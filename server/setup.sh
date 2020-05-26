#!/bin/bash
apt-get update

# install core files needed by server
npm install pm2 -g
npm install @acmucsd/hide-and-seek-ai
npm install dimensions-ai

# security
useradd dimensions_bot
chsh dimensions_bot -s /bin/rbash

# install tooling
apt install sudo
sudo apt-get install g++
sudo apt-get install default-jdk


# run the startup script to setup apache
apt-get install apache2 -y
a2ensite default-ssl
a2enmod ssl

cp ./000-default.conf /etc/apache2/sites-available/

# change the configs
a2enmod proxy 
a2enmod proxy_http
a2enmod proxy_balancer
a2enmod lbmethod_byrequests

# restart
service apache2 restart
