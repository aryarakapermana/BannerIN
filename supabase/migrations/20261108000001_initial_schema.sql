-- Migration: 20261108000001_initial_schema.sql
-- Deskripsi: Skema awal BannerKu (profiles, materials, designs, orders, RLS policies, Storage bucket)
-- Dibuat untuk: Fase 5 - Setup Supabase

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABEL PROFILES (terhubung dengan auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Data profil pengguna dan penentuan hak akses (customer / admin)';
COMMENT ON COLUMN public.profiles.role IS 'Peran pengguna. Nilai admin tidak boleh diubah dari client.';

-- 3. HELPER FUNCTION: is_admin()
-- Menggunakan SECURITY DEFINER agar tidak terjadi rekursi tak terbatas pada policy RLS profiles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

COMMENT ON FUNCTION public.is_admin() IS 'Memeriksa apakah user yang sedang login memiliki role admin';

-- 4. TRIGGER: Auto-create profile saat registrasi baru
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        COALESCE(new.raw_user_meta_data->>'phone', ''),
        'customer' -- Role awal selalu customer saat registrasi umum
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. TABEL MATERIALS
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price_per_sqm NUMERIC(12, 2) NOT NULL CHECK (price_per_sqm >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.materials IS 'Daftar jenis bahan banner dan tarif per meter persegi';

-- 6. TABEL DESIGNS
CREATE TABLE IF NOT EXISTS public.designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    original_file_path TEXT NOT NULL,
    preview_file_path TEXT,
    file_type TEXT NOT NULL CHECK (file_type IN ('image/jpeg', 'image/png', 'image/jpg')),
    editor_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.designs IS 'Penyimpanan referensi file desain dan konfigurasi editor banner';

-- 7. TABEL ORDERS (payments ditunda sesuai spesifikasi MVP)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
    design_id UUID REFERENCES public.designs(id) ON DELETE SET NULL,
    width_cm NUMERIC(8, 2) NOT NULL CHECK (width_cm > 0),
    height_cm NUMERIC(8, 2) NOT NULL CHECK (height_cm > 0),
    area_sqm NUMERIC(10, 4) NOT NULL CHECK (area_sqm > 0),
    quantity INTEGER NOT NULL CHECK (quantity >= 1),
    unit_price_snapshot NUMERIC(12, 2) NOT NULL CHECK (unit_price_snapshot >= 0),
    total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.orders IS 'Pemesanan banner lengkap dengan snapshot harga saat transaksi';

-- 8. INDEXES UNTUK PERFORMA QUERY
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_materials_is_active ON public.materials(is_active);
CREATE INDEX IF NOT EXISTS idx_designs_customer_id ON public.designs(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_material_id ON public.orders(material_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- 9. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 9.1 POLICIES UNTUK PROFILES
-- Customer hanya dapat membaca profil sendiri; Admin dapat membaca semua profil
CREATE POLICY "profiles_select_own_or_admin"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

-- Customer hanya dapat mengupdate profil sendiri dan DILARANG menaikkan role menjadi admin
CREATE POLICY "profiles_update_own_prevent_role_escalation"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin())
    WITH CHECK (
        (auth.uid() = id AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()))
        OR public.is_admin()
    );

-- 9.2 POLICIES UNTUK MATERIALS
-- Bahan aktif dapat dibaca oleh publik & customer; Semua bahan (aktif/nonaktif) dapat dibaca admin
CREATE POLICY "materials_select_active_or_admin"
    ON public.materials FOR SELECT
    USING (is_active = true OR public.is_admin());

-- Hanya admin yang dapat menambah bahan
CREATE POLICY "materials_insert_admin_only"
    ON public.materials FOR INSERT
    WITH CHECK (public.is_admin());

-- Hanya admin yang dapat mengedit bahan & harga
CREATE POLICY "materials_update_admin_only"
    ON public.materials FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Hanya admin yang dapat menghapus bahan
CREATE POLICY "materials_delete_admin_only"
    ON public.materials FOR DELETE
    USING (public.is_admin());

-- 9.3 POLICIES UNTUK DESIGNS
-- Customer hanya melihat desain miliknya; Admin melihat semua desain pesanan
CREATE POLICY "designs_select_own_or_admin"
    ON public.designs FOR SELECT
    USING (auth.uid() = customer_id OR public.is_admin());

-- Customer mengunggah desain untuk dirinya sendiri
CREATE POLICY "designs_insert_own"
    ON public.designs FOR INSERT
    WITH CHECK (auth.uid() = customer_id);

-- Customer dapat memperbarui konfigurasi desain miliknya
CREATE POLICY "designs_update_own"
    ON public.designs FOR UPDATE
    USING (auth.uid() = customer_id OR public.is_admin())
    WITH CHECK (auth.uid() = customer_id OR public.is_admin());

-- Customer dapat menghapus desain miliknya
CREATE POLICY "designs_delete_own"
    ON public.designs FOR DELETE
    USING (auth.uid() = customer_id OR public.is_admin());

-- 9.4 POLICIES UNTUK ORDERS
-- Customer hanya dapat melihat pesanannya sendiri; Admin melihat seluruh pesanan masuk
CREATE POLICY "orders_select_own_or_admin"
    ON public.orders FOR SELECT
    USING (auth.uid() = customer_id OR public.is_admin());

-- Customer dapat membuat pesanan baru atas namanya sendiri dengan status awal 'pending'
CREATE POLICY "orders_insert_own"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = customer_id AND status = 'pending');

-- Hanya admin yang berhak memperbarui status pesanan (customer tidak boleh mengubah status/harga)
CREATE POLICY "orders_update_admin_only"
    ON public.orders FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 10. SETUP SUPABASE STORAGE UNTUK DESAIN (PRIVATE BUCKET)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'designs',
    'designs',
    false, -- BUCKET BERSIFAT PRIVATE
    20971520, -- Maksimum 20MB per file
    ARRAY['image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 20971520,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg'];

-- Policy Storage: Customer mengunggah hanya ke folder ID miliknya (designs/{user_id}/*)
CREATE POLICY "storage_designs_insert_own"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'designs' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy Storage: Customer membaca file miliknya; Admin membaca semua file desain
CREATE POLICY "storage_designs_select_own_or_admin"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'designs' AND
        ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
    );

-- Policy Storage: Customer menghapus file miliknya; Admin dapat menghapus jika perlu
CREATE POLICY "storage_designs_delete_own_or_admin"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'designs' AND
        ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
    );

