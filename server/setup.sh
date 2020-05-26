#!/bin/bash
apt-get update

# install core files needed by server
npm install pm2 -g
npm install @acmucsd/hide-and-seek-ai
npm install dimensions-ai

# setup node related configs
pm2 install pm2-logrotate

# install tooling
apt install sudo
apt-get install -y g++
apt-get -y install default-jdk
apt-get install apache2 -y
apt-get clean;



