-- Membuat fungsi untuk mengupdate timestamp terakhir diupdate
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Membuat tabel penjualan
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_contact TEXT NOT NULL,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  package_selected TEXT NOT NULL,
  price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  payment_proof TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Membuat trigger untuk mengupdate timestamp saat data diupdate
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON sales
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Mengatur Row Level Security (RLS)
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Membuat policy dimana hanya authenticated users yang bisa CRUD
CREATE POLICY "Authenticated users can CRUD" ON sales
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Membuat bucket untuk upload file bukti pembayaran
INSERT INTO storage.buckets (id, name, public)
VALUES ('sales-documents', 'sales-documents', true);

-- Mengizinkan authenticated users untuk upload file
CREATE POLICY "Authenticated users can upload files" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'sales-documents');

-- Mengizinkan semua orang untuk melihat file (optional, sesuai kebutuhan)
CREATE POLICY "Anyone can view files" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'sales-documents');
