FROM node:20-alpine

# Устанавливаем SQLite и инструменты сборки
RUN apk add --no-cache sqlite python3 make g++

# Устанавливаем Dart Sass глобально
RUN npm install -g sass nodemon

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем npm-пакеты (включая пересборку нативных модулей под Alpine)
RUN npm install

# Копируем остальной исходный код бэкенда
COPY . .

# Открываем порт, на котором работает Node.js сервер
EXPOSE 5000

# Команда для запуска сервера
CMD ["node", "server.js"]