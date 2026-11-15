const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const PUBLIC_DIR = path.resolve(__dirname, '..');
app.use(express.static(PUBLIC_DIR));

// Регистрация
app.post('/api/register', async (req, res) => {
    const { fullname, email, password, group_name, course, specialty } = req.body;

    if (!fullname || !email || !password) {
        return res.status(400).json({ error: 'Заполните обязательные поля: ФИО, email и пароль.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `
            INSERT INTO users (fullname, email, password, group_name, course, specialty) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.run(
            query,
            [
                fullname,
                email,
                hashedPassword,
                group_name || 'Не указана',
                course || 1,
                specialty || 'Информационные системы'
            ],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Пользователь с таким email уже зарегистрирован.' });
                    }
                    return res.status(500).json({ error: err.message });
                }
                res.status(201).json({
                    message: 'Регистрация прошла успешно!',
                    userId: this.lastID
                });
            }
        );
    } catch (e) {
        res.status(500).json({ error: 'Внутренняя ошибка сервера при регистрации.' });
    }
});

// Вход
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Введите email и пароль.' });
    }

    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(400).json({ error: 'Неверный email или пароль.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Неверный email или пароль.' });

        res.json({
            message: 'Вход выполнен успешно!',
            user: {
                id: user.id,
                fullname: user.fullname,
                email: user.email,
                group_name: user.group_name,
                course: user.course,
                specialty: user.specialty
            }
        });
    });
});

// Профиль
app.get('/api/profile/:id', (req, res) => {
    const query = `SELECT id, fullname, email, group_name, course, specialty FROM users WHERE id = ?`;
    db.get(query, [req.params.id], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'Пользователь не найден.' });
        res.json(user);
    });
});

// Создать запрос на справку
app.post('/api/requests', (req, res) => {
    const { userId, certificateType, comment } = req.body;

    if (!userId || !certificateType) {
        return res.status(400).json({ error: 'Не указан пользователь или тип справки.' });
    }

    const query = `INSERT INTO requests (user_id, certificate_type, comment) VALUES (?, ?, ?)`;
    db.run(query, [userId, certificateType, comment || ''], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({
            message: 'Заявка на справку успешно принята!',
            requestId: this.lastID
        });
    });
});

// Получить справки студента
app.get('/api/requests/:userId', (req, res) => {
    const query = `SELECT * FROM requests WHERE user_id = ? ORDER BY created_at DESC`;
    db.all(query, [req.params.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Удалить справку
app.delete('/api/requests/:requestId', (req, res) => {
    db.run(`DELETE FROM requests WHERE id = ?`, [req.params.requestId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Заявка успешно удалена.' });
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});