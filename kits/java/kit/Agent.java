package kit;

import java.util.Scanner;
import java.util.ArrayList;

public class Agent {

    private final static int SEEKER_NUMBER = 2;
    private final static int HIDER_NUMBER = 3;
    private final static String DELIMITER = ",";

    public enum Team {
      SEEKER,
      HIDER
    }

    public enum Direction {
        NORTH(0),
        NORTHEAST(1),
        EAST(2),
        SOUTHEAST(3),
        SOUTH(4),
        SOUTHWEST(5),
        WEST(6),
        NORTHWEST(7),
        STILL(8);
        public final int value;
        private Direction(int val) {
            this.value = val;
        }
    }

    public int[][] map;

    public int round_number = 0;
    
    /**
     * List of unit IDs
     */
    public ArrayList<Unit> units = new ArrayList<>();

    /**
     * List of opposing unit IDs
     */
    public ArrayList<Unit> opposingUnits = new ArrayList<>();

    /**
     * What team you are on
     */
    public Team team;

    private final Scanner scanner;

    /**
     * Agent ID
     */
    public int id;

    /**
     * Constructor for a new agent User should edit this according to their `Design`
     */
    public Agent() {
        scanner = new Scanner(System.in);
    }

    /**
     * Initialize Agent for the `Match` User should edit this according to their
     * `Design`
     */
    public void initialize() {
        // get agent ID and team
        String[] meta = scanner.nextLine().split(DELIMITER);
        id = Integer.parseInt(meta[0]);
        int team_val = Integer.parseInt(meta[1]);

        if (team_val == HIDER_NUMBER) {
            team = Team.HIDER;
        }
        else {
            team = Team.SEEKER;
        }

        storeUnitInfo();
        
        // get map data

        String data = scanner.nextLine();
        String[] mapMeta = data.split(DELIMITER);
        final int width = Integer.parseInt(mapMeta[0]);
        final int height = Integer.parseInt(mapMeta[1]);

        map = new int[height][width];
        for (int y = 0; y < height; y++) {
            String row = scanner.nextLine();
            String[] rowarr = row.split(DELIMITER);
            for (int x = 0; x < width; x++) {
                int cell = Integer.parseInt(rowarr[x]);
                map[y][x] = cell;
            }
        }
        
        round_number = 0;
    }
    /**
     * Resets map back to 0s and 1s, the empty and wall tiles
     */
    private void resetMap() {
        for (Unit unit : units) {
            map[unit.y][unit.x] = 0;
        }
        for (Unit unit : opposingUnits) {
            map[unit.y][unit.x] = 0;
        }
    }

    /**
     * Retrieves from stdin any unit info this agent knows about
     */
    private void storeUnitInfo() {
        units.clear();

        String[] units_and_coords = (scanner.nextLine()).split(",");
        for (String unit_and_coord : units_and_coords) {
            if (!unit_and_coord.equals("")) {
                String[] info = unit_and_coord.split("_");
                int id = Integer.parseInt(info[0]);
                int x = Integer.parseInt(info[1]);
                int y = Integer.parseInt(info[2]);
                int dist = Integer.parseInt(info[3]);
                units.add(new Unit(id, x, y, dist));
            }
        }

        opposingUnits.clear();
        String meta = scanner.nextLine();
        
        units_and_coords = meta.split(",");
        for (String unit_and_coord : units_and_coords) {
            if (!unit_and_coord.equals("")) {
                String[] info = unit_and_coord.split("_");
                int id = Integer.parseInt(info[0]);
                int x = Integer.parseInt(info[1]);
                int y = Integer.parseInt(info[2]);
                opposingUnits.add(new Unit(id, x, y, -1));
            }
        }
    }

    /**
     * updates map with known data on seekers and hider locations
     */
    private void updateMapWithIDs() {
        for (Unit unit : units) {
            map[unit.y][unit.x] = unit.id;
        }
        for (Unit unit : opposingUnits) {
            map[unit.y][unit.x] = unit.id;
        }
    }

    /**
     * Updates agent's own known state of `Match` User should edit this according to
     * their `Design`.
     */
    public void update() {
        // wait for the engine to send any updates
        round_number += 1;
        resetMap();
        storeUnitInfo();
        updateMapWithIDs();
    }

    /**
     * End a turn
     */
    public void endTurn() {
        System.out.println("D_FINISH");
        System.out.flush();
    }
}