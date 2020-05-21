# Hide and Seek AI Competition

This is the ACM AI at UCSD prototype AI Competition!

To run a match locally, you will need Node v.12 and npm.

Keep reading to see how to get started, [run a match](#run-a-match), and the [rules for this competition](#rules).

## Getting Started

First install all files necessary, run the following

```bash
npm install dimensions-ai @acmucsd/hide-and-seek-ai
```

Once that is done, create a file called `run.js` and add the following

```js
const HideAndSeekDesign = require('../lib').default;
const Dimension = require('dimensions-ai');
let hideandseekdesign = new HideAndSeekDesign('hide-and-seek');
let hideandseek = Dimension.create(hideandseekdesign, {
  activateStation: false,
  observe: false,
  name: "Hide and Seek"
});
```

This will initialize a `Dimension` through which you can run matches (and tournaments) by yourself.

Keep reading to see how to run a single match

## Run a Match

To run a match, you will first need some AI to run it. For now, we will just use the starter kit bots from `/starter-kits/js/` 

Add the following code

```js
hideandseek.runMatch(['./pathtobot/bot.js', './pathtobot/bot.js'], {
  delay: 0.2,
  liveView: true,
}).then((res) => {
  console.log(res);
});
```

With `liveView` set to `true` as opposed to `false`, the match will run live on your terminal and you can watch it. Set it to `false` and it will run much faster but you will have to watch it through the replay file

`delay: 0.2` sets the speed of the live viewer to 0.2 seconds per frame (5 FPS)

### Watch Replays

By default, replays are stored as `.json` files in the `replays/` folder. To watch a replay, run the following

```js
HideAndSeekDesign.watch('./replays/your_replay_file.json', 0.2);
```

This will run the liveViewer shown earlier in your terminal at a speed of 0.2 seconds per frame (5 FPS)

## Rules

This is a game of hide and seek

## Languages

We support Javascript, Python, C, C++, Typescript, and Go. If you want another language, submit an issue here and we will add it.