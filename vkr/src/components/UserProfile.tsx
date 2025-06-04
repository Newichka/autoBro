import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase/AuthContext';
import axios from 'axios';

// Define the structure for the user profile including address fields
interface UserProfileData {
  fullName: string;
  phone: string;
  country: string;
  city: string;
  address: string;
}

// Define the structure for an Order (matching backend structure)
interface Order {
  id: string;
  userId: string; // This should match the identifier used in the backend (likely currentUser.id)
  fullName: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  carId: number | string;
  carInfo: {
    id: number | string;
    make: string;
    model: string;
    year: number;
    price: number;
    mainPhotoUrl?: string;
  };
  status: 'new' | 'processing' | 'in_transit' | 'completed' | 'cancelled';
  createdAt: string;
}

// Define allowed statuses type
type OrderStatus = 'new' | 'processing' | 'in_transit' | 'completed' | 'cancelled';

const UserProfile: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [success, setSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  
  const [userProfile, setUserProfile] = useState<UserProfileData>({
    fullName: '',
    phone: '',
    country: '',
    city: '',
    address: ''
  });

  // State for user orders (NEW)
  const [userOrders, setUserOrders] = useState<Order[]>([]);

  // Fetch user profile using currentUser.id
  useEffect(() => {
    const fetchUserProfile = async () => {
      // Use currentUser.id instead of currentUser.uid
      if (currentUser?.id) { 
        setLoadingProfile(true);
        setProfileError(null);
        try {
          // Fetch profile using the correct ID from AuthContext
          const response = await axios.get(`http://localhost:3001/users/${currentUser.id}`); 
          setUserProfile({
            fullName: response.data.fullName || '',
            phone: response.data.phone || '',
            country: response.data.country || '',
            city: response.data.city || '',
            address: response.data.address || ''
          });
        } catch (error: any) {
          if (error.response && error.response.status === 404) {
            console.log('Профиль пользователя не найден.');
            // Initialize profile if not found? Or handle differently?
          } else {
            console.error('Ошибка при загрузке профиля:', error);
            setProfileError('Не удалось загрузить профиль пользователя.');
          }
        } finally {
          setLoadingProfile(false);
        }
      }
    };
    fetchUserProfile();
  }, [currentUser]); // Depend on currentUser object

  // Fetch user orders using currentUser.id (NEW)
  useEffect(() => {
    const fetchUserOrders = async () => {
      // Use currentUser.id instead of currentUser.uid
      if (currentUser?.id) { 
        setLoadingOrders(true);
        setOrdersError(null);
        try {
          // Fetch orders filtered by userId (ensure backend uses 'userId' field with the correct ID)
          const response = await axios.get<Order[]>(`http://localhost:3001/orders/user/${currentUser.id}`); 
          // Sort orders by creation date, newest first
          const sortedOrders = response.data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setUserOrders(sortedOrders);
        } catch (error) {
          console.error('Ошибка при загрузке заказов пользователя:', error);
          setOrdersError('Не удалось загрузить историю заказов.');
          setUserOrders([]); // Clear orders on error
        } finally {
          setLoadingOrders(false);
        }
      }
    };
    fetchUserOrders();
  }, [currentUser]); // Depend on currentUser object

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle profile submission using currentUser.id
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return; // Ensure currentUser and id exist
    
    setLoadingProfile(true);
    setProfileError(null);
    setSuccess(false);
    
    try {
      // Send currentUser.id as 'uid' because the backend endpoint /users expects 'uid'
      await axios.post('http://localhost:3001/users', { 
        uid: currentUser.id, // Send the correct ID as 'uid'
        email: currentUser.email, // Email is also needed by the backend
        ...userProfile // Send the updated profile data
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setProfileError('Произошла ошибка при сохранении профиля.');
      console.error('Error saving profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  // Helper functions for displaying order status (similar to AdminPanel)
  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'new': return 'bg-primary';
      case 'processing': return 'bg-warning text-dark';
      case 'in_transit': return 'bg-info text-dark';
      case 'completed': return 'bg-success';
      case 'cancelled': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'new': return 'Новый';
      case 'processing': return 'В обработке';
      case 'in_transit': return 'В пути';
      case 'completed': return 'Выполнен';
      case 'cancelled': return 'Отменен';
      default: return 'Неизвестно';
    }
  };

  if (!currentUser) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">Вы не авторизованы.</div>
      </div>
    );
  }

  return (
    <div className="container mt-5 mb-5">
      <div className="row justify-content-center">
        {/* Profile Section */}
        <div className="col-md-8 mb-4">
          <div className="card shadow-sm">
            <div className="card-header" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
              <h4 className="mb-0">Профиль пользователя</h4>
            </div>
            <div className="card-body">
              {/* Account Info */}
              <div className="mb-4 pb-3 border-bottom">
                <h5>Данные аккаунта</h5>
                <p className="mb-1"><strong>Email:</strong> {currentUser.email}</p>
                {/* Display currentUser.id */}
                <p className="mb-3"><strong>ID:</strong> <span className="text-muted small">{currentUser.id}</span></p> 
                <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-2"></i>Выйти
                </button>
              </div>
              
              {/* Personal Data & Address Form */}
              <h5>Личные данные и адрес доставки</h5>
              <p className="text-muted small mb-4">Эти данные используются при оформлении заказов.</p>
              
              {success && <div className="alert alert-success"><i className="bi bi-check-circle me-2"></i>Профиль обновлен!</div>}
              {profileError && <div className="alert alert-danger"><i className="bi bi-exclamation-triangle me-2"></i>{profileError}</div>}
              
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="fullName" className="form-label">ФИО</label>
                    <input type="text" className="form-control" id="fullName" name="fullName" value={userProfile.fullName} onChange={handleChange} placeholder="Иванов Иван Иванович" />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="phone" className="form-label">Телефон</label>
                    <input type="tel" className="form-control" id="phone" name="phone" value={userProfile.phone} onChange={handleChange} placeholder="+7 (999) 123-45-67" />
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="country" className="form-label">Страна</label>
                  <input type="text" className="form-control" id="country" name="country" value={userProfile.country} onChange={handleChange} placeholder="Россия" />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="city" className="form-label">Город</label>
                    <input type="text" className="form-control" id="city" name="city" value={userProfile.city} onChange={handleChange} placeholder="Москва" />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="address" className="form-label">Адрес</label>
                    <input type="text" className="form-control" id="address" name="address" value={userProfile.address} onChange={handleChange} placeholder="ул. Ленина, д. 1, кв. 5" />
                  </div>
                </div>
                <button type="submit" className="btn" style={{ backgroundColor: 'var(--accent)', color: 'white' }} disabled={loadingProfile}>
                  {loadingProfile ? <><span className="spinner-border spinner-border-sm me-2"></span>Сохранение...</> : 'Сохранить данные'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Order History Section (NEW) */}
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-header" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
              <h4 className="mb-0">История заказов</h4>
            </div>
            <div className="card-body">
              {loadingOrders ? (
                <div className="text-center p-3">
                  <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Загрузка заказов...</span></div>
                </div>
              ) : ordersError ? (
                <div className="alert alert-danger"><i className="bi bi-exclamation-triangle me-2"></i>{ordersError}</div>
              ) : userOrders.length === 0 ? (
                <div className="alert alert-info"><i className="bi bi-info-circle me-2"></i>У вас пока нет заказов.</div>
              ) : (
                <ul className="list-group list-group-flush">
                  {userOrders.map(order => (
                    <li key={order.id} className="list-group-item d-flex flex-column flex-sm-row justify-content-between align-items-sm-center p-3">
                      <div className="d-flex align-items-center mb-2 mb-sm-0">
                        {order.carInfo.mainPhotoUrl && (
                          <img 
                            src={order.carInfo.mainPhotoUrl} 
                            alt={`${order.carInfo.make} ${order.carInfo.model}`}
                            className="me-3 rounded" 
                            style={{ width: '80px', height: '60px', objectFit: 'cover' }}
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80x60?text=Нет+фото'; }}
                          />
                        )}
                        <div>
                          <h6 className="mb-1">{order.carInfo.make} {order.carInfo.model} ({order.carInfo.year})</h6>
                          <p className="mb-1 small text-muted">Заказ от: {new Date(order.createdAt).toLocaleDateString()}</p>
                          <p className="mb-0 small text-muted">Сумма: {order.carInfo.price.toLocaleString()} ₽</p>
                        </div>
                      </div>
                      <div className="text-sm-end mt-2 mt-sm-0">
                        <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

