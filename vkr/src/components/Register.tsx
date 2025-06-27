import React, { useState } from 'react';
import { useAuth } from '../firebase/AuthContext';

interface RegisterProps {
  onClose: () => void;
  switchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onClose, switchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);
  
  const { register } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      setError('Пожалуйста, заполните все поля');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    
    if (password.length < 6) {
      setError('Пароль должен содержать не менее 6 символов');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await register(email, password, 'user');
      onClose();
    } catch (err: any) {
      setError('Ошибка регистрации: ' + (err.message || 'Неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="card shadow border-0">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">Регистрация</h5>
      </div>
      <div className="card-body p-4">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Пароль</label>
            <input
              type="password"
              className="form-control"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label">Подтверждение пароля</label>
            <input
              type="password"
              className="form-control"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-3 form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="agreePersonalData"
              checked={agree}
              onChange={() => setAgree(!agree)}
              required
            />
            <label className="form-check-label" htmlFor="agreePersonalData">
              Я соглашаюсь с <a href="/personal-data-agreement" target="_blank" rel="noopener noreferrer">условиями обработки персональных данных</a>
            </label>
          </div>
          
          <div className="d-grid gap-2">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || !agree}
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </div>
        </form>
        
        <div className="mt-3 text-center">
          <p className="mb-0">
            Уже есть аккаунт?{' '}
            <button 
              className="btn btn-link p-0" 
              onClick={switchToLogin}
            >
              Войти
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
