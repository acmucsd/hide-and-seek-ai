#!/usr/bin/env node
import HideAndSeekDesign from '.';
import * as Dimension from 'dimensions-ai';
import yargs from 'yargs';
import { MatchDestroyedError } from 'dimensions-ai/lib/DimensionError';
yargs.options({
  'watch': {
    alias: 'w',
    describe: 'watch a match'
  },
  'seed': {
    alias: 's',
    describe: 'seed for match'
  },
  'supress': {
    describe: 'supress all logs',
    default: 'false'
  },
  'delay': {
    describe: 'delay of replays',
    default: 0.2
  },
  'live': {
    describe: 'live watch match on terminal',
    default: 'true'
  },
  'maxtime': {
    describe: 'max time per turn for the bot',
    default: 1000
  }
}).help()
let argv = yargs.argv;

// watch mode
if (argv.w || argv.watch) {
  let file = argv.w || argv.watch;

  let delay = parseFloat(<string>argv.delay);
  if (isNaN(delay)) {
    throw Error('delay argument is not a number')
  }
  HideAndSeekDesign.watch(<string>file, delay);
}
else {
  // take in two files
  let file1 = argv._[0];
  let file2 = argv._[1];
  let maxtime = 1000;
  if (argv.maxtime) {
    maxtime = parseInt(<string>argv.maxtime);
    if (isNaN(maxtime)) {
      throw Error('maxtime argument is not a number')
    }
  }
  let loglevel = Dimension.Logger.LEVEL.WARN;
  if (argv.suppress) {
    loglevel = Dimension.Logger.LEVEL.NONE;
  }
  if (argv.log) {
    loglevel = parseInt(<string>argv.log);
    if (isNaN(loglevel)) {
      throw Error('log argument is not a number')
    }
  }
  let seed: any = Math.floor(Math.random() * 1000000);
  if (argv.seed) {
    seed = argv.seed;
  }

  let hideandseekdesign = new HideAndSeekDesign('HideAndSeek!', {
    engineOptions: {
      noStdErr: false,
      timeout: {
        max: maxtime
      }
    }
  });
  let hideandseek = Dimension.create(hideandseekdesign, {
    loggingLevel: loglevel,
    activateStation: false,
    observe: false,
    defaultMatchConfigs: {
      agentOptions: {
        runCommands: {'.py': ['python3']}
      }
    }
  });
  hideandseek.runMatch(
    [{ file: file1, name: file1}, { file: file2, name: file2} ], {
      seed: seed,
      liveView: argv.live == 'true'
    }
  ).then((r) => console.log(r)).catch((err) => {
    if (err instanceof MatchDestroyedError) {
      // ignore;
    }
    else {
      throw err;
    }
  }).catch((err) => {
    console.error(err)
  });
  
}
// let delay = parseFloat(process.argv[3]);
// HideAndSeekDesign.watch(process.argv[2], delay);