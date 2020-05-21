import HideAndSeekDesign from '../src';
import { create, Logger } from 'dimensions-ai';
import { Dimension } from 'dimensions-ai/lib/Dimension';

let hideandseekdesign = new HideAndSeekDesign('HideAndSeek!', {
  engineOptions: {
    noStdErr: false,
    timeout: {
      max: 2000
    }
  }
});

let hideandseek = create(hideandseekdesign, {
  loggingLevel: Logger.LEVEL.WARN,
  activateStation: true,
  observe: true,
});

let randomBot = {file: './kits/js/bot.js', name: 'random'};
let stillbot = {file: './test/bots/js/stillbot/bot.js', name:'still'};
let chaseBot = {file: './test/bots/js/chasebot/bot.js', name: 'chaser'};
let badBot = {file: './test/bots/js/badbot/bot.js', name: 'badbot'};
let botlist = [chaseBot, stillbot];
// for (let i = 0; i < 2; i++) {

//   botlist.push({file: './kits/js/bot.js', name: 'random_' + i});
// }
let bot = {file: './kits/js/bot.js', name: 'bot'};
// seed 30 is bad
hideandseek.runMatch(botlist, {
  delay: 0.2,
  liveView: true,
}).then((res) => {
  console.log(res);
});
// let n = 'match_h1zXUtXiBagA.json'
// HideAndSeekDesign.watch('./replays/' + n, 0.1);

// let app = hideandseek.getStation().app;