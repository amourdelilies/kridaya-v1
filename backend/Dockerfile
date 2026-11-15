FROM php:8.2-apache

# Install ekstensi yang sering dibutuhkan Laravel
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    zip \
    unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd pdo_mysql zip

# Aktifkan mod_rewrite Apache
RUN a2enmod rewrite

# Salin seluruh file backend ke direktori web server
COPY . /var/www/html

# Arahkan DocumentRoot Apache ke public folder Laravel
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
V