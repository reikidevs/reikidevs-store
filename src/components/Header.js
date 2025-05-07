import React, { useState } from 'react';
import '../styles/Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="header">
      <div className="container">
        <div className="logo">
          <h1>RikiDevs <span>Store</span></h1>
        </div>
        
        <div className="mobile-menu-button" onClick={toggleMenu}>
          <div className={`hamburger ${isMenuOpen ? 'active' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <nav className={`nav ${isMenuOpen ? 'active' : ''}`}>
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#products">Produk</a></li>
            <li><a href="#contact">Kontak</a></li>
          </ul>
        </nav>
        
        <div className="contact-button">
          <a href="https://wa.me/6281222489299" target="_blank" rel="noopener noreferrer" className="whatsapp-btn">
            <span className="whatsapp-icon">📱</span> Hubungi Kami
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
