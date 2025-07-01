// src/components/home/HeroBanner/HeroBanner.jsx
import React, { useState, useEffect } from 'react';
import './HeroBanner.css';

const bannerData = [
  {
    id: 1,
    title: 'COMIENZA LA VACUNACIÓN',
    subtitle: 'contra la influenza en Calama',
    description: 'El 1 de marzo dio inicio oficialmente la «Campaña de Vacunación Contra la Influenza» en Calama, con el objetivo de inmunizar a una gran parte de la población, sobre todo a los grupos más vulnerables.',
    image: '/assets/images/banners/vacunacion.jpg',
  },
  {
    id: 2,
    title: 'CALAMA ENFRENTA CRISIS',
    subtitle: 'Sanitaria y ambiental',
    description: 'En una medida urgente, el alcalde de Calama, Eliecer Chamorro Vargas, junto al concejo municipal, aprobó la declaración de emergencia sanitaria en la comuna.',
    image: '/assets/images/banners/emergencia-sanitaria.jpg',
  },
  {
    id: 3,
    title: 'CIRUGIA MENOR',
    subtitle: 'Atención rapida y accecible',
    description: 'El centro de cirugía menor de COMDES ofrece atención rápida y accesible para procedimientos quirúrgicos de baja complejidad, reduciendo los tiempos de espera y mejorando la calidad de vida de los pacientes.',
    image: '/assets/images/banners/cirugia-menor.jpg',
  },
  {
    id: 4,
    title: 'ESCUELA DE VERANO',
    subtitle: 'Una experiencia unica',
    description: 'La Escuela de Verano Comdes 2025, los niños y niñas tienen la oportunidad de fortalecer sus habilidades blandas y mejorar su estado físico a través de actividades diseñadas para fomentar el trabajo en equipo.',
    image: '/assets/images/banners/escuela-verano.jpg',
  },
  // Agrega más banners aquí
];

const HeroBanner = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Cambio automático de banners
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => 
        current === bannerData.length - 1 ? 0 : current + 1
      );
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleIndicatorClick = (index) => {
    setActiveIndex(index);
  };
  
  return (
    <section className="hero-banner">
      <div 
        className="banner-content" 
        style={{ backgroundImage: `url(${bannerData[activeIndex].image})` }}
      >
        <div className="banner-overlay"></div>
        <div className="container">
          <div className="banner-text">
            <h1>
              <span className="banner-highlight">{bannerData[activeIndex].title}</span> 
              {bannerData[activeIndex].subtitle}
            </h1>
            <p>{bannerData[activeIndex].description}</p>
          </div>
        </div>
      </div>
      
      <div className="banner-indicators">
        {bannerData.map((banner, index) => (
          <button 
            key={banner.id}
            className={`indicator ${index === activeIndex ? 'active' : ''}`}
            onClick={() => handleIndicatorClick(index)}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroBanner;


