import { Design, Match, MatchEngine, MatchError, FatalError, Tournament } from 'dimensions-ai';
import { GameMap, EMPTY } from './Map';
import { Seeker } from './Seeker';
import { Hider } from './Hider';
import { mapGen } from './Map/gen';
import colors from 'colors';
import { deepCopy } from 'dimensions-ai/lib/utils/DeepCopy';
import { deepMerge } from 'dimensions-ai/lib/utils/DeepMerge';

export interface GameResults {
  winner: string,
  loser: string,
  winningID: number,
  losingID: number,
  seeker: string,
  hider: string,
  seekerID: number,
  hiderID: number,
}
export interface MatchState {
  gamemap: GameMap,
  round: number,
  agentIDToTeam: Map<number, number>
  // map from agent ID to the set of unit IDs they own
  ownedIDs: Map<number, Set<number>>
  /**
   * Ids of the agents that were terminated due to errors such as timeout or too much memory use
   */
  terminatedIDs: Array<number>
}
export enum DIRECTION {
  NORTH = 0,
  NORTHEAST = 1,
  EAST = 2,
  SOUTHEAST = 3,
  SOUTH = 4,
  SOUTHWEST = 5,
  WEST = 6,
  NORTHWEST = 7,
  STILL =  8
}

export const SEEKER = 2;
export const HIDER = 3;
export interface HideAndSeekConfigs {
  liveView: boolean,
  delay: number,
  roundLimit: number
}
export const defaultMatchConfigs: HideAndSeekConfigs = {
  liveView: true,
  delay: 1,
  roundLimit: 100
}

export default class HideAndSeekDesign extends Design {

  

  getIDs(gamemap: GameMap) {
    let seeker = [];
    let hider = [];
    gamemap.idMap.forEach((unit) => {
      if (unit.type === SEEKER) {
        seeker.push(unit.id);
      }
      else {
        hider.push(unit.id);
      }
    });
    return {seekerIDs: seeker, hiderIDs: hider};
  }

  async initialize(match: Match) {
    let width = 16;
    let height = 16;
    let gamemap = mapGen(width, height);
    let seekerCount = 1;
    let hiderCount = 1;
    match.state = {
      gamemap: gamemap,
      round: 0,
      agentIDToTeam: new Map(),
      ownedIDs: new Map(),
      terminatedIDs: []
    }
    let configs = deepCopy(defaultMatchConfigs);
    configs = deepMerge(configs, match.configs);
    match.configs = configs;
    let state: MatchState = match.state;

    if (match.agents.length != 2) {
      throw new FatalError('Can only have 2 agents!');
    }
    let seekerSet: Set<number> = new Set();
    let hiderSet: Set<number> = new Set();
    state.gamemap.idMap.forEach((unit) => {
      if (unit.type === SEEKER) {
        seekerSet.add(unit.id);
      }
      else {
        hiderSet.add(unit.id);
      }
    });
    // randomly choose seeker or hider team
    if (Math.random() <= 0.5) {
      state.agentIDToTeam.set(0, SEEKER);
      state.agentIDToTeam.set(1, HIDER);
      
      state.ownedIDs.set(0, seekerSet);
      state.ownedIDs.set(1, hiderSet);
    }
    else {
      state.agentIDToTeam.set(1, SEEKER);
      state.agentIDToTeam.set(0, HIDER);
      state.ownedIDs.set(1, seekerSet);
      state.ownedIDs.set(0, hiderSet);
    }

    for (let i = 0; i < match.agents.length; i++) {
      let agentID = match.agents[i].id;
      // sends the string `${agentID}` to the agent specified by agentID
      // and sends what team they are on, 0 for hider, 1 for seeker
      await match.send(`${agentID},${state.agentIDToTeam.get(agentID)}`, agentID); 
    }

    let { seekerIDs, hiderIDs } = this.getIDs(gamemap);
    for (let i = 0; i < match.agents.length; i++) {
      let agentID = match.agents[i].id;
      let team = state.agentIDToTeam.get(agentID);
      if (team === SEEKER) {
        await match.send(`${seekerIDs.join(',')}`, agentID); 
        // match.send(`${seekerPositions.join(',')}`, agentID);
      }
      else {
        await match.send(`${hiderIDs.join(',')}`, agentID);
        // match.send(`${hiderPositions.join(',')}`, agentID);
      }
      
    };

    // also would be good to send any global information to all agents
    await match.sendAll(`${gamemap.width()},${gamemap.height()}`);
    for (let i = 0; i < gamemap.height(); i++) {
      // let cells = [];
      for (let k = 0; k < match.agents.length; k++) {
        let agentID = match.agents[k].id;
        let team = state.agentIDToTeam.get(agentID);
        let str = gamemap.createMapRowString(i, team);
        await match.send(str, agentID);
      }
      
    }
  }

