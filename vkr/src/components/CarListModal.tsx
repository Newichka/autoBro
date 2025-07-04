import React, { useState, useEffect } from 'react';
import AddCarModal from './AddCarModal';

interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  colorName: string;
  condition: string;
}

interface CarListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCarDeleted: () => void;
}

const CarListModal: React.FC<CarListModalProps> = ({ isOpen, onClose, onCarDeleted }) => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [pagination, setPagination] = useState({ page: 0, totalPages: 0, totalElements: 0 });
  const [pageSize] = useState(50); // Увеличиваем размер страницы
  const [editCar, setEditCar] = useState<Car | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCars();
    }
  }, [isOpen, pagination.page]);

  const fetchCars = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/cars?page=${pagination.page}&size=${pageSize}`);
      if (!response.ok) {
        throw new Error('Не удалось загрузить список автомобилей');
      }
      const data = await response.json();
      setCars(data.data.content || data.data);
      setPagination({
        page: data.data.number || 0,
        totalPages: data.data.totalPages || 0,
        totalElements: data.data.totalElements || 0
      });
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при загрузке автомобилей');
      console.error('Error fetching cars:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (carId: number) => {
    try {
      const response = await fetch(`/api/cars/${carId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Не удалось удалить автомобиль');
      }
      setCars(cars.filter(car => car.id !== carId));
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при удалении автомобиля');
      console.error('Error deleting car:', err);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 350);
  };

  if (!isOpen && !closing) return null;

  return (
    <div className={`modal-backdrop animated-backdrop${closing ? ' closing' : ''}`} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
      <div className={`modal-content bg-white p-4 rounded shadow-lg animated-modal${closing ? ' closing' : ''}`} style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="mb-0">Управление автомобилями</h5>
          <button type="button" className="btn-close" onClick={handleClose} aria-label="Close"></button>
        </div>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Загрузка...</span>
            </div>
            <p className="mt-2">Загрузка списка автомобилей...</p>
          </div>
        ) : (
          <>
            {cars.length === 0 ? (
              <div className="alert alert-info">Список автомобилей пуст</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Марка</th>
                      <th>Модель</th>
                      <th>Год</th>
                      <th style={{ minWidth: '120px', width: '140px' }}>Цена</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cars.map(car => (
                      <tr key={car.id}>
                        <td>{car.id}</td>
                        <td>{car.make}</td>
                        <td>{car.model}</td>
                        <td>{car.year}</td>
                        <td style={{ minWidth: '120px', width: '140px', fontWeight: 600 }}>{car.price.toLocaleString()} ₽</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="btn btn-sm btn-primary"
                              style={{ minWidth: 110 }}
                              onClick={() => { setEditCar(car); setIsEditModalOpen(true); }}
                            >
                              <i className="bi bi-pencil-square"></i> Редактировать
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              style={{ minWidth: 110 }}
                              onClick={() => handleDeleteClick(car.id)}
                            >
                              <i className="bi bi-trash"></i> Удалить
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
        
        {/* Пагинация */}
        {!loading && !error && pagination.totalPages > 1 && (
          <nav aria-label="Page navigation" className="mt-4 d-flex justify-content-center">
            <ul className="pagination pagination-sm">
              <li className={`page-item ${pagination.page === 0 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => handlePageChange(pagination.page - 1)} aria-label="Previous">
                  <span aria-hidden="true">&laquo;</span>
                </button>
              </li>
              {[...Array(pagination.totalPages)].map((_, i) => (
                <li key={i} className={`page-item ${pagination.page === i ? 'active' : ''}`}>
                  <button className="page-link" onClick={() => handlePageChange(i)}>{i + 1}</button>
                </li>
              ))}
              <li className={`page-item ${pagination.page === pagination.totalPages - 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => handlePageChange(pagination.page + 1)} aria-label="Next">
                  <span aria-hidden="true">&raquo;</span>
                </button>
              </li>
            </ul>
          </nav>
        )}

        {isEditModalOpen && (
          <AddCarModal
            isOpen={isEditModalOpen}
            onClose={() => { setIsEditModalOpen(false); setEditCar(null); }}
            carToEdit={editCar}
            isEdit={true}
            onCarEdited={() => { setIsEditModalOpen(false); setEditCar(null); fetchCars(); }}
          />
        )}
      </div>
    </div>
  );
};

export default CarListModal;
