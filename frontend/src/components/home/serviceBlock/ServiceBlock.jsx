import React from 'react';
import { Link } from 'react-router-dom';
import './ServiceBlock.css';

const serviceData = [
  {
    id: 'cesfam',
    title: 'CESFAM',
    color: '#F93B5F',
    url: '/servicios/cesfam'
  },
  {
    id: 'cecosf',
    title: 'CECOSF',
    color: '#9933CC',
    url: '/servicios/cecosf'
  },
  {
    id: 'sapu',
    title: 'SAPU / SAR',
    color: '#00B3B3',
    url: '/servicios/sapu-sar'
  },
  {
    id: 'transversales',
    title: 'SERVICIOS TRANSVERSALES',
    color: '#FF9900',
    url: '/servicios/transversales'
  }
];

const ServiceBlocks = () => {
  return (
    <section className="service-blocks">
      <div className="container">
        <div className="blocks-container">
          {serviceData.map(service => (
            <Link 
              key={service.id}
              to={service.url}
              className="service-block"
              style={{ backgroundColor: service.color }}
            >
              <h3 className="block-title">{service.title}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceBlocks;