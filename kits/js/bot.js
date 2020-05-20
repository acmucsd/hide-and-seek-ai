const kit = require('./kit');
const ALL_DIRECTIONS = kit.ALL_DIRECTIONS;
const DIRECTION = kit.DIRECTION;
const SEEKER = kit.SEEKER;
const HIDER = kit.HIDER;
// create a new agent
const agent = new kit.Agent();

// first initialize the agent, and then proceed to go in a loop waiting for updates and running the AI
agent.initialize().then(async () => {
  while(true) {
    
    if (agent.team === SEEKER) {
      /** AI Code for seeker goes here */
      let commands = [];
      agent.units.forEach((unitID) => {
        // seek and move in a random direction
        let randomDirection = Math.floor(Math.random() * ALL_DIRECTIONS.length);
        commands.push(agent.move(unitID, randomDirection));
      });
      
      // submit our commands to the match engine
      console.log(commands.join(","));

      
    }
    else {
      /** AI Code for hider goes here */
      // this code just sits tight and does nothing, hopes that seekers can't find this bot

    }

    // now we end our turn and wait for updates
    agent.endTurn();
    // wait for update from match engine
    await agent.update();
    
    
  }
});