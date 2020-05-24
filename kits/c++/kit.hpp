#include <string>
#include <sstream>
#include <iostream>
#include <regex>
#include <vector>
using namespace std; 
namespace kit {

    static string getline() {
        string line;
        getline(std::cin, line);

        // exit if stdin is bad now
        if (!std::cin.good()) exit(0);

        // return the line
        return line;
    }
    
    /**
     * From https://stackoverflow.com/questions/14265581/parse-split-a-string-in-c-using-string-delimiter-standard-c
     * 
     * thank you
     */
    static std::vector<std::string> split(std::string &s, const string &delim) {
        int pos = 0;
        string token;
        vector<string> strs;
        while ((pos = s.find(delim)) != std::string::npos) {
            token = s.substr(0, pos);
            strs.push_back(token);
            s.erase(0, pos + delim.length());
        }
        strs.push_back(s);
        return strs;
    }
    enum direction {North, Northeast, East, Southeast, South, Southwest, West, Northwest, Still};
    class Unit {
        public:
        int distance;
        int id;
        int x;
        int y;
        Unit(int id, int x, int y, int distance): id(id), x(x), y(y), distance(distance) {};
        string move(direction dir) {
            return id + "_" + dir;
        }
    };
    const static int SEEKER = 2;
    const static int HIDER = 3;
    class Agent {
        private: 
        void resetmap() {
            for (Unit unit: units) {
                map.at(unit.y).at(unit.x) = 0;
            }
            for (Unit unit: opposing_units) {
                map.at(unit.y).at(unit.x) = 0;
            }
        }
        void update_map_with_ids() {

            for (Unit unit: units) {
                map.at(unit.y).at(unit.x) = unit.id;
            }
            for (Unit unit: opposing_units) {
                map.at(unit.y).at(unit.x) = unit.id;
            }
        }
        void store_unit_info() {
            units.clear();
            std::string unit_and_coords_s = (kit::getline());
            vector<string> unit_and_coords = split(unit_and_coords_s, ",");
            for (string unit_and_coord : unit_and_coords) {
                if (unit_and_coord.compare("") != 0) {
                    vector<string> meta = split(unit_and_coord, "_");
                    units.push_back(Unit(stoi(meta[0]), stoi(meta[1]), stoi(meta[2]), stoi(meta[3])));
                }
            }
            opposing_units.clear();
            unit_and_coords_s = (kit::getline());
            unit_and_coords = split(unit_and_coords_s, ",");
            for (string unit_and_coord : unit_and_coords) {
                if (unit_and_coord.compare("") != 0) {
                    vector<string> meta = split(unit_and_coord, "_");
                    opposing_units.push_back(Unit(stoi(meta[0]), stoi(meta[1]), stoi(meta[2]), -1));
                }
            }
        }
        public:
        
        int id;
        int round_number = 0;
        int team;
        vector<Unit> units;
        vector<Unit> opposing_units;

        vector<vector<int> > map;

        Agent() {

        }
        /**
         * Initialize Agent for the `Match`
         * User should edit this according to their `Design`
         */
        void initialize() {
            // get agent ID
            std::string meta = (kit::getline());
            vector<string> meta_r = split(meta, ",");
            id = stoi(meta_r[0]);
            team = stoi(meta_r[1]);

            store_unit_info();

            string map_meta = (kit::getline());

            vector<string> map_meta_r = split(map_meta, ",");

            const int width = stoi(map_meta_r.at(0));
            const int height = stoi(map_meta_r.at(1));

            for (int y = 0; y < height; y++) {
                std::string map_row = (kit::getline());
                vector<string> map_row_r = split(map_row, ",");
                vector<int> r;
                map.push_back(r);
                for (int x = 0; x < width; x++) {
                    map[y].push_back(stoi(map_row_r.at(x)));
                }
            }
            update_map_with_ids();

        }
        // end a turn
        static void end_turn() {
            cout << "D_FINISH" << std::endl << std::flush;
        }

        /**
         * Updates agent's own known state of `Match`.
         * User should edit this according to their `Design`.
         */
        void update() {

            round_number++;
            resetmap();
            store_unit_info();
            update_map_with_ids();
        }
    };

    pair<int, int> apply_direction(int x, int y, kit::direction dir) {
        int newx = x;
        int newy = y;
        switch(dir) {
            case 0:
            newy -=1;
            break;
            case 1:
            newy -=1;
            newx +=1;
            break;
            case 2:
            newx += 1;
            break;
            case 3:
            newx += 1;
            newy += 1;
            break;
            case 4:
            newy += 1;
            break;
            case 5:
            newy += 1;
            newx -= 1;
            break;
            case 6:
            newx -= 1;
            break;
            case 7:
            newx -= 1;
            newy -= 1;
            break;
            case 8:
            break;
        }
        return make_pair(newx, newy);
    };
    
}