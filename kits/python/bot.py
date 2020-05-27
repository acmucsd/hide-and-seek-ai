from kit import Agent, Team, Direction, apply_direction
import math
import random 
import sys

# Create new agent
agent = Agent()

# initialize agent
agent.initialize()

while True:

    commands = []
    units = agent.units # list of units you own
    opposingUnits = agent.opposingUnits # list of units on other team that you can see
    game_map = agent.map # the map
    round_num = agent.round_num # the round number

    
    if (agent.team == Team.SEEKER):
        # AI Code for seeker goes here

        for _, unit in enumerate(units):
            # unit.id is id of the unit
            # unit.x unit.y are its coordinates, unit.distance is distance away from nearest opponent
            # game_map is the 2D map of what you can see. 
            # game_map[i][j] returns whats on that tile, 0 = empty, 1 = wall, 
            # anything else is then the id of a unit which can be yours or the opponents

             # choose a random direction to move in
            randomDirection = random.choice(list(Direction)).value

            # apply direction to current unit's position to check if that new position is on the game map
            (x, y) = apply_direction(unit.x, unit.y, randomDirection)
            if (x < 0 or y < 0 or x >= len(game_map[0]) or y >= len(game_map)):
                # we do nothing if the new position is not in the map
                pass
            else:
                commands.append(unit.move(randomDirection))
        
    else:
        # AI Code for hider goes here
        # hider code, which does nothing, sits tight and hopes it doesn't get 
        # found by seekers
        pass



    # submit commands to the engine
    print(','.join(commands))

    # now we end our turn
    agent.end_turn()

    # wait for update from match engine
    agent.update()
