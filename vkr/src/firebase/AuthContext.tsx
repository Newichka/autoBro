import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from './config';
import * as CryptoJS from 'crypto-js';

// Определение типов
export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  register: (email: string, password: string, role: UserRole) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

// Создание контекста
const AuthContext = createContext<AuthContextType | null>(null);

// Хук для использования контекста
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
};

// Функция для хеширования пароля
const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password).toString();
};

// Провайдер аутентификации
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Проверка сохраненной сессии при загрузке
  useEffect(() => {
    const checkStoredSession = async () => {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        try {
          const userDocRef = doc(db, 'users', storedUserId);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const user: User = {
              id: userDoc.id,
              email: userData.email,
              role: userData.role
            };
            
            setCurrentUser(user);
            setIsAdmin(userData.role === 'admin');
          } else {
            // Если пользователь не найден, очищаем локальное хранилище
            localStorage.removeItem('userId');
          }
        } catch (error) {
          console.error('Ошибка при проверке сохраненной сессии:', error);
          localStorage.removeItem('userId');
        }
      }
      
      setLoading(false);
    };
    
    checkStoredSession();
  }, []);

  // Регистрация нового пользователя
  const register = async (email: string, password: string, role: UserRole) => {
    try {
      // Проверяем, существует ли пользователь с таким email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('Пользователь с таким email уже существует');
      }
      
      // Хешируем пароль перед сохранением
      const hashedPassword = hashPassword(password);
      
      // Добавляем нового пользователя в коллекцию
      const docRef = await addDoc(collection(db, 'users'), {
        email,
        password: hashedPassword,
        role,
        createdAt: new Date()
      });
      
      // Создаем объект пользователя
      const user: User = {
        id: docRef.id,
        email,
        role
      };
      
      // Сохраняем ID пользователя в локальном хранилище для сессии
      localStorage.setItem('userId', docRef.id);
      
      setCurrentUser(user);
      setIsAdmin(role === 'admin');
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      throw error;
    }
  };

  // Вход пользователя
  const login = async (email: string, password: string) => {
    try {
      // Хешируем введенный пароль для сравнения
      const hashedPassword = hashPassword(password);
      
      // Ищем пользователя по email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Пользователь не найден');
      }
      
      // Проверяем пароль
      let userFound = false;
      
      for (const doc of querySnapshot.docs) {
        const userData = doc.data();
        
        if (userData.password === hashedPassword) {
          userFound = true;
          
          // Создаем объект пользователя
          const user: User = {
            id: doc.id,
            email: userData.email,
            role: userData.role
          };
          
          // Сохраняем ID пользователя в локальном хранилище для сессии
          localStorage.setItem('userId', doc.id);
          
          setCurrentUser(user);
          setIsAdmin(userData.role === 'admin');
          break;
        }
      }
      
      if (!userFound) {
        throw new Error('Неверный пароль');
      }
    } catch (error) {
      console.error('Ошибка при входе:', error);
      throw error;
    }
  };

  // Выход пользователя
  const logout = async () => {
    try {
      // Удаляем ID пользователя из локального хранилища
      localStorage.removeItem('userId');
      
      setCurrentUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    isAdmin,
    register,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
