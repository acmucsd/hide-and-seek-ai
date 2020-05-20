import { SEEKER, HIDER, DIRECTION } from "..";
import { Seeker } from "../Seeker";
import { Hider } from "../Hider";
import { Unit } from "../Unit";

export const EMPTY = 0;
export const WALL = 1;
export class GameMap {
  /**
   * Internal map. map[y][x] represents the id of the unit on tile (x, y). 0 indicates empty. 1 indicates wall
   */
  public map: Array<Array<number>> = [[]];
  public idMap: Map<number, Unit> = new Map();
  public gameID: number = 5;
  constructor(width: number, height: number) {

    this.map = [];
    for (let i = 0; i < width; i++) {
      this.map.push([]);
      for (let j = 0 ; j < height; j++) {
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
    let id = this.gameID++;
    let seeker = new Seeker(x, y, id);
    this.map[y][x] = id;
    this.idMap.set(id, seeker);
  }
  spawnHider(x: number, y: number) {
    let id = this.gameID++;
    let hider = new Hider(x, y, id);
    this.map[y][x] = id;
    this.idMap.set(id, hider);
  }
  setWall(x: number, y: number) {
    this.map[y][x] = WALL;
  }
  setEmpty(x: number, y: number) {
    this.map[y][x] = EMPTY;
  }
  setWater(x: number, y: number) {

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
    }
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

  /**
   * Update row string to send to agent of a particular team
   * @param i 
   * @param team 
   */
  createMapRowString(i: number, team: number) {
    let cells = [];
    for (let j = 0; j < this.width(); j++) {
      let cell = this.map[i][j];
      // show cell id if its not in unit idMap or is on same team
      if (!this.idMap.has(cell) || this.idMap.get(cell).type === team) {
        cells.push(cell);
      }
      else {
        cells.push(EMPTY);
      }
    }
    return cells.join(",");
  }
}