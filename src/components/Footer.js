import React from 'react';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer" id="contact">
      <div className="footer-top">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section about">
              <h3>RikiDevs <span>Store</span></h3>
              <p>Menjual Produk Digital 100% Terpercaya. Jual beli aplikasi premium seperti Zoom, Spotify, Netflix dan lainnya dengan harga terjangkau dan garansi penuh.</p>
            </div>
            
            <div className="footer-section links">
              <h3>Navigasi</h3>
              <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#products">Produk</a></li>
                <li><a href="#contact">Kontak</a></li>
              </ul>
            </div>
            
            <div className="footer-section contact-us">
              <h3>Hubungi Kami</h3>
              <div className="contact-info">
                <div className="contact-item">
                  <span className="contact-icon">📱</span>
                  <a href="tel:+6281222489299">+62 81222489299</a>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">✉️</span>
                  <span>info@rikidevs.com</span>
                </div>
                <div className="whatsapp-cta">
                  <a 
                    href="https://wa.me/6281222489299" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="whatsapp-button"
                  >
                    Chat WhatsApp Sekarang
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} RikiDevs Store. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
