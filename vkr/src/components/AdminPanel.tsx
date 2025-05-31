import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../firebase/AuthContext';
import AddCarModal from './AddCarModal';
import CarListModal from './CarListModal';

interface Order {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  carInfo: {
    id: number | string;
    make: string;
    model: string;
    year: number;
    price: number;
    mainPhotoUrl?: string;
  };
  status: 'new' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
}

const AdminPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'cars'>('orders');
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<string | null>(null);
  
  // Состояния для модальных окон
  const [isAddCarModalOpen, setIsAddCarModalOpen] = useState<boolean>(false);
  const [isCarListModalOpen, setIsCarListModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      fetchOrders();
    }
  }, [currentUser]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Ошибка при загрузке заказов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderStatusChange = async (orderId: string, newStatus: 'new' | 'processing' | 'completed' | 'cancelled') => {
    setStatusUpdateLoading(orderId);
    try {
      await axios.patch(`http://localhost:3001/orders/${orderId}`, { status: newStatus });
      
      // Обновляем локальное состояние без повторного запроса к серверу
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      
    } catch (error) {
      console.error('Ошибка при изменении статуса заказа:', error);
      // В случае ошибки делаем полное обновление с сервера
      fetchOrders();
    } finally {
      setStatusUpdateLoading(null);
    }
  };

  const handleCarAdded = () => {
    // Обработчик успешного добавления автомобиля
    setIsAddCarModalOpen(false);
    // Здесь можно добавить логику обновления списка автомобилей, если необходимо
  };

  const handleCarDeleted = () => {
    // Обработчик успешного удаления автомобиля
    setIsCarListModalOpen(false);
    // Здесь можно добавить логику обновления списка автомобилей, если необходимо
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'new': return 'bg-primary';
      case 'processing': return 'bg-warning text-dark';
      case 'completed': return 'bg-success';
      case 'cancelled': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Новый';
      case 'processing': return 'В обработке';
      case 'completed': return 'Выполнен';
      case 'cancelled': return 'Отменен';
      default: return 'Неизвестно';
    }
  };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Панель администратора</h5>
              <div>
                <button 
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => setIsAddCarModalOpen(true)}
                >
                  <i className="bi bi-plus-circle me-1"></i>
                  Добавить автомобиль
                </button>
                <button 
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setIsCarListModalOpen(true)}
                >
                  <i className="bi bi-pencil-square me-1"></i>
                  Управление автомобилями
                </button>
              </div>
            </div>
            <div className="card-body">
              <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                  >
                    <i className="bi bi-cart me-1"></i>
                    Заказы
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'cars' ? 'active' : ''}`}
                    onClick={() => setActiveTab('cars')}
                  >
                    <i className="bi bi-car-front me-1"></i>
                    Автомобили
                  </button>
                </li>
              </ul>

              {activeTab === 'orders' && (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">Управление заказами</h6>
                    <button 
                      className="btn btn-sm btn-outline-secondary" 
                      onClick={fetchOrders}
                      disabled={loading}
                    >
                      <i className={`bi ${loading ? 'bi-arrow-repeat spin' : 'bi-arrow-clockwise'} me-1`}></i>
                      Обновить
                    </button>
                  </div>
                  
                  {loading ? (
                    <div className="text-center p-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Загрузка...</span>
                      </div>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="alert alert-info">
                      Заказы отсутствуют
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Клиент</th>
                            <th>Телефон</th>
                            <th>Автомобиль</th>
                            <th>Цена</th>
                            <th>Статус</th>
                            <th>Действия</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map(order => (
                            <tr key={order.id}>
                              <td>{order.id.substring(0, 8)}...</td>
                              <td>{order.userName}</td>
                              <td>{order.userPhone}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  {order.carInfo.mainPhotoUrl && (
                                    <div className="me-2" style={{ width: '50px', height: '40px' }}>
                                      <img 
                                        src={order.carInfo.mainPhotoUrl} 
                                        alt={`${order.carInfo.make} ${order.carInfo.model}`}
                                        style={{
                                          width: '100%',
                                          height: '100%',
                                          objectFit: 'cover',
                                          borderRadius: '2px'
                                        }}
                                      />
                                    </div>
                                  )}
                                  <span>{order.carInfo.make} {order.carInfo.model} ({order.carInfo.year})</span>
                                </div>
                              </td>
                              <td>{order.carInfo.price.toLocaleString()} ₽</td>
                              <td>
                                <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                                  {getStatusText(order.status)}
                                </span>
                              </td>
                              <td>
                                <div className="dropdown">
                                  <button 
                                    className="btn btn-sm btn-outline-secondary dropdown-toggle" 
                                    type="button" 
                                    data-bs-toggle="dropdown" 
                                    aria-expanded="false"
                                    disabled={statusUpdateLoading === order.id}
                                  >
                                    {statusUpdateLoading === order.id ? (
                                      <>
                                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                        Обновление...
                                      </>
                                    ) : (
                                      'Действия'
                                    )}
                                  </button>
                                  <ul className="dropdown-menu">
                                    {order.status === 'new' && (
                                      <li>
                                        <button 
                                          className="dropdown-item" 
                                          onClick={() => handleOrderStatusChange(order.id, 'processing')}
                                        >
                                          <i className="bi bi-arrow-right-circle me-2"></i>
                                          В обработку
                                        </button>
                                      </li>
                                    )}
                                    {(order.status === 'new' || order.status === 'processing') && (
                                      <>
                                        <li>
                                          <button 
                                            className="dropdown-item" 
                                            onClick={() => handleOrderStatusChange(order.id, 'completed')}
                                          >
                                            <i className="bi bi-check-circle me-2"></i>
                                            Выполнен
                                          </button>
                                        </li>
                                        <li>
                                          <button 
                                            className="dropdown-item text-danger" 
                                            onClick={() => handleOrderStatusChange(order.id, 'cancelled')}
                                          >
                                            <i className="bi bi-x-circle me-2"></i>
                                            Отменить
                                          </button>
                                        </li>
                                      </>
                                    )}
                                    {(order.status === 'completed' || order.status === 'cancelled') && (
                                      <li>
                                        <button 
                                          className="dropdown-item" 
                                          onClick={() => handleOrderStatusChange(order.id, 'new')}
                                        >
                                          <i className="bi bi-arrow-counterclockwise me-2"></i>
                                          Вернуть в новые
                                        </button>
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Модальное окно добавления автомобиля */}
      <AddCarModal 
        isOpen={isAddCarModalOpen} 
        onClose={() => setIsAddCarModalOpen(false)} 
        onCarAdded={handleCarAdded} 
      />
      
      {/* Модальное окно управления автомобилями */}
      <CarListModal 
        isOpen={isCarListModalOpen} 
        onClose={() => setIsCarListModalOpen(false)} 
        onCarDeleted={handleCarDeleted} 
      />
      
      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;
