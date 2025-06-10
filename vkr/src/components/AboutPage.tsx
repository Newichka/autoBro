import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div className="about-page py-5">
      <div className="container">
        <h1 className="text-center mb-5">О нас</h1>
        <div className="row mb-5">
          <div className="col-md-6">
            <h2 className="mb-3">Наша миссия</h2>
            <p className="lead">Мы стремимся сделать процесс покупки автомобиля максимально простым, прозрачным и безопасным для каждого клиента.</p>
            <p>Наша компания была основана с целью предоставить клиентам не только качественные автомобили, но и полное сопровождение на всех этапах сделки.</p>
          </div>
          <div className="col-md-6">
            <img src="https://cdn.pixabay.com/photo/2017/01/06/19/15/auto-1957037_1280.jpg" alt="О нас" className="img-fluid rounded shadow-lg" />
          </div>
        </div>
        <div className="row mb-5">
          <div className="col-12">
            <h2 className="text-center mb-4">Наша команда</h2>
            <div className="row g-4 justify-content-center">
              <div className="col-md-4">
                <div className="card border-0 shadow-sm text-center p-4">
                  <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="team1" className="rounded-circle mb-3" width={100} height={100} />
                  <h5 className="fw-bold">Иван Петров</h5>
                  <p className="text-muted">CEO</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 shadow-sm text-center p-4">
                  <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="team2" className="rounded-circle mb-3" width={100} height={100} />
                  <h5 className="fw-bold">Мария Кузнецова</h5>
                  <p className="text-muted">CTO</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 shadow-sm text-center p-4">
                  <img src="https://randomuser.me/api/portraits/men/65.jpg" alt="team3" className="rounded-circle mb-3" width={100} height={100} />
                  <h5 className="fw-bold">Алексей Смирнов</h5>
                  <p className="text-muted">COO</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <h2 className="text-center mb-4">Наши достижения</h2>
            <div className="row g-4 justify-content-center">
              <div className="col-md-4">
                <div className="card border-0 shadow-sm text-center p-4">
                  <i className="bi bi-trophy display-4 text-warning mb-3"></i>
                  <h5 className="fw-bold">Лучший сервис 2023</h5>
                  <p className="text-muted">Награда за высокое качество обслуживания клиентов.</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 shadow-sm text-center p-4">
                  <i className="bi bi-star display-4 text-warning mb-3"></i>
                  <h5 className="fw-bold">Топ-10 компаний</h5>
                  <p className="text-muted">Входим в десятку лучших компаний по продаже автомобилей.</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 shadow-sm text-center p-4">
                  <i className="bi bi-heart display-4 text-danger mb-3"></i>
                  <h5 className="fw-bold">Довольные клиенты</h5>
                  <p className="text-muted">Более 1000 довольных клиентов за последний год.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage; 