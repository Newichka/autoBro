import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../firebase/AuthContext';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: any;
}

interface UserData {
  fullName: string;
  phone: string;
}

const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, car }) => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<UserData>({
    fullName: '',
    phone: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка данных пользователя при открытии модального окна
  useEffect(() => {
    if (isOpen && currentUser) {
      fetchUserData();
    }
  }, [isOpen, currentUser]);

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
    if (!currentUser || !car) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Сохраняем обновленные данные пользователя
      await axios.put(`http://localhost:3001/users/${currentUser.uid}`, {
        fullName: userData.fullName,
        phone: userData.phone,
        email: currentUser.email,
        updatedAt: new Date().toISOString()
      });
      
      // Создаем заказ
      await axios.post('http://localhost:3001/orders', {
        id: Date.now().toString(),
        userId: currentUser.uid,
        userName: userData.fullName,
        userPhone: userData.phone,
        carInfo: {
          id: car.id,
          make: car.make,
          model: car.model,
          year: car.year,
          price: car.price,
          mainPhotoUrl: car.mainPhotoUrl
        },
        status: 'new',
        createdAt: new Date().toISOString()
      });
      
      setSuccess(true);
      
      // Сбрасываем состояние успеха через 3 секунды и закрываем модальное окно
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Ошибка при оформлении заказа:', error);
      setError('Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Оформление заказа</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {success ? (
              <div className="text-center py-4">
                <div className="mb-3">
                  <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3rem' }}></i>
                </div>
                <h5 className="mb-3">Заказ успешно оформлен!</h5>
                <p className="mb-0">Наш менеджер свяжется с вами в ближайшее время.</p>
              </div>
            ) : (
              <>
                {car && (
                  <div className="mb-4">
                    <div className="d-flex align-items-center">
                      {car.mainPhotoUrl && (
                        <div className="me-3" style={{ width: '80px', height: '60px' }}>
                          <img 
                            src={car.mainPhotoUrl} 
                            alt={`${car.make} ${car.model}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: '4px'
                            }}
                          />
                        </div>
                      )}
                      <div>
                        <h6 className="mb-1">{car.make} {car.model}</h6>
                        <p className="mb-0 small text-muted">{car.year} г., {car.price.toLocaleString()} ₽</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="alert alert-danger mb-3">{error}</div>
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
                      required
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
                      required
                    />
                  </div>
                  
                  <div className="d-grid">
                    <button 
                      type="submit" 
                      className="btn"
                      style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Оформление...
                        </>
                      ) : 'Оформить заказ'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
