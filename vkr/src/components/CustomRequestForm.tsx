import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../firebase/AuthContext';

interface CustomRequestFormProps {
  onClose: () => void; // Function to close the form/modal
}

const CustomRequestForm: React.FC<CustomRequestFormProps> = ({ onClose }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    minPrice: '', // Новый бюджет от
    maxPrice: '', // Новый бюджет до
    color: '',    // Новый цвет
    trim: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Пожалуйста, войдите в систему, чтобы отправить заявку.');
      return;
    }

    // Additional check to ensure currentUser.id is available
    if (!currentUser.id) {
        setError('Не удалось получить ID пользователя. Пожалуйста, попробуйте перезайти в систему.');
        return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Fetch user profile details to include in the request
      let userFullName = 'Не указано';
      let userPhone = 'Не указано';
      try {
        // Use currentUser.id to fetch profile
        const profileResponse = await axios.get(`http://localhost:3001/users/${currentUser.id}`); 
        userFullName = profileResponse.data.fullName || 'Не указано';
        userPhone = profileResponse.data.phone || 'Не указано';
      } catch (profileError) {
        console.warn('Не удалось загрузить профиль пользователя для заявки, используются значения по умолчанию.', profileError);
      }

      await axios.post('http://localhost:3001/custom-requests', {
        ...formData,
        userId: currentUser.id,
        userEmail: currentUser.email,
        fullName: userFullName,
        phone: userPhone,
        year: formData.year ? parseInt(formData.year, 10) : undefined,
        minPrice: formData.minPrice ? parseFloat(formData.minPrice) : undefined,
        maxPrice: formData.maxPrice ? parseFloat(formData.maxPrice) : undefined,
        color: formData.color || undefined,
      });
      setSuccess(true);
      setFormData({ make: '', model: '', year: '', minPrice: '', maxPrice: '', color: '', trim: '' }); // Reset form
      setTimeout(() => {
        onClose(); // Close form after a delay
      }, 2500);
    } catch (err: any) {
      console.error('Ошибка при отправке заявки:', err);
      setError(err.response?.data?.message || 'Не удалось отправить заявку. Пожалуйста, проверьте введенные данные и попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-light">
        <h5 className="mb-0">Оставить заявку на подбор автомобиля</h5>
      </div>
      <div className="card-body">
        {success ? (
          <div className="alert alert-success">
            <i className="bi bi-check-circle me-2"></i>
            Ваша заявка успешно отправлена! Мы свяжемся с вами, если найдем подходящий вариант.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="make" className="form-label">Марка</label>
                <input type="text" className="form-control" id="make" name="make" value={formData.make} onChange={handleChange} required placeholder="Например, Toyota" />
              </div>
              <div className="col-md-6">
                <label htmlFor="model" className="form-label">Модель</label>
                <input type="text" className="form-control" id="model" name="model" value={formData.model} onChange={handleChange} required placeholder="Например, Camry" />
              </div>
              <div className="col-md-4">
                <label htmlFor="year" className="form-label">Год выпуска (желаемый)</label>
                <input type="number" className="form-control" id="year" name="year" value={formData.year} onChange={handleChange} required placeholder="Например, 2020" min="1900" max={new Date().getFullYear() + 1} />
              </div>
              <div className="col-md-4">
                <label htmlFor="minPrice" className="form-label">Бюджет от (₽)</label>
                <input type="number" className="form-control" id="minPrice" name="minPrice" value={formData.minPrice} onChange={handleChange} required placeholder="Например, 1000000" min="0" />
              </div>
              <div className="col-md-4">
                <label htmlFor="maxPrice" className="form-label">Бюджет до (₽)</label>
                <input type="number" className="form-control" id="maxPrice" name="maxPrice" value={formData.maxPrice} onChange={handleChange} required placeholder="Например, 2000000" min="0" />
              </div>
              <div className="col-md-6">
                <label htmlFor="color" className="form-label">Желаемый цвет</label>
                <input type="text" className="form-control" id="color" name="color" value={formData.color} onChange={handleChange} placeholder="Например, черный, белый" />
              </div>
              <div className="col-12">
                <label htmlFor="trim" className="form-label">Комплектация (описание)</label>
                <textarea className="form-control" id="trim" name="trim" value={formData.trim} onChange={handleChange} required placeholder="Опишите желаемую комплектацию (например, двигатель, коробка, опции)" rows={3}></textarea>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger mt-3">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}

            <div className="d-flex justify-content-end mt-4">
              <button type="button" className="btn btn-outline-secondary me-2" onClick={onClose} disabled={loading}>
                Отмена
              </button>
              <button type="submit" className="btn" style={{ backgroundColor: 'var(--accent)', color: 'white' }} disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Отправка...
                  </>
                ) : (
                  <><i className="bi bi-send me-1"></i> Отправить заявку</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CustomRequestForm;

