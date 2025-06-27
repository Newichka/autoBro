import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Header from './components/Header';
import MainContainer from './components/MainContainer';
import AdminPanel from './components/AdminPanel';
import UserProfile from './components/UserProfile';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './firebase/AuthContext';
import HomePage from './components/HomePage';
import AboutPage from './components/AboutPage';
import ContactPage from './components/ContactPage';
import PersonalDataAgreement from './components/PersonalDataAgreement';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div>
          <Header />
          <div className='container'>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/cars" element={<MainContainer />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />
            <Route path="/personal-data-agreement" element={<PersonalDataAgreement />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </div>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
