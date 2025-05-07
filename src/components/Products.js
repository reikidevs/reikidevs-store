import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import axios from 'axios';
import '../styles/Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Determine API endpoint based on environment
        // In production (Vercel), use relative path to serverless function
        // In development, use the scraper directly if needed
        let productData;
        
        if (process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost') {
          // Use serverless API endpoint in production or preview environments
          const response = await axios.get('/api/katalog');
          productData = response.data.products;
          console.log('Fetched products from serverless function');
        } else {
          // For local development, you can either:
          // 1. Use local proxy server
          try {
            const response = await axios.get('/api/katalog');
            productData = response.data.products;
            console.log('Fetched products from local API');
          } catch (localError) {
            // Fallback to importing the scraper directly for development
            console.log('Falling back to direct scraper for development');
            const { scrapeProducts } = await import('../utils/scraper');
            productData = await scrapeProducts();
          }
        }
        
        setProducts(productData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <section className="products-section" id="products">
      <div className="container">
        <h2 className="section-title">Our Premium Products</h2>
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading products...</p>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Products;
