import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase/AuthContext';
import axios from 'axios';

interface UserData {
  fullName: string;
  phone: string;
}

const UserProfile: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [userData, setUserData] = useState<UserData>({
    fullName: '',
    phone: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'danger'} | null>(null);

  // Загрузка данных пользователя при монтировании компонента
  useEffect(() => {
    if (currentUser) {
      fetchUserData();
    }
  }, [currentUser]);

  // Функция для загрузки данных пользователя
  const fetchUserData = async () => {
    if (!currentUser) return;
    
    try {
      const response = await axios.get(`http://localhost:3001/users/${currentUser.uid}`);
      if (response.data) {
        setUserData({
          fullName: response.data.fullName || '',
          phone: response.data.phone || ''
        });
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных пользователя:', error);
      // Если пользователь не найден, создаем новую запись
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        createUserData();
      }
    }
  };

  // Функция для создания новой записи пользователя
  const createUserData = async () => {
    if (!currentUser) return;
    
    try {
      await axios.post('http://localhost:3001/users', {
        id: currentUser.uid,
        email: currentUser.email,
        fullName: '',
        phone: '',
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Ошибка при создании данных пользователя:', error);
    }
  };

  // Обработчик изменения полей формы
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      await axios.put(`http://localhost:3001/users/${currentUser.uid}`, {
        ...userData,
        email: currentUser.email,
        updatedAt: new Date().toISOString()
      });
      
      setMessage({
        text: 'Данные успешно сохранены',
        type: 'success'
      });
    } catch (error) {
      console.error('Ошибка при сохранении данных:', error);
      setMessage({
        text: 'Ошибка при сохранении данных',
        type: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  // Обработчик выхода из аккаунта
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <h5 className="mb-0">Личный кабинет</h5>
            </div>
            <div className="card-body">
              {currentUser ? (
                <>
                  <div className="mb-4">
                    <p className="mb-1"><strong>Email:</strong> {currentUser.email}</p>
                  </div>
                  
                  {message && (
                    <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
                      {message.text}
                      <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label htmlFor="fullName" className="form-label">ФИО</label>
                      <input
                        type="text"
                        className="form-control"
                        id="fullName"
                        name="fullName"
                        value={userData.fullName}
                        onChange={handleChange}
                        placeholder="Введите ваше полное имя"
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="phone" className="form-label">Номер телефона</label>
                      <input
                        type="tel"
                        className="form-control"
                        id="phone"
                        name="phone"
                        value={userData.phone}
                        onChange={handleChange}
                        placeholder="+7 (999) 123-45-67"
                      />
                    </div>
                    
                    <div className="d-grid gap-2">
                      <button 
                        type="submit" 
                        className="btn"
                        style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Сохранение...
                          </>
                        ) : 'Сохранить данные'}
                      </button>
                      
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary"
                        onClick={handleLogout}
                      >
                        Выйти из аккаунта
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="mb-0">Для доступа к личному кабинету необходимо авторизоваться</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
