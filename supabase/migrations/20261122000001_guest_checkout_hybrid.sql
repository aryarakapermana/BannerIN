-- Migration Fase 15: Guest Checkout (Hybrid)
-- Mengizinkan pembuatan pesanan dan pengunggahan desain/bukti pembayaran bagi pengunjung (Guest / Unauthenticated)
-- tanpa menghapus akun pelanggan terdaftar (Registered Customer) dan mempertahankan akses penuh Admin.

-- 1. Buat customer_id menjadi opsional (nullable) pada tabel designs dan orders
ALTER TABLE public.designs ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN customer_id DROP NOT NULL;

-- 2. Tambahkan kolom tracking_token pada public.orders untuk akses pelacakan instan pesanan tamu
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_token TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON public.orders(tracking_token);

-- 3. Kebijakan RLS untuk tabel designs (Hybrid)
DROP POLICY IF EXISTS "designs_select_own_or_admin" ON public.designs;
DROP POLICY IF EXISTS "designs_select_hybrid" ON public.designs;
CREATE POLICY "designs_select_hybrid"
    ON public.designs FOR SELECT
    USING (
        customer_id IS NULL OR
        (auth.uid() IS NOT NULL AND auth.uid() = customer_id) OR
        public.is_admin()
    );

DROP POLICY IF EXISTS "designs_insert_own" ON public.designs;
DROP POLICY IF EXISTS "designs_insert_hybrid" ON public.designs;
CREATE POLICY "designs_insert_hybrid"
    ON public.designs FOR INSERT
    WITH CHECK (
        customer_id IS NULL OR
        (auth.uid() IS NOT NULL AND auth.uid() = customer_id) OR
        public.is_admin()
    );

DROP POLICY IF EXISTS "designs_update_own" ON public.designs;
DROP POLICY IF EXISTS "designs_update_hybrid" ON public.designs;
CREATE POLICY "designs_update_hybrid"
    ON public.designs FOR UPDATE
    USING (
        customer_id IS NULL OR
        (auth.uid() IS NOT NULL AND auth.uid() = customer_id) OR
        public.is_admin()
    )
    WITH CHECK (
        customer_id IS NULL OR
        (auth.uid() IS NOT NULL AND auth.uid() = customer_id) OR
        public.is_admin()
    );

-- 4. Kebijakan RLS untuk tabel orders (Hybrid)
DROP POLICY IF EXISTS "orders_select_own_or_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_select_hybrid" ON public.orders;
CREATE POLICY "orders_select_hybrid"
    ON public.orders FOR SELECT
    USING (
        (auth.uid() IS NOT NULL AND auth.uid() = customer_id) OR
        (customer_id IS NULL) OR
        public.is_admin()
    );

DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_hybrid" ON public.orders;
CREATE POLICY "orders_insert_hybrid"
    ON public.orders FOR INSERT
    WITH CHECK (
        ((customer_id IS NULL) OR (auth.uid() IS NOT NULL AND auth.uid() = customer_id) OR public.is_admin())
        AND status = 'pending'
    );

-- 5. Kebijakan Storage untuk bucket designs (Folder guest/*)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'storage_designs_insert_guest'
  ) THEN
    CREATE POLICY "storage_designs_insert_guest"
        ON storage.objects FOR INSERT
        TO anon, authenticated
        WITH CHECK (
            bucket_id = 'designs' AND
            (storage.foldername(name))[1] = 'guest'
        );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'storage_designs_select_guest'
  ) THEN
    CREATE POLICY "storage_designs_select_guest"
        ON storage.objects FOR SELECT
        TO anon, authenticated
        USING (
            bucket_id = 'designs' AND
            (storage.foldername(name))[1] = 'guest'
        );
  END IF;

  -- 6. Kebijakan Storage untuk bucket payment-proofs (Folder guest/*)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'storage_payment_proofs_insert_guest'
  ) THEN
    CREATE POLICY "storage_payment_proofs_insert_guest"
        ON storage.objects FOR INSERT
        TO anon, authenticated
        WITH CHECK (
            bucket_id = 'payment-proofs' AND
            (storage.foldername(name))[1] = 'guest'
        );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'storage_payment_proofs_select_guest'
  ) THEN
    CREATE POLICY "storage_payment_proofs_select_guest"
        ON storage.objects FOR SELECT
        TO anon, authenticated
        USING (
            bucket_id = 'payment-proofs' AND
            (storage.foldername(name))[1] = 'guest'
        );
  END IF;
END
$$;
