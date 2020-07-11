/**
 * Benchmark bot
 * 
 * As chaser, moves randomlyy until sees hider, then swarm towards hider
 * 
 * As hider, stays put until sees seeker, then runs away from first seeker in sight
 */


const kit = require('./kit');
const ALL_DIRECTIONS = kit.ALL_DIRECTIONS;
const DIRECTION = kit.DIRECTION;
// create a new agent
const agent = new kit.Agent();

// first initialize the agent, and then proceed to go in a loop waiting for updates and running the AI
agent.initialize().then(async () => {
  while(true) {
    
    /** AI Code goes here */
    let commands = [];

    let units = agent.units;
    let opposingUnits = agent.opposingUnits;
    if (agent.team === kit.SEEKER) {
  
      units.forEach((unit) => {
        if (opposingUnits.length === 0) {
          let randomDirection = Math.floor(Math.random() * ALL_DIRECTIONS.length);
          commands.push(unit.move(randomDirection));
        }
        else {
          // follow first unit
          let target = opposingUnits[0];
          let bestdir = ALL_DIRECTIONS[0];
          let closestdist = 999999;
          for (let i = 0; i < ALL_DIRECTIONS.length; i++) {
            let dir = ALL_DIRECTIONS[i];
            let newLoc = applyDirection(unit.x, unit.y, dir);
            if (notBlocked(agent.map, newLoc.x, newLoc.y)) {
              let dist = distance(newLoc.x, newLoc.y, target.x, target.y);
              if (dist < closestdist) {
                closestdist = dist;
                bestdir = dir
              }
            }
          }
          commands.push(unit.move(bestdir));
        }
      });
    }
    else {
      agent.units.forEach((unit) => {
        if (opposingUnits.length === 0) {

        }
        else {
          let ox = opposingUnits[0].x; let oy = opposingUnits[0].y
          let bestdir = ALL_DIRECTIONS[0];
          let farthestDist = -1;
          for (let i = 0; i < ALL_DIRECTIONS.length; i++) {
            let dir = ALL_DIRECTIONS[i];
            let newLoc = applyDirection(unit.x, unit.y, dir);
            if (notBlocked(agent.map, newLoc.x, newLoc.y)) {
              let dist = distance(newLoc.x, newLoc.y, ox, oy);
              if (dist > farthestDist) {
                farthestDist = dist;
                bestdir = dir
              }
            }
          }
          // let randomDirection = Math.floor(Math.random() * ALL_DIRECTIONS.length);
          commands.push(unit.move(bestdir));
        }
      });
    }

    // choose a random direction
    
    // move in that direction by logging it
    console.log(commands.join(","));

    // now we end our turn and wait for updates
    agent.endTurn();
    // wait for update from match engine
    await agent.update();
    
    
  }
});

function inMap(map, x, y) {
  if (x < 0 || y < 0 || x >= map[0].length || y >= map.length) {
    return false;
  }
  return true;
}
function notBlocked(map, x, y)  {
  if (inMap(map, x, y)) {
    if (map[y][x] === 0) {
      return true;
    }
  }
  return false;
}
function distance(x1, y1, x2, y2) {
  return Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
}

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