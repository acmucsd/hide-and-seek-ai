const kit = require('./kit');
const ALL_DIRECTIONS = kit.ALL_DIRECTIONS;
const DIRECTION = kit.DIRECTION;
const SEEKER = kit.SEEKER;
const HIDER = kit.HIDER;
const applyDirection = kit.applyDirection;
// create a new agent
const agent = new kit.Agent();

// first initialize the agent, and then proceed to go in a loop waiting for updates and running the AI
agent.initialize().then(async () => {
  while(true) {
    let commands = [];
    let map = agent.map;
    if (agent.team === SEEKER) {
      /** AI Code for seeker goes here */
      
      // go through each of our units and decide on a place for them to move
      agent.units.forEach((unit) => {
        // seek and move in a random direction
        let randomDirection = Math.floor(Math.random() * ALL_DIRECTIONS.length);

        // unit.id is id of the unit
        // unit.x unit.y are its coordinate
        // map is the 2D map of what you can see. 
        // map[i][j] returns whats on that tile, 0 = empty, 1 = wall, 
        // anything else is then the id of a unit which can be yours or the opponents

        // we apply the proposed random direction to get the new coordinates if the unit moved in that direction
        let { x, y } = applyDirection(unit.x, unit.y, randomDirection);
        
        // check that the new position is in the map
        if (x < 0 || y < 0 || x >= map[0].length || y >= map.length) {
          // we do nothing if the new position is not in the map
        }
        else {
          // make the unit move in direction randomDirection
          commands.push(unit.move(randomDirection));
        }
      });
    }
    else {
      /** AI Code for hider goes here */
      // this code just sits tight and does nothing, hopes that seekers can't find this bot
      
    }

    // submit commands to match engine
    console.log(commands.join(","));

    // now we end our turn and wait for updates
    agent.endTurn();
    // wait for update from match engine
    await agent.update();
    
    
  }
});