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
  loggingLevel: Logger.LEVEL.ERROR,
  activateStation: true,
  observe: true,
});

let jskit = {file: './test/bots/js/badbot/bot.js', name: 'js-kit'};
let jskit2 = {file: './test/bots/js/multiplemoves/bot.js', name: 'js-kit'};

hideandseek.runMatch([jskit, jskit2], {
  delay: 0.2,
  liveView:true,
  seed: 30
}).then((res) => {
  console.log(res);
});