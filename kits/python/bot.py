from kit import Agent, Team, Direction
import math
import random 
import sys

# Create new agent
agent = Agent()

# initialize agent
agent.initialize()

while True:

    commands = []
    units = agent.units
    opposingUnits = agent.opposingUnits
    map = agent.map

    # AI Code goes here
    if (agent.team == Team.SEEKER):
        # seeker code

        for _, unit in enumerate(units):
            # unit.id is id of the unit
            # unit.x unit.y are its coordinate
            # map is the 2D map of what you can see. 
            # map[i][j] returns whats on that tile, 0 = empty, 1 = wall, 
            # anything else is then the id of a unit which can be yours or the opponents

             # choose a random direction to move in
            randomDirection = random.choice(list(Direction)).value
            commands.append(unit.move(randomDirection))
        
    else:
        # hider code, which does nothing, sits tight and hopes it doesn't get 
        # found by seekers
        pass



    # submit commands to the engine
    print(','.join(commands))

    # now we end our turn
    agent.end_turn()

    # wait for update from match engine
    agent.update()