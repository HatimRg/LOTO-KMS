import React from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../utils/constants';

function Footer() {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault();
    navigate('/about');
  };

  return (
    <div className="text-center py-4">
      <a
        href="/about"
        onClick={handleClick}
        className="inline-flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group cursor-pointer"
      >
        <img 
          src="/icon.jpg" 
          alt="Developer" 
          className="w-5 h-5 rounded-full object-cover group-hover:ring-2 group-hover:ring-blue-500 transition-all"
        />
        <span>Made by {APP_CONFIG.author}</span>
      </a>
    </div>
  );
}

export default Footer;
