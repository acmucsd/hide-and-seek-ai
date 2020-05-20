/**
 * Generates a map
 */

import { GameMap } from "."

export const mapGen = (width: number, height: number) => {
  let map = new GameMap(width, height);
  map.setWall(4, 4);
  map.setWall(5, 4);
  map.setWall(6, 4);
  map.setWall(6, 6);
  map.setWall(8, 2); map.setWall(8, 3); map.setWall(8, 4); map.setWall(7, 3);
  map.spawnHider(0,0);
  map.spawnSeeker(12, 12);

  return map;
}