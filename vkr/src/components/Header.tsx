import React, { useState, useEffect } from 'react';
import AuthModal from './AuthModal';
import { useAuth } from '../firebase/AuthContext';
import { useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { currentUser, logout, isAdmin } = useAuth();
  const location = useLocation();
  
  // Убираю отслеживание прокрутки для изменения стиля хедера
  // useEffect(() => {
  //   const handleScroll = () => {
  //     setScrolled(window.scrollY > 50);
  //   };
  //   window.addEventListener('scroll', handleScroll);
  //   return () => window.removeEventListener('scroll', handleScroll);
  // }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  };
  
  return (
    <>
      <header 
        className="py-3 position-sticky top-0" 
        style={{ 
          background: 'linear-gradient(135deg, var(--primary-dark), var(--primary-light))',
          backdropFilter: 'none',
          boxShadow: '0 2px 15px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          zIndex: 1000
        }}
      >
        <div className="container">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <div 
                className="me-3 p-2 rounded-circle shadow-sm" 
                style={{
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease'
                }}
              >
                <i className="bi bi-car-front-fill fs-3 text-white"></i>
              </div>
              <div style={{ transition: 'all 0.3s ease' }}>
                <h1 className="m-0 fs-3 fw-bold" style={{ transition: 'all 0.3s ease' }}>
                  <span className="text-white" style={{ opacity: 0.95 }}>Авто</span>
                  <span style={{ color: 'var(--highlight)' }}>Бро</span>
                </h1>
                <div className="text-light opacity-75 small" style={{ transition: 'all 0.3s ease' }}>
                  Лучшие автомобили для вас
                </div>
              </div>
            </div>
            
            <div className="d-flex align-items-center">
              <nav className="me-3">
                <ul className="nav">
                  <li className="nav-item">
                    <a 
                      className="nav-link text-white px-3 py-2 position-relative" 
                      href="/"
                      style={{ 
                        transition: 'all 0.3s ease',
                        background: location.pathname === '/' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                        borderRadius: '8px'
                      }}
                      onMouseEnter={(e) => {
                        if (location.pathname !== '/') {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                          e.currentTarget.style.borderRadius = '8px';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (location.pathname !== '/') {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <i className="bi bi-house-door me-1"></i> Главная
                    </a>
                  </li>
                  <li className="nav-item">
                    <a 
                      className="nav-link text-white px-3 py-2 position-relative" 
                      href="/cars"
                      style={{ 
                        transition: 'all 0.3s ease',
                        background: location.pathname === '/cars' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                        borderRadius: '8px'
                      }}
                      onMouseEnter={(e) => {
                        if (location.pathname !== '/cars') {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                          e.currentTarget.style.borderRadius = '8px';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (location.pathname !== '/cars') {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <i className="bi bi-grid me-1"></i> Каталог
                    </a>
                  </li>
                  <li className="nav-item">
                    <a 
                      className="nav-link text-white px-3 py-2 position-relative" 
                      href="/about"
                      style={{ 
                        transition: 'all 0.3s ease',
                        background: location.pathname === '/about' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                        borderRadius: '8px'
                      }}
                      onMouseEnter={(e) => {
                        if (location.pathname !== '/about') {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                          e.currentTarget.style.borderRadius = '8px';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (location.pathname !== '/about') {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <i className="bi bi-info-circle me-1"></i> О нас
                    </a>
                  </li>
                  <li className="nav-item">
                    <a 
                      className="nav-link text-white px-3 py-2 position-relative d-flex align-items-center" 
                      href="/contact"
                      style={{ 
                        transition: 'all 0.3s ease',
                        background: location.pathname === '/contact' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                        borderRadius: '8px'
                      }}
                      onMouseEnter={(e) => {
                        if (location.pathname !== '/contact') {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                          e.currentTarget.style.borderRadius = '8px';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (location.pathname !== '/contact') {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <i className="bi bi-envelope me-1"></i> 
                      <span>Контакты</span>
                    </a>
                  </li>
                </ul>
              </nav>
              
              <div className="d-flex align-items-center">
                {currentUser ? (
                  <div className="dropdown">
                    <button 
                      className="btn rounded-pill px-3 py-2 d-flex align-items-center dropdown-toggle" 
                      type="button"
                      id="userDropdown"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      style={{ 
                        backgroundColor: 'var(--accent)', 
                        color: 'white',
                        boxShadow: '0 3px 8px rgba(53, 99, 233, 0.3)',
                        transition: 'all 0.3s ease',
                        border: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--accent-light)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 5px 12px rgba(53, 99, 233, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--accent)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 3px 8px rgba(53, 99, 233, 0.3)';
                      }}
                    >
                      <i className="bi bi-person-circle me-2"></i>
                      {isAdmin ? 'Админ' : 'Личный кабинет'}
                    </button>
                    <ul className="dropdown-menu" aria-labelledby="userDropdown">
                      <li>
                        <a className="dropdown-item" href={isAdmin ? "/admin" : "/profile"}>
                          <i className={`bi ${isAdmin ? 'bi-speedometer2' : 'bi-person'} me-2`}></i>
                          {isAdmin ? 'Панель администратора' : 'Профиль'}
                        </a>
                      </li>
                      {!isAdmin && (
                        <>
                          <li>
                            <a className="dropdown-item" href="/profile?tab=my-cars">
                              <i className="bi bi-car-front me-2"></i>
                              Мои машины
                            </a>
                          </li>
                          <li>
                            <a className="dropdown-item" href="/profile?tab=my-requests">
                              <i className="bi bi-list-check me-2"></i>
                              Мои заявки
                            </a>
                          </li>
                        </>
                      )}
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <button className="dropdown-item" onClick={handleLogout}>
                          <i className="bi bi-box-arrow-right me-2"></i>
                          Выйти
                        </button>
                      </li>
                    </ul>
                  </div>
                ) : (
                  <button 
                    className="btn rounded-pill px-3 py-2 d-flex align-items-center" 
                    style={{ 
                      backgroundColor: 'var(--accent)', 
                      color: 'white',
                      boxShadow: '0 3px 8px rgba(53, 99, 233, 0.3)',
                      transition: 'all 0.3s ease',
                      border: 'none'
                    }}
                    onClick={() => setShowAuthModal(true)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--accent-light)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 5px 12px rgba(53, 99, 233, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--accent)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 3px 8px rgba(53, 99, 233, 0.3)';
                    }}
                  >
                    <i className="bi bi-person-circle me-2"></i>
                    Войти
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
};

export default Header;
