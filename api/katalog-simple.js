const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Logic utama scraping
    const targetUrl = 'https://rizstore.my.id/new/katalog';
    
    // Fetch HTML with appropriate headers
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 15000
    });
    
    // Parse HTML with Cheerio
    const html = response.data;
    const $ = cheerio.load(html, {
      normalizeWhitespace: true,
      decodeEntities: true
    });
    
    // Array to store products
    const products = [];
    
    // Find all product elements
    const productElements = $('.product-wrapper, .card, .item, article, [class*="product"], [class*="item"], [class*="card"], div:has(h3, h4, h5)');
    
    productElements.each((index, element) => {
      try {
        const card = $(element);
        
        // Find title/name
        const titleSelectors = 'h2, h3, h4, h5, .product-title, .title, .name, .product-name, strong:first-child, div[class*="title"]';
        const titleElement = card.find(titleSelectors).first();
        
        if (!titleElement.length) return;
        
        const fullTitle = titleElement.text().trim();
        if (!fullTitle) return;
        
        // Extract name and period
        let name = fullTitle;
        let period = "";
        
        // Separate period from name
        const titleParts = fullTitle.split(/\\s+/);
        for (let wordCount of [2, 3]) {
          if (titleParts.length > wordCount) {
            const possiblePeriod = titleParts.slice(-wordCount).join(' ');
            if (possiblePeriod.match(/(\\d+)\\s*(BULAN|HARI|HARIAN|TAHUN|MINGGU)/i)) {
              name = titleParts.slice(0, -wordCount).join(' ').trim();
              period = possiblePeriod.trim();
              break;
            }
          }
        }
        
        // Clean up name
        name = name.replace(/\\(.*\\)/g, '').trim();
        
        // Find price
        let price = 0;
        const priceSelectors = '.price, .product-price, .item-price, [class*="price"], p:contains("Rp"), span:contains("Rp"), strong:contains("Rp")';
        const priceElements = card.find(priceSelectors);
        
        if (priceElements.length) {
          for (let i = 0; i < priceElements.length; i++) {
            const priceText = $(priceElements[i]).text().trim();
            const priceMatches = priceText.match(/(?:Rp|IDR)\\s*([\\d.,]+)/i);
            
            if (priceMatches) {
              const cleanPrice = priceMatches[1].replace(/\\./g, '').replace(/,/g, '.');
              price = parseFloat(cleanPrice);
              if (price > 0) break;
            }
          }
        }
        
        // Extract stock info
        let stock = 'Tersedia';
        const stockElements = card.find('.stock, .inventory, .availability, [class*="stock"], span:contains("stok"), p:contains("stok")');
        
        if (stockElements.length) {
          const stockText = stockElements.text().toLowerCase();
          if (stockText.includes('habis') || stockText.includes('kosong') || stockText.includes('sold out')) {
            stock = 'Habis';
          } else {
            const stockMatch = stockText.match(/(?:stok|stock)\\s*:?\\s*(\\d+)/i);
            if (stockMatch && stockMatch[1]) {
              stock = `Stok: ${stockMatch[1]}`;
            }
          }
        }
        
        // Extract packages
        const packages = [];
        if (period) packages.push(period);
        
        card.find('option, li, .package, .variant, select option').each((_, packageEl) => {
          const packageText = $(packageEl).text().trim();
          if (packageText && packageText.match(/\\d+\\s*(BULAN|HARI|HARIAN|TAHUN|MINGGU)/i)) {
            if (!packages.includes(packageText)) {
              packages.push(packageText);
            }
          }
        });
        
        // Ensure we have at least one package
        if (packages.length === 0) {
          packages.push('Premium');
        }
        
        // Find image
        let imageUrl = '';
        const imageElement = card.find('img');
        if (imageElement.length) {
          imageUrl = imageElement.attr('src') || imageElement.attr('data-src') || '';
          
          // Fix relative URLs
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = imageUrl.startsWith('/') 
              ? `https://rizstore.my.id${imageUrl}` 
              : `https://rizstore.my.id/${imageUrl}`;
          }
        }
        
        // Add product to array
        products.push({
          id: index + 1,
          name: name.toUpperCase(),
          period: period || packages[0] || 'Premium',
          price: price,
          stock: stock,
          packages: packages,
          image: imageUrl || `${name.toLowerCase().replace(/\\s+/g, '-')}.png`
        });
      } catch (err) {
        console.error(`Error processing product: ${err.message}`);
      }
    });
    
    // Jika tidak ada produk yang ditemukan, gunakan fallback
    const finalProducts = products.length > 0 ? products : getFallbackProducts();
    
    // Return products as JSON with timestamp
    return res.status(200).json({ 
      success: true, 
      products: finalProducts,
      source: 'fresh_data',
      timestamp: Date.now(),
      fetchedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching catalog:', error);
    
    // Jika terjadi error, gunakan fallback statis
    return res.status(200).json({ 
      success: true, 
      error: error.message, 
      products: getFallbackProducts(),
      source: 'fallback_data',
      timestamp: Date.now()
    });
  }
};

