import HideAndSeekDesign from '../src';
import * as Dimension from 'dimensions-ai';
import Logger = Dimension.Logger;
import { MongoDB, GCloudStorage } from 'dimensions-ai';
let hideandseekdesign = new HideAndSeekDesign('hide-and-seek-v1.9.8', {
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

let randomBot = {file: './kits/js/bot.js', name: 'random'};
let pybot = {file: './kits/python/bot.py', name: 'bot_py'};
let bugpybot = {file: './test/bots/python/bug/bot.py', name: 'bot_bug_py'};
let stillbot = {file: './test/bots/js/stillbot/bot.js', name:'still'};
let chaseBot = {file: './test/bots/js/benchmark/bench.js', name: 'chaser'};
let botlist = [chaseBot, randomBot];
// for (let i = 0; i < 2; i++) {

//   botlist.push({file: './kits/js/bot.js', name: 'random_' + i});
// }

// let mongo = new MongoDB('mongodb://localhost:27017/hide_and_seek');
// let gcloudstorage = new GCloudStorage({
//   projectId: "proto-code",
//   keyFilename: "./test/keys/proto-code-d5588dd59697.json"
// });
// hideandseek.use(mongo);
// hideandseek.use(gcloudstorage);
let bot = {file: './kits/js/bot.js', name: 'bot'};
let tourney = hideandseek.createTournament([bugpybot, randomBot], {
    type: Dimension.Tournament.TOURNAMENT_TYPE.LADDER,
    rankSystem: Dimension.Tournament.RANK_SYSTEM.TRUESKILL,
    loggingLevel: Dimension.Logger.LEVEL.INFO,
    name: 'Hide and Seek',
    consoleDisplay: false,
    defaultMatchConfigs: {
      randomizeSeeker: true,
      liveView: false,
      loggingLevel: Dimension.Logger.LEVEL.INFO,
      storeReplayDirectory: 'replays',
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
  tourney.run();

