import fs from 'fs';
import { GameMap } from '../Map';
import { Match } from 'dimensions-ai';
import { MatchState, SEEKER, HIDER } from '..';
export class Replay {
  public contents = {
    map: {},
    match: {
      name: "",
      id: ""
    },
    idMap: {},
    frames: [],
    agents: [],
    teams: [],
    seed: 0
  }
  constructor(public path: string) {
    fs.writeFileSync(this.path, '');
  }
  async writeMeta(match: Match) {
    let state: MatchState = match.state;
    this.contents.match.name = match.name;
    this.contents.match.id = match.id;
    this.contents.seed = match.configs.seed;
    this.contents.agents = match.agents.map((agent) => {
      return {
        name: agent.name,
        id: agent.id,
        team: state.agentIDToTeam.get(agent.id)
      }
    });
  }
  async writeAgent(agentIDToTeam: Map<number, number>) {
    this.contents.agents.push({
      id: 0,
      team: agentIDToTeam.get(0)
    });
    this.contents.agents.push({
      id: 0,
      team: agentIDToTeam.get(1)
    });
  }
  async writeTeam(teamToAgentID: Map<number, number>) {
    this.contents.teams.push({
      team: SEEKER,
      agentID: teamToAgentID.get(SEEKER)
    });
    this.contents.teams.push({
      team: HIDER,
      agentID: teamToAgentID.get(HIDER)
    });
  }
  async writeMap(map: GameMap) {
    this.contents.map = JSON.parse(JSON.stringify(map.map));
    map.idMap.forEach((unit) => {
      this.contents.idMap[unit.id] = unit.type;
    });
  }
  async writeData(moves: Array<Object>, seekerIDs: Array<number>, hiderIDs: Array<number>) {
    this.contents.frames.push({
      moves: moves,
      seekerIDs: seekerIDs,
      hiderIDs: hiderIDs
    });
  }
  async writeOut() {
    fs.appendFileSync(this.path, JSON.stringify(this.contents));
  }

  /**
   * Reads in a replay file and plays it
   * @param path 
   */
  static async read(path: string) {

  }
}