const HideAndSeekDesign = require('hide-and-seek-ai');
const Dimension = require('dimensions-ai');
const { MongoDB, GCloudStorage } = Dimension;
let hideandseekdesign = new HideAndSeekDesign('hide-and-seek-v1.2.0', {
  engineOptions: {
    noStdErr: true,
    timeout: {
      max: 2000
    }
  }
});

let hideandseek = Dimension.create(hideandseekdesign, {
  loggingLevel: Logger.LEVEL.WARN,
  activateStation: true,
  observe: true,
  secureMode: true,
  id: "oLBptg",
  name: "Hide and Seek"
});

let dbpw = 'gyJv9gRzCbADB9C';

let mongo = new MongoDB(`mongodb+srv://admin:${dbpw}@cluster0-psah5.mongodb.net/test?retryWrites=true&w=majority`);
let gcloudstorage = new GCloudStorage({
  projectId: "proto-code",
  keyFilename: "./test/keys/proto-code-d5588dd59697.json"
});
hideandseek.use(mongo);
hideandseek.use(gcloudstorage);
let tourney = hideandseek.createTournament([], {
  type: Dimension.Tournament.TOURNAMENT_TYPE.LADDER,
  rankSystem: Dimension.Tournament.RANK_SYSTEM.TRUESKILL,
  loggingLevel: Dimension.Logger.LEVEL.INFO,
  name: 'Hide and Seek',
  consoleDisplay: false,
  defaultMatchConfigs: {
    randomizeSeeker: true,
    liveView: false,
    loggingLevel: Dimension.Logger.LEVEL.INFO
  },
  agentsPerMatch: [2],
  tournamentConfigs: {
    maxConcurrentMatches: 8,
  },
  resultHandler: HideAndSeekDesign.trueskillResultHandler,
  id: 'a0Zlpa'
});