import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/common/header/Header.jsx';
import Footer from '../components/common/footer/Footer.jsx';
import './MainLayout.css';

const MainLayout = () => {
  return (
    <div className="site-container">
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
