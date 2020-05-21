import { Design, Match, MatchEngine, MatchError, FatalError, Tournament, MatchWarn } from 'dimensions-ai';
import { GameMap, EMPTY, MOVE_DELTAS, WALL } from './Map';
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
import { Unit } from './Unit';

export interface GameResults {
  winner: string,
  loser: string,
  winningID: number,
  losingID: number,
  seeker: string,
  hider: string,
  seekerID: number,
  hiderID: number,
  replayFile: string,
  terminatedIDs: Array<number>,
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
  seed: Math.floor(Math.random()*1000000),
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

  /**
   * Gets the seekerIDs and hiderIDs from a gamemap
   */
  private getIDs(gamemap: GameMap): {seekerIDs: Array<number>, hiderIDs: Array<number>} {
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
    let gamemap = mapGen(width, height, configs, rng);
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
    state.replay.writeMap(gamemap);
    
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
      // and sends what team they are on, 3 for hider, 2 for seeker
      await match.send(`${agentID},${state.agentIDToTeam.get(agentID)}`, agentID); 
    }

    await this.sendSeekersAndHidersInformation(match);

    // send the initial map configuration not including unit ids
    await match.sendAll(`${gamemap.width()},${gamemap.height()}`);
    for (let y = 0; y < gamemap.height(); y++) {
      let strs = [];
      for (let x = 0; x < gamemap.width(); x++) {
        if (gamemap.hasUnit(x, y)) {
          strs.push("0");
        }
        else {
          strs.push(gamemap.map[y][x]);
        }
      }
      await match.sendAll(strs.join(","));
    }
    state.replay.writeMeta(match);
    state.replay.writeTeam(state.teamToAgentID);
    
  }

  /**
   * Sends unit ids and their locations to the respective teams
   * Furthermore, send opposing team ids and location if they can be seen
   */
  private async sendSeekersAndHidersInformation(match: Match) {
    let state: MatchState = match.state;
    let { seekerIDs, hiderIDs } = this.getIDs(state.gamemap);
    for (let i = 0; i < match.agents.length; i++) {
      let agentID = match.agents[i].id;
      let team = state.agentIDToTeam.get(agentID);
      if (team === SEEKER) {
        let strs = [];
        // send all seekers

        let seenHiderIDs: Set<number> = new Set();
        seekerIDs.forEach((id) => {
          let unit = state.gamemap.idMap.get(id);
          // send id and the units x y coords
          strs.push(`${id}_${unit.x}_${unit.y}`);
          // find which hiders this unit can see
          hiderIDs.forEach((hiderID) => {
            // i know, this code is a little slow
            if (!seenHiderIDs.has(hiderID)) {
              let hiderUnit = state.gamemap.idMap.get(hiderID);
              let dist = state.gamemap.distance(unit.x, unit.y, hiderUnit.x, hiderUnit.y);
              if (dist <= match.configs.parameters.VISION_RANGE && !state.gamemap.sightBlocked(unit.x, unit.y, hiderUnit.x, hiderUnit.y)) {
                seenHiderIDs.add(hiderID);
              }
            }
          })
        });
        await match.send(`${strs.join(',')}`, agentID); 
        
        // send all hiders in vision
        let hiderStrs = [];
        seenHiderIDs.forEach((hiderID) => {
          let hiderUnit = state.gamemap.idMap.get(hiderID);
          hiderStrs.push(`${hiderID}_${hiderUnit.x}_${hiderUnit.y}`);
        });
        await match.send(`${hiderStrs.join(',')}`, agentID); 

      }
      else {
        let strs = [];
        let seenSeekerIDs: Set<number> = new Set();
        hiderIDs.forEach((id) => {
          let unit = state.gamemap.idMap.get(id);
          // send id and the units x y coords
          strs.push(`${id}_${unit.x}_${unit.y}`);
          // find which hiders this unit can see
          seekerIDs.forEach((seekerID) => {
            // i know, this code is a little slow
            if (!seenSeekerIDs.has(seekerID)) {
              let seekerUnit = state.gamemap.idMap.get(seekerID);
              let dist = state.gamemap.distance(unit.x, unit.y, seekerUnit.x, seekerUnit.y);
              if (dist <= match.configs.parameters.VISION_RANGE && !state.gamemap.sightBlocked(unit.x, unit.y, seekerUnit.x, seekerUnit.y)) {
                seenSeekerIDs.add(seekerID);
              }
            }
          })
        });
        await match.send(`${strs.join(',')}`, agentID);

        // send all seekers in vision
        let seekerStrs = [];
        seenSeekerIDs.forEach((seekerID) => {
          let seekerUnit = state.gamemap.idMap.get(seekerID);
          seekerStrs.push(`${seekerID}_${seekerUnit.x}_${seekerUnit.y}`);
        });
        await match.send(`${seekerStrs.join(',')}`, agentID); 
      }
      
    };
  }

  async update(match: Match, commands: Array<MatchEngine.Command> ): Promise<Match.Status> {
    let state: MatchState = match.state
    match.state.round++;
    this.log.detail('Starting round ' + match.state.round);
    
    let gamemap = state.gamemap;

    // check aliveness of each agent
    let terminatedIDs = [];
    match.agents.forEach((agent) => {
      if (agent.isTerminated()) {
        terminatedIDs.push(agent.id);
      }
    });

    // if any bot was terminated, we finish the match and save what we have so far
    if (terminatedIDs.length > 0) {
      state.terminatedIDs = terminatedIDs;
      state.replay.writeOut();
      return Match.Status.FINISHED;
    }

    /** Command Parsing */
    let parsedCommands: Array<{agentID: number, unitID: number, dir: DIRECTION}> = [];
    let unitIDsMoved = new Set();
    for (let i = 0; i < commands.length; i++) {
      let command = commands[i];
      let data = command.command.split("_");
      let id = parseInt(data[0]);
      let dir = parseInt(data[1]);
      let agentID = command.agentID;
      
      if (isNaN(dir) || isNaN(id)) {
        match.throw(agentID, new MatchWarn(`logged an invalid move: ${command.command}`));
        continue;
      }
      if (dir < 0 || dir > 8) {
        match.throw(agentID, new MatchWarn(`logged an invalid move direction: ${command.command}`));
        continue;
      }
      // check if agent owns this unit
      if (!gamemap.ownedIDs.get(agentID).has(id)) {
        match.throw(agentID, new MatchWarn(`tried to move unit ${id} but does not own it - cmd: ${command.command}`));
        continue;
      }
      // check if unit already moved
      if (unitIDsMoved.has(id)) {
        match.throw(agentID, new MatchWarn(`unit ${id} has already moved and cannot move again`));
        continue;
      }
      // command passed, store it
      parsedCommands.push({agentID: agentID, unitID: id, dir: dir});
      // store what units moved already
      unitIDsMoved.add(id);
    }

    /**
     * Sort commands in order of unit id
     */
    parsedCommands.sort((a, b) => a.unitID - b.unitID);
    let successfulMoves = [];
    parsedCommands.forEach((cmd) => {
      // if succesfull move, store it
      if (gamemap.move(gamemap.idMap.get(cmd.unitID), cmd.dir)) {
        successfulMoves.push(cmd);
      }
    });
    
    
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
    
    // save moves data
    state.replay.writeData(successfulMoves, seekerIDs, hiderIDs);
    
    // print display if enabled
    if (match.configs.liveView) {
      this.printDisplay(match);
      await HideAndSeekDesign._sleep(match.configs.delay * 1000);
    }

    /** Check if game over */
    if (this.gameOver(match)) {
      state.replay.writeOut();
      return Match.Status.FINISHED;
    }

    /** UPDATE SECTION */

    // send unit information
    await this.sendSeekersAndHidersInformation(match);

    return Match.Status.RUNNING;
  }

  private static async _sleep (time: number) {
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
  private printDisplay(match: Match) {
    let state: MatchState = match.state;
    let gamemap: GameMap = state.gamemap;
    console.clear();
    let { seekerIDs, hiderIDs } = this.getIDs(gamemap);
    console.log(`Match: ${match.name} | Round # - ${state.round}`);
    console.log(`Player: ${match.agents[state.teamToAgentID.get(SEEKER)].name} | Seeker # -`.cyan, seekerIDs);
    console.log(`Player: ${match.agents[state.teamToAgentID.get(HIDER)].name} | Hider # -`.red, hiderIDs);
    console.log(`Map Size: ${gamemap.width()}x${gamemap.height()} | Seed: ${match.configs.seed}`);
    HideAndSeekDesign._printMap(gamemap.map, seekerIDs, hiderIDs);
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
      replayFile: "",
      terminatedIDs: []
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

    result.terminatedIDs = state.terminatedIDs
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

  private setResult(result: GameResults, winningID: number, losingID: number, match: Match) {
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

  /**
   * Reads in a replay file and plays it
   * @param path 
   */
  static async watch(path: string, delay: number = 0.2) {
    fs.readFile(path, "utf8", async (err, data: any) => {
      data = JSON.parse(data);
      let map = data.map;
      let match = data.match;
      let agents = data.agents;
      let teams = data.teams;
      for (let i = 0; i < data.frames.length; i++) {
        let round = i + 1;
        let frame = data.frames[i];
        console.clear();
        let { seekerIDs, hiderIDs } = frame;
        let a = [1,2];
        // apply moves
        let { moves } = frame;

        // go through map finding our seekers and hiders and apply moves
        for (let y = 0 ; y < map.length; y++) {
          for (let x = 0; x < map[0].length; x++) {
            let cell = map[y][x];
            if (cell === EMPTY || cell === WALL) {
              continue;
            }
            for (let k = 0;k < moves.length; k++) {
              if (moves[k].unitID === cell) {
                
                if (moves[k].dir != DIRECTION.STILL) {
                  // if we foudn where unit is on map
                  let newPos = Unit.applyDirection(x, y, moves[k].dir);
                  // console.log('round', round, `move unit [${moves[k].unitID}]`, x, y, 'to', newPos, moves[k].dir);
                  if (newPos) {
                    if (newPos.x < 0 || newPos.y < 0 || newPos.x >= map[0].length || newPos.y >= map.length) {
                      continue;
                    }
                    map[newPos.y][newPos.x] = cell;
                    map[y][x] = EMPTY;
                    moves.splice(k, 1);
                    break;
                  }
                }
              }
            }
            
          }
        }

        console.log(`Match: ${match.name} | Round # - ${round}`);
        console.log(`Player: ${agents[teams[0].agentID].name} | Seeker # -`.cyan, seekerIDs);
        console.log(`Player: ${agents[teams[1].agentID].name} | Hider # -`.red, hiderIDs);
        console.log(`Map Size: ${map[0].length}x${map.length} | Seed: ${data.seed}`);
        HideAndSeekDesign._printMap(map, seekerIDs, hiderIDs);
        await HideAndSeekDesign._sleep(delay * 1000);
      }
    });
  }

  static  _printMap(map: Array<Array<number>>, seekerIDs: Array<number>, hiderIDs: Array<number>) {
    for (let i = 0 ; i < map.length; i++) {
      let str = [];
      for (let j = 0; j < map[0].length; j++) {
        let cell = map[i][j];
        if (seekerIDs.indexOf(cell) != -1) {
          str.push(`${cell}`.cyan);
        }
        else if (hiderIDs.indexOf(cell) != -1) {
          str.push(`${cell}`.red);
        }
        else if (cell === WALL) {
          str.push(`▩`.yellow);
        }
        else {
          str.push(`${EMPTY}`);
        }
      }
      console.log(`[${str.join(" ")}]`);
    }
  }
}