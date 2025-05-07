import React from 'react';
import '../styles/Hero.css';

const Hero = () => {
  return (
    <section className="hero" id="home">
      <div className="container">
        <div className="hero-grid">
          <div className="hero-content">
            <h1>BIKIN SEMUANYA <span className="highlight">SATSET</span></h1>
            <p className="hero-subtitle">Aman - Mudah - Tepercaya</p>
            <p className="hero-desc">
              Temukan berbagai produk digital berkualitas di RikiDevs Store. Kami menyediakan aplikasi premium seperti Zoom, Spotify, Netflix dan lainnya dengan harga terjangkau!
            </p>
            <div className="hero-buttons">
              <button className="cta-button primary">Lihat Produk</button>
              <button className="cta-button secondary">Hubungi Kami</button>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">1000+</span>
                <span className="stat-label">Pengguna</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">12+</span>
                <span className="stat-label">Produk</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">24/7</span>
                <span className="stat-label">Support</span>
              </div>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-image-container">
              <div className="blob-shape"></div>
              <div className="app-mockup">
                <div className="mockup-content">
                  <div className="app-icon">RS</div>
                  <div className="app-text">
                    <div className="app-title">RikiDevs Store</div>
                    <div className="app-subtitle">Digital Premium Apps</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
