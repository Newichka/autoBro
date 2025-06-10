const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

// Настройка базы данных
const adapter = new FileSync("db.json");
const db = low(adapter);

// Инициализация базы данных с пустыми коллекциями
db.defaults({ 
  orders: [], 
  users: [],
  custom_requests: []
}).write();

console.log('База данных успешно инициализирована'); 