#!/bin/bash
service apache2 start
pm2-runtime run.prod.js --output ./logs/out.log --error ./logs/err.log;
