// src/components/common/SocialIcons/SocialIcons.jsx
import React from 'react';
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';
import './SocialIcons.css';

const SocialIcons = () => {
  const socialLinks = [
    { id: 'facebook', url: 'https://facebook.com/comdes.calama', icon: <FaFacebookF /> },
    { id: 'instagram', url: 'https://instagram.com/comdes.calama', icon: <FaInstagram /> },
    { id: 'twitter', url: 'https://twitter.com/comdes_calama', icon: <FaTwitter /> },
    { id: 'youtube', url: 'https://youtube.com/comdes.calama', icon: <FaYoutube /> }
  ];
  
  return (
    <div className="social-icons">
      {socialLinks.map(social => (
        <a 
          key={social.id} 
          href={social.url} 
          className={`social-icon ${social.id}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Síguenos en ${social.id}`}
        >
          {social.icon}
        </a>
      ))}
    </div>
  );
};

export default SocialIcons;