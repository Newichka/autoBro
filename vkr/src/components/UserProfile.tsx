import React from 'react';
import { useAuth } from '../firebase/AuthContext';

const UserProfile: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12 col-md-8 mx-auto">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Личный кабинет</h4>
            </div>
            <div className="card-body">
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                Это заглушка для личного кабинета пользователя. Здесь будет размещен персональный функционал.
              </div>
              
              <div className="text-center mb-4">
                <div className="avatar-placeholder bg-light rounded-circle mx-auto d-flex align-items-center justify-content-center" style={{ width: '120px', height: '120px' }}>
                  <i className="bi bi-person-circle text-primary" style={{ fontSize: '3rem' }}></i>
                </div>
                <h5 className="mt-3">{currentUser?.email}</h5>
                <span className="badge bg-success">Пользователь</span>
              </div>
              
              <h5 className="border-bottom pb-2">Персональная информация</h5>
              <div className="row mb-4">
                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted small">Email</label>
                  <div>{currentUser?.email}</div>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted small">Дата регистрации</label>
                  <div>25 апреля 2025</div>
                </div>
              </div>
              
              <h5 className="border-bottom pb-2">Действия</h5>
              <div className="row mt-3">
                <div className="col-md-6 mb-3">
                  <div className="d-grid">
                    <button className="btn btn-outline-primary">
                      <i className="bi bi-car-front me-2"></i>
                      Мои автомобили
                    </button>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="d-grid">
                    <button className="btn btn-outline-primary">
                      <i className="bi bi-star me-2"></i>
                      Избранное
                    </button>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="d-grid">
                    <button className="btn btn-outline-primary">
                      <i className="bi bi-clock-history me-2"></i>
                      История просмотров
                    </button>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="d-grid">
                    <button className="btn btn-outline-primary">
                      <i className="bi bi-gear me-2"></i>
                      Настройки профиля
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
