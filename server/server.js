const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Раздача статических файлов (HTML, CSS, JS) из корня проекта (projectGAI/)
const PUBLIC_DIR = path.resolve(__dirname, '..');
app.use(express.static(PUBLIC_DIR));

// ==========================================
// 1. АВТОРИЗАЦИЯ И РЕГИСТРАЦИЯ
// ==========================================

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

// ==========================================
// 2. ЛИЧНЫЙ КАБИНЕТ (ПРОФИЛЬ)
// ==========================================

// Получить профиль студента
app.get('/api/profile/:id', (req, res) => {
    const query = `SELECT id, fullname, email, group_name, course, specialty FROM users WHERE id = ?`;
    db.get(query, [req.params.id], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'Пользователь не найден.' });
        res.json(user);
    });
});

// Обновить данные профиля (группа, курс, специальность)
app.put('/api/profile/:id', (req, res) => {
    const { fullname, group_name, course, specialty } = req.body;
    const query = `
        UPDATE users 
        SET fullname = COALESCE(?, fullname),
            group_name = COALESCE(?, group_name),
            course = COALESCE(?, course),
            specialty = COALESCE(?, specialty)
        WHERE id = ?
    `;

    db.run(query, [fullname, group_name, course, specialty, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Пользователь не найден.' });
        res.json({ message: 'Данные профиля успешно обновлены!' });
    });
});

// ==========================================
// 3. ЗАПРОСЫ СПРАВОК (УСЛУГИ)
// ==========================================

// Отправить новый запрос на справку
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

// Получить все справки конкретного студента
app.get('/api/requests/:userId', (req, res) => {
    const query = `SELECT * FROM requests WHERE user_id = ? ORDER BY created_at DESC`;
    db.all(query, [req.params.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Отменить / удалить заявку (если она еще в обработке)
app.delete('/api/requests/:requestId', (req, res) => {
    db.run(`DELETE FROM requests WHERE id = ?`, [req.params.requestId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Заявка удалена.' });
    });
});

// ==========================================
// 4. МАРШРУТ ПО УМОЛЧАНИЮ
// ==========================================

app.get('/', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});