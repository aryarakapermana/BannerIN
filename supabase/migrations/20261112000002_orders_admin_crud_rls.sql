-- Fase 11: Admin Full CRUD RLS Policies on public.orders
-- Menambahkan policy INSERT dan DELETE khusus Admin agar Dashboard Admin dapat membuat pesanan manual dan menghapus pesanan secara permanen (terlindungi public.is_admin()).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'orders'
      AND policyname = 'orders_insert_admin_only'
  ) THEN
    CREATE POLICY "orders_insert_admin_only" ON public.orders
      FOR INSERT TO authenticated
      WITH CHECK (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'orders'
      AND policyname = 'orders_delete_admin_only'
  ) THEN
    CREATE POLICY "orders_delete_admin_only" ON public.orders
      FOR DELETE TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

