import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase/AuthContext';
import axios from 'axios';
import { User } from 'firebase/auth';
import { useLocation } from 'react-router-dom';

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

// 1. Добавим тип для заявки
interface CustomRequest {
  id: string;
  userId: string;
  make: string;
  model: string;
  year?: number;
  minPrice?: number;
  maxPrice?: number;
  color?: string;
  trim?: string;
  condition?: string;
  status: string;
  createdAt: string;
}

const UserProfile: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
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
  
  // 2. Добавим состояние для заявок
  const [userRequests, setUserRequests] = useState<CustomRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  
  // 3. Добавим вкладку 'my-requests' в состояние
  const [activeTab, setActiveTab] = useState<'profile' | 'my-cars' | 'my-requests'>(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('tab') === 'my-cars') return 'my-cars';
    if (searchParams.get('tab') === 'my-requests') return 'my-requests';
    return 'profile';
  });

  // Fetch user profile using currentUser.id
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (currentUser?.id) { 
        setLoadingProfile(true);
        setProfileError(null);
        try {
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
  }, [currentUser]);

  // Fetch user orders using currentUser.id
  useEffect(() => {
    const fetchUserOrders = async () => {
      if (currentUser?.id) { 
        setLoadingOrders(true);
        setOrdersError(null);
        try {
          const response = await axios.get<Order[]>(`http://localhost:3001/orders/user/${currentUser.id}`); 
          if (Array.isArray(response.data)) {
            const sortedOrders = response.data.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setUserOrders(sortedOrders);
          } else {
            console.error('Неверный формат данных заказов:', response.data);
            setOrdersError('Получены некорректные данные о заказах');
            setUserOrders([]);
          }
        } catch (error) {
          console.error('Ошибка при загрузке заказов пользователя:', error);
          setOrdersError('Не удалось загрузить историю заказов.');
          setUserOrders([]);
        } finally {
          setLoadingOrders(false);
        }
      }
    };
    fetchUserOrders();
  }, [currentUser]);

  // 4. Запрос заявок пользователя
  useEffect(() => {
    const fetchUserRequests = async () => {
      if (currentUser?.id) {
        setLoadingRequests(true);
        setRequestsError(null);
        try {
          const response = await axios.get<CustomRequest[]>(`http://localhost:3001/custom-requests?userId=${currentUser.id}`);
          if (Array.isArray(response.data)) {
            setUserRequests(response.data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          } else {
            setUserRequests([]);
          }
        } catch (error) {
          setRequestsError('Не удалось загрузить заявки.');
          setUserRequests([]);
        } finally {
          setLoadingRequests(false);
        }
      }
    };
    fetchUserRequests();
  }, [currentUser]);

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
    if (!currentUser?.id) return;
    
    setLoadingProfile(true);
    setProfileError(null);
    setSuccess(false);
    
    try {
      const response = await axios.post('http://localhost:3001/users', { 
        uid: currentUser.id,
        email: currentUser.email,
        ...userProfile
      });
      // После сохранения профиля делаем повторный GET-запрос
      const updated = await axios.get(`http://localhost:3001/users/${currentUser.id}`);
      setUserProfile({
        fullName: updated.data.fullName || '',
        phone: updated.data.phone || '',
        country: updated.data.country || '',
        city: updated.data.city || '',
        address: updated.data.address || ''
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

  // Helper function to get status description
  const getStatusDescription = (status: OrderStatus) => {
    switch (status) {
      case 'new': return 'Заказ принят и ожидает обработки';
      case 'processing': return 'Заказ находится в обработке';
      case 'in_transit': return 'Автомобиль в пути к вам';
      case 'completed': return 'Заказ выполнен';
      case 'cancelled': return 'Заказ отменен';
      default: return '';
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
        <div className="col-md-10">
          {/* Tabs Navigation */}
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Профиль</button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'my-cars' ? 'active' : ''}`} onClick={() => setActiveTab('my-cars')}>Мои машины</button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'my-requests' ? 'active' : ''}`} onClick={() => setActiveTab('my-requests')}>Мои заявки</button>
            </li>
          </ul>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
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
          )}

          {/* My Cars Tab */}
          {activeTab === 'my-cars' && (
            <div className="card shadow-sm">
              <div className="card-header" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                <h4 className="mb-0">Мои машины</h4>
              </div>
              <div className="card-body">
                {loadingOrders ? (
                  <div className="text-center p-3">
                    <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Загрузка машин...</span></div>
                  </div>
                ) : ordersError ? (
                  <div className="alert alert-danger"><i className="bi bi-exclamation-triangle me-2"></i>{ordersError}</div>
                ) : userOrders.length === 0 ? (
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    У вас пока нет заказанных автомобилей. Вы можете выбрать и заказать автомобиль в каталоге.
                  </div>
                ) : (
                  <div className="row">
                    {userOrders.map(order => (
                      <div key={order.id} className="col-md-6 mb-4">
                        <div className="card h-100">
                          <div className="card-header bg-light d-flex justify-content-between align-items-center">
                            <h6 className="mb-0">{order.carInfo.make} {order.carInfo.model}</h6>
                            <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                          </div>
                          <div className="card-body">
                            <div className="row">
                              <div className="col-md-5 mb-3 mb-md-0">
                                <img 
                                  src={order.carInfo.mainPhotoUrl || 'https://via.placeholder.com/300x200?text=Нет+фото'} 
                                  alt={`${order.carInfo.make} ${order.carInfo.model}`}
                                  className="img-fluid rounded" 
                                  style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Нет+фото'; }}
                                />
                              </div>
                              <div className="col-md-7">
                                <p className="mb-2"><strong>Год выпуска:</strong> {order.carInfo.year}</p>
                                <p className="mb-2"><strong>Цена:</strong> {order.carInfo.price.toLocaleString()} ₽</p>
                                <p className="mb-2"><strong>Дата заказа:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                                <p className="mb-0"><strong>Статус:</strong> {getStatusText(order.status)}</p>
                              </div>
                            </div>
                            
                            <div className="mt-3 pt-3 border-top">
                              <div className="d-flex align-items-center">
                                <div className={`status-indicator ${getStatusBadgeClass(order.status)}`} style={{ width: '12px', height: '12px', borderRadius: '50%', marginRight: '10px' }}></div>
                                <p className="mb-0 small">{getStatusDescription(order.status)}</p>
                              </div>
                            </div>
                          </div>
                          <div className="card-footer bg-white">
                            <div className="d-flex justify-content-between align-items-center">
                              <small className="text-muted">ID заказа: {order.id.substring(0, 8)}...</small>
                              {order.status === 'cancelled' ? (
                                <span className="text-danger small"><i className="bi bi-x-circle me-1"></i>Заказ отменен</span>
                              ) : order.status === 'completed' ? (
                                <span className="text-success small"><i className="bi bi-check-circle me-1"></i>Заказ выполнен</span>
                              ) : (
                                <span className="text-primary small"><i className="bi bi-clock-history me-1"></i>Заказ в обработке</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* My Requests Tab */}
          {activeTab === 'my-requests' && (
            <div>
              <h5 className="mb-3">Мои заявки на подбор</h5>
              {loadingRequests ? (
                <div className="text-center p-4"><div className="spinner-border text-primary" role="status"></div></div>
              ) : requestsError ? (
                <div className="alert alert-danger">{requestsError}</div>
              ) : userRequests.length === 0 ? (
                <div className="alert alert-info">У вас пока нет заявок на подбор.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Марка</th>
                        <th>Модель</th>
                        <th>Год</th>
                        <th>Бюджет</th>
                        <th>Цвет</th>
                        <th>Комплектация</th>
                        <th>Состояние</th>
                        <th>Статус</th>
                        <th>Дата</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userRequests.map(req => (
                        <tr key={req.id}>
                          <td>{req.make}</td>
                          <td>{req.model}</td>
                          <td>{req.year || '-'}</td>
                          <td>{(req.minPrice ? req.minPrice.toLocaleString() : '-') + ' - ' + (req.maxPrice ? req.maxPrice.toLocaleString() : '-')} ₽</td>
                          <td>{req.color || '-'}</td>
                          <td>{req.trim || '-'}</td>
                          <td>{req.condition || '-'}</td>
                          <td><span className="badge bg-secondary">{req.status || 'В обработке'}</span></td>
                          <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
