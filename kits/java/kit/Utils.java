package kit;

import kit.Agent.Direction;

public class Utils {
    static public int[] applyDirection(int x, int y, Direction dir) {
      int newx = x;
      int newy = y;
      switch(dir) {
        case NORTH:
          newy -=1;
          break;
        case NORTHEAST:
          newy -=1;
          newx +=1;
          break;
        case EAST:
          newx += 1;
          break;
        case SOUTHEAST:
          newx += 1;
          newy += 1;
          break;
        case SOUTH:
          newy += 1;
          break;
        case SOUTHWEST:
          newy += 1;
          newx -= 1;
          break;
        case WEST:
          newx -= 1;
          break;
        case NORTHWEST:
          newx -= 1;
          newy -= 1;
          break;
        case STILL:
          break;
      }

      return new int[]{x, y};
    }
}