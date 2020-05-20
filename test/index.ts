import HideAndSeekDesign from '../src';
import { create, Logger } from 'dimensions-ai';

let hideandseekdesign = new HideAndSeekDesign('HideAndSeek!', {
  engineOptions: {
    noStdErr: true,
    timeout: {
      max: 100
    }
  }
});

let hideandseek = create(hideandseekdesign, {
  loggingLevel: Logger.LEVEL.INFO,
  activateStation: false,
  observe: false
});

let randomBot = {file: './kits/js/bot.js', name: 'random'};
let botlist = [];
for (let i = 0; i < 2; i++) {

  botlist.push({file: './kits/js/bot.js', name: 'random_' + i});
}
let bot = {file: './kits/js/bot.js', name: 'bot'};
hideandseek.runMatch(botlist, {
  delay: 0.2,
  liveView: false,
}).then((res) => {
  console.log(res);
})


