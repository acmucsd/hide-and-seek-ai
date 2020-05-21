import { SEEKER, HIDER, DIRECTION, HideAndSeekConfigs, MatchState } from "..";
import { Seeker } from "../Seeker";
import { Hider } from "../Hider";
import { Unit } from "../Unit";
import { Match } from "dimensions-ai";

export const MOVE_DELTAS = [[0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1]];

export const EMPTY = 0;
export const WALL = 1;
export class GameMap {
  /**
   * Internal map. map[y][x] represents the id of the unit on tile (x, y). 0 indicates empty. 1 indicates wall
   */
  public map: Array<Array<number>> = [[]];
  public idMap: Map<number, Unit> = new Map();
  public gameID: number = 4;
  // map from agent ID to the set of unit IDs they own
  public ownedIDs: Map<number, Set<number>> = new Map();
  constructor(width: number, height: number, public configs: HideAndSeekConfigs) {

    this.map = [];
    for (let i = 0; i < height; i++) {
      this.map.push([]);
      for (let j = 0 ; j < width; j++) {
        this.map[i].push(EMPTY);
      }
    }
  }
  width() {
    return this.map[0].length;
  }
  height() {
    return this.map.length;
  }
  spawnSeeker(x: number, y: number) {
    let id = this.gameID;
    let seeker = new Seeker(x, y, id);
    this.map[y][x] = id;
    this.idMap.set(id, seeker);
    this.gameID++;
  }
  spawnHider(x: number, y: number) {
    let id = this.gameID;
    let hider = new Hider(x, y, id);
    this.map[y][x] = id;
    this.idMap.set(id, hider);
    this.gameID++;
  }
  setWall(x: number, y: number) {
    this.map[y][x] = WALL;
  }
  setEmpty(x: number, y: number) {
    this.map[y][x] = EMPTY;
  }
  setWater(x: number, y: number) {

  }
  hasUnit(x: number, y: number) {
    if (this.inMap(x, y)) {
      return this.map[y][x] != WALL && this.map[y][x] != EMPTY;
    }
    return false;
  }
  isSeeker(cell: number) {
    if (this.idMap.has(cell)) {

      if (this.idMap.get(cell).type === SEEKER) {
        return true;
      }
    }
    return false;
  }
  isHider(cell: number) {
    if (this.idMap.has(cell)) {

      if (this.idMap.get(cell).type === HIDER) {
        return true;
      }
    }
    return false;
  }
  move(unit: Unit, dir: DIRECTION) {
    let move = unit.canMove(dir, this);
    if (move) {
      this.map[unit.y][unit.x] = EMPTY;
      unit.x = move.x;
      unit.y = move.y;
      this.map[unit.y][unit.x] = unit.id;
      return true;
    }
    return false;
  }

  inMap(x: number, y: number) {
    if (x < 0 || y < 0 || x >= this.width() || y >= this.height()) {
      return false;
    }
    return true;
  }

  isWall(x: number, y: number) {
    return this.map[y][x] === WALL;
  }
  isEmpty(x: number, y: number) {
    return this.map[y][x] === EMPTY;
  }

  removeHider(unit: Hider) {
    this.map[unit.y][unit.x] = EMPTY;
    this.idMap.delete(unit.id);
    this.ownedIDs.get(0).delete(unit.id);
    this.ownedIDs.get(1).delete(unit.id);
  }

  /**
   * Create the map strings to send to agents
   * @param match 
   */
  createMapStrings(match: Match) {
    
    let state: MatchState = match.state;

    let team0 = state.agentIDToTeam.get(0);
    let team1 = state.agentIDToTeam.get(1);
    let ids0 = this.idsTeamCanSee(team0);
    let ids1 = this.idsTeamCanSee(team1);
    
    let mapInfo0 = []; // map for agent 0, team 0
    let mapInfo1 = []; // map for agent 1, team 

    for (let i = 0; i < this.height(); i++) {
      // let cells = [];
      for (let k = 0; k < match.agents.length; k++) {
        let agentID = match.agents[k].id;
        let team = state.agentIDToTeam.get(agentID);
        let str = this.createMapRowString(i, team);
        let cells = [];
        for (let j = 0; j < this.width(); j++) {
          let cell = this.map[i][j];
          // show cell id if its not in unit idMap or is on same team or is within range
          if (!this.idMap.has(cell) || this.idMap.get(cell).type === team) {
            cells.push(cell);
          }
          else if ((agentID === 0 && ids0.has(cell)) || (agentID === 1 && ids1.has(cell))) {
            cells.push(cell);
          }
          else {
            cells.push(EMPTY);
          }
        }
        if (agentID === 0) {
          mapInfo0.push(cells.join(","));
        }
        else {
          mapInfo1.push(cells.join(","));
        }
      }
      
    }
    return [mapInfo0, mapInfo1];
  }

