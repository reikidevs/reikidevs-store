import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSaleById, deleteSale, updateSale } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const SaleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Redirect jika tidak terautentikasi
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Load sale data
  useEffect(() => {
    const loadSaleData = async () => {
      try {
        setLoading(true);
        const { data, error } = await getSaleById(id);
        
        if (error) {
          throw error;
        }
        
        setSale(data);
      } catch (err) {
        console.error('Error loading sale:', err);
        setError('Gagal memuat data penjualan');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && id) {
      loadSaleData();
    }
  }, [id, isAuthenticated]);

  // Handle status update
  const handleStatusChange = async (newStatus) => {
    try {
      setLoading(true);
      const { error } = await updateSale(id, { status: newStatus });
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setSale(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Gagal mengubah status');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setLoading(true);
      const { error } = await deleteSale(id);
      
      if (error) {
        throw error;
      }
      
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Error deleting sale:', err);
      setError('Gagal menghapus data penjualan');
    } finally {
      setLoading(false);
      setDeleteConfirm(false);
    }
  };

  // Format tanggal
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (isLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
          <button 
            onClick={() => navigate('/admin/dashboard')}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700">Data tidak ditemukan</h2>
          <button 
            onClick={() => navigate('/admin/dashboard')}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Status badge dengan warna
  const getStatusBadgeClass = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return statusColors[status] || 'bg-gray-100';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Detail Penjualan #{sale.id}</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Kembali
            </button>
            <button
              onClick={() => navigate(`/admin/sales/${id}/edit`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="p-6">
            {/* Sale Status Information */}
            <div className="border-b pb-6 mb-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Status Penjualan</h2>
                  <div className="mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(sale.status)}`}>
                      {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0">
                  <div className="text-sm text-gray-500 mb-2">Ubah Status</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleStatusChange('pending')}
                      disabled={sale.status === 'pending'}
                      className={`px-3 py-1 text-xs rounded ${sale.status === 'pending' ? 'bg-gray-100 text-gray-400' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => handleStatusChange('processing')}
                      disabled={sale.status === 'processing'}
                      className={`px-3 py-1 text-xs rounded ${sale.status === 'processing' ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
                    >
                      Processing
                    </button>
                    <button
                      onClick={() => handleStatusChange('completed')}
                      disabled={sale.status === 'completed'}
                      className={`px-3 py-1 text-xs rounded ${sale.status === 'completed' ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                    >
                      Completed
                    </button>
                    <button
                      onClick={() => handleStatusChange('cancelled')}
                      disabled={sale.status === 'cancelled'}
                      className={`px-3 py-1 text-xs rounded ${sale.status === 'cancelled' ? 'bg-gray-100 text-gray-400' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                    >
                      Cancelled
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* General Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Informasi Umum</h3>
                <div className="space-y-2">
                  <div className="flex">
                    <span className="w-32 text-sm text-gray-500">ID Transaksi:</span>
                    <span className="text-sm text-gray-900">{sale.id}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-sm text-gray-500">Tanggal:</span>
                    <span className="text-sm text-gray-900">{formatDate(sale.created_at)}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-sm text-gray-500">Terakhir Diupdate:</span>
                    <span className="text-sm text-gray-900">{formatDate(sale.updated_at)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Informasi Pelanggan</h3>
                <div className="space-y-2">
                  <div className="flex">
                    <span className="w-32 text-sm text-gray-500">Nama:</span>
                    <span className="text-sm text-gray-900">{sale.customer_name}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-sm text-gray-500">Kontak:</span>
                    <span className="text-sm text-gray-900">{sale.customer_contact}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="mb-8">
              <h3 className="text-md font-medium text-gray-900 mb-4">Produk</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{sale.product_name}</h4>
                    <div className="text-sm text-gray-500">Paket: {sale.package_selected}</div>
                  </div>
                  <div className="text-lg font-medium">
                    Rp {sale.price?.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="mb-8">
              <h3 className="text-md font-medium text-gray-900 mb-4">Informasi Pembayaran</h3>
              <div className="space-y-2">
                <div className="flex">
                  <span className="w-32 text-sm text-gray-500">Metode:</span>
                  <span className="text-sm text-gray-900">{sale.payment_method || '-'}</span>
                </div>
                {sale.payment_proof && (
                  <div className="flex">
                    <span className="w-32 text-sm text-gray-500">Bukti Pembayaran:</span>
                    <a 
                      href={sale.payment_proof} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Lihat Bukti Pembayaran
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {sale.notes && (
              <div className="mb-8">
                <h3 className="text-md font-medium text-gray-900 mb-4">Catatan</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-800 whitespace-pre-line">{sale.notes}</p>
                </div>
              </div>
            )}

            {/* Delete Action */}
            <div className="mt-10 pt-6 border-t">
              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Hapus Penjualan
                </button>
              ) : (
                <div className="bg-red-50 p-4 rounded-md">
                  <p className="text-sm text-red-700 mb-4">
                    Anda yakin ingin menghapus data penjualan ini? Tindakan ini tidak dapat dibatalkan.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Ya, Hapus Permanen
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SaleDetail;
