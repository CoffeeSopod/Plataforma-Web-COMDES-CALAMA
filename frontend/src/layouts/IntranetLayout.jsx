// src/layouts/IntranetLayout.jsx
import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/common/header/Header.jsx';
import './IntranetLayout.css';

// ⬇️ chat (cliente)
import ChatProvider from '../chat/ChatProvider';
import ChatWidget from '../chat/ChatWidget';
import '../chat/chat.css';

function ScrollToHash() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace('#', '');
    let attempts = 0;

    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (attempts < 10) {
        attempts += 1;
        requestAnimationFrame(tryScroll);
      }
    };

    tryScroll();
  }, [location.pathname, location.hash]);

  return null;
}

const IntranetLayout = () => {
  return (
    <ChatProvider>
      <div className="site-container">
        <Header />
        <ScrollToHash />
        <main className="main-content">
          <Outlet />
        </main>

        {/* Botón flotante + panel del chat, visible en toda la intranet */}
        <ChatWidget />
      </div>
    </ChatProvider>
  );
};

export default IntranetLayout;
