// src/components/common/Header/MainNav.jsx
import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

const MainNav = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Implementar lógica de búsqueda
    console.log(`Buscando: ${searchQuery}`);
  };

  return (
    <nav className="main-nav">
      <div className="container">
        <ul className="nav-links">
          <li className="nav-item">
            <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
              Inicio
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/quienes-somos" className={({ isActive }) => isActive ? 'active' : ''}>
              Quienes Somos
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/comdes-al-dia" className={({ isActive }) => isActive ? 'active' : ''}>
              Comdes al Día
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/intranet" className={({ isActive }) => isActive ? 'active' : ''}>
              Intranet
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/servicios" className={({ isActive }) => isActive ? 'active' : ''}>
              Servicios
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/contacto" className={({ isActive }) => isActive ? 'active' : ''}>
              Contacto
            </NavLink>
          </li>
        </ul>
        
        <div className="nav-right">
          <div className="phone-number">
            <span className="phone-icon">📞</span>
            <span className="phone">4242</span>
          </div>
          
          <form className="search-form" onSubmit={handleSearchSubmit}>
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input"
            />
            <button type="submit" className="search-button">
              <span className="search-icon">🔍</span>
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
};

export default MainNav;