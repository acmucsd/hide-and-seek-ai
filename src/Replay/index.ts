import fs from 'fs';
import { GameMap } from '../Map';
import { Match } from 'dimensions-ai';
import { MatchState } from '..';
export class Replay {
  public contents = {
    map: {},
    idMap: {},
    moves: [],
    agents: []
  }
  constructor(public path: string) {
    fs.writeFileSync(this.path, '');
  }
  async writeMeta(match: Match) {
    let state: MatchState = match.state;
    this.contents.agents = match.agents.map((agent) => {
      return {
        name: agent.name,
        id: agent.id,
        team: state.agentIDToTeam.get(agent.id)
      }
    })
  }
  async writeMap(map: GameMap) {
    // fs.appendFileSync(this.path, JSON.stringify(obj));
    this.contents.map = map.map;
    map.idMap.forEach((unit) => {
      this.contents.idMap[unit.id] = unit.type;
    });
  }
  async writeMoves(moves: Array<Object>) {
    this.contents.moves.push(moves);
  }
  async writeOut() {
    fs.appendFileSync(this.path, JSON.stringify(this.contents));
  }
}