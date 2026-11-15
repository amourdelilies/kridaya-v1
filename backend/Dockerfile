FROM php:8.2-apache

# Install ekstensi yang dibutuhkan Laravel
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

RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Buat script startup untuk membersihkan modul MPM konflik saat runtime, lalu jalankan Apache
RUN echo '#!/bin/bash\n\
rm -f /etc/apache2/mods-enabled/mpm_event.*\n\
rm -f /etc/apache2/mods-enabled/mpm_worker.*\n\
a2enmod mpm_prefork\n\
exec apache2-foreground' > /usr/local/bin/start-apache.sh \
    && chmod +x /usr/local/bin/start-apache.sh

# Gunakan script startup sebagai perintah utama container
CMD ["/usr/local/bin/start-apache.sh"]