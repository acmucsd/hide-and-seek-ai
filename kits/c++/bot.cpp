#include "kit.hpp"
#include <string>

int main() {
    kit::Agent agent = kit::Agent();
    // initialize
    agent.initialize();

    while(true) {
        vector<string> commands;
        auto map = agent.map;
        auto units = agent.units;
        if (agent.team == kit::SEEKER) {
            /** AI Code for seeker goes here */

            // go through each of our units and decide on a place for them to move
            for (auto unit: units) {
                // seek and move in a random direction
                kit::direction random_direction = static_cast<kit::direction>(rand() % 9);
                // unit.id is id of the unit
                // unit.x unit.y are its coordinates, unit.distance is distance away from nearest opponent
                // map is the 2D map of what you can see. 
                // map[i][j] returns whats on that tile, 0 = empty, 1 = wall, 
                // anything else is then the id of a unit which can be yours or the opponents
            }
        }
        else {
            /** AI Code for hider goes here */
            // this code just sits tight and does nothing, hopes that seekers can't find this bot
        }
        // go through each of our units and decide on a place for them to move
        // end turn
        agent.end_turn();
        // wait for updates
        agent.update();
    
    }
  
return 0;
}