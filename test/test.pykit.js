const HideAndSeekDesign = require('@acmucsd/hide-and-seek-ai').default
const Dimension = require('dimensions-ai');
let hideandseekdesign = new HideAndSeekDesign('HideAndSeek!', {
  engineOptions: {
    noStdErr: false,
    timeout: {
      max: 2000
    }
  }
});
let hideandseek = Dimension.create(hideandseekdesign, {
  loggingLevel: Dimension.Logger.LEVEL.WARN,
  activateStation: false,
  observe: false,
});

let pykit = {file: './kits/python/bot.py', name: 'py-kit'};

hideandseek.runMatch([pykit, pykit], {
  delay: 0.2,
  liveView: true
}).then((res) => {
  console.log(res);
});