  /**
   * Update row string to send to agent of a particular team
   * @param i 
   * @param team 
   */
  createMapRowString(i: number, team: number) {
    let cells = [];
    for (let j = 0; j < this.width(); j++) {
      let cell = this.map[i][j];
      // show cell id if its not in unit idMap or is on same team or is within range
      if (!this.idMap.has(cell) || this.idMap.get(cell).type === team ) {
        cells.push(cell);
      }
      else {
        cells.push(EMPTY);
      }
    }
    return cells.join(",");
  }

  hashLoc(x1, y1) {
    return x1 * Math.max(this.width(), this.height()) + y1;
  }
  /**
   * Returns true if sight is blocked from (x1, y1) and (x2, y2);
   * 
   * The "Line of Sight" is measured from the center of cell (x1, y1) to center of cell (x2, y2)
   */
  sightBlocked(x1, y1, x2, y2) {
    let queue = [{x: x1, y: y1}];
    let target = {x: x2, y: y2};
    let visitedSet = new Set();
    // perform a DFS of sorts
    while (queue.length) {
      // determine if line (x2, y2) to (x1, y1) intersects neighboring tiles
      // if intersects, check tile if it is blocked by square
      let cell = queue.pop();
      if (cell.x === target.x && cell.y === target.y) {
        // reached target, stop
        return false;
      }
      let thisCellsDistance = this.distance(cell.x, cell.y, target.x, target.y);
      visitedSet.add(this.hashLoc(cell.x, cell.y));
      if (this.inMap(cell.x, cell.y)) {
        // if current cell is in line of sight
        if (this.lineIntersectsCell(x1 + 0.5, y1 + 0.5, x2 + 0.5, y2 + 0.5, cell.x, cell.y)) {
          // TODO: Optionally, block by other units?
          if (this.map[cell.y][cell.x] !== WALL) {
            // not blocked add more to queue
            // add cells that are closer than this one
            for (let i = 0; i < MOVE_DELTAS.length; i++) {
              let delta = MOVE_DELTAS[i];
              let nx = cell.x + delta[0];
              let ny = cell.y + delta[1];
              let hash = this.hashLoc(nx, ny);
              // not visited and closer
              if (!visitedSet.has(hash) && this.distance(nx, ny, target.x, target.y) <= thisCellsDistance) {
                queue.push({x: nx, y: ny});
              }
            }
          }
        }
      }
    }
    // default is sight is blocked unless we return false in the DFS.
    return true;
  }

  /**
   * Checks if line x1,y1 to x2, y2 intersects cell x3, y3
   */
  lineIntersectsCell(x1: number, y1: number, x2: number, y2: number, rx: number, ry: number) {
    let rw = 1; let rh = 1;
    let left =   this.lineIntersectLine(x1,y1,x2,y2, rx,ry,rx, ry+rh);
    let right =  this.lineIntersectLine(x1,y1,x2,y2, rx+rw,ry, rx+rw,ry+rh);
    let top =    this.lineIntersectLine(x1,y1,x2,y2, rx,ry, rx+rw,ry);
    let bottom = this.lineIntersectLine(x1,y1,x2,y2, rx,ry+rh, rx+rw,ry+rh);
    if (left || right || top || bottom) {
      return true;
    }
    return false;
  }
  lineIntersectLine(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number) {
    let uA = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
    let uB = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
    if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
      return true;
    }
    return false;
  }

  idsTeamCanSee(team: number): Set<number> {
    let teamUnits = [];
    let otherUnits = [];
    this.idMap.forEach((unit) => {
      if (unit.type === team) {
        teamUnits.push(unit);
      }
      else {
        otherUnits.push(unit);
      }
    });
    // there aren't a lot of units, so we can bruteforce this faster
    let otherIDsInVision: Set<number> = new Set();
    otherUnits.forEach((unit) => {
      for (let i = 0; i < teamUnits.length; i++) {
        let teamUnit = teamUnits[i]; 
        // must be within vision and have unblocked vision in order to see unit
        if (this.distance(unit.x, unit.y, teamUnit.x, teamUnit.y) <= this.configs.parameters.VISION_RANGE) {
          if (!this.sightBlocked(unit.x, unit.y, teamUnit.x, teamUnit.y)) {
            otherIDsInVision.add(unit.id);
            break;
          }
        }
      }
    });
    return otherIDsInVision;
  }

  /**
   * Calculates R^2 distance
   */
  distance(x1, y1, x2, y2) {
    return Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
  }
}