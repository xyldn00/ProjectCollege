const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Ошибка подключения к SQLite:', err.message);
    } else {
        console.log('Успешное подключение к базе данных SQLite.');
    }
});

db.serialize(async () => {
    // Таблица пользователей с ролями
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullname TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        group_name TEXT DEFAULT 'Не указана',
        course INTEGER DEFAULT 1,
        specialty TEXT DEFAULT 'Информационные системы и программирование',
        role TEXT DEFAULT 'student'
    )`, async () => {
        // Автоматически создаем тестового администратора, если его еще нет
        const adminEmail = 'admin@college.ru';
        db.get(`SELECT * FROM users WHERE email = ?`, [adminEmail], async (err, row) => {
            if (!row) {
                const hashedPassword = await bcrypt.hash('admin123', 10);
                db.run(
                    `INSERT INTO users (fullname, email, password, group_name, course, specialty, role) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    ['Администратор Учебной Части', adminEmail, hashedPassword, 'Админка', 4, 'Управление ИС', 'admin']
                );
                console.log('Создан тестовый аккаунт администратора: admin@college.ru / admin123');
            }
        });
    });

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