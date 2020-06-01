const HideAndSeekDesign = require('@acmucsd/hide-and-seek-ai').default;
const Dimension = require('dimensions-ai');
require('dotenv').config()
const { MongoDB, GCloudStorage, Logger } = Dimension;
let hideandseekdesign = new HideAndSeekDesign('hide-and-seek-v1.9.7', {
  engineOptions: {
    noStdErr: true,
    timeout: {
      max: 1000
    },
    memory: {
      limit: 100000000, // ~ 100 mb
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
  name: "Hide and Seek"
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
      randomizeSeeker: true,
      liveView: false,
      loggingLevel: Dimension.Logger.LEVEL.ERROR,
      storeReplayDirectory: 'hide_and_seek_official_tournament/replays',
      agentOptions: {
        runCommands: {'.py': ['python3']}
      }
    },
    agentsPerMatch: [2],
    tournamentConfigs: {
      maxConcurrentMatches: 1,
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