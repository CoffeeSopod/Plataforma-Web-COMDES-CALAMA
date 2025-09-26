// src/layouts/MainLayout.jsx
import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/common/header/Header.jsx';
import Footer from '../components/common/footer/Footer.jsx';
import './MainLayout.css';

function ScrollToHash() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace('#', '');
    let attempts = 0;

    // Reintenta unas cuantas veces por si el contenido tarda en montar
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (attempts < 10) {
        attempts += 1;
        requestAnimationFrame(tryScroll);
      }
    };

    // navegas al path y luego haces scroll al ancla
    tryScroll();
  }, [location.pathname, location.hash]);

  return null;
}

const MainLayout = () => {
  return (
    <div className="site-container">
      <Header />
      <ScrollToHash /> 
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
