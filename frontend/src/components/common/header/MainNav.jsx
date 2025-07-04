// src/components/common/Header/MainNav.jsx
import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

const MainNav = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Implementar lógica de búsqueda
    console.log(`Buscando: ${searchQuery}`);
  };

  const enlaces = [
    { nombre: "Ley del Lobby",      url: "https://www.leylobby.gob.cl/instituciones/CM018"      },
    { nombre: "Autoconsulta",       url: "http://ac.comdescalama.cl:8009/autoconsulta/"     },
    { nombre: "Temponet",           url: "http://tempo.comdescalama.cl/TempoNet/Account/Login/"         },
    { nombre: "Convenios",          url: "https://www.comdescalama.cl/convenios-comdes/"         },
    { nombre: "Compras públicas",   url: "https://www.mercadopublico.cl/Portal/Modules/Site/Busquedas/ResultadoBusqueda.aspx?qs=1&IdEmpresa=nR/LAf|fFJ8="    }
  ];



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
            <NavLink to="/quienes-somos" className={({ isActive }) => isActive ? 'active' : ''}>
              Intranet
            </NavLink>
          </li>
          <li className="nav-item">
            <a href="#centros" className="nav-link">
              Centros
            </a>
          </li>
          <li className="nav-item">
            <a href="#contactos" className="nav-link">
              Contactos
            </a>
          </li>

        </ul>
        
        <div className="nav-right">

          <div className="enlaces-dropdown">
            <div className="phone-number" onClick={() => setIsOpen(!isOpen)}>
              <span className="enlace-title">Servicios administrativos</span>
              <span className="dropdown-arrow">{isOpen ? "▲" : "▼"}</span>
            </div>
            {isOpen && (
              <ul className="dropdown-menu">
                {enlaces.map((item, index) => (
                  <li key={index}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dropdown-link"
                    >
                      {item.nombre}
                    </a>
                  </li>
                ))}
              </ul>
            )}
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