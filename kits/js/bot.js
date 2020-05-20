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
    agent.units.forEach((unitID) => {
      let randomDirection = Math.floor(Math.random() * ALL_DIRECTIONS.length);
      commands.push(`${unitID}_${randomDirection}`);
    });
    // choose a random direction
    
    // move in that direction by logging it
    console.log(commands.join(","));

    // now we end our turn and wait for updates
    agent.endTurn();
    // wait for update from match engine
    await agent.update();
    
    
  }
});