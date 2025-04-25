import React, { useState } from 'react';
import { useAuth } from '../firebase/AuthContext';

interface LoginProps {
  onClose: () => void;
  switchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onClose, switchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      onClose();
    } catch (err: any) {
      setError('Ошибка входа: ' + (err.message || 'Неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="card shadow border-0">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">Вход в систему</h5>
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
          
          <div className="d-grid gap-2">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </div>
        </form>
        
        <div className="mt-3 text-center">
          <p className="mb-0">
            Нет аккаунта?{' '}
            <button 
              className="btn btn-link p-0" 
              onClick={switchToRegister}
            >
              Зарегистрироваться
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
