-- Migration Fase 10: Tambah kolom detail checkout & bukti pembayaran pada tabel public.orders
-- serta bucket privat `payment-proofs` pada Supabase Storage.
-- Catatan (Rule 11): File migrasi ini menunggu konfirmasi user sebelum dijalankan ke database remote (`supabase db push`).

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'qris_static',
  ADD COLUMN IF NOT EXISTS payment_proof_path TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_payment_method_check'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_payment_method_check
      CHECK (payment_method IN ('qris_static'));
  END IF;
END
$$;

-- Bucket privat Supabase Storage untuk menyimpan bukti transfer / pembayaran QRIS pelanggan
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'payment-proofs',
    'payment-proofs',
    false,
    10485760, -- Maksimum 10MB per file
    ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'storage_payment_proofs_insert_own'
  ) THEN
    CREATE POLICY "storage_payment_proofs_insert_own"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
            bucket_id = 'payment-proofs' AND
            (storage.foldername(name))[1] = auth.uid()::text
        );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'storage_payment_proofs_select_own_or_admin'
  ) THEN
    CREATE POLICY "storage_payment_proofs_select_own_or_admin"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (
            bucket_id = 'payment-proofs' AND
            ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
        );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'storage_payment_proofs_delete_own_or_admin'
  ) THEN
    CREATE POLICY "storage_payment_proofs_delete_own_or_admin"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (
            bucket_id = 'payment-proofs' AND
            ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
        );
  END IF;
END
$$;
