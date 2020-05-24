const fs = require('fs');
const readline = require('readline');
const SEEKER = 2;
const HIDER = 3;
const DIRECTION = {
  NORTH: 0,
  NORTHEAST: 1,
  EAST: 2,
  SOUTHEAST: 3,
  SOUTH: 4,
  SOUTHWEST: 5,
  WEST: 6,
  NORTHWEST: 7,
  STILL: 8
}
const ALL_DIRECTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8];


// Create parser and use ',' as the delimiter between commands being sent by the `Match` and `MatchEngine`
const Parser = require('./parser');
const parse = new Parser(',');

class Unit {
  constructor(id, x, y, distance = undefined) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.distance = distance;
  }
  move(dir) {
    return `${this.id}_${dir}`;
  }
}

/**
 * Agent for sequential `Designs`
 */
class Agent {
  _setup() {

    // Prepare to read input
    const rl = readline.createInterface({
      input: process.stdin,
      output: null,
    });

    let buffer = [];
    let currentResolve;
    const makePromise = function() {
      return new Promise((resolve) => {
        currentResolve = resolve;
      });
    };
    // on each line, push line to buffer
    rl.on('line', (line) => {
      buffer.push(line);
      currentResolve();
      currentPromise = makePromise();
    });

    // The current promise for retrieving the next line
    let currentPromise = makePromise();
    
    // with await, we pause process until there is input
    const getLine = async () => {
      return new Promise(async (resolve) => {
        while (buffer.length === 0) {
          // pause while buffer is empty, continue if new line read
          await currentPromise;
        }
        // once buffer is not empty, resolve the most recent line in stdin, and remove it
        resolve(parse(buffer.shift()));
      });
    };
    this.getLine = getLine;
  }

  constructor() {
    this._setup(); // DO NOT REMOVE
  }

  /**
   * Store unit ifnrmation
   */
  async _storeUnitInformation() {
    let unitIDsAndCoordinates = (await this.getLine()).nextStrArr();
    let units = [];
    unitIDsAndCoordinates.forEach((info) => {
      info = info.split("_");
      let unit = new Unit(parseInt(info[0]), parseInt(info[1]), parseInt(info[2]), parseInt(info[3]));
      units.push(unit);
    });
    this.units = units;

    // reset opposing units
    this.opposingUnits = [];

    let otherUnitIDsAndCoordinatesLine = (await this.getLine());
    if (otherUnitIDsAndCoordinatesLine.contents.length) {
      let otherUnitIDsAndCoordinates = otherUnitIDsAndCoordinatesLine.nextStrArr();
      let opposingUnits = [];
      otherUnitIDsAndCoordinates.forEach((info) => {
        info = info.split("_");
        let unit = new Unit(parseInt(info[0]), parseInt(info[1]), parseInt(info[2]));
        opposingUnits.push(unit);
      });
      this.opposingUnits = opposingUnits;
    }

  }

  /**
   * Initialize Agent for the `Match`
   * User should edit this according to their `Design`
   */
  async initialize() {
    
    // get agent ID
    let meta = (await this.getLine()).nextIntArr();
    this.round = 0;
    this.id = meta[0];
    this.team = meta[1]; // equals SEEKER=3 of HIDER=2

    // get unit information
    await this._storeUnitInformation();

    // get map input
    let mapInfo = (await this.getLine()).nextIntArr();
    let width = mapInfo[0];
    let height = mapInfo[1];
    this.map = [];
    for (let i = 0; i < height; i++) {
      let line = (await this.getLine()).nextIntArr();
      this.map.push(line);
    }

    // add unit ids onto the map
    this.units.forEach((unit) => {
      this.map[unit.y][unit.x] = unit.id;
    });
    this.opposingUnits.forEach((unit) => {
      this.map[unit.y][unit.x] = unit.id;
    });
    
  }
  /**
   * Updates agent's own known state of `Match`
   */
  async update() {

    this.round++;
    // reset map unit ids 
    this.units.forEach((unit) => {
      this.map[unit.y][unit.x] = 0;
    });
    this.opposingUnits.forEach((unit) => {
      this.map[unit.y][unit.x] = 0;
    });
    // get unit information
    await this._storeUnitInformation();

    // add unit ids onto the map
    this.units.forEach((unit) => {
      this.map[unit.y][unit.x] = unit.id;
    });
    this.opposingUnits.forEach((unit) => {
      this.map[unit.y][unit.x] = unit.id;
    });

  }

  move(unitID, direction) {
    return `${unitID}_${direction}`;
  }

  /**
   * End a turn
   */
  endTurn() {
    console.log('D_FINISH');
  }
}

/**
 * Applies a direction to x,y and returns an object { x: number, y: number } that 
 * represents the coordinates after going in that direction by one step.
 * @param {number} x 
 * @param {number} y 
 * @param {number} dir 
 */
function applyDirection(x, y, dir) {
  let newx = x;
  let newy = y;
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
  }
  return { x: newx, y: newy};
}

module.exports = { Agent, DIRECTION, ALL_DIRECTIONS, SEEKER, HIDER, applyDirection };