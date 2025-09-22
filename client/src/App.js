import React, { useState } from 'react';
import './App.css';
import RegistrationForm from './components/RegistrationForm';
import AdminPage from './components/AdminPage';

function App() {
  const [currentPage, setCurrentPage] = useState('form');

  return (
    <div className="App">
      <nav className="navigation">
        <div className="nav-container">
          <div className="nav-brand">
            <img 
              src="https://www.hwpl.kr/wp-content/uploads/2024/02/ipyg.png" 
              alt="IPYG Logo" 
              className="nav-logo"
            />
            <h1 className="nav-title">INSIS Contact&Meeting Registration (G09)</h1>
          </div>
          <div className="nav-buttons">
            <button 
              className={`nav-btn ${currentPage === 'form' ? 'active' : ''}`}
              onClick={() => setCurrentPage('form')}
            >
              등록 폼 (Register)
            </button>
            <button 
              className={`nav-btn ${currentPage === 'admin' ? 'active' : ''}`}
              onClick={() => setCurrentPage('admin')}
            >
              관리 페이지 (History)
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {currentPage === 'form' ? <RegistrationForm /> : <AdminPage />}
      </main>
    </div>
  );
}

export default App;