  async update(match: Match, commands: Array<MatchEngine.Command> ): Promise<Match.Status> {
    let state: MatchState = match.state
    match.state.round++;
    let gamemap = state.gamemap;

    // check aliveness
    let terminatedIDs = [];
    match.agents.forEach((agent) => {
      if (agent.isTerminated()) {
        terminatedIDs.push(agent.id);
      }
    });
    if (terminatedIDs.length > 0) {
      state.terminatedIDs = terminatedIDs;
      return Match.Status.FINISHED;
    }

    // clean up commands
    // parsed commands sorted in order of ID.
    let parsedCommands: Array<{agentID: number, unitID: number, direction: DIRECTION}> = [];
    for (let i = 0; i < commands.length; i++) {
      let command = commands[i];
      let data = command.command.split("_");
      let id = parseInt(data[0]);
      let dir = parseInt(data[1]);
      let agentID = command.agentID;
      if (isNaN(dir) || isNaN(id)) {
        match.throw(agentID, new MatchError(`Agent ${agentID} unit ${id} logged an invalid move: ${command.command}`));
        // match.kill(agentID);
        continue;
      }
      else {
        if (dir < 0 || dir > 8) {
          match.throw(agentID, new MatchError(`Agent ${agentID} unit ${id} logged an invalid move: ${command.command}`));
          // match.kill(agentID);
          continue;
        }
        // check if agent owns this unit
        if (!state.ownedIDs.get(agentID).has(id)) {
          match.throw(agentID, new MatchError(`Agent ${agentID} tried to move unit ${id} but does not own it - cmd: ${command.command}`));
          continue;
        }
      }
      // command passed, store it
      parsedCommands.push({agentID: agentID, unitID: id, direction: dir});
    }

    parsedCommands.sort((a, b) => a.unitID - b.unitID);
    parsedCommands.forEach((cmd) => {
      gamemap.move(gamemap.idMap.get(cmd.unitID), cmd.direction);
    });


    if (this.gameOver(match)) {
      return Match.Status.FINISHED;
    }
    if (match.configs.liveView) {
      this.printDisplay(match);
      await this.sleep(match.configs.delay * 1000);
    }

    
    // send updates

    // send available unit ids still
    let { seekerIDs, hiderIDs } = this.getIDs(gamemap);
    for (let i = 0; i < match.agents.length; i++) {
      let agentID = match.agents[i].id;
      let team = state.agentIDToTeam.get(agentID);
      if (team === SEEKER) {
        await match.send(`${seekerIDs.join(',')}`, agentID); 
      }
      else {
        await match.send(`${hiderIDs.join(',')}`, agentID);
      }
      
    };

    // send map
    for (let i = 0; i < gamemap.height(); i++) {
      // let cells = [];
      for (let k = 0; k < match.agents.length; k++) {
        let agentID = match.agents[k].id;
        let team = state.agentIDToTeam.get(agentID);
        let str = gamemap.createMapRowString(i, team);
        await match.send(str, agentID);
      }
      
    }
    

    return Match.Status.RUNNING;
  }

