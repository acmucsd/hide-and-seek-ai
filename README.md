# Hide and Seek AI Competition

Welcome to the Hide and Seek AI competition. This is the first ACM AI at UCSD prototype so expect *many* bugs. So what is the game?

It's like hide and seek and also tag. Your AI will need to be able to play as both the chaser and the hider. Your AI's objective as the seeker is to find the hiders and tag them. Your AI's objective as the hider is to dodge the seekers and hide from them.

Read the [specs](#specs) for specific information on how to play and what the rules are

Keep reading to see how to get started really quick and [run a match](#run-a-match) to test your bots!

## Getting Started

First install all files necessary, run the following

```bash
npm install dimensions-ai @acmucsd/hide-and-seek-ai
```

Once that is done, create a file called `run.js` and add the following

```js
const HideAndSeekDesign = require('@acmucsd/hide-and-seek-ai').default;
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

## Specs

This is a game of hide and seek (and tag).

This is a two agent/player game, one player will be the Seeker team, the other will be the Hider team. The AI will play on a 2D Map of dimensions ranging from 16x16 to 24x24 (not necessarily square). The map is composed of empty tiles (0s) and wall tiles (1s), and other numbers represent the ID of the unit on that tile.

Seekers and Hiders are both called `Units`, which can do only two things, move in the North, Northeast, East, ... West, Southwest directions, or stay put and do nothing. If a Hider is adjacent to a Seeker, the Hider is considered to have been **tagged** by the Seeker and will now be removed from the game. In each round, the AI can send commands to move their seekers (if they are the seeker team) or move their hiders (if they are the hider team) in one direction and only once. (You will get a warning if you try to move a unit multiple times)

The game ends when the max round limit of 200 has reached or there are no more hiders left on the map. The Seekers win if there are no more hiders on the map. The Hiders win if the round limit is reached and they still have untagged hiders. It's as simple as that.

The game also uses fog of war for all players. Both teams are always given the map layout, which includes the empty and wall tiles, and their own units, along with where their units are. However, you are only given the x, y coordinates of an opposing team's units if at least one of your units can **see** that opposing team's unit. 

Units vision can see as far as 48R^2. R^2 is the euclidean distance but squared. Furthermore, walls on the map block a unit's line of sight, and units cannot see behind walls. Here are some short examples demonstrating this

The green circle marks the vision range of unit #4. The red numbers are hiders, the blue numbers are seekers. Everything intersected by the green circle and within it is within 48R^2, the vision range, of unit #4

![](assets/visionexample1.png)

The yellow squares are walls. Because of the **walls**, unit #4s line of sight is **blocked** and we have marked the tiles the unit cannot see with **red circles**. For example, the purple line shows the line of sight intersecting a yellow wall and thus being blocked from seeing one of the tiles. The line of sight is the line from the center of a tile to the center of a target tile, and if that line ever intersects a square tile that is a wall, the line of sight is considered to be blocked.

### Computation Limits

Each bot has up to 1000ms of computation time, regardless of language. (Even then, you can probably write a really good bot in python compared to one in C). This time is calculated as it runs on our Google Cloud Compute Engines (4 cpus, 4 GB RAM).

Furthermore, each bot is limited to 100MB of RAM. This should generally be more than enough memory. We will expand this as needed.

## Languages

We support Javascript, Python, C, C++, Typescript, and Go. If you want another language and there enough demand for it, submit an issue here and we will add it.
