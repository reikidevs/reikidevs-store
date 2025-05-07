import axios from 'axios';
import { load } from 'cheerio';

/**
 * Main function to scrape product data from rizstore.my.id
 * Handles multiple proxy fallbacks, error logging, and data validation
 * @returns {Promise<Array>} Array of product objects with normalized data
 */
export const scrapeProducts = async () => {
  try {
    console.log('Mulai mengambil data dari rizstore.my.id/new/katalog...');
    
    // Definisi URL target dan URLs proxy alternatif
    const targetUrl = 'https://rizstore.my.id/new/katalog';
    const proxyUrls = [
      'https://corsproxy.io/?',
      'https://api.allorigins.win/raw?url=',
      'https://cors.eu.org/',
      'https://thingproxy.freeboard.io/fetch/',
      'https://cors-anywhere.herokuapp.com/'
    ];
    
    // Fungsi untuk mencoba menggunakan proxy secara berurutan jika terjadi kegagalan
    const fetchWithFallback = async (index = 0) => {
      if (index >= proxyUrls.length) {
        throw new Error('Semua proxy gagal mengambil data');
      }
      
      try {
        console.log(`Mencoba proxy ${index + 1}/${proxyUrls.length}...`);
        
        // Konfigurasi request dengan timeout dan headers yang tepat
        const config = {
          timeout: 15000, // 15 detik timeout
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        };
        
        // Menggunakan proxy yang berbeda untuk setiap percobaan
        const response = await axios.get(`${proxyUrls[index]}${encodeURIComponent(targetUrl)}`, config);
        
        // Validasi data HTML yang diterima
        const html = response.data;
        if (!html || typeof html !== 'string' || html.length < 1000) {
          throw new Error('Data HTML tidak valid atau terlalu kecil');
        }
        
        console.log(`Berhasil mengambil data dengan proxy ${index + 1}`);
        return html;
      } catch (error) {
        console.warn(`Proxy ${index + 1} gagal:`, error.message);
        // Coba proxy berikutnya
        return fetchWithFallback(index + 1);
      }
    };
    
    // Mencoba mengambil data HTML dengan fallback proxies
    const html = await fetchWithFallback();
    console.log('Berhasil mendapatkan HTML, memulai parsing...');
    
    // Load HTML dengan Cheerio untuk parsing
    const $ = load(html, {
      normalizeWhitespace: true,
      decodeEntities: true
    });
    
    const products = [];
    
    // Temukan semua item produk dengan pendekatan yang lebih spesifik
    console.log('Mencari elemen-elemen produk...');
    
    // Pendeteksian otomatis struktur halaman
    const possibleProductContainers = [
      // Kelas umum untuk wrapper produk
      '.product-wrapper', '.product-card', '.product-item', '.product', '.card', '.item', '.catalog-item',
      // Tag umum yang digunakan untuk daftar produk
      'article', '.col-md-4', '.col-sm-6', '.col-lg-3', '.product-grid', '.product-list',
      // Kombinasi atribut yang umum untuk produk
      '[class*="product"]', '[class*="item"]', '[class*="card"]',
      // Fallback ke elemen div yang memiliki child tertentu
      'div:has(h3, h4, h5)', 'div:has(.price)', 'div:has(img)'
    ];
    
    // Gabungkan semua selector menjadi satu string untuk optimasi performa
    const productSelector = possibleProductContainers.join(', ');
    const productElements = $(productSelector);
    
    console.log(`Ditemukan ${productElements.length} kemungkinan produk, memulai ekstraksi data...`);
    
    // Jika tidak menemukan elemen produk dengan selector di atas
    if (productElements.length === 0) {
      console.warn('Tidak menemukan elemen produk dengan selector umum, mencoba pendekatan alternatif...');
      // Coba cari elemen yang kemungkinan berisi daftar produk
      const alternativeElements = $('div').filter(function() {
        const text = $(this).text();
        return text.includes('Rp') && 
               (text.toLowerCase().includes('bulan') || 
                text.toLowerCase().includes('hari') || 
                text.toLowerCase().includes('tahun'));
      });
      
      // Gunakan elemen-elemen alternatif jika ditemukan
      if (alternativeElements.length > 0) {
        console.log(`Ditemukan ${alternativeElements.length} elemen alternatif yang mungkin produk`);
        productElements.push(...alternativeElements.get());
      }
    }
    
    productElements.each((index, cardElement) => {
      try {
        const card = $(cardElement);
        
        // 1. EKSTRAKSI JUDUL/NAMA PRODUK - dengan berbagai variasi selector
        const titleSelectors = [
          'h2, h3, h4, h5', // Heading elements
          '.product-title, .title, .name, .product-name', // Class-based selectors
          'strong:first-child', // First strong tag
          'b:first-child', // First bold tag
          'div[class*="title"], div[class*="name"]', // Div with title/name in class
          'span[class*="title"], span[class*="name"]' // Span with title/name in class
        ];
        
        // Gabungkan semua selector judul
        const titleElement = card.find(titleSelectors.join(', ')).first();
        
        // Skip jika tidak ada judul yang valid
        if (!titleElement.length) {
          console.log(`Produk #${index+1}: Tidak ditemukan judul, skip`);
          return; 
        }
        
        const fullTitle = titleElement.text().trim();
        if (!fullTitle) {
          console.log(`Produk #${index+1}: Judul kosong, skip`);
          return;
        }
        
        // 2. PEMISAHAN NAMA PRODUK DAN PERIODE
        let name = fullTitle;
        let period = "";
        
        // Pattern untuk mendeteksi periode dengan berbagai format
        const periodPatterns = [
          /(\d+)\s*(BULAN|HARI|HARIAN|TAHUN|MINGGU)/i,  // 1 BULAN, 3 BULAN, 1 TAHUN
          /(HARIAN|MINGGUAN|BULANAN)/i,                 // HARIAN, BULANAN
          /(PREMIUM|BASIC|PRO|STANDAR)/i                // PREMIUM, PRO
        ];
        
        // Memisahkan nama dan periode dengan pendeteksian cerdas
        const titleParts = fullTitle.split(/\s+/);
        
        // Coba deteksi perioda pada 2 kata terakhir, lalu 3 kata terakhir jika gagal
        for (let wordCount of [2, 3]) {
          if (titleParts.length > wordCount) {
            const possiblePeriod = titleParts.slice(-wordCount).join(' ');
            
            // Cek dengan semua pola periode
            for (const pattern of periodPatterns) {
              if (possiblePeriod.match(pattern)) {
                name = titleParts.slice(0, -wordCount).join(' ').trim();
                period = possiblePeriod.trim();
                break;
              }
            }
            
            // Keluar jika berhasil menemukan periode
            if (period) break;
          }
        }
        
        // Bersihkan nama produk dari karakter-karakter tidak perlu
        name = name.replace(/\(.*\)/g, '').trim();
        
        // 3. EKSTRAKSI HARGA dengan berbagai format
        let price = 0;
        const priceSelectors = [
          '.price, .product-price, .item-price, [class*="price"]', // Class-based selectors
          'p:contains("Rp"), span:contains("Rp"), div:contains("Rp")', // Elements containing Rp
          'p:contains("IDR"), span:contains("IDR"), div:contains("IDR")', // Elements containing IDR
          'p:contains("₨"), span:contains("₨"), div:contains("₨")', // Elements containing Rupee sign
          'strong:contains("Rp"), b:contains("Rp")' // Bold/strong elements with price
        ];
        
        // Gabungkan semua selector harga
        const priceElements = card.find(priceSelectors.join(', '));
        
        if (priceElements.length) {
          // Cek semua elemen harga yang ditemukan
          for (let i = 0; i < priceElements.length; i++) {
            const priceText = $(priceElements[i]).text().trim();
            
            // Pattern untuk mendeteksi format harga yang berbeda-beda
            const pricePatterns = [
              /(?:Rp|IDR|₨)\s*([\d.,]+)/i,  // Rp 100.000, IDR 100.000
              /(\d[\d.,]*)\s*(?:ribu|rb|k)/i, // 100 ribu, 100rb, 100k
              /(\d[\d.,]*)/                  // Plain numbers as last resort
            ];
            
            // Coba semua pattern sampai ditemukan
            for (const pattern of pricePatterns) {
              const priceMatch = priceText.match(pattern);
              if (priceMatch) {
                // Bersihkan harga - hilangkan pemisah ribuan dan gunakan titik sebagai desimal
                let cleanPrice = priceMatch[1].replace(/\./g, '').replace(/,/g, '.');
                
                // Kalikan dengan 1000 jika ada kata ribu/rb/k
                if (priceText.match(/ribu|rb|k/i)) {
                  price = parseFloat(cleanPrice) * 1000;
                } else {
                  price = parseFloat(cleanPrice);
                }
                
                // Validasi harga
                if (isNaN(price)) {
                  price = 0;
                } else if (price > 0) {
                  // Jika berhasil mendapatkan harga, hentikan loop
                  break;
                }
              }
            }
            
            // Keluar dari loop jika sudah dapat harga yang valid
            if (price > 0) break;
          }
        }
      
      // 4. EKSTRAKSI INFORMASI STOK dengan metode komprehensif
      let stock = 'Tersedia';
      
      // Method 1: Elemen khusus stok dengan class/id terkait stok
      const stockElement = card.find('.stock, .inventory, .availability, .quantity, [class*="stock"], [class*="inventory"], [id*="stock"], [id*="inventory"]');
      
      // Method 2: Cari teks yang mengandung kata kunci stok
      const stockTextElements = card.find('p, span, div, li, strong, b').filter(function() {
        const text = $(this).text().toLowerCase();
        return text.includes('stok') || 
               text.includes('stock') || 
               text.includes('persediaan') || 
               text.includes('tersedia') || 
               text.includes('habis') || 
               text.includes('kosong') || 
               text.includes('sold') || 
               text.includes('out') || 
               text.includes('available') || 
               text.includes('sisa');
      });
      
      // Method 3: Badge/label/tag yang mungkin menunjukkan status stok
      const badgeElements = card.find('.badge, .tag, .label, .status, .pill, [class*="badge"], [class*="tag"], [class*="label"], [class*="status"]');
      
      // Gabungkan semua elemen yang ditemukan
      const allPossibleStockElements = [].concat(
        stockElement.get(), 
        stockTextElements.get(),
        badgeElements.get()
      );
      
      if (allPossibleStockElements.length > 0) {
        console.log(`Produk '${name}': Ditemukan ${allPossibleStockElements.length} kemungkinan elemen stok`);
        
        // Analisis setiap elemen untuk menentukan stok
        for (const element of allPossibleStockElements) {
          const stockText = $(element).text().trim().toLowerCase();
          
          // Pattern untuk mendeteksi stok habis dengan berbagai variasi kata
          const outOfStockPatterns = [
            /(?:habis|kosong|sold out|tidak tersedia|out of stock|empty|unavailable)/i,
            /stok\s*(?:habis|kosong)/i,
            /(?:0|nol)\s*(?:stok|stock|item)/i
          ];
          
          // Cek jika stok habis
          for (const pattern of outOfStockPatterns) {
            if (stockText.match(pattern)) {
              stock = 'Habis';
              console.log(`Produk '${name}': Terdeteksi stok habis dari teks '${stockText}'`);
              break;
            }
          }
          
          // Jika sudah terdeteksi habis, tidak perlu cek pattern lain
          if (stock === 'Habis') break;
          
          // Pattern untuk mendeteksi jumlah stok dengan berbagai format
          const stockPatterns = [
            // Format "Stok: 10" atau "Stock: 10"
            /(?:stok|stock|persediaan|qty|quantity|tersedia)\s*:?\s*(\d+)/i,
            // Format "10 items left" atau "tersisa 10"
            /(\d+)\s*(?:items?|left|remaining|tersisa)/i,
            // Format "Ada 10 stok"
            /(?:ada|sisa)\s*(\d+)\s*(?:stok|stock|item)/i,
            // Angka mentah yang mungkin menunjukkan stok
            /^\s*(\d+)\s*$/
          ];
          
          // Cek dengan semua pattern untuk ekstraksi angka stok
          for (const pattern of stockPatterns) {
            const match = stockText.match(pattern);
            if (match && match[1]) {
              const stockNum = parseInt(match[1]);
              
              // Validasi angka stok (hindari angka yang terlalu besar atau 0)
              if (!isNaN(stockNum) && stockNum > 0 && stockNum < 10000) {
                stock = `Stok: ${stockNum}`;
                console.log(`Produk '${name}': Terdeteksi stok ${stockNum} dari teks '${stockText}'`);
                break;
              }
            }
          }
          
          // Jika berhasil mendapatkan informasi stok spesifik, hentikan pencarian
          if (stock !== 'Tersedia') break;
        }
      }
      
      // Method 4: Analisis teks lengkap kartu produk jika belum mendapatkan info stok
      if (stock === 'Tersedia') {
        const fullCardText = card.text().toLowerCase();
        
        // Cek indikator stok habis dalam teks lengkap
        if (fullCardText.match(/(habis|kosong|sold out|tidak tersedia|out of stock)/i)) {
          stock = 'Habis';
          console.log(`Produk '${name}': Terdeteksi stok habis dari teks lengkap kartu`);
        } else {
          // Ekstraksi jumlah stok dari teks lengkap
          const stockMatch = fullCardText.match(/(?:stok|stock|persediaan)\s*:?\s*(\d+)/i);
          if (stockMatch && stockMatch[1]) {
            const stockNum = parseInt(stockMatch[1]);
            if (!isNaN(stockNum) && stockNum > 0 && stockNum < 10000) {
              stock = `Stok: ${stockNum}`;
              console.log(`Produk '${name}': Terdeteksi stok ${stockNum} dari teks lengkap kartu`);
            }
          }
        }
      }
      
      // 5. EKSTRAKSI PAKET/PILIHAN PRODUK dengan lebih lengkap
      const packages = [];
      
      // Jika telah menemukan periode utama, tambahkan sebagai paket pertama
      if (period) {
        packages.push(period);
      }
      
      // Cari elemen yang mungkin berisi informasi paket
      const packageSelectors = [
        'option',                          // Dropdown options
        'li',                             // List items
        '.package, .variant, .plan',      // Classes for packages/variants
        'select option',                  // Select dropdown options
        'input[type="radio"] + label',    // Radio button labels
        'div[class*="option"], span[class*="option"]'  // Divs/spans with option in class name
      ];
      
      // Cari semua elemen paket yang mungkin
      card.find(packageSelectors.join(', ')).each((_, packageEl) => {
        const packageText = $(packageEl).text().trim();
        
        // Pattern untuk mendeteksi paket yang valid
        const packagePatterns = [
          // Periode dengan angka (1 BULAN, 3 HARI)
          /\d+\s*(BULAN|HARI|HARIAN|TAHUN|MINGGU|MONTH|DAY|YEAR|WEEK)/i,
          // Tingkat paket (PREMIUM, PRO, BASIC)
          /^\s*(PREMIUM|PRO|BASIC|STANDARD|REGULER)\s*$/i,
          // Kombinasi tingkat dan periode
          /(PREMIUM|PRO|BASIC)\s+\d+\s*(BULAN|HARI)/i
        ];
        
        // Cek teks dengan semua pattern
        for (const pattern of packagePatterns) {
          if (packageText && packageText.match(pattern)) {
            const normalizedPackage = packageText.replace(/\s+/g, ' ').trim();
            
            // Tambahkan hanya jika belum ada di array paket
            if (!packages.includes(normalizedPackage) && 
                // Hindari teks yang terlalu panjang atau terlalu pendek
                normalizedPackage.length > 2 && normalizedPackage.length < 30) {
              packages.push(normalizedPackage);
              console.log(`Produk '${name}': Ditemukan paket '${normalizedPackage}'`);
            }
            break;
          }
        }
      });
      
      // Cari teks yang menunjukkan paket dalam konteks lengkap kartu
      if (packages.length < 3) {
        const cardText = card.text();
        
        // Ekstrak semua kemungkinan periode dengan regex
        const periodMatches = cardText.match(/\d+\s*(BULAN|HARI|HARIAN|TAHUN|MINGGU|MONTH|DAY|YEAR|WEEK)/gi) || [];
        
        periodMatches.forEach(match => {
          const normalizedMatch = match.replace(/\s+/g, ' ').trim();
          if (!packages.includes(normalizedMatch)) {
            packages.push(normalizedMatch);
            console.log(`Produk '${name}': Ditemukan paket '${normalizedMatch}' dari teks kartu`);
          }
        });
      }
      
      // Generate paket umum jika belum cukup paket
      if (packages.length === 0) {
        if (name.match(/NETFLIX|DISNEY|YOUTUBE|AMAZON|SPOTIFY|APPLE/i)) {
          packages.push('Premium', '1 BULAN', '3 BULAN');
        } else {
          packages.push('Premium');
        }
      } else if (packages.length === 1 && name.match(/NETFLIX|DISNEY|YOUTUBE|SPOTIFY/i)) {
        // Tambahkan variasi untuk layanan streaming popular
        if (!packages.includes('1 BULAN')) packages.push('1 BULAN');
        if (!packages.includes('3 BULAN')) packages.push('3 BULAN');
      }
      
      // Batasi jumlah paket untuk menghindari opsi yang berlebihan
      if (packages.length > 6) {
        packages.splice(6);
      }
      
      // 6. EKSTRAKSI GAMBAR PRODUK
      let imageUrl = '';
      
      // Cari elemen gambar dalam kartu
      const imageElements = card.find('img');
      if (imageElements.length) {
        // Prioritaskan gambar yang lebih besar
        let bestImage = null;
        let maxSize = 0;
        
        imageElements.each((_, img) => {
          const el = $(img);
          const src = el.attr('src') || el.attr('data-src') || el.attr('data-original') || '';
          
          // Skip icon kecil dan gambar placeholder
          if (src.includes('icon') || src.includes('placeholder') || !src) return;
          
          // Perhitungan "skor" gambar berdasarkan ukuran dan posisi
          const width = parseInt(el.attr('width') || '0');
          const height = parseInt(el.attr('height') || '0');
          const size = width * height;
          
          // Jika ukuran tidak diketahui, gunakan posisi sebagai alternatif
          if (size > maxSize || (size === 0 && !bestImage)) {
            bestImage = src;
            maxSize = size;
          }
        });
        
        imageUrl = bestImage || imageElements.first().attr('src') || '';
      }
      
      // 7. VALIDASI DAN NORMALISASI DATA SEBELUM MENAMBAHKAN KE ARRAY
      
      // Validasi nama produk
      if (!name || name.length < 2) {
        console.log(`Produk #${index+1}: Nama produk tidak valid, skip`);
        return;
      }
      
      // Normalisasi nama produk (uppercase untuk konsistensi)
      name = name.toUpperCase();
      
      // Validasi dan normalisasi harga
      if (isNaN(price) || price <= 0) {
        console.log(`Produk '${name}': Harga tidak valid (${price}), menggunakan default`);
        // Harga default berdasarkan jenis produk
        if (name.includes('NETFLIX')) {
          price = 45000;
        } else if (name.includes('SPOTIFY')) {
          price = 25000;
        } else if (name.includes('YOUTUBE')) {
          price = 30000;
        } else {
          price = 50000; // Default fallback
        }
      }
      
      // Pastikan period tidak kosong
      period = period.trim() || packages[0] || 'Premium';
      
      // Validasi URL gambar
      if (imageUrl && !imageUrl.startsWith('http')) {
        // Tambahkan domain jika URL relatif
        if (imageUrl.startsWith('/')) {
          imageUrl = 'https://rizstore.my.id' + imageUrl;
        } else {
          imageUrl = 'https://rizstore.my.id/' + imageUrl;
        }
      }
      
      // Simpan produk dengan data yang sudah divalidasi
      const product = {
        id: index + 1,
        name: name.trim(),
        period: period.trim(),
        price: price,
        stock: stock,
        packages: packages,
        image: imageUrl || name.toLowerCase().replace(/\s+/g, '-') + '.png'
      };
      
      console.log(`Berhasil mengekstrak produk: ${name} - Rp.${price} - ${stock} - Paket: ${packages.join(', ')}`);
      products.push(product);
      } catch (err) {
        console.error(`Error saat memproses produk #${index+1}:`, err.message);
      }
    });
    
    // Jika tidak ada produk yang ditemukan dengan pendekatan utama, coba pendekatan fallback
    if (products.length === 0) {
      console.log('Tidak berhasil menemukan produk dengan pendekatan utama, mencoba pendekatan fallback...');
      
      // Pendekatan fallback 1: Cari elemen heading
      $('h1, h2, h3, h4, h5, h6').each((index, element) => {
        try {
          const titleElement = $(element);
          const title = titleElement.text().trim();
          
          if (!title || title.length < 3) return;
          
          // Parse nama produk dan periode
          let name = title;
          let period = "";
          
          // Cek jika judul berisi informasi periode
          const titleParts = title.split(' ');
          if (titleParts.length > 1) {
            // Cek jika bagian akhir adalah periode
            const possiblePeriod = titleParts.slice(-2).join(' ');
            if (possiblePeriod.match(/(\d+)\s*(BULAN|HARI|HARIAN|TAHUN|MINGGU)/i)) {
              name = titleParts.slice(0, -2).join(' ');
              period = possiblePeriod;
            }
          }
          
          // Coba dapatkan harga dari elemen berikutnya
          let price = 0;
          const nextElements = [titleElement.next(), titleElement.parent().next()];
          
          for (const nextEl of nextElements) {
            if (!nextEl.length) continue;
            
            const priceText = nextEl.text().trim();
            const priceMatch = priceText.match(/(?:Rp|IDR)\s*([\d.,]+)/i);
            if (priceMatch) {
              const cleanPrice = priceMatch[1].replace(/\./g, '').replace(/,/g, '.');
              price = parseFloat(cleanPrice);
              break;
            }
          }
          
          // Jika tidak dapat menemukan harga, skip produk ini
          if (price <= 0) return;
          
          // Tampilkan log untuk diagnostik
          console.log(`Fallback: Menemukan produk '${name}' dengan harga ${price}`);
          
          // Untuk gambar - gunakan konvensi penamaan berdasarkan nama produk
          const imageName = name.toLowerCase().replace(/\s+/g, '-') + '.png';
          
          products.push({
            id: index + 1,
            name: name.trim().toUpperCase(),
            period: period.trim() || 'Premium',
            price: price,
            stock: 'Tersedia',
            packages: period ? [period] : ['Premium', '1 BULAN', '3 BULAN'],
            image: imageName
          });
        } catch (err) {
          console.error(`Error saat memproses fallback produk #${index+1}:`, err.message);
        }
      });
      
      // Pendekatan fallback 2: Cari blok teks yang mungkin produk
      if (products.length === 0) {
        $('div, p').filter(function() {
          const text = $(this).text();
          return text.includes('Rp') && text.length < 200;
        }).each((index, element) => {
          try {
            const text = $(element).text().trim();
            const priceMatch = text.match(/(?:Rp|IDR)\s*([\d.,]+)/i);
            
            if (!priceMatch) return;
            
            // Ekstrak harga
            const cleanPrice = priceMatch[1].replace(/\./g, '').replace(/,/g, '.');
            const price = parseFloat(cleanPrice);
            
            // Ekstrak nama produk (gunakan teks sebelum harga)
            let name = text.split(/Rp|IDR/i)[0].trim();
            if (name.length < 2 || name.length > 50) {
              name = `PRODUK ${index + 1}`;
            }
            
            products.push({
              id: index + 1,
              name: name.toUpperCase(),
              period: 'Premium',
              price: price,
              stock: 'Tersedia',
              packages: ['Premium', '1 BULAN', '3 BULAN'],
              image: name.toLowerCase().replace(/\s+/g, '-') + '.png'
            });
          } catch (err) {
            console.error(`Error saat memproses fallback 2 produk #${index+1}:`, err.message);
          }
        });
      }
    }
    
    // Deduplikasi produk berdasarkan nama (ambil versi dengan harga lebih tinggi)
    const uniqueProducts = {};
    products.forEach(product => {
      const key = product.name.trim().toLowerCase();
      
      if (!uniqueProducts[key] || uniqueProducts[key].price < product.price) {
        uniqueProducts[key] = product;
      }
    });
    
    // Konversi kembali ke array
    const finalProducts = Object.values(uniqueProducts);
    
    // Sort produk berdasarkan ID, lalu urutkan ulang ID
    finalProducts.sort((a, b) => a.id - b.id);
    finalProducts.forEach((product, idx) => {
      product.id = idx + 1;
    });
    
    console.log(`Berhasil mendapatkan ${finalProducts.length} produk dari rizstore.my.id/new/katalog`);
    
    // Jika masih tidak bisa mendapatkan produk, gunakan data fallback
    if (finalProducts.length === 0) {
      console.warn('Tidak ada produk yang berhasil diambil, menggunakan data fallback');
      return getFallbackProducts();
    }
    
    return finalProducts;
  } catch (error) {
    console.error('Error saat scraping produk:', error);
    // Tampilkan info diagnostik lebih detail
    console.error('Error detail:', error.message);
    // Tampilkan stack trace untuk debugging
    console.error('Stack:', error.stack);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', JSON.stringify(error.response.headers));
    }
    
    // Gunakan data fallback jika scraping gagal
    return getFallbackProducts();
  }
};

// Fallback data in case scraping fails
const getFallbackProducts = () => {
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
};
