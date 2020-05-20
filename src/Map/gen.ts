/**
 * Generates a map
 */

import { GameMap, EMPTY, WALL, MOVE_DELTAS } from "."
import { HideAndSeekConfigs } from "..";
import seedrandom from 'seedrandom';

export enum SYMMETRY {
  HORIZONTAL,
  VERTICAL
}

export const mapGen = (width: number, height: number, configs: HideAndSeekConfigs) => {
  let map = new GameMap(width, height, configs);
  let rng = new seedrandom(configs.seed);
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
      console.log(x, y);
      map.spawnSeeker(x, y);
      map.spawnHider(width - x - 1, y);
    }
  }

  // using game of life to randomly generate half a map
  let arr = [];
  for (let i = 0; i < height2; i++) {
    arr.push([]);
    for (let j = 0; j < width2; j++) {
      
      let type = EMPTY;
      if (!map.isSeeker(map.map[i][j]) && !map.isHider(map.map[i][j])) {
        if (rng() < DENSITY) {
          type = WALL;
        }
      }
      arr[i].push(type);
    }
  }

  // simulate GOL
  for (let i = 0; i < 2; i++) {
    simulate(arr);
  }

  for (let y = 0; y < height2; y++) {
    for (let x = 0; x < width2; x++) {
      if (arr[y][x] === WALL) {
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




  return map;
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