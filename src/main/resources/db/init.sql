-- Удаляем базу если существует
DROP DATABASE IF EXISTS autoBro;

-- Создаем базу с нужной кодировкой
CREATE DATABASE autoBro
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'ru_RU.UTF-8'
    LC_CTYPE = 'ru_RU.UTF-8'
    TEMPLATE template0;