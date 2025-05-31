const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Путь к файлу базы данных
const dbPath = path.join(__dirname, 'db.json');

// Инициализация базы данных, если она не существует
const initializeDb = () => {
  if (!fs.existsSync(dbPath)) {
    const initialData = {
      users: [],
      orders: []
    };
    fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
  }
};

// Получение данных из базы
const getDb = () => {
  initializeDb();
  const data = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(data);
};

// Сохранение данных в базу
const saveDb = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// Маршруты для пользователей
app.get('/users/:id', (req, res) => {
  const db = getDb();
  const user = db.users.find(u => u.id === req.params.id);
  
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: 'Пользователь не найден' });
  }
});

app.post('/users', (req, res) => {
  const db = getDb();
  const newUser = req.body;
  
  // Проверяем, существует ли пользователь с таким id
  const existingUser = db.users.find(u => u.id === newUser.id);
  if (existingUser) {
    return res.status(409).json({ message: 'Пользователь с таким ID уже существует' });
  }
  
  db.users.push(newUser);
  saveDb(db);
  
  res.status(201).json(newUser);
});

app.put('/users/:id', (req, res) => {
  const db = getDb();
  const userId = req.params.id;
  const userData = req.body;
  
  const userIndex = db.users.findIndex(u => u.id === userId);
  
  if (userIndex !== -1) {
    // Обновляем существующего пользователя
    db.users[userIndex] = { ...db.users[userIndex], ...userData };
    saveDb(db);
    res.json(db.users[userIndex]);
  } else {
    // Создаем нового пользователя, если он не существует
    const newUser = { id: userId, ...userData };
    db.users.push(newUser);
    saveDb(db);
    res.status(201).json(newUser);
  }
});

// Маршруты для заказов
app.get('/orders', (req, res) => {
  const db = getDb();
  res.json(db.orders);
});

app.post('/orders', (req, res) => {
  const db = getDb();
  const newOrder = req.body;
  
  db.orders.push(newOrder);
  saveDb(db);
  
  res.status(201).json(newOrder);
});

app.patch('/orders/:id', (req, res) => {
  const db = getDb();
  const orderId = req.params.id;
  const updates = req.body;
  
  const orderIndex = db.orders.findIndex(o => o.id === orderId);
  
  if (orderIndex !== -1) {
    db.orders[orderIndex] = { ...db.orders[orderIndex], ...updates };
    saveDb(db);
    res.json(db.orders[orderIndex]);
  } else {
    res.status(404).json({ message: 'Заказ не найден' });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  initializeDb();
});
