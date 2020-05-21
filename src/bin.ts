#!/usr/bin/env node
import HideAndSeekDesign from '.';
import * as Dimension from 'dimensions-ai';
import yargs from 'yargs';
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
    default: false
  },
  'delay': {
    describe: 'delay of replays',
    default: 0.2
  },
  'live': {
    describe: 'live watch match on terminal',
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
  let maxtime = 750;
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
    activateStation: true,
    observe: true,
  });
  hideandseek.runMatch(
    [file1, file2], {
      seed: seed,
      liveView: argv.live
    }
  ).then((r) => console.log(r));
  
}
// let delay = parseFloat(process.argv[3]);
// HideAndSeekDesign.watch(process.argv[2], delay);