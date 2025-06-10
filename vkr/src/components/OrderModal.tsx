import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../firebase/AuthContext';
import { CSSTransition } from 'react-transition-group';


interface Car {
  id: number | string;
  make: string;
  model: string;
  year: number;
  price: number;
  mainPhotoUrl?: string;
  // Другие свойства автомобиля
}

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car | null;
}

// Update UserProfile interface to include address fields
interface UserProfile {
  fullName: string;
  phone: string;
  country: string; // New field
  city: string;    // New field
  address: string; // New field
}

const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, car }) => {
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile>({
    fullName: '',
    phone: '',
    country: '',
    city: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // handleSubmit теперь принимает профиль как аргумент
  const handleSubmit = async (e: React.FormEvent | null, profileArg?: UserProfile) => {
    if (e) {
      e.preventDefault();
    }
    if (!car || !currentUser) return;
    setLoading(true);
    setError(null);
    try {
      // Используем профиль из аргумента, если он есть, иначе из состояния
      const profileToUse = profileArg || userProfile;
      // Сохраняем/обновляем профиль
      await axios.post('http://localhost:3001/users', {
        uid: currentUser.id,
        email: currentUser.email,
        ...profileToUse
      });
      // После сохранения профиля делаем повторный GET-запрос
      const updatedProfileResp = await axios.get(`http://localhost:3001/users/${currentUser.id}`);
      const updatedProfile = updatedProfileResp.data;
      if (!updatedProfile.fullName || !updatedProfile.phone) {
        throw new Error('Данные профиля не заполнены');
      }
      // Создаём заказ
      const orderResponse = await axios.post('http://localhost:3001/orders', {
        uid: currentUser.id,
        userEmail: currentUser.email,
        fullName: updatedProfile.fullName,
        phone: updatedProfile.phone,
        country: updatedProfile.country,
        city: updatedProfile.city,
        address: updatedProfile.address,
        carId: car.id,
        carInfo: {
          id: car.id,
          make: car.make,
          model: car.model,
          year: car.year,
          price: car.price,
          mainPhotoUrl: car.mainPhotoUrl
        },
        status: 'new'
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError('Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте позже.');
      console.error('Ошибка при создании заказа:', err);
    } finally {
      setLoading(false);
    }
  };

  // Проверяем наличие данных пользователя
  useEffect(() => {
    const checkUserProfile = async () => {
      if (currentUser?.id && isOpen) {
        try {
          const response = await axios.get(`http://localhost:3001/users/${currentUser.id}`);
          const profileData = {
            fullName: response.data.fullName || '',
            phone: response.data.phone || '',
            country: response.data.country || '',
            city: response.data.city || '',
            address: response.data.address || ''
          };
          setUserProfile(profileData);
          const isProfileComplete = Object.values(profileData).every(value => value.trim() !== '');
          if (isProfileComplete) {
            // Передаём профиль из базы, а не из состояния!
            await handleSubmit(null, profileData);
          } else {
            setShowForm(true);
          }
        } catch (error) {
          setError('Ошибка при загрузке данных профиля');
          setShowForm(true);
        }
      }
    };
    if (isOpen) {
      setSuccess(false);
      setError(null);
      checkUserProfile();
    }
  }, [isOpen, currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <CSSTransition
      in={isOpen}
      timeout={300}
      classNames="modal-fade"
      unmountOnExit
    >
      <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
              <h5 className="modal-title">Оформление заказа</h5>
              <button type="button" className="btn-close btn-close-white" onClick={onClose} disabled={loading}></button>
            </div>
            <div className="modal-body">
              {success ? (
                <div className="alert alert-success">
                  <i className="bi bi-check-circle me-2"></i>
                  Заказ успешно оформлен! Наш менеджер свяжется с вами в ближайшее время.
                </div>
              ) : (
                <>
                  {car && (
                    <div className="car-info mb-4 pb-3 border-bottom">
                      <div className="d-flex align-items-center">
                        {car.mainPhotoUrl && (
                          <img 
                            src={car.mainPhotoUrl} 
                            alt={`${car.make} ${car.model}`} 
                            className="me-3" 
                            style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80x60?text=Нет+фото'; }}
                          />
                        )}
                        <div>
                          <h6 className="mb-1">{car.make} {car.model}</h6>
                          <p className="mb-0 small text-muted">{car.year} г., {car.price.toLocaleString()} ₽</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {showForm ? (
                    <>
                      <h6 className="mb-3">Контактные данные и адрес доставки</h6>
                      <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                          <label htmlFor="fullNameOrder" className="form-label">ФИО</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            id="fullNameOrder" 
                            name="fullName"
                            value={userProfile.fullName}
                            onChange={handleChange}
                            required
                            placeholder="Иванов Иван Иванович"
                          />
                        </div>
                        <div className="mb-3">
                          <label htmlFor="phoneOrder" className="form-label">Номер телефона</label>
                          <input 
                            type="tel" 
                            className="form-control" 
                            id="phoneOrder" 
                            name="phone"
                            value={userProfile.phone}
                            onChange={handleChange}
                            required
                            placeholder="+7 (999) 123-45-67"
                          />
                        </div>
                        <div className="mb-3">
                          <label htmlFor="countryOrder" className="form-label">Страна</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            id="countryOrder" 
                            name="country"
                            value={userProfile.country}
                            onChange={handleChange}
                            required
                            placeholder="Россия"
                          />
                        </div>
                        <div className="mb-3">
                          <label htmlFor="cityOrder" className="form-label">Город</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            id="cityOrder" 
                            name="city"
                            value={userProfile.city}
                            onChange={handleChange}
                            required
                            placeholder="Москва"
                          />
                        </div>
                        <div className="mb-3">
                          <label htmlFor="addressOrder" className="form-label">Адрес доставки</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            id="addressOrder" 
                            name="address"
                            value={userProfile.address}
                            onChange={handleChange}
                            required
                            placeholder="ул. Ленина, д. 1, кв. 5"
                          />
                        </div>
                        
                        {error && (
                          <div className="alert alert-danger mt-3">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            {error}
                          </div>
                        )}
                        
                        <div className="d-flex justify-content-end mt-4">
                          <button 
                            type="button" 
                            className="btn btn-outline-secondary me-2" 
                            onClick={onClose}
                            disabled={loading}
                          >
                            Отмена
                          </button>
                          <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Оформление...
                              </>
                            ) : (
                              'Оформить заказ'
                            )}
                          </button>
                        </div>
                      </form>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Загрузка...</span>
                      </div>
                      <p className="mb-0">Оформление заказа...</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </CSSTransition>
  );
};

export default OrderModal;

