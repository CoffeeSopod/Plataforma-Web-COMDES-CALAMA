// src/components/common/Header/TopBar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import SocialIcons from '../SocialIcons/SocialIcons';

const TopBar = () => {
  return (
    <div className="top-bar">
      <div className="container">
        <div className="logo-container">
          <Link to="/" className="logo-link">
            <img 
              src="/assets/images/logo_comdes_blanco.png" 
              alt="COMDES Calama Logo" 
              className="logo"
            />
          </Link>
          <span className="slogan">Juntos por Calama</span>
        </div>
        
        <div className="transparency-links">
          <Link to="/transparencia/ley" className="transparency-link">
            <span className="check-icon">✓</span>
            Ley de Transparencia
          </Link>
          <Link to="/transparencia/activa" className="transparency-link">
            <span className="check-icon">✓</span>
            Transparencia Activa
          </Link>
          <Link to="/memoria-anual" className="transparency-link">
            <span className="check-icon">✓</span>
            Memoria Anual Comdes
          </Link>
        </div>
        
        <SocialIcons />
      </div>
    </div>
  );
};

export default TopBar;