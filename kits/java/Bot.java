import kit.*;
import java.util.*;
import kit.Agent.Direction;
import kit.Agent.Team;
public class Bot {
    public static void main(final String[] args) throws Exception {
        Agent agent = new Agent();
        agent.initialize();
        
        while(true) {
            ArrayList<String> commands = new ArrayList<>();
            ArrayList<Unit> units = agent.units;
            int[][] map = agent.map;

            if (agent.team.equals(Team.SEEKER)) {
                /** AI Code for seeker goes here */
                // go through each of our units and decide on a place for them to move
                for (Unit unit : units) {
                    // unit.id is id of the unit
                    // unit.x unit.y are its coordinates, unit.distance is distance away from nearest opponent
                    // map is the 2D map of what you can see. 
                    // map[i][j] returns whats on that tile, 0 = empty, 1 = wall, 
                    // anything else is then the id of a unit which can be yours or the opponents

                    // our strategy here is pick a random direction to move that isn't off the map
                    Direction[] dirs = Direction.values();
                    Direction randomDirection = dirs[(int) (Math.random() * dirs.length)];
                    
                    // apply direction to unit's current position to find new position
                    int[] newPos = Utils.applyDirection(unit.x, unit.y, randomDirection);
                    int x = newPos[0]; int y = newPos[1];
                    
                    if (x < 0 || y < 0 || x >= map[0].length || y >= map.length) {
                        // we do nothing if the new position is not in the map
                    }
                    else {
                        // make the unit move in direction randomDirection
                        commands.add(unit.move(randomDirection));
                    }
                }
            }
            else {
                /** AI Code for hider goes here */
                // this code just sits tight and does nothing, hopes that seekers can't find this bot
            }

            // submit our commands to the engine
            System.out.println(String.join(",", commands));
            
            // end turn
            agent.endTurn();
            // wait for updates
            agent.update();
            
        }
    }
}
