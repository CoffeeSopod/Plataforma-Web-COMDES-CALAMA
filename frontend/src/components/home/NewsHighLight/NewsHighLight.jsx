import React from 'react';
import NewsCard from './NewsCards.jsx';
import './NewsHighLight.css';

const newsData = [
  {
    id: 1,
    title: 'Comienza la vacunación contra la influenza',
    summary: 'El 1 de marzo dio inicio oficialmente la «Campaña de Vacunación Contra la Influenza» en Calama, con el objetivo de inmunizar a una gran parte de la población, sobre todo a los grupos más vulnerables.',
    image: '/assets/images/news/vacunacion.jpg',
    url: '/comdes-al-dia/vacunacion-influenza'
  },
  {
    id: 2,
    title: 'Calama enfrenta crisis sanitaria y ambiental',
    summary: 'En una medida urgente, el alcalde de Calama, Eliecer Chamorro Vargas, junto al concejo municipal, aprobó la declaración de emergencia sanitaria en la comuna.',
    image: '/assets/images/news/crisis-sanitaria.jpg',
    url: '/comdes-al-dia/crisis-sanitaria'
  },
  {
    id: 3,
    title: 'Cirugía menor: Atención rápida y accesible',
    summary: 'El centro de cirugía menor de COMDES ofrece atención rápida y accesible para procedimientos quirúrgicos de baja complejidad, reduciendo los tiempos de espera y mejorando la calidad de vida de los pacientes.',
    image: '/assets/images/news/cirugia-menor.jpg',
    url: '/comdes-al-dia/cirugia-menor'
  },
  {
    id: 4,
    title: 'Escuela de Verano: Una experiencia única',
    summary: 'La Escuela de Verano Comdes 2025, los niños y niñas tienen la oportunidad de fortalecer sus habilidades blandas y mejorar su estado físico a través de actividades diseñadas para fomentar el trabajo en equipo.',
    image: '/assets/images/news/escuela-verano.jpg',
    url: '/comdes-al-dia/escuela-verano'
  }
];

const NewsHighlight = () => {
  return (
    <section className="news-highlight" >
      <div className="container">
        <div className="section-header">
          <div className="title-container">
            <h2 className="section-title-primary">NOTICIAS</h2>
            <h2 className="section-title-secondary">DESTACADAS</h2>
          </div>
        </div>
        </div>
        <div>
        <div className="news-grid">
          {newsData.map(news => (
            <NewsCard 
              key={news.id}
              title={news.title}
              summary={news.summary}
              image={news.image}
              url={news.url}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewsHighlight;