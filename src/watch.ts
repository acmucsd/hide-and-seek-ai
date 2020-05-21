#!/usr/bin/env node
import HideAndSeekDesign from '.';
let delay = parseFloat(process.argv[3]);
HideAndSeekDesign.watch(process.argv[2], delay);