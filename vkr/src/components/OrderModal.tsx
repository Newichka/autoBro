import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../firebase/AuthContext';

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
  // Initialize state with new address fields
  const [userProfile, setUserProfile] = useState<UserProfile>({
    fullName: '',
    phone: '',
    country: '', // New field
    city: '',    // New field
    address: ''  // New field
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user profile including address fields
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (currentUser?.id) {
        try {
          const response = await axios.get(`http://localhost:3001/users/${currentUser.id}`);
          // Update state with fetched data, providing defaults
          setUserProfile({
            fullName: response.data.fullName || '',
            phone: response.data.phone || '',
            country: response.data.country || '',
            city: response.data.city || '',
            address: response.data.address || ''
          });
        } catch (error: any) {
          if (error.response && error.response.status === 404) {
            console.log('Профиль пользователя не найден, данные будут взяты из формы.');
          } else {
            console.error('Ошибка при загрузке профиля в модальном окне заказа:', error);
          }
        }
      }
    };

    if (isOpen) {
      fetchUserProfile();
      setSuccess(false);
      setError(null);
    }
  }, [isOpen, currentUser]);

  // Generic handler for input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission to create order with address
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!car || !currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await axios.post('http://localhost:3001/orders', {
        uid: currentUser.id,
        userEmail: currentUser.email,
        fullName: userProfile.fullName,
        phone: userProfile.phone,
        country: userProfile.country,
        city: userProfile.city,
        address: userProfile.address,
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
      console.error('Error creating order:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
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
                
                <h6 className="mb-3">Контактные данные и адрес доставки</h6>
                <form onSubmit={handleSubmit}>
                  {/* Personal Info */} 
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

                  {/* Address Fields */} 
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
                  
                  {/* Action Buttons */} 
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

