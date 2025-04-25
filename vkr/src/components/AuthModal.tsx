import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

const AuthModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  
  return (
    <div className="modal-backdrop" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content" style={{ width: '100%', maxWidth: '400px' }}>
        {isLogin ? (
          <Login 
            onClose={onClose} 
            switchToRegister={() => setIsLogin(false)} 
          />
        ) : (
          <Register 
            onClose={onClose} 
            switchToLogin={() => setIsLogin(true)} 
          />
        )}
      </div>
    </div>
  );
};

export default AuthModal;
