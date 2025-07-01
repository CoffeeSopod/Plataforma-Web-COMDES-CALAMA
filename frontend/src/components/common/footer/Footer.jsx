import React from 'react';
import { Link } from 'react-router-dom';
import SocialIcons from '../SocialIcons/SocialIcons.jsx';
import './Footer.css';

const Footer = () => {
  const contactDepartments = [
    { id: 'direccion', name: 'DIRECCIÓN EJECUTIVA' },
    { id: 'salud', name: 'DEPARTAMENTO DE SALUD' },
    { id: 'rrhh', name: 'RECURSOS HUMANOS' },
    { id: 'planificacion', name: 'PLANIFICACIÓN' },
    { id: 'administracion', name: 'ADMINISTRACIÓN' },
    { id: 'finanzas', name: 'FINANZAS' },
    { id: 'juridica', name: 'ASESORÍA JURÍDICA' },
    { id: 'control', name: 'CONTROL INTERNO' }
  ];

  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="container">
          <div className="footer-content">
            <div className="footer-image">
              <img src="/assets/images/footer-flags.jpg" alt="Banderas" />
            </div>
            
            <div className="footer-contact">
              <h3 className="contact-title">Contáctanos</h3>
              <ul className="contact-list">
                {contactDepartments.map(dept => (
                  <li key={dept.id} className="contact-item">
                    <Link to={`/contacto/${dept.id}`} className="contact-link">
                      {dept.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="footer-social">
            <div className="follow-text">
              Síguenos en
              <img 
                src="/assets/images/logo.png" 
                alt="COMDES Calama" 
                className="logo-footer"
              />
            </div>
            <SocialIcons />
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="container">
          <p className="copyright">
            CORPORACIÓN MUNICIPAL DE DESARROLLO SOCIAL CALAMA 2025
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;