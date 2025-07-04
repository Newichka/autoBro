import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../firebase/AuthContext';
import AddCarModal from './AddCarModal';
import CarListModal from './CarListModal';
import { parseCars, ParsedCar } from '../services/carParserService';
import ParsedCarsModal from './ParsedCarsModal';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { IconBaseProps } from 'react-icons';

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
  status: 'new' | 'processing' | 'in_transit' | 'completed' | 'cancelled' | 'awaiting_prepayment' | 'prepayment_received' | 'processing_docs';
  deliveryPrice?: number;
  createdAt: string;
}
type OrderStatus = 'new' | 'processing' | 'in_transit' | 'completed' | 'cancelled' | 'awaiting_prepayment' | 'prepayment_received' | 'processing_docs';

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
  suggestedCarUrl?: string;
  userResponse?: 'accepted' | 'rejected' | null;
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
  const [isParsedCarsModalOpen, setIsParsedCarsModalOpen] = useState<boolean>(false);
  const [parsedCars, setParsedCars] = useState<ParsedCar[]>([]);
  const [loadingParsedCars, setLoadingParsedCars] = useState<boolean>(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  // Состояния для сортировки заявок на подбор
  const [sortField, setSortField] = useState<'createdAt' | 'status' | 'userResponse'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Состояния для сортировки заказов
  const [sortFieldOrders, setSortFieldOrders] = useState<'createdAt' | 'status'>('createdAt');
  const [sortDirectionOrders, setSortDirectionOrders] = useState<'asc' | 'desc'>('desc');

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
  const handleCarDeleted = () => {};

  // Status helpers for Orders
  const getOrderStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'new': return 'bg-primary';
      case 'processing': return 'bg-warning text-dark';
      case 'in_transit': return 'bg-info text-dark';
      case 'completed': return 'bg-success';
      case 'cancelled': return 'bg-danger';
      case 'awaiting_prepayment': return 'bg-secondary';
      case 'prepayment_received': return 'bg-info';
      case 'processing_docs': return 'bg-dark';
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
      case 'awaiting_prepayment': return 'Ожидает предоплаты';
      case 'prepayment_received': return 'Внесена предоплата';
      case 'processing_docs': return 'На оформлении';
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

  // Добавляю обработчики для изменения и сохранения суммы доставки
  const handleDeliveryPriceChange = (orderId: string, value: string) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, deliveryPrice: value === '' ? undefined : Number(value) } : order
    ));
  };

  const saveDeliveryPrice = async (orderId: string, value: string) => {
    try {
      await axios.put(`http://localhost:3001/orders/${orderId}`, { deliveryPrice: value === '' ? undefined : Number(value) });
      fetchOrders();
    } catch (error) {
      console.error('Ошибка при сохранении суммы доставки:', error);
    }
  };

  // Обработчик нажатия Enter для input доставки
  const handleDeliveryPriceKeyDown = (orderId: string, value: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveDeliveryPrice(orderId, value);
      e.currentTarget.blur(); // чтобы убрать фокус после сохранения
    }
  };

  // Функция для нормализации url фото
  const normalizePhotoUrl = (url?: string) => {
    if (!url) return '/car.png';
    if (url.startsWith('http://localhost:5000/uploads/')) {
      return url.replace('http://localhost:5000', 'http://localhost:8080');
    }
    if (url.startsWith('/uploads/')) {
      return 'http://localhost:8080' + url;
    }
    return url;
  };

  // Обработчик для изменения и сохранения ссылки
  const handleSuggestedCarUrlChange = (requestId: string, value: string) => {
    setCustomRequests(prev => prev.map(req =>
      req.id === requestId ? { ...req, suggestedCarUrl: value } : req
    ));
  };
  const saveSuggestedCarUrl = async (requestId: string, value: string) => {
    try {
      await axios.put(`http://localhost:3001/custom-requests/${requestId}`, { suggestedCarUrl: value });
      fetchCustomRequests();
    } catch (error) {
      console.error('Ошибка при сохранении ссылки на авто:', error);
    }
  };

  // Handle user response to suggested car
  const handleUserResponse = async (requestId: string, response: 'accepted' | 'rejected') => {
    try {
      await axios.put(`http://localhost:3001/custom-requests/${requestId}`, { userResponse: response });
      fetchCustomRequests();
    } catch (error) {
      console.error('Ошибка при сохранении ответа пользователя:', error);
    }
  };

  // Get user response text
  const getUserResponseText = (response?: 'accepted' | 'rejected' | null) => {
    switch (response) {
      case 'accepted': return 'Подходит';
      case 'rejected': return 'Не подходит';
      default: return 'Ожидает ответа';
    }
  };

  // Get user response badge class
  const getUserResponseBadgeClass = (response?: 'accepted' | 'rejected' | null) => {
    switch (response) {
      case 'accepted': return 'bg-success';
      case 'rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const handleParseCars = async (request: CustomRequest) => {
    setSelectedRequestId(request.id);
    setLoadingParsedCars(true);
    setIsParsedCarsModalOpen(true);
    setParsedCars([]); // Очищаем предыдущие результаты

    try {
      console.log('Начало парсинга для заявки:', request);
      const cars = await parseCars({
        make: request.make,
        model: request.model,
        year: request.year,
        minPrice: request.minPrice,
        maxPrice: request.maxPrice,
        color: request.color
      });
      console.log('Получены результаты парсинга:', cars);
      setParsedCars(cars);
    } catch (error) {
      console.error('Ошибка при парсинге автомобилей:', error);
      setParsedCars([]);
      // Показываем уведомление об ошибке
      alert(error instanceof Error ? error.message : 'Произошла ошибка при поиске автомобилей');
    } finally {
      setLoadingParsedCars(false);
    }
  };

  const handleSelectCar = async (car: ParsedCar) => {
    if (!selectedRequestId) return;
    
    try {
      await axios.put(`http://localhost:3001/custom-requests/${selectedRequestId}`, {
        suggestedCarUrl: car.url
      });
      fetchCustomRequests();
      setIsParsedCarsModalOpen(false);
    } catch (error) {
      console.error('Ошибка при сохранении ссылки на автомобиль:', error);
    }
  };

  // Функция сортировки заявок
  const getSortedCustomRequests = () => {
    const sorted = [...customRequests];
    sorted.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      // Для даты сортируем по времени
      if (sortField === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      // Для userResponse null всегда в конце
      if (sortField === 'userResponse') {
        const order: Record<string, number> = { accepted: 2, rejected: 1, null: 0 };
        aValue = aValue === null || aValue === undefined ? 0 : order[String(aValue)] ?? 0;
        bValue = bValue === null || bValue === undefined ? 0 : order[String(bValue)] ?? 0;
      }
      // Для status задаём порядок
      if (sortField === 'status') {
        const order: Record<string, number> = { new: 2, viewed: 1, closed: 0 };
        aValue = order[String(aValue)] ?? 0;
        bValue = order[String(bValue)] ?? 0;
      }
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  // Функция сортировки заказов
  const getSortedOrders = () => {
    const sorted = [...orders];
    sorted.sort((a, b) => {
      let aValue: any = a[sortFieldOrders];
      let bValue: any = b[sortFieldOrders];
      if (sortFieldOrders === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      if (sortFieldOrders === 'status') {
        const order: Record<string, number> = {
          new: 4, processing: 3, in_transit: 2, completed: 1, cancelled: 0, awaiting_prepayment: 5, prepayment_received: 6, processing_docs: 7
        };
        aValue = order[String(aValue)] ?? 0;
        bValue = order[String(bValue)] ?? 0;
      }
      if (aValue < bValue) return sortDirectionOrders === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirectionOrders === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
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
                  <div className="mb-2 d-flex align-items-center gap-2">
                    <span>Сортировать по:</span>
                    <button
                      className={`btn btn-sm ${sortFieldOrders === 'createdAt' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setSortFieldOrders('createdAt')}
                    >
                      Дате
                      {sortFieldOrders === 'createdAt' && (sortDirectionOrders === 'asc' ? <FaSortUp className="icon-margin-left"/> : <FaSortDown className="icon-margin-left"/>) }
                    </button>
                    <button
                      className={`btn btn-sm ${sortFieldOrders === 'status' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setSortFieldOrders('status')}
                    >
                      Статусу
                      {sortFieldOrders === 'status' && (sortDirectionOrders === 'asc' ? <FaSortUp className="icon-margin-left"/> : <FaSortDown className="icon-margin-left"/>) }
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary ms-2"
                      onClick={() => setSortDirectionOrders(d => d === 'asc' ? 'desc' : 'asc')}
                    >
                      <FaSort className="icon-margin-right"/>{sortDirectionOrders === 'asc' ? 'По возрастанию' : 'По убыванию'}
                    </button>
                  </div>
                  {loadingOrders ? (
                    <div className="text-center p-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Загрузка...</span></div></div>
                  ) : orders.length === 0 ? (
                    <div className="alert alert-info">Заказы отсутствуют</div>
                  ) : (
                    <div className="table-responsive" style={{ minHeight: '80vh' }}>
                      <table className="table table-hover align-middle">
                        <thead>
                          {/* Заголовки колонок убраны для компактности и современного вида */}
                        </thead>
                        <tbody>
                          {getSortedOrders().map((order, idx) => (
                            <tr key={order.id}>
                              <td colSpan={8} style={{
                                background: idx % 2 === 0 ? '#e3f1fb' : '#ededed',
                                borderRadius: '12px',
                                boxShadow: '0 2px 12px rgba(53,99,233,0.13)',
                                padding: 0,
                                border: 'none',
                                verticalAlign: 'top',
                                marginBottom: 0
                              }}>
                                <div style={{ padding: '1.2rem 1.5rem 1.2rem 1.5rem', width: '100%' }}>
                                  <div className="d-flex flex-wrap align-items-center" style={{ gap: 0 }}>
                                    <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap' }}>
                                      <div style={{ minWidth: 120, borderRight: '1px solid #e0e0e0', paddingRight: 12, marginRight: 12, wordBreak: 'break-all' }}><b>ID:</b> {order.id}</div>
                                      <div style={{ minWidth: 120, borderRight: '1px solid #e0e0e0', paddingRight: 12, marginRight: 12 }}><b>Клиент:</b> {order.fullName}</div>
                                      <div style={{ minWidth: 120, borderRight: '1px solid #e0e0e0', paddingRight: 12, marginRight: 12 }}><b>Телефон:</b> {order.phone}</div>
                                      <div style={{ minWidth: 100, borderRight: '1px solid #e0e0e0', paddingRight: 12, marginRight: 12 }}><b>Страна:</b> {order.country}</div>
                                      <div style={{ minWidth: 100, borderRight: '1px solid #e0e0e0', paddingRight: 12, marginRight: 12 }}><b>Город:</b> {order.city}</div>
                                      <div style={{ minWidth: 160, wordBreak: 'break-word' }}><b>Адрес:</b> {order.address}</div>
                                    </div>
                                    <span className={`badge ${getOrderStatusBadgeClass(order.status)}`}>{getOrderStatusText(order.status)}</span>
                                    <div className="dropdown ms-3">
                                      <button className="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        Изменить статус
                                      </button>
                                      <ul className="dropdown-menu dropdown-menu-end">
                                        {order.status !== 'processing' && order.status !== 'completed' && order.status !== 'cancelled' && (
                                          <li><button className="dropdown-item" onClick={() => handleOrderStatusChange(order.id, 'processing')}><i className="bi bi-arrow-repeat me-2"></i>В обработку</button></li>
                                        )}
                                        {order.status !== 'awaiting_prepayment' && (
                                          <li><button className="dropdown-item" onClick={() => handleOrderStatusChange(order.id, 'awaiting_prepayment')}><i className="bi bi-hourglass-split me-2"></i>Ожидает предоплаты</button></li>
                                        )}
                                        {order.status !== 'prepayment_received' && (
                                          <li><button className="dropdown-item" onClick={() => handleOrderStatusChange(order.id, 'prepayment_received')}><i className="bi bi-cash-coin me-2"></i>Внесена предоплата</button></li>
                                        )}
                                        {order.status !== 'processing_docs' && (
                                          <li><button className="dropdown-item" onClick={() => handleOrderStatusChange(order.id, 'processing_docs')}><i className="bi bi-file-earmark-text me-2"></i>На оформлении</button></li>
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
                                  </div>
                                  <div className="d-flex flex-wrap align-items-center gap-3 pt-2">
                                    {order.carInfo.mainPhotoUrl && (
                                      <div className="me-2 flex-shrink-0" style={{ width: '70px', height: '50px' }}>
                                        <img
                                          src={order.carInfo.mainPhotoUrl ? normalizePhotoUrl(order.carInfo.mainPhotoUrl) : '/car.png'}
                                          alt={`${order.carInfo.make} ${order.carInfo.model}`}
                                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '2px' }}
                                          onError={(e) => { (e.target as HTMLImageElement).src = '/car.png'; }}
                                        />
                                      </div>
                                    )}
                                    <div className="small">
                                      <b>Авто:</b> {order.carInfo.make} {order.carInfo.model} ({order.carInfo.year})<br/>
                                      <b>Цена:</b> {order.carInfo.price.toLocaleString()} ₽
                                      {order.deliveryPrice !== undefined && order.deliveryPrice !== null && order.deliveryPrice > 0 && (
                                        <><b> + Доставка:</b> {order.deliveryPrice.toLocaleString()} ₽</>
                                      )}
                                      <b> = Итого:</b> {(order.carInfo.price + (order.deliveryPrice || 0)).toLocaleString()} ₽
                                    </div>
                                    {order.status === 'processing' && (
                                      <div className="ms-3">
                                        <label className="form-label mb-0 me-2">Доставка:</label>
                                        <input
                                          type="number"
                                          className="form-control form-control-sm d-inline-block"
                                          style={{ width: 100, display: 'inline-block' }}
                                          value={order.deliveryPrice ?? ''}
                                          min={0}
                                          placeholder="₽"
                                          onChange={e => handleDeliveryPriceChange(order.id, e.target.value)}
                                          onBlur={e => saveDeliveryPrice(order.id, e.target.value)}
                                          onKeyDown={e => handleDeliveryPriceKeyDown(order.id, (e.target as HTMLInputElement).value, e)}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {idx !== orders.length - 1 && (
                                  <div style={{ height: 24 }} />
                                )}
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
                  {/* UI для сортировки */}
                  <div className="mb-2 d-flex align-items-center gap-2">
                    <span>Сортировать по:</span>
                    <button
                      className={`btn btn-sm ${sortField === 'createdAt' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setSortField('createdAt')}
                    >
                      Дате
                      {sortField === 'createdAt' && (sortDirection === 'asc' ? <FaSortUp className="icon-margin-left"/> : <FaSortDown className="icon-margin-left"/>)}
                    </button>
                    <button
                      className={`btn btn-sm ${sortField === 'status' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setSortField('status')}
                    >
                      Статусу
                      {sortField === 'status' && (sortDirection === 'asc' ? <FaSortUp className="icon-margin-left"/> : <FaSortDown className="icon-margin-left"/>)}
                    </button>
                    <button
                      className={`btn btn-sm ${sortField === 'userResponse' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setSortField('userResponse')}
                    >
                      Ответу
                      {sortField === 'userResponse' && (sortDirection === 'asc' ? <FaSortUp className="icon-margin-left"/> : <FaSortDown className="icon-margin-left"/>)}
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary ms-2"
                      onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
                    >
                      <FaSort className="icon-margin-right"/>{sortDirection === 'asc' ? 'По возрастанию' : 'По убыванию'}
                    </button>
                  </div>
                  {loadingRequests ? (
                    <div className="text-center p-5"><div className="spinner-border text-info" role="status"><span className="visually-hidden">Загрузка...</span></div></div>
                  ) : customRequests.length === 0 ? (
                    <div className="alert alert-info">Пользовательские заявки отсутствуют</div>
                  ) : (
                    <div className="table-responsive" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                      <table className="table table-hover align-middle" style={{ fontSize: '0.9rem' }}>
                        <thead className="sticky-top bg-light">
                          <tr>
                            <th style={{ width: '100px' }}>Дата</th>
                            <th style={{ width: '200px' }}>Пользователь</th>
                            <th style={{ width: '200px' }}>Автомобиль</th>
                            <th style={{ width: '100px' }}>Статус</th>
                            <th style={{ width: '200px' }}>Предложенный автомобиль</th>
                            <th style={{ width: '150px' }}>Ответ пользователя</th>
                            <th style={{ width: '200px' }}>Действия</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getSortedCustomRequests().map((request) => (
                            <tr key={request.id}>
                              <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                              <td>
                                <div className="text-truncate" title={request.fullName}>{request.fullName}</div>
                                <div className="text-truncate" title={request.phone}>{request.phone}</div>
                                <div className="text-truncate" title={request.userEmail}>{request.userEmail}</div>
                              </td>
                              <td>
                                <div className="text-truncate" title={`${request.make} ${request.model}`}>{request.make} {request.model}</div>
                                <div>{request.year} г.</div>
                                <div className="text-truncate" title={request.trim}>{request.trim}</div>
                                <div className="text-truncate" title={request.condition}>{request.condition}</div>
                                {request.minPrice && request.maxPrice && (
                                  <div>Цена: {request.minPrice} - {request.maxPrice} ₽</div>
                                )}
                                {request.color && <div>Цвет: {request.color}</div>}
                              </td>
                              <td>
                                <span className={`badge ${getCustomRequestStatusBadgeClass(request.status)}`}>
                                  {getCustomRequestStatusText(request.status)}
                                </span>
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  style={{ width: '220px', minWidth: '120px', maxWidth: '100%' }}
                                  value={request.suggestedCarUrl || ''}
                                  onChange={(e) => handleSuggestedCarUrlChange(request.id, e.target.value)}
                                  onBlur={(e) => saveSuggestedCarUrl(request.id, e.target.value)}
                                  placeholder="Ссылка на предложенный автомобиль"
                                />
                              </td>
                              <td>
                                <span className={`badge ${getUserResponseBadgeClass(request.userResponse)}`}>
                                  {getUserResponseText(request.userResponse)}
                                </span>
                                {request.suggestedCarUrl && !request.userResponse && (
                                  <div className="mt-2 d-flex gap-1">
                                    <button
                                      className="btn btn-success btn-sm flex-grow-1"
                                      onClick={() => handleUserResponse(request.id, 'accepted')}
                                    >
                                      Подходит
                                    </button>
                                    <button
                                      className="btn btn-danger btn-sm flex-grow-1"
                                      onClick={() => handleUserResponse(request.id, 'rejected')}
                                    >
                                      Не подходит
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td>
                                <div className="btn-group">
                                  <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => handleCustomRequestStatusChange(request.id, 'viewed')}
                                    disabled={request.status === 'viewed'}
                                  >
                                    Просмотрено
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => handleCustomRequestStatusChange(request.id, 'closed')}
                                    disabled={request.status === 'closed'}
                                  >
                                    Закрыть
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleCustomRequestDelete(request.id)}
                                  >
                                    Удалить
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

      {/* Add ParsedCarsModal */}
      <ParsedCarsModal
        isOpen={isParsedCarsModalOpen}
        onClose={() => setIsParsedCarsModalOpen(false)}
        cars={parsedCars}
        onSelectCar={handleSelectCar}
        loading={loadingParsedCars}
      />
    </div>
  );
};

export default AdminPanel;

