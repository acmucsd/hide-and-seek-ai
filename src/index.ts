import { Design, Match, MatchEngine, MatchError, FatalError, Tournament } from 'dimensions-ai';
import { GameMap, EMPTY, MOVE_DELTAS } from './Map';
import { Seeker } from './Seeker';
import { Hider } from './Hider';
import { mapGen } from './Map/gen';
import colors from 'colors';
import seedrandom from 'seedrandom';
import { deepCopy } from 'dimensions-ai/lib/utils/DeepCopy';
import { deepMerge } from 'dimensions-ai/lib/utils/DeepMerge';
import fs from 'fs';
import { Replay } from './Replay';
import path from 'path';

export interface GameResults {
  winner: string,
  loser: string,
  winningID: number,
  losingID: number,
  seeker: string,
  hider: string,
  seekerID: number,
  hiderID: number,
  replayFile: string
}
export interface MatchState {
  gamemap: GameMap,
  round: number,
  agentIDToTeam: Map<number, number>,
  teamToAgentID: Map<number, number>
  /**
   * Ids of the agents that were terminated due to errors such as timeout or too much memory use
   */
  terminatedIDs: Array<number>,
  replay: Replay
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
  /**
   * Whether or not print a live game display to the terminal
   */
  liveView: boolean,
  /**
   * How often display should update
   */
  delay: number,
  /**
   * Max rounds before game ends
   */
  roundLimit: number,
  /**
   * Directory to store replays in
   */
  replayDirectory: string,
  /**
   * Game seed for map generation
   */
  seed: number,
  mode: GameModes,
  /**
   * Whether or not to randomize which team gets the seeker. If false, first agent is always the seeker
   * 
   * @default `true`
   */
  randomizeSeeker: boolean,
  parameters: {
    /**
     * R^2 distance of how far units can see
     */
    VISION_RANGE: number,
    /**
     * How dense map is with walls
     */
    DENSITY: number,
    SEEKER_MAX: number,
    MIN_WIDTH: number,
    MIN_HEIGHT: number,
    MAX_WIDTH: number,
    MAX_HEIGHT: number
  }
}
export enum GameModes {
  tag = 'tag',
  see = 'see'
}
export const defaultMatchConfigs: HideAndSeekConfigs = {
  liveView: true,
  delay: 0.2,
  roundLimit: 200,
  seed: 30,
  replayDirectory: './replays',
  mode: GameModes.tag,
  randomizeSeeker: true,
  parameters: {
    VISION_RANGE: 48,
    DENSITY: 0.35,
    SEEKER_MAX: 3,
    MIN_HEIGHT: 16,
    MIN_WIDTH: 16,
    MAX_HEIGHT: 24,
    MAX_WIDTH: 24
  }
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
    
    
    let configs = deepCopy(defaultMatchConfigs);
    configs = deepMerge(configs, match.configs);
    match.configs = configs;

    let rng = seedrandom(match.configs.seed)
    // @ts-ignore;
    let params = (<HideAndSeekConfigs>(match.configs)).parameters;

    // create map
    let width = 16;
    let height = 16;
    width = params.MIN_WIDTH + Math.floor((params.MAX_WIDTH - params.MIN_WIDTH) * rng());
    height = params.MIN_HEIGHT + Math.floor((params.MAX_HEIGHT - params.MIN_HEIGHT) * rng());
    if (width % 2 == 1) {
      if (width > params.MIN_WIDTH) {
        width -= 1;
      }
    }
    if (height % 2 == 1) {
      if (height > params.MIN_HEIGHT) {
        height -= 1;
      }
    }
    console.log(width, height);
    let gamemap = mapGen(width, height, configs);
    let seekerCount = 1;
    let hiderCount = 1;
    match.state = {
      gamemap: gamemap,
      round: 0,
      agentIDToTeam: new Map(),
      teamToAgentID: new Map(),
      ownedIDs: new Map(),
      terminatedIDs: [],
      replay: null
    }
    

    // create replay directory
    if (!fs.existsSync(match.configs.replayDirectory)) {
      fs.mkdirSync(match.configs.replayDirectory);
    }

    let state: MatchState = match.state;
    state.replay = new Replay(path.join(match.configs.replayDirectory, `${match.name}.json`));

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
    if (!match.configs.randomizeSeeker || rng() <= 0.5 ) {
      state.agentIDToTeam.set(0, SEEKER);
      state.agentIDToTeam.set(1, HIDER);
      state.teamToAgentID.set(SEEKER, 0);
      state.teamToAgentID.set(HIDER, 1);
      gamemap.ownedIDs.set(0, seekerSet);
      gamemap.ownedIDs.set(1, hiderSet);
    }
    else {
      state.agentIDToTeam.set(1, SEEKER);
      state.agentIDToTeam.set(0, HIDER);
      state.teamToAgentID.set(SEEKER, 1);
      state.teamToAgentID.set(HIDER, 0);
      gamemap.ownedIDs.set(1, seekerSet);
      gamemap.ownedIDs.set(0, hiderSet);
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
    let mapStrings = gamemap.createMapStrings(match);

    for (let i = 0; i < mapStrings.length; i++) {
      let mapString = mapStrings[i];
      for (let j = 0; j < mapString.length; j++) {
        await match.send(mapString[j], i);
      }
    }

    state.replay.writeMap(gamemap);
  }

  async update(match: Match, commands: Array<MatchEngine.Command> ): Promise<Match.Status> {
    let state: MatchState = match.state
    match.state.round++;
    this.log.detail('Starting round ' + match.state.round);
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
      state.replay.writeOut();
      return Match.Status.FINISHED;
    }

    // clean up commands
    // parsed commands sorted in order of ID.
    let parsedCommands: Array<{agentID: number, unitID: number, dir: DIRECTION}> = [];
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
        if (!gamemap.ownedIDs.get(agentID).has(id)) {
          match.throw(agentID, new MatchError(`Agent ${agentID} tried to move unit ${id} but does not own it - cmd: ${command.command}`));
          continue;
        }
      }
      // command passed, store it
      parsedCommands.push({agentID: agentID, unitID: id, dir: dir});
    }

    parsedCommands.sort((a, b) => a.unitID - b.unitID);
    let successfulMoves = [];
    parsedCommands.forEach((cmd) => {
      // if succesfull move, store it
      if (gamemap.move(gamemap.idMap.get(cmd.unitID), cmd.dir)) {
        successfulMoves.push(cmd);
      }
    });
    state.replay.writeMoves(successfulMoves);
    
    let { seekerIDs, hiderIDs } = this.getIDs(gamemap);
    let seekerLocationSet = new Set();
    seekerIDs.forEach((id) => {
      let unit = gamemap.idMap.get(id);
      seekerLocationSet.add(gamemap.hashLoc(unit.x, unit.y));
    })
    // capture hiders if they are tagged
    hiderIDs.forEach((id) => {
      let unit = gamemap.idMap.get(id);
      for (let i = 0; i < MOVE_DELTAS.length; i++) {
        // check surrounding tiles for seekers
        let delta = MOVE_DELTAS[i];
        let nx = unit.x + delta[0];
        let ny = unit.y + delta[1];
        let hash = gamemap.hashLoc(nx, ny);
        if (seekerLocationSet.has(hash)) {
          gamemap.removeHider(unit);
        }
      }
    });
    hiderIDs = this.getIDs(gamemap).hiderIDs;

    // print display if enabled
    if (match.configs.liveView) {
      this.printDisplay(match);
      await this.sleep(match.configs.delay * 1000);
    }

    if (this.gameOver(match)) {
      state.replay.writeOut();
      return Match.Status.FINISHED;
    }

    

    
    // send updates

    // send available unit ids still
    
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
    let mapStrings = gamemap.createMapStrings(match);

    for (let i = 0; i < mapStrings.length; i++) {
      let mapString = mapStrings[i];
      for (let j = 0; j < mapString.length; j++) {
        await match.send(mapString[j], i);
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
    console.log(`Match: ${match.name} | Round # - ${state.round}`);
    console.log(`Player: ${match.agents[state.teamToAgentID.get(SEEKER)].name} | Seeker # -`.cyan, seekerIDs);
    console.log(`Player: ${match.agents[state.teamToAgentID.get(HIDER)].name} | Hider # -`.red, hiderIDs);
    // console.log(`Map Info: ${gamemap.width()}x${gamemap.height()}`);
    for (let i = 0 ; i < gamemap.height(); i++) {
      let str = [];
      for (let j = 0; j < gamemap.width(); j++) {
        let cell = gamemap.map[i][j];
        if (gamemap.isSeeker(cell)) {
          str.push(`${cell}`.cyan);
        }
        else if (gamemap.isHider(cell)) {
          str.push(`${cell}`.red);
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
      replayFile: ""
    }
    let state: MatchState = match.state;
    result.replayFile = state.replay.path;
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