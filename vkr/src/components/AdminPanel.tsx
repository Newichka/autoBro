import React from 'react';
import { useAuth } from '../firebase/AuthContext';

const AdminPanel: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Панель администратора</h4>
            </div>
            <div className="card-body">
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                Это заглушка для панели администратора. Здесь будет размещен функционал управления системой.
              </div>
              
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
                <button className="list-group-item list-group-item-action d-flex align-items-center">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
