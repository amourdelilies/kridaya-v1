FROM php:8.4-apache

# Install ekstensi sistem yang dibutuhkan Laravel & Composer
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd pdo_mysql zip

# Install Composer resmi ke dalam container
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Aktifkan mod_rewrite Apache
RUN a2enmod rewrite

# Salin seluruh file project ke direktori web server
COPY . /var/www/html

# Set working directory
WORKDIR /var/www/html

# Jalankan composer install otomatis untuk menghasilkan autoload yang valid
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Berikan izin akses penuh ke folder storage dan bootstrap/cache
RUN mkdir -p /var/www/html/storage/framework/sessions \
    && mkdir -p /var/www/html/storage/framework/views \
    && mkdir -p /var/www/html/storage/framework/cache \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Arahkan DocumentRoot Apache ke public folder Laravel
ENV APACHE_DOCUMENT_ROOT /var/www/html/public

RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Buat script startup: bersihkan MPM konflik, cache konfigurasi, jalankan migrasi database, lalu jalankan Apache
RUN echo '#!/bin/bash\n\
rm -f /etc/apache2/mods-enabled/mpm_event.*\n\
rm -f /etc/apache2/mods-enabled/mpm_worker.*\n\
a2enmod mpm_prefork\n\
php artisan config:cache\n\
php artisan route:cache\n\
php artisan migrate --force\n\
exec apache2-foreground' > /usr/local/bin/start-apache.sh \
    && chmod +x /usr/local/bin/start-apache.sh

# Gunakan script startup sebagai perintah utama container
CMD ["/usr/local/bin/start-apache.sh"]