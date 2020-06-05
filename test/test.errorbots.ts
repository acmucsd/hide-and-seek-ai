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
let bugpybot = {file: './test/bots/python/bug/bot.py', name: 'bot_bug_py'};
let stillbot = {file: './test/bots/js/stillbot/bot.js', name:'still'};
let jskit = {file: './test/bots/js/badbot/bot.js', name: 'js-kit'};
let jskit2 = {file: './test/bots/js/multiplemoves/bot.js', name: 'js-kit'};

async function test() {
  await hideandseek.runMatch([jskit, jskit2], {
    delay: 0.2,
    liveView: false,
    seed: 30
  }).then((res) => {
    console.log(res);
  });
  await hideandseek.runMatch([bugpybot, stillbot], {
    delay: 0.2,
    liveView: false,
    seed: 30
  }).then((res) => {
    console.log(res);
  });
}
test();