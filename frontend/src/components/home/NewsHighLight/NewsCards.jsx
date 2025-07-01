import React from 'react';
import { Link } from 'react-router-dom';
import './NewsCard.css';

const NewsCard = ({ title, summary, image, url }) => {
  return (
    <div className="news-card">
      <div className="news-image">
        <img src={image} alt={title} />
        <div className="news-title-overlay">
          <h3 className="news-title">{title}</h3>
        </div>
      </div>
      <div className="news-content">
        <p className="news-summary">{summary}</p>
        <Link to={url} className="read-more-btn">
          LEER MÁS
        </Link>
      </div>
    </div>
  );
};

export default NewsCard;