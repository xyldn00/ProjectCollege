const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Ошибка подключения к SQLite:', err.message);
    } else {
        console.log('Успешное подключение к базе данных SQLite.');
    }
});

db.serialize(() => {
    // Таблица пользователей (студентов)
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullname TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        group_name TEXT DEFAULT 'Не указана',
        course INTEGER DEFAULT 1,
        specialty TEXT DEFAULT 'Информационные системы и программирование'
    )`);

    // Таблица запросов справок
    db.run(`CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        certificate_type TEXT NOT NULL,
        comment TEXT,
        status TEXT DEFAULT 'В обработке',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
});

module.exports = db;