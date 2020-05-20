import HideAndSeekDesign from '../src';
import { create, Logger } from 'dimensions-ai';

let hideandseekdesign = new HideAndSeekDesign('HideAndSeek!', {
  engineOptions: {
    noStdErr: true,
    timeout: {
      max: 200
    }
  }
});

let hideandseek = create(hideandseekdesign, {
  loggingLevel: Logger.LEVEL.SYSTEM,
  activateStation: true,
  observe: true,
  secureMode: true
});

let randomBot = {file: './kits/js/bot.js', name: 'random'};
let stillbot = {file: './test/bots/js/stillbot/bot.js', name:'still'};
let chaseBot = {file: './test/bots/js/chasebot/bot.js', name: 'chaser'};
let botlist = [chaseBot, randomBot];
// for (let i = 0; i < 2; i++) {

//   botlist.push({file: './kits/js/bot.js', name: 'random_' + i});
// }
let bot = {file: './kits/js/bot.js', name: 'bot'};
hideandseek.runMatch(botlist, {
  delay: 0.5,
  randomizeSeeker: false,
  liveView: true,
  seed: 300
}).then((res) => {
  console.log(res);
});


