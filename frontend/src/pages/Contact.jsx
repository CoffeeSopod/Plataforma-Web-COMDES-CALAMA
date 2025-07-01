import React, { useState, useEffect } from 'react';
import './Contact.css';

const Contact = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Estado para el formulario
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    subject: '',
    message: ''
  });

  // Estado para mensajes de validación/éxito
  const [formStatus, setFormStatus] = useState({
    submitted: false,
    error: false,
    message: ''
  });

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.name || !formData.email || !formData.message) {
      setFormStatus({
        submitted: true,
        error: true,
        message: 'Por favor completa todos los campos obligatorios.'
      });
      return;
    }
    
    // Aquí iría la lógica para enviar el formulario a un servidor
    // Por ahora, solo simulamos una respuesta exitosa
    
    console.log('Formulario enviado:', formData);
    
    // Mostrar mensaje de éxito
    setFormStatus({
      submitted: true,
      error: false,
      message: '¡Gracias por contactarnos! Te responderemos a la brevedad.'
    });
    
    // Limpiar el formulario
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: '',
      subject: '',
      message: ''
    });
    
    // Opcionalmente, limpiar el mensaje después de un tiempo
    setTimeout(() => {
      setFormStatus({
        submitted: false,
        error: false,
        message: ''
      });
    }, 5000);
  };

  return (
    <div className="contact-page">
      <div className="page-banner">
        <div className="container">
          <h1 className="page-title">Contacto</h1>
        </div>
      </div>

      <section className="contact-section">
        <div className="container">
          <div className="contact-content">
            <div className="contact-info">
              <h2>Información de Contacto</h2>
              
              <div className="info-item">
                <div className="icon">📍</div>
                <div className="info-text">
                  <h3>Dirección</h3>
                  <p>Av. Granaderos #2060, Calama, Antofagasta, Chile</p>
                </div>
              </div>
              
              <div className="info-item">
                <div className="icon">📞</div>
                <div className="info-text">
                  <h3>Teléfono</h3>
                  <p>+56 55 242 4242</p>
                </div>
              </div>
              
              <div className="info-item">
                <div className="icon">✉️</div>
                <div className="info-text">
                  <h3>Email</h3>
                  <p>contacto@comdes-calama.cl</p>
                </div>
              </div>
              
              <div className="info-item">
                <div className="icon">🕙</div>
                <div className="info-text">
                  <h3>Horario de Atención</h3>
                  <p>Lunes a Viernes: 8:30 - 14:00 y 15:00 - 17:30</p>
                </div>
              </div>
              
              <div className="map-container">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3624.1295462748957!2d-68.9!3d-22.45!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x96ac0a2e0ede5aa7%3A0x7cd3a11b6f09a33d!2sCalama%2C%20Antofagasta%2C%20Chile!5e0!3m2!1ses!2scl!4v1651123456789!5m2!1ses!2scl" 
                  width="100%" 
                  height="300" 
                  style={{ border: 0 }} 
                  allowFullScreen="" 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ubicación COMDES Calama"
                ></iframe>
              </div>
            </div>
            
            <div className="contact-form-container">
              <h2>Envíanos un Mensaje</h2>
              
              {formStatus.submitted && (
                <div className={`form-message ${formStatus.error ? 'error' : 'success'}`}>
                  {formStatus.message}
                </div>
              )}
              
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Nombre Completo *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Teléfono</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="department">Departamento</label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                  >
                    <option value="">Seleccione un departamento</option>
                    <option value="direccion">Dirección Ejecutiva</option>
                    <option value="salud">Departamento de Salud</option>
                    <option value="rrhh">Recursos Humanos</option>
                    <option value="planificacion">Planificación</option>
                    <option value="administracion">Administración</option>
                    <option value="finanzas">Finanzas</option>
                    <option value="juridica">Asesoría Jurídica</option>
                    <option value="control">Control Interno</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="subject">Asunto</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="message">Mensaje *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="5"
                  ></textarea>
                </div>
                
                <div className="form-submit">
                  <button type="submit" className="submit-button">Enviar Mensaje</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;