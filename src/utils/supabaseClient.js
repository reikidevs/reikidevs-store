import { createClient } from '@supabase/supabase-js'

// Gunakan environment variables untuk kredensial Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Buat Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function helper untuk autentikasi
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data?.user;
};

// Function helper untuk CRUD penjualan
export const fetchSales = async (filters = {}) => {
  let query = supabase.from('sales').select('*');
  
  // Terapkan filters jika ada
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters.searchTerm) {
    query = query.or(
      `customer_name.ilike.%${filters.searchTerm}%,product_name.ilike.%${filters.searchTerm}%,customer_contact.ilike.%${filters.searchTerm}%`
    );
  }
  
  // Urutkan berdasarkan created_at, terbaru terlebih dahulu
  query = query.order('created_at', { ascending: false });
  
  const { data, error } = await query;
  return { data, error };
};

export const getSaleById = async (id) => {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('id', id)
    .single();
  
  return { data, error };
};

export const createSale = async (saleData) => {
  const { data, error } = await supabase
    .from('sales')
    .insert([saleData])
    .select();
  
  return { data, error };
};

export const updateSale = async (id, updates) => {
  const { data, error } = await supabase
    .from('sales')
    .update(updates)
    .eq('id', id)
    .select();
  
  return { data, error };
};

export const deleteSale = async (id) => {
  const { error } = await supabase
    .from('sales')
    .delete()
    .eq('id', id);
  
  return { error };
};

// Function untuk upload bukti pembayaran
export const uploadPaymentProof = async (file, saleId) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `payment-proof-${saleId}-${Math.random()}.${fileExt}`;
  const filePath = `payment-proofs/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from('sales-documents')
    .upload(filePath, file);
  
  if (error) {
    return { error };
  }
  
  // Dapatkan URL publik untuk file yang diupload
  const { data: { publicUrl } } = supabase.storage
    .from('sales-documents')
    .getPublicUrl(filePath);
  
  return { data: { path: filePath, url: publicUrl }, error: null };
};
