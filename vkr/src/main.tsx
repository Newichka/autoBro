import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import axios from 'axios'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// Подавляем предупреждение о mozInputSource
const originalConsoleWarn = console.warn;
console.warn = function(message: any, ...optionalParams: any[]) {
  if (typeof message === 'string' && message.includes('MouseEvent.mozInputSource')) {
    // Игнорируем это предупреждение
    return;
  }
  // Передаем все остальные предупреждения оригинальному методу
  originalConsoleWarn.apply(console, [message, ...optionalParams]);
};

// Базовый URL для API - используем относительный URL, чтобы работал прокси через Vite
axios.defaults.baseURL = '/api';

// Настройка интерцептора для обработки ошибок
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    // Проверяем, если это ошибка из-за неработающего бэкенда
    if (!error.response) {
      console.error('Бэкенд недоступен. Убедитесь, что Spring приложение запущено на http://localhost:8080');
    }
    
    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
