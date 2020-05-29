#!/bin/bash

# other
mkdir logs

# security
useradd dimensions_bot
chsh dimensions_bot -s /bin/rbash

# run the startup script to setup apache

a2ensite default-ssl
a2enmod ssl

cp ./000-default.conf /etc/apache2/sites-available/

# change the configs
a2enmod proxy 
a2enmod proxy_http
a2enmod proxy_balancer
a2enmod lbmethod_byrequests
