import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createSale, updateSale, getSaleById, fetchSales } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

// Form multi-fungsi untuk Create dan Edit penjualan
const SaleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const isEditMode = !!id;

  // State untuk form data
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_contact: '',
    product_id: '',
    product_name: '',
    package_selected: '',
    price: '',
    status: 'pending',
    payment_method: '',
    notes: ''
  });

  // State untuk products (untuk dropdown)
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // State untuk loading dan error
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Redirect jika tidak terautentikasi
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Load products untuk dropdown
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        
        // Kita bisa menggunakan API katalog untuk mendapatkan produk
        // atau alternatifnya dari Supabase jika ada tabel products
        const response = await fetch('/api/katalog-simple');
        const data = await response.json();
        
        if (data && data.products) {
          setProducts(data.products);
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  // Jika edit mode, load data penjualan
  useEffect(() => {
    if (isEditMode) {
      const loadSaleData = async () => {
        try {
          setLoading(true);
          const { data, error } = await getSaleById(id);
          
          if (error) {
            throw error;
          }
          
          if (data) {
            setFormData(data);
            
            // Find selected product
            const product = products.find(p => p.id === data.product_id || p.name === data.product_name);
            setSelectedProduct(product || null);
          }
        } catch (err) {
          console.error('Error loading sale:', err);
          setFormError('Gagal memuat data penjualan');
        } finally {
          setLoading(false);
        }
      };

      loadSaleData();
    }
  }, [id, isEditMode, products]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || '' : value
    }));
  };

  // Handle product selection
  const handleProductChange = (e) => {
    const productId = e.target.value;
    const selected = products.find(p => p.id.toString() === productId);
    
    if (selected) {
      setSelectedProduct(selected);
      setFormData(prev => ({
        ...prev,
        product_id: selected.id,
        product_name: selected.name,
        price: selected.price,
        package_selected: selected.packages[0] || ''
      }));
    } else {
      setSelectedProduct(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);

    try {
      // Validasi form sederhana
      if (!formData.customer_name || !formData.customer_contact || !formData.product_name) {
        throw new Error('Mohon lengkapi data pelanggan dan produk');
      }

      // Proses submit berdasarkan mode (create/edit)
      if (isEditMode) {
        // Update existing sale
        const { error } = await updateSale(id, formData);
        
        if (error) {
          throw error;
        }
        
        navigate('/admin/dashboard');
      } else {
        // Create new sale
        const { error } = await createSale(formData);
        
        if (error) {
          throw error;
        }
        
        navigate('/admin/dashboard');
      }
    } catch (err) {
      console.error('Error saving sale:', err);
      setFormError(err.message || 'Gagal menyimpan data penjualan');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Penjualan' : 'Tambah Penjualan Baru'}
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            {formError && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
                <p>{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Customer Info */}
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Informasi Pelanggan</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Pelanggan
                    </label>
                    <input
                      type="text"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kontak (Email/WA)
                    </label>
                    <input
                      type="text"
                      name="customer_contact"
                      value={formData.customer_contact}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Informasi Produk</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pilih Produk
                    </label>
                    <select
                      name="product_id"
                      value={formData.product_id}
                      onChange={handleProductChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">-- Pilih Produk --</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - Rp {product.price.toLocaleString('id-ID')}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {selectedProduct && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pilih Paket
                      </label>
                      <select
                        name="package_selected"
                        value={formData.package_selected}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      >
                        <option value="">-- Pilih Paket --</option>
                        {selectedProduct.packages.map((pkg, idx) => (
                          <option key={idx} value={pkg}>
                            {pkg}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Harga (Rp)
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Informasi Pembayaran</h2>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Metode Pembayaran
                    </label>
                    <select
                      name="payment_method"
                      value={formData.payment_method || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">-- Pilih Metode --</option>
                      <option value="transfer">Transfer Bank</option>
                      <option value="qris">QRIS</option>
                      <option value="ewallet">E-Wallet</option>
                      <option value="cod">Cash on Delivery</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan
                </label>
                <textarea
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/admin/dashboard')}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : isEditMode ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SaleForm;