// Fallback products if scraping fails
function getFallbackProducts() {
  return [
    {
      id: 1,
      name: "NETFLIX",
      period: "1 BULAN",
      price: 42000,
      stock: "Tersedia",
      packages: ["1 BULAN", "3 BULAN", "6 BULAN"],
      image: "netflix.png",
    },
    {
      id: 2,
      name: "GSUITE",
      period: "3 HARIAN",
      price: 15000,
      stock: "Stok: 10",
      packages: ["3 HARIAN", "1 BULAN", "1 TAHUN"],
      image: "gsuite.png",
    },
    {
      id: 3,
      name: "CHATGPT",
      period: "1 BULAN",
      price: 45000,
      stock: "Tersedia",
      packages: ["1 BULAN", "3 BULAN"],
      image: "chatgpt.png",
    },
    {
      id: 4,
      name: "YOUTUBE PREMIUM",
      period: "1 BULAN",
      price: 30000,
      stock: "Tersedia",
      packages: ["1 BULAN", "6 BULAN", "1 TAHUN"],
      image: "youtube.png",
    },
    {
      id: 5,
      name: "CAPCUT PRO",
      period: "Premium",
      price: 50000,
      stock: "Tersedia",
      packages: ["Premium", "1 BULAN", "3 BULAN"],
      image: "capcut.png",
    },
    {
      id: 6,
      name: "ZOOM PRO",
      period: "Premium",
      price: 50000,
      stock: "Tersedia",
      packages: ["Premium", "1 BULAN", "1 TAHUN"],
      image: "zoom.png",
    },
    {
      id: 7,
      name: "DRAMABOX",
      period: "Premium",
      price: 30000,
      stock: "Habis",
      packages: ["Premium"],
      image: "dramabox.png",
    },
    {
      id: 8,
      name: "SPOTIFY",
      period: "Premium",
      price: 8000,
      stock: "Stok: 5",
      packages: ["Premium", "1 BULAN", "3 BULAN"],
      image: "spotify.png",
    },
    {
      id: 9,
      name: "CANVA PREMIUM",
      period: "Premium",
      price: 50000,
      stock: "Tersedia",
      packages: ["Premium", "1 BULAN", "1 TAHUN"],
      image: "canva.png",
    },
    {
      id: 10,
      name: "TINDER PREMIUM",
      period: "Premium",
      price: 35000,
      stock: "Tersedia",
      packages: ["Premium", "1 BULAN", "6 BULAN"],
      image: "tinder.png",
    },
    {
      id: 11,
      name: "APPLE MUSIKIN",
      period: "Premium",
      price: 15000,
      stock: "Tersedia",
      packages: ["Premium", "1 BULAN", "3 BULAN"],
      image: "apple-music.png",
    },
    {
      id: 12,
      name: "RCTI+",
      period: "1 BULAN",
      price: 11000,
      stock: "Stok: 15",
      packages: ["1 BULAN", "3 BULAN", "6 BULAN"],
      image: "rcti.png",
    },
  ];
}
