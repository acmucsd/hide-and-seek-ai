/**
 * Generates a map
 */

import { GameMap, EMPTY, WALL, MOVE_DELTAS } from "."
import { HideAndSeekConfigs, DIRECTION } from "..";
import seedrandom from 'seedrandom';

export enum SYMMETRY {
  HORIZONTAL,
  VERTICAL
}

export const mapGen = (width: number, height: number, configs: HideAndSeekConfigs, rng: () => number): GameMap => {
  let map = new GameMap(width, height, configs);
  // vary density by 0.2
  let DENSITY = configs.parameters.DENSITY - 0.1 + 0.2 * rng();

  let SeekerCount = Math.floor(rng() * configs.parameters.SEEKER_MAX + 1);

  let symmetry = SYMMETRY.HORIZONTAL;
  if (rng() < 0.5) {
    symmetry = SYMMETRY.VERTICAL;
  }
  let height2 = height;
  let width2 = width;
  if (symmetry === SYMMETRY.VERTICAL) {
    height2 /= 2;
    for (let i = 0; i < SeekerCount; i++) {
      let x = Math.floor(rng() * (width2 - 1));
      let y = Math.floor(rng() * (height2 - 4));
      map.spawnSeeker(x, y);
      map.spawnHider(x, height - y - 1);
    }
  }
  else if (symmetry === SYMMETRY.HORIZONTAL) {
    
    width2 /= 2;
    for (let i = 0; i < SeekerCount; i++) {
      let x = Math.floor(rng() * (width2 - 4));
      let y = Math.floor(rng() * (height2 - 1));
      map.spawnSeeker(x, y);
      map.spawnHider(width - x - 1, y);
    }
  }

  // using game of life to randomly generate half a map
  let arr = [];
  for (let y = 0; y < height2; y++) {
    arr.push([]);
    for (let x = 0; x < width2; x++) {
      
      let type = EMPTY;
      if (!map.hasUnit(x, y) && 
          !map.hasUnit(x + 1, y) && 
          !map.hasUnit(x - 1, y) &&
          !map.hasUnit(x, y + 1) &&
          !map.hasUnit(x, y - 1)
          ) {
        if (rng() < DENSITY) {
          type = WALL;
        }
      }
      arr[y].push(type);
    }
  }

  // simulate GOL for 2 rounds
  for (let i = 0; i < 2; i++) {
    simulate(arr);
  }

  for (let y = 0; y < height2; y++) {
    for (let x = 0; x < width2; x++) {
      if (arr[y][x] === WALL && map.map[y][x] === EMPTY) {
        map.setWall(x, y);
        if (symmetry === SYMMETRY.HORIZONTAL) {
          map.setWall(width - x - 1, y);
        }
        else {
          map.setWall(x, height - y - 1);
        }
      }
    }
  }

  // If invalid map, reroll a map
  if (!validateMap(map)) {
    return mapGen(width, height, configs, rng);
  }




  return map;
}

/**
 * Checks if the game is winnable by seekers and hiders. Performs a BFS looking
 * for the other units
 * @param map 
 */
const validateMap = (map: GameMap) => {
  let unit = Array.from(map.idMap.values())[0];
  // bfs from that unit
  let unitsReached = new Set();
  let visitedSet = new Set();
  let queue = [{x: unit.x, y: unit.y}];
  unitsReached.add(unit.id);
  while (queue.length) {
    if (unitsReached.size === map.idMap.size) {
      return true;
    }
    else {
      let {x, y} = queue.pop();
      visitedSet.add(map.hashLoc(x, y));
      if (map.hasUnit(x, y)) {
        unitsReached.add(map.map[y][x]);
      }
      for (let i = 0; i < MOVE_DELTAS.length; i++) {
        let delta = MOVE_DELTAS[i];
        let nx = x + delta[0];
        let ny = y + delta[1];
        let hash = map.hashLoc(nx, ny);
        if (!visitedSet.has(hash) && map.inMap(nx, ny) && !map.isWall(nx, ny)) {
          queue.push({x: nx, y: ny});
        }
      }
    }
  }
  return false;
}

const simulate = (arr: Array<Array<number>>) => {
  let padding = 2;
  let deathLimit = 2;
  let birthLimit = 4;
  for (let i = padding; i < arr.length - padding; i++) {
    for (let j = padding; j < arr[0].length - padding; j++) {
      let cell = arr[i][j];
      let alive = 0;
      for (let i = 0; i < MOVE_DELTAS.length; i++) {
        let delta = MOVE_DELTAS[i];
        let ny= i + delta[1];
        let nx =j + delta[0];
        if (nx < 0 || ny < 0 || nx >= arr[0].length || ny >= arr.length) {

        }
        else if (arr[ny][nx] === WALL) {
          alive++;
        }
      }
      if (arr[i][j] == WALL) {
        if (alive < deathLimit) {
            arr[i][j] = EMPTY;
        }
        else {
            arr[i][j] = WALL;
        }
      }
      else {
        if (alive > birthLimit) {
            arr[i][j] = WALL;
        }
        else {
            arr[i][j] = EMPTY;
        }
      }
    }
  }
}