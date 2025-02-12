#!/bin/bash

# Verifica si ya existe package.json, si no, inicializa el proyecto
if [ ! -f package.json ]; then
  echo "No se encontró package.json, inicializando el proyecto..."
  npm init -y
fi

# Instala las librerías necesarias
echo "Instalando axios, cheerio, puppeteer-extra y puppeteer-extra-plugin-stealth..."
npm install axios cheerio puppeteer-extra puppeteer-extra-plugin-stealth
npx puppeteer browsers install chrome
npx puppeteer install --chrome

echo "Instalación completada exitosamente!"
