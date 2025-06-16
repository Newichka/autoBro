import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../firebase/AuthContext';
import AddCarModal from './AddCarModal';
import CarListModal from './CarListModal';

// Interface for standard Orders
interface Order {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  country: string;
  city: string;
  address: string;
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
type OrderStatus = 'new' | 'processing' | 'in_transit' | 'completed' | 'cancelled';

// Interface for Custom Requests
interface CustomRequest {
  id: string;
  userId: string;
  userEmail: string;
  fullName: string;
  phone: string;
  make: string;
  model: string;
  year: number;
  minPrice?: number;
  maxPrice?: number;
  color?: string;
  trim: string;
  condition: string;
  status: 'new' | 'viewed' | 'closed';
  createdAt: string;
}
type CustomRequestStatus = 'new' | 'viewed' | 'closed';

const AdminPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customRequests, setCustomRequests] = useState<CustomRequest[]>([]); // State for custom requests
  const [activeTab, setActiveTab] = useState<'orders' | 'custom_requests' | 'cars'>('orders'); // Added 'custom_requests' tab

  const [isAddCarModalOpen, setIsAddCarModalOpen] = useState<boolean>(false);
  const [isCarListModalOpen, setIsCarListModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      fetchOrders();
      fetchCustomRequests(); // Fetch custom requests on load
    }
  }, [currentUser]);

  // Fetch standard orders
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await axios.get('http://localhost:3001/orders');
      const fetchedOrders = response.data.map((order: any) => ({
        ...order,
        fullName: order.fullName || 'N/A',
        phone: order.phone || 'N/A',
        country: order.country || 'N/A',
        city: order.city || 'N/A',
        address: order.address || 'N/A',
      }));
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Ошибка при загрузке заказов:', error);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch custom requests
  const fetchCustomRequests = async () => {
    setLoadingRequests(true);
    try {
      const response = await axios.get('http://localhost:3001/custom-requests');
      setCustomRequests(response.data);
    } catch (error) {
      console.error('Ошибка при загрузке пользовательских заявок:', error);
      setCustomRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Handle standard order status change
  const handleOrderStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await axios.put(`http://localhost:3001/orders/${orderId}`, { status: newStatus });
      fetchOrders();
    } catch (error) {
      console.error('Ошибка при изменении статуса заказа:', error);
    }
  };

  // Handle standard order deletion
  const handleOrderDelete = async (orderId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот заказ? Это действие необратимо.')) {
      try {
        await axios.delete(`http://localhost:3001/orders/${orderId}`);
        fetchOrders();
      } catch (error) {
        console.error('Ошибка при удалении заказа:', error);
      }
    }
  };

  // Handle custom request status change
  const handleCustomRequestStatusChange = async (requestId: string, newStatus: CustomRequestStatus) => {
    try {
      await axios.put(`http://localhost:3001/custom-requests/${requestId}`, { status: newStatus });
      fetchCustomRequests(); // Refresh custom requests list
    } catch (error) {
      console.error('Ошибка при изменении статуса пользовательской заявки:', error);
    }
  };

  // Handle custom request deletion
  const handleCustomRequestDelete = async (requestId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту пользовательскую заявку?')) {
      try {
        await axios.delete(`http://localhost:3001/custom-requests/${requestId}`);
        fetchCustomRequests(); // Refresh custom requests list
      } catch (error) {
        console.error('Ошибка при удалении пользовательской заявки:', error);
      }
    }
  };

  const handleCarAdded = () => setIsAddCarModalOpen(false);
  const handleCarDeleted = () => setIsCarListModalOpen(false);

  // Status helpers for Orders
  const getOrderStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'new': return 'bg-primary';
      case 'processing': return 'bg-warning text-dark';
      case 'in_transit': return 'bg-info text-dark';
      case 'completed': return 'bg-success';
      case 'cancelled': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };
  const getOrderStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'new': return 'Новый';
      case 'processing': return 'В обработке';
      case 'in_transit': return 'В пути';
      case 'completed': return 'Выполнен';
      case 'cancelled': return 'Отменен';
      default: return 'Неизвестно';
    }
  };

  // Status helpers for Custom Requests
  const getCustomRequestStatusBadgeClass = (status: CustomRequestStatus) => {
    switch (status) {
      case 'new': return 'bg-primary';
      case 'viewed': return 'bg-info text-dark';
      case 'closed': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };
  const getCustomRequestStatusText = (status: CustomRequestStatus) => {
    switch (status) {
      case 'new': return 'Новая';
      case 'viewed': return 'Просмотрена';
      case 'closed': return 'Закрыта';
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
                    style={activeTab === 'orders' ? { color: 'var(--accent)' } : {}}
                  >
                    <i className="bi bi-cart me-1"></i>
                    Заказы на авто
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'custom_requests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('custom_requests')}
                    style={activeTab === 'custom_requests' ? { color: 'var(--accent)' } : {}}
                  >
                    <i className="bi bi-person-lines-fill me-1"></i>
                    Заявки на подбор
                  </button>
                </li>
                {/* Car management tab can be added here if needed */}
              </ul>

              {/* Standard Orders Tab */} 
              {activeTab === 'orders' && (
                <>
                  <h6 className="mb-3">Управление заказами на автомобили</h6>
                  {loadingOrders ? (
                    <div className="text-center p-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Загрузка...</span></div></div>
                  ) : orders.length === 0 ? (
                    <div className="alert alert-info">Заказы отсутствуют</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead>
                          <tr>
                            <th>ID Заказа</th>
                            <th>Клиент</th>
                            <th>Телефон</th>
                            <th>Страна</th>
                            <th>Город</th>
                            <th>Адрес</th>
                            <th>Автомобиль</th>
                            <th>Цена</th>
                            <th>Статус</th>
                            <th>Действия</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map(order => (
                            <tr key={order.id}>
                              <td title={order.id}>{order.id.substring(0, 8)}...</td>
                              <td>{order.fullName}</td>
                              <td>{order.phone}</td>
                              <td>{order.country}</td>
                              <td>{order.city}</td>
                              <td>{order.address}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  {order.carInfo.mainPhotoUrl && (
                                    <div className="me-2 flex-shrink-0" style={{ width: '50px', height: '40px' }}>
                                      <img
                                        src={order.carInfo.mainPhotoUrl}
                                        alt={`${order.carInfo.make} ${order.carInfo.model}`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '2px' }}
                                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/50x40?text=Нет+фото'; }}
                                      />
                                    </div>
                                  )}
                                  <span className="small">{order.carInfo.make} {order.carInfo.model} ({order.carInfo.year})</span>
                                </div>
                              </td>
                              <td>{order.carInfo.price.toLocaleString()} ₽</td>
                              <td>
                                <span className={`badge ${getOrderStatusBadgeClass(order.status)}`}>
                                  {getOrderStatusText(order.status)}
                                </span>
                              </td>
                              <td>
                                <div className="dropdown">
                                  <button className="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    Изменить статус
                                  </button>
                                  <ul className="dropdown-menu dropdown-menu-end">
                                    {order.status !== 'processing' && order.status !== 'completed' && order.status !== 'cancelled' && (
                                      <li><button className="dropdown-item" onClick={() => handleOrderStatusChange(order.id, 'processing')}><i className="bi bi-arrow-repeat me-2"></i>В обработку</button></li>
                                    )}
                                    {order.status === 'processing' && (
                                      <li><button className="dropdown-item" onClick={() => handleOrderStatusChange(order.id, 'in_transit')}><i className="bi bi-truck me-2"></i>В пути</button></li>
                                    )}
                                    {(order.status === 'processing' || order.status === 'in_transit') && (
                                      <li><button className="dropdown-item" onClick={() => handleOrderStatusChange(order.id, 'completed')}><i className="bi bi-check-circle me-2"></i>Выполнен</button></li>
                                    )}
                                    {order.status !== 'cancelled' && order.status !== 'completed' && (
                                      <li><button className="dropdown-item text-danger" onClick={() => handleOrderStatusChange(order.id, 'cancelled')}><i className="bi bi-x-circle me-2"></i>Отменить</button></li>
                                    )}
                                    {(order.status === 'completed' || order.status === 'cancelled') && (
                                      <li><button className="dropdown-item" onClick={() => handleOrderStatusChange(order.id, 'new')}><i className="bi bi-arrow-counterclockwise me-2"></i>Вернуть в новые</button></li>
                                    )}
                                    <li><hr className="dropdown-divider"/></li>
                                    <li>
                                      <button className="dropdown-item text-danger" onClick={() => handleOrderDelete(order.id)}>
                                        <i className="bi bi-trash me-2"></i>Удалить заказ
                                      </button>
                                    </li>
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

              {/* Custom Requests Tab */} 
              {activeTab === 'custom_requests' && (
                <>
                  <h6 className="mb-3">Управление пользовательскими заявками на подбор</h6>
                  {loadingRequests ? (
                    <div className="text-center p-5"><div className="spinner-border text-info" role="status"><span className="visually-hidden">Загрузка...</span></div></div>
                  ) : customRequests.length === 0 ? (
                    <div className="alert alert-info">Пользовательские заявки отсутствуют</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead>
                          <tr>
                            <th>ID Заявки</th>
                            <th>Клиент</th>
                            <th>Телефон</th>
                            <th>Email</th>
                            <th>Авто (Марка, Модель, Год)</th>
                            <th>Бюджет (от-до)</th>
                            <th>Цвет</th>
                            <th>Комплектация</th>
                            <th>Состояние</th>
                            <th>Статус</th>
                            <th>Дата</th>
                            <th>Действия</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customRequests.map(req => (
                            <tr key={req.id}>
                              <td title={req.id}>{req.id.substring(0, 10)}...</td>
                              <td>{req.fullName}</td>
                              <td>{req.phone}</td>
                              <td>{req.userEmail}</td>
                              <td>{req.make} {req.model} ({req.year})</td>
                              <td>{(req.minPrice ? req.minPrice.toLocaleString() : '-') + ' - ' + (req.maxPrice ? req.maxPrice.toLocaleString() : '-')} ₽</td>
                              <td>{req.color || '-'}</td>
                              <td style={{ whiteSpace: 'pre-wrap', minWidth: '150px' }}>{req.trim}</td>
                              <td style={{ whiteSpace: 'pre-wrap', minWidth: '150px' }}>{req.condition}</td>
                              <td>
                                <span className={`badge ${getCustomRequestStatusBadgeClass(req.status)}`}>
                                  {getCustomRequestStatusText(req.status)}
                                </span>
                              </td>
                              <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                              <td>
                                <div className="d-flex flex-column flex-sm-row gap-1">
                                  <div className="dropdown">
                                    <button className="btn btn-sm btn-outline-secondary dropdown-toggle w-100" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                      Статус
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-end">
                                      {req.status !== 'viewed' && (
                                        <li><button className="dropdown-item" onClick={() => handleCustomRequestStatusChange(req.id, 'viewed')}><i className="bi bi-eye me-2"></i>Просмотрена</button></li>
                                      )}
                                      {req.status !== 'closed' && (
                                        <li><button className="dropdown-item" onClick={() => handleCustomRequestStatusChange(req.id, 'closed')}><i className="bi bi-check-circle me-2"></i>Закрыта</button></li>
                                      )}
                                      {req.status !== 'new' && (
                                        <li><button className="dropdown-item" onClick={() => handleCustomRequestStatusChange(req.id, 'new')}><i className="bi bi-arrow-counterclockwise me-2"></i>Вернуть в новые</button></li>
                                      )}
                                    </ul>
                                  </div>
                                  <button
                                    className="btn btn-sm btn-outline-danger w-100 mt-1 mt-sm-0"
                                    onClick={() => handleCustomRequestDelete(req.id)}
                                    title="Удалить заявку"
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
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

              {/* Placeholder for Car Management Tab Content */}
              {activeTab === 'cars' && (
                <div className="alert alert-secondary">
                  Управление автомобилями (через модальные окна).
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Car Modal */}
      <AddCarModal
        isOpen={isAddCarModalOpen}
        onClose={() => setIsAddCarModalOpen(false)}
        onCarAdded={handleCarAdded}
      />

      {/* Car List/Management Modal */}
      <CarListModal
        isOpen={isCarListModalOpen}
        onClose={() => setIsCarListModalOpen(false)}
        onCarDeleted={handleCarDeleted}
      />
    </div>
  );
};

export default AdminPanel;

