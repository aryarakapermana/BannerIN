-- ==============================================================================
-- BANNERKU SEED DATA
-- PERINGATAN: DATA PENGEMBANGAN / DEVELOPMENT DATA ONLY
-- Harga di bawah ini adalah data contoh untuk keperluan pengujian lokal.
-- Wajib mengonfirmasi kembali satuan dan harga per m2 kepada penyedia percetakan
-- sebelum aplikasi digunakan untuk transaksi bisnis nyata.
-- ==============================================================================

INSERT INTO public.materials (name, description, price_per_sqm, is_active)
VALUES
    (
        'Flexi Standard 280 gram',
        'Bahan outdoor standar, cocok untuk spanduk promosi jangka pendek dan acara singkat.',
        20000.00,
        true
    ),
    (
        'Flexi Premium 340 gram',
        'Bahan outdoor lebih tebal dan tahan cuaca, cocok untuk baliho dan banner toko jangka menengah.',
        28000.00,
        true
    ),
    (
        'Flexi Korea 440 gram',
        'Bahan tebal bertekstur halus matte dengan daya tahan tinggi, cocok untuk backdrop dan display indoor/outdoor profesional.',
        45000.00,
        true
    ),
    (
        'Albatros',
        'Bahan indoor halus tanpa serat kasar dengan hasil cetak tajam, ideal untuk roll-up banner, X-banner, dan poster galeri.',
        65000.00,
        true
    )
ON CONFLICT DO NOTHING;

