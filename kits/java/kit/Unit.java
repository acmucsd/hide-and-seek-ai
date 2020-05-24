package kit;

import kit.Agent.Direction;

public class Unit {
    public int id;
    public int x;
    public int y;
    Unit(int id, int x, int y) {
        this.id = id;
        this.x = x;
        this.y = y;
    }
    public String move(Agent.Direction dir) {
      return this.id + "_" + dir.value;
    }
}