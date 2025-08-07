import React, { useState } from 'react';
import RegistrationForm from './components/RegistrationForm';
import AdminPage from './components/AdminPage';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('form'); // 'form' or 'admin'

  return (
    <div className="App">
      <nav className="navigation">
        <button 
          className={`nav-btn ${currentPage === 'form' ? 'active' : ''}`}
          onClick={() => setCurrentPage('form')}
        >
          등록 폼 (Registration Form)
        </button>
        <button 
          className={`nav-btn ${currentPage === 'admin' ? 'active' : ''}`}
          onClick={() => setCurrentPage('admin')}
        >
          관리 페이지 (Admin Page)
        </button>
      </nav>

      <div className="page-content">
        {currentPage === 'form' ? <RegistrationForm /> : <AdminPage />}
      </div>
    </div>
  );
}

export default App;
