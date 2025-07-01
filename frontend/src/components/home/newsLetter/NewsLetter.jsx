import React, { useState } from 'react';
import './NewsLetter.css';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí implementarías la lógica para suscribir al boletín
    console.log(`Suscribiendo: ${email}`);
    // Limpiar el campo después de enviar
    setEmail('');
    // Mostrar mensaje de éxito
    alert('¡Gracias por suscribirte a nuestro boletín informativo!');
  };
  
  return (
    <section className="newsletter">
      <div className="container">
        <div className="newsletter-content">
          <h2 className="newsletter-title">Boletín Informativo</h2>
          <p className="newsletter-subtitle">REVISA AQUÍ NUESTRA NUEVA EDICIÓN</p>
          
          <form className="newsletter-form" onSubmit={handleSubmit}>
            <input 
              type="email" 
              placeholder="Ingresa tu correo electrónico" 
              value={email}
              onChange={handleEmailChange}
              required
              className="newsletter-input"
            />
            <button type="submit" className="newsletter-button">
              Suscribirse
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;