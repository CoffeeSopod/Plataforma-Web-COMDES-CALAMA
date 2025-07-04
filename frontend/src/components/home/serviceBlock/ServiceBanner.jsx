// src/components/home/ServiceBlocks/ServiceBanner.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './ServiceBanner.css';

const ServiceBanner = () => {
  return (
    <section id="centros" className="service-banner">
      <div className="container">
        <div className="farmacia-banner">
          <div className="farmacia-content">
            <h2 className="farmacia-title">
              <span className="title-cursive">Farmacia</span>
              <span className="title-block">CIUDADANA</span>
            </h2>
            <Link to="/servicios/farmacia" className="click-button">
              Click aquí
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceBanner;