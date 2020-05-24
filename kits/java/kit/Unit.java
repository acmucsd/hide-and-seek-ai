package kit;

import kit.Agent.Direction;

public class Unit {
    public int id;
    public int x;
    public int y;
    public int distance;
    Unit(int id, int x, int y, int dist) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.distance = dist;
    }
    public String move(Agent.Direction dir) {
      return this.id + "_" + dir.value;
    }
}