import { DIRECTION } from "..";
import { GameMap } from "../Map";

export abstract class Unit {
  public type = -1; // same as team, HIDER or SEEKER
  constructor(public x: number, public y: number, public id: number) {

  }

  /**
   * Returns new directions if can move. False otherwise
   * @param dir 
   * @param map 
   */
  canMove(dir: DIRECTION, map: GameMap) {
    let newx = this.x;
    let newy = this.y;
    switch(dir) {
      case DIRECTION.NORTH:
        newy -=1;
        break;
      case DIRECTION.NORTHEAST:
        newy -=1;
        newx +=1;
        break;
      case DIRECTION.EAST:
        newx += 1;
        break;
      case DIRECTION.SOUTHEAST:
        newx += 1;
        newy += 1;
        break;
      case DIRECTION.SOUTH:
        newy += 1;
        break;
      case DIRECTION.SOUTHWEST:
        newy += 1;
        newx -= 1;
        break;
      case DIRECTION.WEST:
        newx -= 1;
        break;
      case DIRECTION.NORTHWEST:
        newx -= 1;
        newy -= 1;
        break;
      case DIRECTION.STILL:
        break;
      default:
        console.error("ERROR, incorrect direction " + dir + " given");
        return false;
    }
    if (!map.inMap(newx, newy)) {
      return false;
    }
    // check for collision
    if (map.isEmpty(newx, newy)) {
      // can move, then move unit
      return {x: newx, y: newy};
    }

  }
}