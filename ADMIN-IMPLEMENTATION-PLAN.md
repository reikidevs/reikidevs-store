# Rencana Implementasi Admin Panel & CRUD Penjualan

## 1. Setup Supabase
- Buat akun di [Supabase](https://supabase.com)
- Buat project baru (free tier)
- Konfigurasi Auth untuk single admin
- Setup database tables:
  
  ```sql
  -- Tabel Penjualan
  CREATE TABLE sales (
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

  -- Trigger untuk update_at
  CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();
  ```

## 2. Integrasi Supabase dengan React
- Install paket: `npm install @supabase/supabase-js`
- Setup Supabase client:

  ```javascript
  // src/utils/supabaseClient.js
  import { createClient } from '@supabase/supabase-js'

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

  export const supabase = createClient(supabaseUrl, supabaseAnonKey)
  ```

## 3. Implementasi Auth Admin
- Buat page login admin
- Implementasi autentikasi dengan Supabase Auth
- Setup protected routes

## 4. Admin Dashboard
- Tabel penjualan dengan filter dan pencarian
- Form untuk edit status penjualan
- Statistik penjualan sederhana

## 5. Integration dengan Toko
- Tambahkan form checkout dengan data customer
- Hubungkan checkout dengan database penjualan
- Implementasi upload bukti pembayaran

## 6. Deploy Updates
- Perbarui environment variables di Vercel
- Deploy aplikasi yang sudah diupdate

## Konfigurasi Vercel Environment Variables
```
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

## URL Admin Panel
Admin panel akan tersedia di path: `/admin`
