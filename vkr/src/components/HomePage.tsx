import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="homepage-container py-5">
      {/* Hero Section */}
      <div className="container mb-5">
        <div className="row align-items-center">
          <div className="col-md-6 mb-4 mb-md-0">
            <h1 className="display-4 fw-bold mb-3">Добро пожаловать в <span style={{color: 'var(--accent)'}}>AutoBro</span>!</h1>
            <p className="lead mb-4">Платформа для подбора, покупки и бронирования автомобилей с гарантией качества и прозрачными условиями.</p>
            <button className="btn btn-primary btn-lg px-4" onClick={() => navigate('/cars')}>
              Перейти в каталог
              <i className="bi bi-arrow-right ms-2"></i>
            </button>
          </div>
          <div className="col-md-6 text-center">
            <img src="https://cdn.pixabay.com/photo/2017/01/06/19/15/auto-1957037_1280.jpg" alt="АвтоБро" className="img-fluid rounded shadow-lg homepage-hero-img" style={{maxHeight: 340}} />
          </div>
        </div>
      </div>

      {/* Advantages Section */}
      <div className="container mb-5">
        <h2 className="text-center mb-4">Почему выбирают нас?</h2>
        <div className="row g-4 justify-content-center">
          <div className="col-12 col-md-4">
            <div className="card h-100 shadow-sm border-0 text-center p-4">
              <i className="bi bi-shield-check display-5 text-primary mb-3"></i>
              <h5 className="fw-bold mb-2">Гарантия и проверка</h5>
              <p className="text-muted">Только проверенные автомобили с прозрачной историей и юридической чистотой.</p>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card h-100 shadow-sm border-0 text-center p-4">
              <i className="bi bi-cash-coin display-5 text-success mb-3"></i>
              <h5 className="fw-bold mb-2">Выгодные цены</h5>
              <p className="text-muted">Лучшие предложения на рынке, гибкие условия оплаты и бронирования.</p>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card h-100 shadow-sm border-0 text-center p-4">
              <i className="bi bi-people display-5 text-info mb-3"></i>
              <h5 className="fw-bold mb-2">Поддержка 24/7</h5>
              <p className="text-muted">Консультации, помощь с выбором и сопровождение на всех этапах сделки.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="container mb-5">
        <h2 className="text-center mb-4">Отзывы клиентов</h2>
        <div className="row g-4 justify-content-center">
          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm p-3 h-100">
              <div className="d-flex align-items-center mb-2">
                <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="user1" className="rounded-circle me-3" width={48} height={48} />
                <div>
                  <div className="fw-bold">Иван Петров</div>
                  <div className="text-muted small">Москва</div>
                </div>
              </div>
              <div className="fst-italic">"Быстро подобрали отличный автомобиль, всё прозрачно и честно. Рекомендую!"</div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm p-3 h-100">
              <div className="d-flex align-items-center mb-2">
                <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="user2" className="rounded-circle me-3" width={48} height={48} />
                <div>
                  <div className="fw-bold">Мария Кузнецова</div>
                  <div className="text-muted small">Санкт-Петербург</div>
                </div>
              </div>
              <div className="fst-italic">"Очень довольна сервисом! Помогли с оформлением и доставкой авто."</div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm p-3 h-100">
              <div className="d-flex align-items-center mb-2">
                <img src="https://randomuser.me/api/portraits/men/65.jpg" alt="user3" className="rounded-circle me-3" width={48} height={48} />
                <div>
                  <div className="fw-bold">Алексей Смирнов</div>
                  <div className="text-muted small">Казань</div>
                </div>
              </div>
              <div className="fst-italic">"Понравился подход и поддержка на всех этапах. Спасибо AutoBro!"</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contacts Section */}
      <div className="container mb-5">
        <h2 className="text-center mb-4">Связаться с нами</h2>
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card border-0 shadow-sm p-4 text-center">
              <div className="mb-2"><i className="bi bi-envelope-at fs-3 text-primary"></i></div>
              <div className="mb-2">Почта: <a href="mailto:support@autobro.ru">support@autobro.ru</a></div>
              <div className="mb-2">Телефон: <a href="tel:+78005553535">8 800 555-35-35</a></div>
              <div>Адрес: г. Москва, ул. Примерная, д. 1</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 