import React, { useState } from 'react';
import '../styles/ProductCard.css';

// Function to get product image URL based on product name
const getProductImage = (productName) => {
  // Clean product name and convert to uppercase for matching
  const name = productName.toUpperCase().trim();
  
  // Direct logo mapping for products - verified high quality sources
  const directLogoUrls = {
    // VERIFIED LOGOS EXPLICITLY REQUESTED BY USER
    'GSUITE': 'https://www.colorado.edu/sites/default/files/styles/large_image_style/public/2024-05/RSR-gsuite-logo.jpeg?itok=qkh8SVd3',
    'G SUITE': 'https://logodownload.org/wp-content/uploads/2020/04/google-workspace-logo.png',
    'G-SUITE': 'https://logodownload.org/wp-content/uploads/2020/04/google-workspace-logo.png',
    'CAPCUT PRO': 'https://i.pcmag.com/imagery/reviews/00e02Ss3KiOLKE7Ivb8SQ0P-1.fit_lim.size_1200x630.v1632757092.png',
    'CAPCUT': 'https://seeklogo.com/images/C/capcut-logo-A3C08EF4D1-seeklogo.com.png',
    'ZOOM PRO': 'https://infocanvas.upenn.edu/wp-content/uploads/2024/08/Zoom-Logo.png',
    'ZOOM': 'https://logodownload.org/wp-content/uploads/2020/04/zoom-logo-6.png',
    'DRAMABOX': 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/64/ee/54/64ee549a-ef30-e6a0-0cfd-208be6e9840f/AppIcon-0-0-1x_U007ephone-0-1-0-0-85-220.png/1200x600wa.png',
    'SPOTIFY': 'https://logohistory.net/wp-content/uploads/2023/07/Spotify-Logo.png',
    'SPOTIFY PREMIUM': 'https://logohistory.net/wp-content/uploads/2023/07/Spotify-Logo.png',
    'TINDER PREMIUM': 'https://logodownload.org/wp-content/uploads/2020/09/tinder-logo-1.png',
    'TINDER': 'https://logodownload.org/wp-content/uploads/2020/09/tinder-logo-1.png',
    'CANVA': 'https://static.canva.com/static/images/canva-logo-blue.png',
    'CANVA PREMIUM': 'https://static.canva.com/static/images/canva-logo-blue.png',
    'RCTI+': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Logo_Rctiplus.svg/1200px-Logo_Rctiplus.svg.png',
    'RCTI': 'https://upload.wikimedia.org/wikipedia/id/thumb/d/dd/RCTI_logo_2015.svg/1200px-RCTI_logo_2015.svg.png',
    
    // Streaming Services
    'NETFLIX': 'https://1000logos.net/wp-content/uploads/2017/05/Netflix-Logo-2006.png',
    'DISNEY+': 'https://1000logos.net/wp-content/uploads/2021/04/Disney-logo.png',
    'DISNEY PLUS': 'https://1000logos.net/wp-content/uploads/2021/04/Disney-logo.png',
    'YOUTUBE PREMIUM': 'https://1000logos.net/wp-content/uploads/2021/04/YouTube-logo.png',
    'YOUTUBE': 'https://1000logos.net/wp-content/uploads/2021/04/YouTube-logo.png',
    'APPLE MUSIC': 'https://1000logos.net/wp-content/uploads/2016/10/Apple-Logo.png',
    'ITUNES': 'https://1000logos.net/wp-content/uploads/2016/10/Apple-Logo.png',
    'APPLE MUSIKIN': 'https://1000logos.net/wp-content/uploads/2016/10/Apple-Logo.png',
    'HBO MAX': 'https://1000logos.net/wp-content/uploads/2021/02/HBO-Max-logo.png',
    'HBO': 'https://1000logos.net/wp-content/uploads/2021/02/HBO-Max-logo.png',
    
    // Communication & Office
    'MICROSOFT': 'https://1000logos.net/wp-content/uploads/2017/04/Microsoft-logo.png',
    'OFFICE': 'https://1000logos.net/wp-content/uploads/2020/08/Office-365-logo.png',
    'MICROSOFT OFFICE': 'https://1000logos.net/wp-content/uploads/2020/08/Office-365-logo.png',
    'OFFICE 365': 'https://1000logos.net/wp-content/uploads/2020/08/Office-365-logo.png',
    'GMAIL': 'https://1000logos.net/wp-content/uploads/2021/05/Gmail-logo.png',
    
    // AI Tools
    'CHATGPT': 'https://1000logos.net/wp-content/uploads/2023/02/ChatGPT-Logo.png',
    'OPENAI': 'https://1000logos.net/wp-content/uploads/2023/02/ChatGPT-Logo.png',
    'PHOTOSHOP': 'https://1000logos.net/wp-content/uploads/2020/03/Photoshop-logo.png',
    'ADOBE': 'https://1000logos.net/wp-content/uploads/2016/09/Adobe-logo.png',
    
    // Others
    'GRAMMARLY': 'https://1000logos.net/wp-content/uploads/2022/02/Grammarly-Logo.png',
    'VPN': 'https://1000logos.net/wp-content/uploads/2022/11/NordVPN-Logo.png',
    'NORDVPN': 'https://1000logos.net/wp-content/uploads/2022/11/NordVPN-Logo.png',
    'WINDOWS': 'https://1000logos.net/wp-content/uploads/2017/04/Windows-Logo.png'
  };
  
  // Try to find an exact match in our direct logo mapping
  if (directLogoUrls[name]) {
    return directLogoUrls[name];
  }
  
  // Try to find a partial match by checking if any key in our mapping is contained in the product name
  for (const [key, url] of Object.entries(directLogoUrls)) {
    if (name.includes(key)) {
      return url;
    }
  }
  
  // If no match found, use a reliable Clearbit logo API that can find logos for almost any company
  const encoded = encodeURIComponent(productName.trim());
  return `https://logo.clearbit.com/${encoded.toLowerCase().replace(/\s+/g, '')}.com?size=128`;
};

