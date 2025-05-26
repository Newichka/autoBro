import React, { useState } from 'react';
import { useAuth } from '../firebase/AuthContext';
import AddCarModal from './AddCarModal';
import CarListModal from './CarListModal';

const AdminPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const [isAddCarModalOpen, setIsAddCarModalOpen] = useState(false);
  const [isCarListModalOpen, setIsCarListModalOpen] = useState(false);
  const [lastAddedCar, setLastAddedCar] = useState<any>(null);
  const [lastDeletedNotice, setLastDeletedNotice] = useState<string | null>(null);

  const handleAddCarClick = () => {
    setIsAddCarModalOpen(true);
  };

  const handleManageCarsClick = () => {
    setIsCarListModalOpen(true);
  };

  const handleCarAdded = (car: any) => {
    setLastAddedCar(car);
    // Здесь можно добавить логику обновления списка автомобилей
    console.log('Автомобиль успешно добавлен:', car);
  };

  const handleCarDeleted = () => {
    setLastDeletedNotice("Автомобиль успешно удален");
    // Скрываем уведомление через 5 секунд
    setTimeout(() => {
      setLastDeletedNotice(null);
    }, 5000);
  };

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Панель администратора</h4>
            </div>
            <div className="card-body">
              {lastAddedCar && (
                <div className="alert alert-success mb-4">
                  <i className="bi bi-check-circle me-2"></i>
                  Автомобиль успешно добавлен: {lastAddedCar.make} {lastAddedCar.model} ({lastAddedCar.year})
                </div>
              )}
              
              {lastDeletedNotice && (
                <div className="alert alert-success mb-4">
                  <i className="bi bi-check-circle me-2"></i>
                  {lastDeletedNotice}
                </div>
              )}
              
              <h5 className="mt-4">Информация о пользователе</h5>
              <p>Email: {currentUser?.email}</p>
              <p>Роль: Администратор</p>
              
              <h5 className="mt-4">Доступные функции</h5>
              <div className="list-group">
                <button className="list-group-item list-group-item-action d-flex align-items-center">
                  <i className="bi bi-people me-3 fs-5"></i>
                  <div>
                    <strong>Управление пользователями</strong>
                    <div className="small text-muted">Добавление, редактирование и удаление пользователей</div>
                  </div>
                </button>
                <button 
                  className="list-group-item list-group-item-action d-flex align-items-center"
                  onClick={handleManageCarsClick}
                >
                  <i className="bi bi-car-front me-3 fs-5"></i>
                  <div>
                    <strong>Управление автомобилями</strong>
                    <div className="small text-muted">Добавление, редактирование и удаление автомобилей в каталоге</div>
                  </div>
                </button>
                <button className="list-group-item list-group-item-action d-flex align-items-center">
                  <i className="bi bi-graph-up me-3 fs-5"></i>
                  <div>
                    <strong>Статистика и отчеты</strong>
                    <div className="small text-muted">Просмотр статистики использования системы</div>
                  </div>
                </button>
                <button className="list-group-item list-group-item-action d-flex align-items-center">
                  <i className="bi bi-gear me-3 fs-5"></i>
                  <div>
                    <strong>Настройки системы</strong>
                    <div className="small text-muted">Управление глобальными настройками приложения</div>
                  </div>
                </button>
              </div>

              <div className="mt-4 d-flex gap-2">
                <button 
                  className="btn btn-primary" 
                  onClick={handleAddCarClick}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Добавить автомобиль
                </button>
                <button 
                  className="btn btn-outline-primary" 
                  onClick={handleManageCarsClick}
                >
                  <i className="bi bi-list me-2"></i>
                  Управление автомобилями
                </button>
              </div>
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
    </div>
  );
};

export default AdminPanel;
