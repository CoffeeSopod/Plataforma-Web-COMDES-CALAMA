// src/components/common/Header/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import TopBar from './TopBar';
import MainNav from './MainNav';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <TopBar />
      <MainNav />
    </header>
  );
};

export default Header;





