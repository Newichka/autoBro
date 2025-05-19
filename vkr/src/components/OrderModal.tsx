import React, { useState } from 'react';
import axios from 'axios';

interface OrderModalProps {
  show: boolean;
  onClose: () => void;
  carId: number | string;
  carMake: string;
  carModel: string;
  carYear: number;
  carPrice: number;
}

interface OrderFormData {
  fullName: string;
  phone: string;
  email: string;
}

const OrderModal: React.FC<OrderModalProps> = ({ 
  show, 
  onClose, 
  carId, 
  carMake, 
  carModel, 
  carYear, 
  carPrice 
}) => {
  const [formData, setFormData] = useState<OrderFormData>({
    fullName: '',
    phone: '',
    email: ''
  });
  
  const [errors, setErrors] = useState<Partial<OrderFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const API_URL = 'http://localhost:5000/api';

  const validateForm = (): boolean => {
    const newErrors: Partial<OrderFormData> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'ФИО обязательно для заполнения';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Номер телефона обязателен для заполнения';
    } else if (!/^\+?[0-9]{10,15}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Введите корректный номер телефона';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен для заполнения';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Введите корректный email';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Очищаем ошибку при вводе
    if (errors[name as keyof OrderFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const response = await axios.post(`${API_URL}/orders`, {
        ...formData,
        carId,
        carMake,
        carModel,
        carYear,
        carPrice
      });
      
      console.log('Order submitted successfully:', response.data);
      setSubmitSuccess(true);
      
      // Сбрасываем форму после успешной отправки
      setTimeout(() => {
        setFormData({
          fullName: '',
          phone: '',
          email: ''
        });
        onClose();
        setSubmitSuccess(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting order:', error);
      setSubmitError('Произошла ошибка при отправке заказа. Пожалуйста, попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div 
      className="modal fade show" 
      style={{ 
        display: 'block', 
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(5px)'
      }}
      onClick={onClose}
    >
      <div 
        className="modal-dialog modal-dialog-centered" 
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Оформление заказа</h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          
          <div className="modal-body p-4">
            {submitSuccess ? (
              <div className="text-center py-4">
                <div className="mb-3">
                  <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3rem' }}></i>
                </div>
                <h4 className="mb-3">Заказ успешно оформлен!</h4>
                <p className="text-muted">Наш менеджер свяжется с вами в ближайшее время.</p>
              </div>
            ) : (
              <>
                <div className="car-info mb-4 p-3 rounded" style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
                  <h6 className="mb-2">{carMake} {carModel} ({carYear})</h6>
                  <div className="fw-bold text-primary">{carPrice.toLocaleString()} ₽</div>
                </div>
                
                {submitError && (
                  <div className="alert alert-danger mb-3">{submitError}</div>
                )}
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="fullName" className="form-label">ФИО</label>
                    <input
                      type="text"
                      className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Иванов Иван Иванович"
                    />
                    {errors.fullName && (
                      <div className="invalid-feedback">{errors.fullName}</div>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="phone" className="form-label">Номер телефона</label>
                    <input
                      type="tel"
                      className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+7 (999) 123-45-67"
                    />
                    {errors.phone && (
                      <div className="invalid-feedback">{errors.phone}</div>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="example@mail.ru"
                    />
                    {errors.email && (
                      <div className="invalid-feedback">{errors.email}</div>
                    )}
                  </div>
                  
                  <div className="d-grid gap-2 mt-4">
                    <button 
                      type="submit" 
                      className="btn btn-primary py-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Отправка...
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
