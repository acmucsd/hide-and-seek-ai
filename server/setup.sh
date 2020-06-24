#!/bin/bash
apt-get update

# install core files needed by server
npm install pm2 -g
npm install @acmucsd/hide-and-seek-ai@1.9.12
npm install dimensions-ai@3.1.7

# setup node related configs
pm2 install pm2-logrotate

# install tooling
apt install sudo -y
apt-get install -y g++
apt-get -y install default-jdk
apt-get install apache2 -y
apt-get -y install python3-pip
apt-get clean;




