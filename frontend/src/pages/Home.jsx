import React, { useEffect } from 'react';
import HeroBanner from '../components/home/heroBanner/HeroBanner.jsx';
import NewsHighlight from '../components/home/NewsHighLight/NewsHighLight.jsx';
import ServiceBanner from '../components/home/seccion_salud/ServiceBanner.jsx';
import ServiceBlocks from '../components/home/seccion_salud/enlaces_salud.jsx';
import Newsletter from '../components/home/newsLetter/NewsLetter.jsx';
import './Home.css';
import { Link } from 'react-router-dom';


const Home = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="home-page">
      <HeroBanner />
      <ServiceBanner />
      <ServiceBlocks />

      <Newsletter />
    </div>
  );
};

export default Home;