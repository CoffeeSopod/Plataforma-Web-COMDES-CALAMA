// src/components/common/Header/TopBar.jsx
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretUp } from '@fortawesome/free-solid-svg-icons';

const TopBar = () => {
  const handleCloseDropdown = (e) => {
    const li = e.currentTarget.closest('.has-dropdown');
    if (!li) return;

    // Quita el focus para terminar :focus-within
    const btn = li.querySelector('.dropdown-trigger');
    if (btn) btn.blur();

    // Fuerza el cierre aunque el mouse siga encima (clase temporal)
    li.classList.add('closing');
    setTimeout(() => li.classList.remove('closing'), 200);
  };

  // Dropdown: Nosotros
  const linksNosotros = [
    { tipo: 'route', label: 'Quiénes Somos', to: '/quienes-somos' },
    { tipo: 'ext',   label: 'Transparencia Activa', href: 'https://www.portaltransparencia.cl/PortalPdT/directorio-de-organismos-regulados/?org=CM018' },
    { tipo: 'ext',   label: 'Compras Públicas', href: 'https://www.mercadopublico.cl/Portal/Modules/Site/Search/AcquisitionSearchPage.aspx?TP=Invitado&IdEmpresa=nR/LAf|fFJ8=' },
    { tipo: 'ext',   label: 'Convenios', href: 'https://www.comdescalama.cl/convenios-comdes/' },
  ];

  // Dropdown: Servicios administrativos
  const linksServicios = [
    { label: 'Ley del Lobby', href: 'https://www.leylobby.gob.cl/instituciones/CM018' },
    { label: 'Autoconsulta',  href: 'http://ac.comdescalama.cl:8009/autoconsulta/' },
    { label: 'Temponet',      href: 'http://tempo.comdescalama.cl/TempoNet/Account/Login/' },
  ];

  return (
    <div className="top-bar">
      <div className="topbar-container">
        {/* IZQUIERDA: Logo */}
        <div className="tb-left">
          <Link to="/#" className="logo-link" aria-label="Ir a inicio">
            <img
              src="/assets/images/logo_comdes_blanco.png"
              alt="COMDES Calama"
              className="logo"
            />
          </Link>
        </div>

        {/* CENTRO: Navegación */}
        <nav className="tb-center" aria-label="Navegación principal">
          <ul className="nav-links">

            {/* Enlaces a secciones de la página de inicio */}
            <li className="nav-item">
              <Link to="/#centros" className="nav-link">Salud</Link>
            </li>

            <li className="nav-item">
              <Link to="/#noticias" className="nav-link">Noticias</Link>
            </li>

            {/* Dropdown: Nosotros (hover/focus-within en CSS) */}
            <li className="nav-item has-dropdown">
              <button
                type="button"
                className="dropdown-trigger"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <span className="enlace-title">Nosotros</span>
                <FontAwesomeIcon icon={faCaretUp} className="caret" />
              </button>

              <ul className="dropdown-menu" role="menu">
                {linksNosotros.map((item, idx) => (
                  <li key={`nos-${idx}`} role="none">
                    {item.tipo === 'route' ? (
                      <NavLink
                        to={item.to}
                        className="dropdown-link"
                        role="menuitem"
                        onClick={handleCloseDropdown}
                      >
                        {item.label}
                      </NavLink>
                    ) : (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dropdown-link"
                        role="menuitem"
                        onClick={handleCloseDropdown}
                      >
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </li>

            <li className="nav-item">
              <Link to="/#contactos" className="nav-link">Contactos</Link>
            </li>

            {/* Dropdown: Servicios administrativos */}
            <li className="nav-item has-dropdown">
              <button
                type="button"
                className="dropdown-trigger"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <span className="enlace-title">Servicios administrativos</span>
                <FontAwesomeIcon icon={faCaretUp} className="caret" />
              </button>

              <ul className="dropdown-menu" role="menu">
                {linksServicios.map((item, idx) => (
                  <li key={`srv-${idx}`} role="none">
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dropdown-link"
                      role="menuitem"
                      onClick={handleCloseDropdown}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </nav>

        {/* DERECHA: CTA Intranet */}
        <div className="tb-right">
          <NavLink to="/login" className="btn-intranet">
            Acceso Intranet
          </NavLink>
        </div>
      </div>

      {/* Barras de color */}
      <div className="topbar-stripes" aria-hidden="true" role="presentation">
        <span className="stripe stripe-purple"></span>
        <span className="stripe stripe-blue"></span>
        <span className="stripe stripe-green"></span>
        <span className="stripe stripe-white"></span>
        <span className="stripe stripe-yellow"></span>
        <span className="stripe stripe-orange"></span>
        <span className="stripe stripe-red"></span>
      </div>
    </div>
  );
};

export default TopBar;
