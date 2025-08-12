FROM php:8.2-apache

# Installer l’extension mysqli
RUN docker-php-ext-install mysqli && docker-php-ext-enable mysqli

# Optionnel : installer pdo_mysql aussi
RUN docker-php-ext-install pdo pdo_mysql