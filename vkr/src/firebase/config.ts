// Конфигурация Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBr9vL4-cibRvsP_HyrJ-dgl8CQCfOTfTM",
  authDomain: "autobrovkr.firebaseapp.com",
  projectId: "autobrovkr",
  storageBucket: "autobrovkr.firebasestorage.app",
  messagingSenderId: "105277743197",
  appId: "1:105277743197:web:a77a099d248e6d7d91adb4"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);

// Экспорт сервиса Firestore
export const db = getFirestore(app);
export default app;
