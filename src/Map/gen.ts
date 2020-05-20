/**
 * Generates a map
 */

import { GameMap } from "."
import { HideAndSeekConfigs } from "..";

export const mapGen = (width: number, height: number, configs: HideAndSeekConfigs) => {
  let map = new GameMap(width, height, configs);
  map.setWall(4, 4);
  map.setWall(5, 4);
  map.setWall(6, 4);
  map.setWall(6, 6);
  map.setWall(8, 2); map.setWall(8, 3); map.setWall(8, 4); map.setWall(7, 3);
  map.spawnHider(6,5);
  // map.spawnHider(0,2);
  // map.spawnSeeker(6, 10);
  for (let i = 0; i < height; i++) {
    map.setWall(Math.floor(width/2), i);
  }
  map.spawnSeeker(3, 5);
  map.spawnSeeker(2, 2);

  return map;
}