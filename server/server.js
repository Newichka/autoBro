const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const app = express();
const PORT = process.env.PORT || 3001;

// Настройка базы данных
const adapter = new FileSync("db.json");
const db = low(adapter);

// Инициализация базы данных с новыми коллекциями
db.defaults({ 
  orders: [], 
  users: [],
  custom_requests: [] // Новая коллекция для пользовательских заявок
}).write();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Функция для очистки дубликатов пользователей
const cleanupDuplicateUsers = () => {
  const users = db.get("users").value();
  const uniqueUsers = new Map();
  
  users.forEach(user => {
    if (user.uid) {
      if (!uniqueUsers.has(user.uid)) {
        uniqueUsers.set(user.uid, user);
      } else {
        // Если нашли дубликат, удаляем его
        db.get("users").remove({ uid: user.uid }).write();
      }
    }
  });
};

// Очищаем дубликаты при запуске сервера
cleanupDuplicateUsers();

// --- Маршруты для пользователей ---
app.get("/users/:uid", (req, res) => {
  const user = db.get("users").find({ uid: req.params.uid }).value();
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ 
      message: "Пользователь не найден", 
      user: { 
        uid: req.params.uid,
        fullName: "", 
        phone: "", 
        country: "", 
        city: "", 
        address: "" 
      } 
    }); 
  }
});

app.post("/users", (req, res) => {
  const { uid, email, fullName, phone, country, city, address } = req.body;
  
  console.log('Получены данные пользователя:', { uid, email, fullName, phone, country, city, address });
  
  // Валидация обязательных полей
  if (!uid || !email) {
    console.error('Отсутствуют обязательные поля:', { uid, email });
    return res.status(400).json({ 
      message: "Отсутствуют обязательные поля (uid, email)" 
    });
  }

  const existingUser = db.get("users").find({ uid }).value();
  console.log('Существующий пользователь:', existingUser);

  if (existingUser) {
    const userData = {
      uid,
      email,
      fullName: fullName !== undefined ? fullName : existingUser.fullName || "",
      phone: phone !== undefined ? phone : existingUser.phone || "",
      country: country !== undefined ? country : existingUser.country || "",
      city: city !== undefined ? city : existingUser.city || "",
      address: address !== undefined ? address : existingUser.address || "",
      updatedAt: new Date().toISOString(),
      createdAt: existingUser.createdAt || new Date().toISOString()
    };
    db.get("users").find({ uid }).assign(userData).write();
    res.json({
      message: "Профиль пользователя обновлен",
      user: db.get("users").find({ uid }).value()
    });
  } else {
    // Создаем нового пользователя
    const newUser = {
      uid,
      email,
      fullName: fullName || "",
      phone: phone || "",
      country: country || "",
      city: city || "",
      address: address || "",
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    db.get("users").push(newUser).write();
    res.status(201).json({
      message: "Профиль пользователя создан",
      user: newUser
    });
  }
});

// --- Маршруты для заказов (без изменений) ---
app.get("/orders", (req, res) => {
  const orders = db.get("orders").value();
  res.json(orders);
});

app.get("/orders/:id", (req, res) => {
  const order = db.get("orders").find({ id: req.params.id }).value();
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ message: "Заказ не найден" });
  }
});

app.get("/orders/user/:uid", (req, res) => {
  const userOrders = db.get("orders").filter({ uid: req.params.uid }).value();
  res.json(userOrders);
});

app.post("/orders", (req, res) => {
  const { uid, userEmail, fullName, phone, country, city, address, carId, carInfo, status } = req.body;
  
  console.log('Получены данные заказа:', { uid, userEmail, fullName, phone, country, city, address, carId, carInfo, status });
  
  // Проверяем наличие всех необходимых данных
  if (!uid || !userEmail || !fullName || !phone || !carId || !carInfo) {
    console.error('Отсутствуют обязательные поля заказа');
    return res.status(400).json({ 
      message: "Отсутствуют обязательные поля заказа" 
    });
  }

  const newOrder = {
    id: Date.now().toString(),
    uid,
    userEmail,
    fullName,
    phone,
    country: country || "",
    city: city || "",
    address: address || "",
    carId,
    carInfo,
    status: status || "new",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  console.log('Создаем новый заказ:', newOrder);
  
  db.get("orders").push(newOrder).write();
  res.status(201).json({ message: "Заказ создан", order: newOrder });
});

app.put("/orders/:id", (req, res) => {
  const { status } = req.body;
  const order = db.get("orders").find({ id: req.params.id }).value();
  if (!order) {
    return res.status(404).json({ message: "Заказ не найден" });
  }
  const allowedStatuses = ["new", "processing", "in_transit", "completed", "cancelled"];
  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Недопустимый статус заказа" });
  }
  db.get("orders").find({ id: req.params.id }).assign({ status, updatedAt: new Date().toISOString() }).write();
  res.json({ message: "Статус заказа обновлен", order: db.get("orders").find({ id: req.params.id }).value() });
});

