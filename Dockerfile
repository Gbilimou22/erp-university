
# =========================================================
# 1. Dependances PHP de production
# =========================================================
FROM php:8.5-cli AS vendor

RUN apt-get update && apt-get install -y --no-install-recommends \
    git unzip libpq-dev libicu-dev libzip-dev libxml2-dev \
    && docker-php-ext-install \
    pdo_pgsql intl zip bcmath pcntl dom mbstring \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --no-interaction \
    --no-scripts \
    --prefer-dist \
    --optimize-autoloader

COPY . .

RUN composer dump-autoload --no-dev --optimize


# =========================================================
# 2. Compilation React, TypeScript, Vite et SSR
# =========================================================
FROM node:22-bookworm-slim AS frontend

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build


# =========================================================
# 3. Image finale PHP + Apache
# =========================================================
FROM php:8.5-apache

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev libicu-dev libzip-dev libxml2-dev \
    && docker-php-ext-install \
    pdo_pgsql intl zip bcmath pcntl dom mbstring opcache \
    && rm -rf /var/lib/apt/lists/*

RUN a2enmod rewrite headers \
    && sed -ri -e 's!/var/www/html!/var/www/html/public!g' \
    /etc/apache2/sites-available/000-default.conf \
    && sed -ri 's/AllowOverride None/AllowOverride All/g' \
    /etc/apache2/apache2.conf

WORKDIR /var/www/html

COPY . .

COPY --from=vendor /app/vendor ./vendor

COPY --from=frontend /app/public/build ./public/build

COPY --from=frontend /app/bootstrap/ssr ./bootstrap/ssr

RUN mkdir -p \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

EXPOSE 80

CMD ["/usr/local/bin/start-container"]
