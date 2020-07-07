const HideAndSeekDesign = require('@acmucsd/hide-and-seek-ai').default;
const Dimension = require('dimensions-ai');
require('dotenv').config()
const { MongoDB, GCloudStorage, Logger } = Dimension;
let hideandseekdesign = new HideAndSeekDesign('hide-and-seek-v1.9.14', {
  engineOptions: {
    noStdErr: false,
    timeout: {
      max: 1000 + 100
    },
    memory: {
      limit: 200000000, // ~ 200 mb
      active: true
    }
  }
});

let hideandseek = Dimension.create(hideandseekdesign, {
  loggingLevel: Logger.LEVEL.INFO,
  activateStation: true,
  observe: true,
  secureMode: true,
  id: "oLBptg",
  name: "Hide and Seek",
  stationConfigs: {
    disableUploads: true
  }
});
let mongo = new MongoDB(process.env.MONGO_STRING);
let gcloudstorage = new GCloudStorage({
  projectId: "proto-code",
  keyFilename: "./keys/proto-code-d5588dd59697.json"
});
let promises = [];
promises.push(hideandseek.use(mongo));
promises.push(hideandseek.use(gcloudstorage));
Promise.all(promises).then(() => {
  let tourney = hideandseek.createTournament([], {
    type: Dimension.Tournament.TOURNAMENT_TYPE.LADDER,
    rankSystem: Dimension.Tournament.RANK_SYSTEM.TRUESKILL,
    loggingLevel: Dimension.Logger.LEVEL.INFO,
    name: 'Hide and Seek',
    consoleDisplay: false,
    defaultMatchConfigs: {
      randomizeSeeker: false,
      liveView: false,
      loggingLevel: Dimension.Logger.LEVEL.ERROR,
      storeReplayDirectory: 'hide_and_seek_official_tournament/replays',
      storeErrorDirectory: 'hide_and_seek_official_tournament/errorlogs',
      agentOptions: {
        runCommands: {'.py': ['python3']}
      },
    },
    agentsPerMatch: [2],
    tournamentConfigs: {
      maxConcurrentMatches: 1,
      matchMake: (rankings) => {
        let sortedPlayers = rankings.map((p) => p.player).filter((p) => !p.disabled);
        let newQueue = [];
        sortedPlayers.forEach((player, rank) => {

          
          // take random competitors from +/- competitorCount * 2.5 ranks near you
          if (sortedPlayers.length < 2) {
            return;
          }
          let oplayer = sortedPlayers[rank + 1];
          if (rank == sortedPlayers.length - 1) {
            oplayer = sortedPlayers[rank - 1];
          }
          let lower = 0
          let upper = 6
          lower = Math.max(0, rank - 5);
          upper = Math.min(sortedPlayers.length, rank + 5);

          let selectFrom = [...sortedPlayers.slice(lower, rank), ...sortedPlayers.slice(rank + 1, upper)];
          oplayer = selectFrom[Math.floor(Math.random() * selectFrom.length)];
          newQueue.push([player, oplayer], [oplayer, player]);
        });

        // console.log(newQueue.map((a) => {
        //   return [a[0].tournamentID.name, a[1].tournamentID.name]
        // }));
        return newQueue;
      }
    },
    resultHandler: HideAndSeekDesign.trueskillResultHandler,
    id: 'a0Zlpa'
  });
  // tourney.run();
})

// cgroups
/*

//sudo pm2 restart node run.prod.js --max-memory-restart 200M
# create group
sudo cgcreate -g memory,cpu:botgroup
# set limit
sudo cgset -r memory.limit_in_bytes=50M botgroup
sudo cgexec -g memory,cpu:botgroup sudo node run.prod.js
*/

const shuffle =(arr) => {
  for (let i = arr.length - 1; i >= 1; i--) {
    let j = Math.floor(Math.random() * i);
    let tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}