const ProductCard = ({ product }) => {
  const [selectedOption, setSelectedOption] = useState(product.period || (product.packages && product.packages.length > 0 ? product.packages[0] : 'Premium'));
  
  // Format the price with commas
  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };
  
  // Generate WhatsApp message URL with product details
  const generateWhatsAppUrl = () => {
    const message = `Halo, saya ingin membeli ${product.name} dengan opsi ${selectedOption} seharga Rp ${formatPrice(product.price)}. Mohon informasi lebih lanjut. Terima kasih.`;
    return `https://wa.me/6281222489299?text=${encodeURIComponent(message)}`;
  };
  
  // Use the real packages data from the product
  const getPeriodOptions = () => {
    // If product has packages array, use those options
    if (product.packages && product.packages.length > 0) {
      return product.packages;
    }
    
    // If product has a period but no packages, use it as the only option
    if (product.period) {
      return [product.period];
    }
    
    // Fallback for products without any period or packages
    return ['Premium'];
  };
  
  // Check if product is out of stock
  const isOutOfStock = () => {
    return product.stock === 'Habis' || 
           product.stock?.toLowerCase().includes('habis') || 
           product.stock?.toLowerCase().includes('kosong') || 
           product.stock?.toLowerCase().includes('sold out');
  };

  return (
    <div className={`product-card ${isOutOfStock() ? 'out-of-stock' : ''}`}>
      <div className="card-content">
        <div className="product-badge">{selectedOption}</div>
        
        {isOutOfStock() && (
          <div className="stock-badge out-of-stock">Stok Habis</div>
        )}
        
        {!isOutOfStock() && product.stock && product.stock !== 'Tersedia' && (
          <div className="stock-badge">{product.stock}</div>
        )}
        
        <div className="product-image">
          <img 
            src={getProductImage(product.name)}
            alt={product.name} 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/150?text=No+Image';
            }}
          />
        </div>
        
        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>
          <p className="product-price">Rp {formatPrice(product.price)}</p>
          
          <div className="product-options">
            <label htmlFor={`period-${product.id}`}>Pilih Paket:</label>
            <select 
              id={`period-${product.id}`} 
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="period-select"
              disabled={isOutOfStock()}
            >
              {getPeriodOptions().map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          
          <div className="product-features">
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Garansi 100%</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Support 24/7</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card-actions">
        {isOutOfStock() ? (
          <button 
            className="buy-button disabled"
            disabled
          >
            Stok Habis
          </button>
        ) : (
          <a 
            href={generateWhatsAppUrl()} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="buy-button primary"
          >
            Beli Sekarang
          </a>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
