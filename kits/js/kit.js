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

  /**
   * Constructor for a new agent
   * User should edit this according to the `Design` this agent will compete under
   */
  constructor() {
    this._setup(); // DO NOT REMOVE
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

    // get unit ids
    let unitIDs = (await this.getLine()).nextIntArr();
    this.units = unitIDs;
    // console.error('my units: ' + this.units);
    // get some other necessary initial input
    let mapInfo = (await this.getLine()).nextIntArr();
    let width = mapInfo[0];
    let height = mapInfo[1];
    this.map = [];
    for (let i = 0; i < height; i++) {
      let line = (await this.getLine()).nextIntArr();
      
      this.map.push(line);
    }
    
    // console.error(this.map);
  }
  /**
   * Updates agent's own known state of `Match`
   * User should edit this according to their `Design`.
   */
  async update() {

    // wait for the engine to send any updates
    let unitIDs = (await this.getLine()).nextIntArr();
    this.round++;
    this.units = unitIDs;
    for (let i = 0; i < this.map.length; i++) {
      let line = (await this.getLine()).nextIntArr();
      this.map[i] = line;
    }
  }

  /**
   * Returns whats in vision
   */
  vision() {

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

module.exports = { Agent, DIRECTION, ALL_DIRECTIONS };