  async sleep (time: number) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }
  /**
   * Live print the match, kind of slow however
   * @param match 
   */
  printDisplay(match: Match) {
    let state: MatchState = match.state;
    let gamemap: GameMap = state.gamemap;
    console.clear();
    let { seekerIDs, hiderIDs } = this.getIDs(gamemap);
    console.log(`Match: ${match.name} | Round #: ${state.round}`);
    console.log('Seeker #: '.cyan, seekerIDs);
    console.log('Hider #: '.red, hiderIDs);
    for (let i = 0 ; i < gamemap.height(); i++) {
      let str = [];
      for (let j = 0; j < gamemap.width(); j++) {
        let cell = gamemap.map[i][j];
        if (gamemap.isSeeker(cell)) {
          str.push(`${cell}`.red);
        }
        else if (gamemap.isHider(cell)) {
          str.push(`${cell}`.cyan);
        }
        else if (gamemap.isWall(j, i)) {
          str.push(`▩`.yellow);
        }
        else {
          str.push(`${cell}`);
        }
      }
      console.log(`[${str.join(" ")}]`);
    }
  }

  async getResults(match: Match): Promise<GameResults> {
    let result: GameResults = {
      winner: "",
      loser: "",
      winningID: -1,
      losingID: -1,
      seeker: "",
      hider: "",
      seekerID: -1,
      hiderID: -1,
    }
    let state: MatchState = match.state;
    // store who is seeker or hider
    let a0team = state.agentIDToTeam.get(0);
    if (a0team === SEEKER) {
      result.seeker = match.agents[0].name;
      result.hider = match.agents[1].name;
      result.seekerID = 0;
      result.hiderID = 1;
    }
    else {
      result.seeker = match.agents[1].name;
      result.hider = match.agents[0].name;
      result.seekerID = 1
      result.hiderID = 0;
    }

    if (state.terminatedIDs.length > 0) {
      // all agents terminated
      if (state.terminatedIDs.length === 2) {
        result.winner = 'tie';
        result.loser = 'tie';
        return result;
      }
      else {
        if (state.terminatedIDs[0] === 0) {
          this.setResult(result, 1, 0, match);
        }
        else {
          this.setResult(result, 0, 1, match);
        }
      }
    }
    let { seekerIDs, hiderIDs } = this.getIDs(state.gamemap);
    
    if (hiderIDs.length > 0) {
      if (a0team === HIDER) {
        this.setResult(result, 0, 1, match);
      }
      else {
        this.setResult(result, 1, 0, match);
      }
    }
    else {
      if (a0team === SEEKER) {
        this.setResult(result, 0, 1, match);
      }
      else {
        this.setResult(result, 1, 0, match);
      }
    }
    return result;
  }

  setResult(result: GameResults, winningID: number, losingID: number, match: Match) {
    let agents = match.agents;
    result.winningID = winningID;
    result.losingID = losingID;
    result.winner = agents[winningID].name;
    result.loser = agents[losingID].name;
  }

  private gameOver(match: Match) {
    let { hiderIDs } = this.getIDs(match.state.gamemap);
    if (match.state.round >= match.configs.roundLimit || hiderIDs.length <= 0) {
      return true;
    }
    return false;
  }

  // result handler for RankSystem.WINS 
  static winsResultHandler(results: GameResults): Tournament.RankSystem.WINS.Results {
    // push the numerical agent ids of the winners, tied players, and losers into the arrays and return them
    if (results.winner === 'tie') {
      return {
        winners: [],
        losers:[],
        ties: [0, 1]
      }
    }
    return {
      winners: [results.winningID],
      ties: [],
      losers: [results.losingID]
    }
  }

  // result handler for RankSystem.TRUESKILL
  static trueskillResultHandler(results: GameResults): Tournament.RankSystem.TRUESKILL.Results {
    if (results.winner === "tie") {
      return {ranks: [{rank: 1, agentID: 0}, {rank: 1, agentID: 1}]}
    }
    return {ranks: [{rank: 1, agentID: results.winningID}, {rank: 2, agentID: results.losingID}]}
  }
}