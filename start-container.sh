#!/bin/sh
set -e

# Utiliser le port fourni par Render
PORT="${PORT:-10000}"

# Configurer Apache sur le port Render
sed -i "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/" \
    /etc/apache2/sites-available/000-default.conf

# Vérifier la configuration Apache
apache2ctl configtest

# Démarrer le serveur SSR Inertia en arrière-plan
su -s /bin/sh www-data -c "cd /var/www/html && php artisan inertia:start-ssr" &

# Démarrer Apache au premier plan
exec apache2-foreground