app.delete("/orders/:id", (req, res) => {
  const order = db.get("orders").find({ id: req.params.id }).value();
  if (!order) {
    return res.status(404).json({ message: "Заказ не найден" });
  }
  db.get("orders").remove({ id: req.params.id }).write();
  res.json({ message: "Заказ удален" });
});

// --- Новые маршруты для пользовательских заявок ---

// Получить все пользовательские заявки (для админа)
app.get("/custom-requests", (req, res) => {
  const requests = db.get("custom_requests").orderBy("createdAt", "desc").value();
  res.json(requests);
});

// Создать новую пользовательскую заявку
app.post("/custom-requests", (req, res) => {
  const { userId, userEmail, fullName, phone, make, model, year, price, trim, condition } = req.body;
  
  // Улучшенная валидация
  if (!userId || !userEmail || !make || !model || trim === undefined || trim === null || condition === undefined || condition === null) {
      return res.status(400).json({ message: "Не заполнены обязательные текстовые поля заявки (ID пользователя, Email, Марка, Модель, Комплектация, Состояние)" });
  }

  const parsedYear = parseInt(year, 10);
  const parsedPrice = parseFloat(price);

  if (year === undefined || year === null || isNaN(parsedYear) || parsedYear <= 0) {
      return res.status(400).json({ message: "Поле 'Год' должно быть указано и быть положительным числом" });
  }

  if (price === undefined || price === null || isNaN(parsedPrice) || parsedPrice < 0) { // Цена может быть 0, если это запрос на поиск
      return res.status(400).json({ message: "Поле 'Цена' должно быть указано и быть неотрицательным числом" });
  }

  const newRequest = {
    id: "cr_" + Date.now().toString(), // Префикс для отличия ID от заказов
    userId,
    userEmail,
    fullName: fullName || "Не указано",
    phone: phone || "Не указано",
    make,
    model,
    year: parsedYear, // Используем распарсенное значение
    price: parsedPrice, // Используем распарсенное значение
    trim, // Комплектация
    condition, // Состояние
    status: "new", // Статус по умолчанию: 'new', 'viewed', 'closed'
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  db.get("custom_requests").push(newRequest).write();
  res.status(201).json({ message: "Ваша заявка принята", request: newRequest });
});

// Обновить статус пользовательской заявки (для админа)
app.put("/custom-requests/:id", (req, res) => {
  const { status } = req.body;
  const requestId = req.params.id;
  const request = db.get("custom_requests").find({ id: requestId }).value();
  
  if (!request) {
    return res.status(404).json({ message: "Заявка не найдена" });
  }
  
  const allowedStatuses = ["new", "viewed", "closed"];
  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Недопустимый статус заявки" });
  }

  db.get("custom_requests")
    .find({ id: requestId })
    .assign({ status, updatedAt: new Date().toISOString() })
    .write();
  
  res.json({ message: "Статус заявки обновлен", request: db.get("custom_requests").find({ id: requestId }).value() });
});

// Удалить пользовательскую заявку (для админа)
app.delete("/custom-requests/:id", (req, res) => {
  const requestId = req.params.id;
  const request = db.get("custom_requests").find({ id: requestId }).value();
  
  if (!request) {
    return res.status(404).json({ message: "Заявка не найдена" });
  }
  
  db.get("custom_requests").remove({ id: requestId }).write();
  res.json({ message: "Заявка удалена" });
});


// Запуск сервера
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Сервер заказов запущен на порту ${PORT}`);
});

