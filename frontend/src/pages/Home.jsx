import React, { useEffect } from 'react';
import HeroBanner from '../components/home/heroBanner/HeroBanner.jsx';
import NewsHighlight from '../components/home/NewsHighLight/NewsHighLight.jsx';
import ServiceBanner from '../components/home/serviceBlock/ServiceBanner.jsx';
import ServiceBlocks from '../components/home/serviceBlock/ServiceBlock.jsx';
import Newsletter from '../components/home/newsLetter/NewsLetter.jsx';
import './Home.css';

const Home = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="home-page">
      <HeroBanner />
      <NewsHighlight />
      <ServiceBanner />
      <ServiceBlocks />
      <Newsletter />
    </div>
  );
};

export default Home;