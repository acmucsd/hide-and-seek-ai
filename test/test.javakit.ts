import HideAndSeekDesign from '../src';
import { create, Logger } from 'dimensions-ai';
import { Dimension } from 'dimensions-ai/lib/Dimension';

let hideandseekdesign = new HideAndSeekDesign('HideAndSeek!', {
  engineOptions: {
    noStdErr: false
  }
});
let hideandseek = create(hideandseekdesign, {
  loggingLevel: Logger.LEVEL.WARN,
  activateStation: false,
  observe: false,
  secureMode: true
});

let jskit = {file: './kits/js/bot.js', name: 'js-kit'};
let javakit = {file: './kits/java/Bot.java', name: 'java-kit'};

hideandseek.runMatch([javakit, jskit], {
  delay: 0.2,
  liveView: true,
  seed: 32
}).then((res) => {
  console.log(res);
});