import sys
from enum import Enum

def apply_direction(x, y, dir):
    newx = x
    newy = y
    if (dir == 0):
        newy -= 1
    elif (dir == 1):
        newy -= 1
        newx += 1
    elif (dir == 2):
        newx += 1
    elif (dir ==3):
        newx += 1
        newy += 1
    elif (dir == 4):
        newy += 1
    elif (dir == 5):
        newy += 1
        newx -= 1
    elif (dir == 6):
        newx -= 1
    elif (dir == 7):
        newx -= 1
        newy -= 1
    elif (dir == 8):
        pass
    
    return (newx, newy)

def read_input():
    """
    Reads input from stdin
    """
    try:
        return input()
    except EOFError as eof:
        raise SystemExit(eof)
      
class Team(Enum):
    SEEKER = 2
    HIDER = 3

class Direction(Enum):
    NORTH = 0
    NORTHEAST = 1
    EAST = 2
    SOUTHEAST = 3
    SOUTH = 4
    SOUTHWEST = 5
    WEST = 6
    NORTHWEST = 7
    STILL = 8

class Unit:
    def __init__(self, id, x, y, dist):
        self.id = id
        self.x = x
        self.y = y
        self.distance = dist

    def move(self, dir: int) -> str:
        return "%d_%d" % (self.id, dir)


class Agent:
    round_num = 0
    """
    Constructor for a new agent
    User should edit this according to their `Design`
    """
    def __init__(self):
        pass

    """
    Initialize Agent for the `Match`
    User should edit this according to their `Design`
    """
    def initialize(self):
        meta = read_input().split(",")
        self.id = int(meta[0])
        self.team = Team(int(meta[1]))

        self._store_unit_info()
        

        [width, height] = [int(i) for i in (read_input().split(","))]
        self.map = []
        for i in range(height):
            line = read_input().split(",")
            parsedList = []
            for j in range(len(line)):
                if line[j] != '':
                    parsedList.append(int(line[j]))

            self.map.append(parsedList)

        self.round_num = 0

        self._update_map_with_ids()

    def _reset_map(self):

        for _, unit in enumerate(self.units):
            self.map[unit.y][unit.x] = 0

        for _, unit in enumerate(self.opposingUnits):
            self.map[unit.y][unit.x] = 0

    def _update_map_with_ids(self):

         # add unit ids to map
        for _, unit in enumerate(self.units):
            self.map[unit.y][unit.x] = unit.id
        
        # add unit ids to map
        for _, unit in enumerate(self.opposingUnits):
            self.map[unit.y][unit.x] = unit.id

    def _store_unit_info(self):
        units_and_coords = read_input().split(",")

        self.units = []
        for _, val in enumerate(units_and_coords):
            if (val != ""):
                [id, x, y, dist] = [int(k) for k in val.split("_")]
                self.units.append(Unit(id, x, y, dist))

        units_and_coords = read_input().split(",")
        
        self.opposingUnits = []
        for _, value in enumerate(units_and_coords):
            if (value != ""):
                [id, x, y] = [int(k) for k in value.split("_")]
                self.opposingUnits.append(Unit(id, x, y, -1))

    """
    Updates Agent's own known state of `Match`
    User should edit this according to their `Design
    """
    def update(self):
        self.round_num += 1
        self._reset_map()
        self._store_unit_info()
        self._update_map_with_ids()

    """
    End a turn
    """
    def end_turn(self):
        print('D_FINISH')
        
