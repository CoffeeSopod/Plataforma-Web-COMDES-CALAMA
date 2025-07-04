import React from 'react';
import { Link } from 'react-router-dom';
import SocialIcons from '../SocialIcons/SocialIcons.jsx';
import './Footer.css';

const Footer = () => {
  const contactDepartments = [
    { id: 'direccion', name: 'DIRECCIÓN EJECUTIVA', phone: "+55 2 711 806" },
    { id: 'salud', name: 'DEPARTAMENTO DE SALUD', phone: "+55 2 540 418" },
    { id: 'rrhh', name: 'RECURSOS HUMANOS', phone: "+55 2 711 802" },
    { id: 'planificacion', name: 'PLANIFICACIÓN', phone: "+55 2 711 864" },
    { id: 'administracion', name: 'ADMINISTRACIÓN', phone: "+55 2 711 881" },
    { id: 'finanzas', name: 'FINANZAS', phone: "+55 2 711 831" },
    { id: 'juridica', name: 'ASESORÍA JURÍDICA', phone: "+55 2 711 816" },
    { id: 'control', name: 'CONTROL INTERNO', phone: "+55 2 711 854" }
  ];

  return (
    <footer id="contactos" className="footer">
      <div className="footer-main">
        <div className="container">

          <div className="footer-content">

            <div className="footer-image">
              <img src="/assets/images/about/banderas.png" alt="Banderas" />
            </div>

            <div className="footer-info">

              <div className="footer-units-title">
                NUESTRAS UNIDADES
              </div>
              
              <div className="footer-contact">
                <h3 className="contact-title">Contáctanos</h3>
                <ul className="contact-list">
                  {contactDepartments.map(dept => (
                    <li key={dept.id} className="contact-item">
                      <Link to={`/contacto/${dept.id}`} className="contact-link">
                        <span className='contact-name'>{dept.name}</span>
                        <span className='contact-phone'>{dept.phone}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className='footer-links'>
                <div className="footer-social">

                  <div className="follow-text">Síguenos en</div>

                  <div className="social-icons"><SocialIcons/></div>
                    
                  <div className="logo-footer">
                    <img src="/assets/images/logo_comdes_blanco.png" alt="COMDES Calama"/>
                  </div>
                  
                </div>

              </div>
              


            </div>

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