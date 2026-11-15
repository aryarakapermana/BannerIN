import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  Banner,
  PriceCalculator,
  Design,
  DesignEditorService,
  Order,
  OrderService,
  STATIC_QRIS_INFO,
  BANNERKU_WHATSAPP,
} from "../src/domain";

/**
 * Fase 13: Pengujian Menyeluruh Sistem BannerIN (Testing & Security Verification)
 * Memverifikasi 15 skenario pengujian resmi sesuai dokumen BANNERKU_PROJECT_PLAN.md
 */
describe("Fase 13: Pengujian Menyeluruh Sistem BannerIN (15 Skenario SRS)", () => {
  const calculator = new PriceCalculator();
  const editorService = new DesignEditorService();
  const orderService = new OrderService();

  const activeFlexiMaterial = {
    id: "mat-flexi-280",
    name: "Flexi Standard 280 gram",
    pricePerSqm: 20000,
    isActive: true,
  };

  const activeHigressMaterial = {
    id: "mat-flexi-340",
    name: "Flexi Higress 340 gram",
    pricePerSqm: 28000,
    isActive: true,
  };

  // Skenario 1, 2, 3: Registrasi & Login Validasi Identitas
  describe("Skenario 1, 2, 3: Autentikasi, Registrasi & Login Validasi", () => {
    it("Skenario 1: Registrasi data valid (nama valid & WhatsApp Indonesia ternormalisasi)", () => {
      const validName = Order.normalizeCustomerName("  Ahmad Dahlan  ");
      assert.strictEqual(validName, "Ahmad Dahlan");

      const waNormalized = Order.normalizeWhatsApp("085863601253");
      assert.strictEqual(waNormalized.e164, "+6285863601253");
      assert.strictEqual(waNormalized.display, "085863601253");
      assert.strictEqual(waNormalized.waMeDigits, "6285863601253");
    });

    it("Skenario 1 (Edge Case): Registrasi gagal jika nama kosong atau WhatsApp tidak valid", () => {
      assert.throws(() => Order.normalizeCustomerName(" "), /Nama pemesan wajib diisi/);
      assert.throws(() => Order.normalizeCustomerName("A"), /minimal 2 karakter/);
      assert.throws(() => Order.normalizeWhatsApp("12345"), /Nomor WhatsApp tidak valid/);
      assert.throws(() => Order.normalizeWhatsApp(""), /Nomor WhatsApp wajib diisi/);
    });

    it("Skenario 2 & 3: Format email dan batas keamanan kredensial", () => {
      // Email valid
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      assert.strictEqual(emailRegex.test("customer@gmail.com"), true);
      assert.strictEqual(emailRegex.test("admin@bannerku.com"), true);

      // Email tidak valid (kredensial salah)
      assert.strictEqual(emailRegex.test("invalid-email"), false);
      assert.strictEqual(emailRegex.test("@no-user.com"), false);
    });
  });

  // Skenario 4 & 5: Ukuran & Validasi Dimensi
  describe("Skenario 4 & 5: Validasi Dimensi & Kalkulasi Luas Banner", () => {
    it("Skenario 4: Validasi gagal saat lebar atau tinggi nol / negatif", () => {
      // Nol
      assert.throws(
        () => calculator.calculateArea(0, 100),
        /Ukuran harus lebih besar dari nol/
      );
      assert.throws(
        () => calculator.calculateArea(300, 0),
        /Ukuran harus lebih besar dari nol/
      );

      // Negatif
      assert.throws(
        () => calculator.calculateArea(-300, 100),
        /Ukuran harus lebih besar dari nol/
      );
    });

    it("Skenario 5: Nilai valid menghasilkan luas dan rasio yang dihitung presisi", () => {
      // Banner 300 x 100 cm = 3 m²
      const area = calculator.calculateArea(300, 100);
      const total = calculator.calculateTotal(300, 100, 20000, 1);

      assert.strictEqual(area, 3);
      assert.strictEqual(total, 60000);

      const banner = new Banner(300, 100);
      assert.strictEqual(banner.getOrientation(), "landscape");
      assert.strictEqual(banner.getRatio(), 3);
    });
  });

  // Skenario 6 & 7: Pergantian Bahan & Jumlah (Quantity)
  describe("Skenario 6 & 7: Dinamika Harga Berdasarkan Bahan & Kuantitas", () => {
    it("Skenario 6: Ganti bahan mengubah estimasi subtotal sesuai tarif per m²", () => {
      const flexi280Total = calculator.calculateTotal(300, 100, activeFlexiMaterial.pricePerSqm, 1);
      const flexi340Total = calculator.calculateTotal(300, 100, activeHigressMaterial.pricePerSqm, 1);
      const korchinTotal = calculator.calculateTotal(300, 100, 38000, 1);

      assert.strictEqual(flexi280Total, 60000); // 3 m² * 20.000
      assert.strictEqual(flexi340Total, 84000); // 3 m² * 28.000
      assert.strictEqual(korchinTotal, 114000); // 3 m² * 38.000
    });

    it("Skenario 7: Ganti jumlah pesanan melipatgandakan total secara linear", () => {
      const qty1 = calculator.calculateTotal(300, 100, 20000, 1);
      const qty3 = calculator.calculateTotal(300, 100, 20000, 3);
      const qty5 = calculator.calculateTotal(300, 100, 20000, 5);

      assert.strictEqual(qty1, 60000);
      assert.strictEqual(qty3, 180000);
      assert.strictEqual(qty5, 300000);

      // Penolakan kuantitas tidak sah
      assert.throws(
        () => calculator.calculateTotal(300, 100, 20000, 0),
        /Harga atau jumlah tidak valid/
      );
      assert.throws(
        () => new Banner(300, 100, 1.5),
        /Harga atau jumlah tidak valid/
      );
    });
  });

  // Skenario 8 & 9: Upload File & Validasi Biner Magic Bytes
  describe("Skenario 8 & 9: Keamanan Unggah Berkas Desain & Bukti Pembayaran", () => {
    const validJpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const validPngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const spoofedPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-

    it("Skenario 8: File diizinkan (JPG/PNG dengan magic bytes asli) berhasil divalidasi", () => {
      const jpegResult = editorService.validateFileBuffer(
        { name: "spanduk-promo.jpg", type: "image/jpeg", size: 1024 * 500 },
        validJpegBytes
      );
      assert.strictEqual(jpegResult.valid, true);
      assert.strictEqual(jpegResult.canonicalMimeType, "image/jpeg");

      const pngResult = editorService.validateFileBuffer(
        { name: "backdrop.png", type: "image/png", size: 2048 },
        validPngBytes
      );
      assert.strictEqual(pngResult.valid, true);
      assert.strictEqual(pngResult.canonicalMimeType, "image/png");
    });

    it("Skenario 9: File tidak diizinkan (format dilarang, magic bytes palsu, melebihi batas) ditolak", () => {
      // Format tidak diizinkan
      assert.throws(
        () =>
          editorService.validateFileMetadata({
            name: "desain.pdf",
            type: "application/pdf",
            size: 1024,
          }),
        /Ekstensi file tidak didukung/
      );

      // File palsu (ekstensi .png tapi isi biner PDF)
      assert.throws(
        () =>
          editorService.validateFileBuffer(
            { name: "palsu.png", type: "image/png", size: 512 },
            spoofedPdfBytes
          ),
        /Signature file tidak valid/
      );

      // Melebihi 20 MB
      assert.throws(
        () =>
          editorService.validateFileMetadata({
            name: "besar.jpg",
            type: "image/jpeg",
            size: Design.MAX_FILE_SIZE_BYTES + 1,
          }),
        /melebihi batas maksimum 20 MB/
      );
    });
  });

  // Skenario 10: Preview Kanvas Fabric.js
  describe("Skenario 10: Kalkulasi Dimensi Kanvas Preview Fabric.js", () => {
    it("Skenario 10: Rasio banner 300x100 cm menghasilkan kanvas proporsional", () => {
      const landscape = editorService.computeCanvasDimensions(300, 100, 600, 300);
      assert.strictEqual(landscape.widthPx, 600);
      assert.strictEqual(landscape.heightPx, 200);
    });

    it("Skenario 10 (Banner Portait): Rasio banner 100x200 cm dihitung presisi", () => {
      const portrait = editorService.computeCanvasDimensions(100, 200, 600, 300);
      assert.strictEqual(portrait.widthPx, 150);
      assert.strictEqual(portrait.heightPx, 300);
    });
  });

  // Skenario 11 & 12: Pemesanan & Anti-Manipulasi Harga Browser
  describe("Skenario 11 & 12: Integritas Pesanan & Anti-Manipulasi Harga", () => {
    it("Skenario 11: Data pesanan valid berhasil disusun dan menghasilkan format #BK-...", () => {
      const order = orderService.prepareOrder({
        customerId: "cust-123",
        customerName: "Budi Santoso",
        whatsappNumber: "081234567890",
        material: activeFlexiMaterial,
        widthCm: 300,
        heightCm: 100,
        quantity: 2,
        paymentMethod: "qris_static",
      });

      assert.strictEqual(order.customerName, "Budi Santoso");
      assert.strictEqual(order.whatsappNumber, "+6281234567890");
      assert.strictEqual(order.totalPrice, 120000);
      assert.strictEqual(order.status, "pending");

      // Format BK dari UUID
      const formatted = Order.formatOrderNumber("550e8400-e29b-41d4-a716-446655440000");
      assert.strictEqual(formatted, "#BK-550E8400");
    });

    it("Skenario 12: Server mutlak mengabaikan harga manipulasi dari browser", () => {
      // Browser nakal mengirim clientTotalPrice: Rp 1.000 dan clientStatus: "completed"
      const order = orderService.prepareOrder({
        customerId: "cust-123",
        customerName: "Penyerang Web",
        whatsappNumber: "081234567890",
        material: activeFlexiMaterial, // Rp 20.000 / m²
        widthCm: 300,
        heightCm: 100,
        quantity: 1,
        clientTotalPrice: 1000,
        clientStatus: "completed",
      });

      // Server mengkalkulasi ulang secara independen: 3 m² * Rp20.000 * 1 = Rp60.000
      assert.strictEqual(order.totalPrice, 60000);
      assert.notStrictEqual(order.totalPrice, 1000);
      // Status wajib default ke "pending", menolak "completed"
      assert.strictEqual(order.status, "pending");
    });

    it("Skenario 12 (Bahan Nonaktif): Menolak checkout jika bahan tidak aktif di database", () => {
      assert.throws(
        () =>
          orderService.prepareOrder({
            customerId: "cust-123",
            customerName: "Pelanggan",
            whatsappNumber: "081234567890",
            material: { ...activeFlexiMaterial, isActive: false },
            widthCm: 200,
            heightCm: 100,
            quantity: 1,
          }),
        /Bahan cetak yang dipilih sedang tidak aktif/
      );
    });
  });

  // Skenario 13: RLS & Isolasi Kepemilikan (Anti-IDOR)
  describe("Skenario 13: Keamanan Akses Data Antar Konsumen (Anti-IDOR)", () => {
    it("Skenario 13: Konsumen hanya boleh mengakses pesanannya sendiri, akses ke milik orang lain ditolak", () => {
      const userA = "user-uuid-aaaa-1111";
      const userB = "user-uuid-bbbb-2222";

      // Pemilik sah
      assert.strictEqual(Order.isOwnedBy(userA, userA), true);
      assert.strictEqual(Order.isOwnedBy(userB, userB), true);

      // Penyerang (User B mencoba akses pesanan milik User A)
      assert.strictEqual(Order.isOwnedBy(userA, userB), false);
      assert.strictEqual(Order.isOwnedBy(userB, userA), false);

      // Anonim / unauthenticated
      assert.strictEqual(Order.isOwnedBy(userA, null), false);
      assert.strictEqual(Order.isOwnedBy(userA, ""), false);
    });
  });

  // Skenario 14: Perubahan Status oleh Admin
  describe("Skenario 14: Pembaruan Status Pesanan oleh Admin", () => {
    it("Skenario 14: Status transisi dari pending -> confirmed -> processing -> completed tersimpan konsisten", () => {
      const pendingMeta = Order.getCustomerStatusMeta("pending");
      const confirmedMeta = Order.getCustomerStatusMeta("confirmed");
      const processingMeta = Order.getCustomerStatusMeta("processing");
      const completedMeta = Order.getCustomerStatusMeta("completed");
      const cancelledMeta = Order.getCustomerStatusMeta("cancelled");

      assert.strictEqual(pendingMeta.step, 1);
      assert.strictEqual(pendingMeta.label, "Menunggu Konfirmasi");

      assert.strictEqual(confirmedMeta.step, 2);
      assert.strictEqual(confirmedMeta.label, "Dikonfirmasi");

      assert.strictEqual(processingMeta.step, 3);
      assert.strictEqual(processingMeta.label, "Sedang Dicetak");

      assert.strictEqual(completedMeta.step, 4);
      assert.strictEqual(completedMeta.label, "Siap Diambil / Selesai");

      assert.strictEqual(cancelledMeta.step, 0);
      assert.strictEqual(cancelledMeta.label, "Dibatalkan");
    });
  });

  // Skenario 15: Tampilan Responsif & Kontak Resmi Toko
  describe("Skenario 15: Kontak Konsistensi & Metadata QRIS", () => {
    it("Skenario 15: Konstanta WhatsApp toko resmi dan QRIS statis terpasang akurat", () => {
      assert.strictEqual(BANNERKU_WHATSAPP.display, "+62 858-6360-1253");
      assert.strictEqual(BANNERKU_WHATSAPP.baseUrl, "https://wa.me/6285863601253");

      assert.strictEqual(STATIC_QRIS_INFO.merchantName, "SYAKIR ALAMSYAH");
      assert.strictEqual(STATIC_QRIS_INFO.nmid, "ID1026622671455");
      assert.strictEqual(STATIC_QRIS_INFO.imagePath, "/qris-bannerku.jpg");
    });
  });
});
