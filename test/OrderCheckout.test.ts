import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  BANNERKU_WHATSAPP,
  Order,
  OrderService,
  STATIC_QRIS_INFO,
} from "../src/domain";

describe("Fase 10: Domain Model Order, OrderService & Anti-Manipulasi Harga", () => {
  const service = new OrderService();

  const activeFlexiMaterial = {
    id: "mat-flexi-280",
    name: "Flexi Standard 280 gram",
    pricePerSqm: 20000,
    isActive: true,
  };

  describe("1. Validasi Identitas Pemesan & Normalisasi WhatsApp (+62)", () => {
    it("harus menormalisasi nama pemesan yang valid", () => {
      assert.strictEqual(
        Order.normalizeCustomerName("   Budi   Santoso  "),
        "Budi Santoso"
      );
    });

    it("harus menolak nama pemesan kosong atau terlalu pendek", () => {
      assert.throws(() => Order.normalizeCustomerName("   "), /wajib diisi/);
      assert.throws(() => Order.normalizeCustomerName("B"), /minimal 2 karakter/);
    });

    it("harus menormalisasi berbagai format nomor WhatsApp Indonesia ke +62", () => {
      assert.strictEqual(
        Order.normalizeWhatsApp("081234567890").e164,
        "+6281234567890"
      );
      assert.strictEqual(
        Order.normalizeWhatsApp("81234567890").e164,
        "+6281234567890"
      );
      assert.strictEqual(
        Order.normalizeWhatsApp("+62 812-3456-7890").e164,
        "+6281234567890"
      );
      assert.strictEqual(
        Order.normalizeWhatsApp("6281234567890").waMeDigits,
        "6281234567890"
      );
    });

    it("harus menolak nomor WhatsApp tidak valid", () => {
      assert.throws(() => Order.normalizeWhatsApp(""), /wajib diisi/);
      assert.throws(() => Order.normalizeWhatsApp("12345"), /tidak valid/);
      assert.throws(() => Order.normalizeWhatsApp("07123456789"), /tidak valid/);
    });

    it("harus menormalisasi catatan opsional dan menolak jika melebihi 500 karakter", () => {
      assert.strictEqual(Order.normalizeNotes("   "), null);
      assert.strictEqual(
        Order.normalizeNotes("  Mata ayam 4 sudut  "),
        "Mata ayam 4 sudut"
      );
      assert.throws(
        () => Order.normalizeNotes("a".repeat(501)),
        /maksimal 500 karakter/
      );
    });
  });

  describe("2. Konstanta QRIS Statis & Format Nomor Pesanan", () => {
    it("harus memuat metadata QRIS statis resmi BannerKu sesuai aset", () => {
      assert.strictEqual(STATIC_QRIS_INFO.merchantName, "SYAKIR ALAMSYAH");
      assert.strictEqual(STATIC_QRIS_INFO.nmid, "ID1026622671455");
      assert.strictEqual(STATIC_QRIS_INFO.imagePath, "/qris-bannerku.jpg");
    });

    it("harus memformat nomor pesanan #BK dari UUID", () => {
      assert.strictEqual(
        Order.formatOrderNumber("a1b2c3d4-e5f6-7890-1234-567890abcdef"),
        "#BK-A1B2C3D4"
      );
    });
  });

  describe("3. Keamanan Harga Server-Authoritative (Anti-Manipulasi Browser)", () => {
    it("harus mengabaikan total/harga/status manipulatif dari browser dan menghitung ulang dari DB", () => {
      const order = service.prepareOrder({
        customerId: "user-123",
        customerName: "Budi Santoso",
        whatsappNumber: "081234567890",
        material: activeFlexiMaterial,
        designId: "design-001",
        designOwnedByCustomer: true,
        widthCm: 300,
        heightCm: 100,
        quantity: 2,
        notes: "Mata ayam 4 sudut, lipat tepi",
        paymentMethod: "qris_static",
        paymentProofPath: "user-123/proof-123456-qris.jpg",
        requirePaymentProof: true,
        // Simulasi payload yang dimanipulasi dari DevTools / interceptor browser
        clientUnitPrice: 1,
        clientTotalPrice: 500,
        clientAreaSqm: 0.01,
        clientStatus: "completed",
      });

      assert.strictEqual(order.areaSqm, 3);
      assert.strictEqual(order.totalAreaSqm, 6);
      assert.strictEqual(order.unitPriceSnapshot, 20000);
      assert.strictEqual(order.perBannerPrice, 60000);
      // Harus 3.00 m2 * Rp 20.000 * 2 pcs = Rp 120.000 (bukan Rp 500!)
      assert.strictEqual(order.totalPrice, 120000);
      // Status awal wajib tetap pending
      assert.strictEqual(order.status, "pending");

      const insertPayload = order.toInsertPayload();
      assert.strictEqual(insertPayload.customer_name, "Budi Santoso");
      assert.strictEqual(insertPayload.whatsapp_number, "+6281234567890");
      assert.strictEqual(insertPayload.unit_price_snapshot, 20000);
      assert.strictEqual(insertPayload.total_price, 120000);
      assert.strictEqual(insertPayload.payment_method, "qris_static");
      assert.strictEqual(
        insertPayload.payment_proof_path,
        "user-123/proof-123456-qris.jpg"
      );
      assert.strictEqual(insertPayload.status, "pending");
      assert.strictEqual(insertPayload.notes, "Mata ayam 4 sudut, lipat tepi");
    });

    it("harus menolak checkout jika bahan nonaktif di database", () => {
      assert.throws(
        () =>
          service.prepareOrder({
            customerId: "user-123",
            customerName: "Budi Santoso",
            whatsappNumber: "081234567890",
            material: { ...activeFlexiMaterial, isActive: false },
            widthCm: 300,
            heightCm: 100,
            quantity: 1,
          }),
        /tidak aktif/
      );
    });

    it("harus menolak checkout jika designId bukan milik pelanggan tersebut", () => {
      assert.throws(
        () =>
          service.prepareOrder({
            customerId: "user-123",
            customerName: "Budi Santoso",
            whatsappNumber: "081234567890",
            material: activeFlexiMaterial,
            designId: "design-orang-lain",
            designOwnedByCustomer: false,
            widthCm: 300,
            heightCm: 100,
            quantity: 1,
          }),
        /bukan milik akun Anda/
      );
    });
  });

  describe("4. Validasi Upload & Isolasi Path Bukti Pembayaran", () => {
    const validJpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const validWebp = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x24, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50, // WEBP
    ]);

    it("harus menerima file bukti transfer JPG dan WEBP dengan magic bytes sah", () => {
      const jpgResult = service.validatePaymentProofBuffer(
        { name: "bukti-qris.jpg", type: "image/jpeg", size: 2048 },
        validJpg
      );
      assert.strictEqual(jpgResult.valid, true);
      assert.strictEqual(jpgResult.canonicalMimeType, "image/jpeg");

      const webpResult = service.validatePaymentProofBuffer(
        { name: "struk-dana.webp", type: "image/webp", size: 4096 },
        validWebp
      );
      assert.strictEqual(webpResult.valid, true);
      assert.strictEqual(webpResult.canonicalMimeType, "image/webp");
    });

    it("harus menolak file bukti bayar palsu (magic bytes bukan gambar) atau melebihi 10 MB", () => {
      const fakePdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
      assert.throws(
        () =>
          service.validatePaymentProofBuffer(
            { name: "bukti.png", type: "image/png", size: 512 },
            fakePdf
          ),
        /Signature file tidak valid/
      );

      assert.throws(
        () =>
          service.validatePaymentProofMetadata({
            name: "besar.jpg",
            type: "image/jpeg",
            size: Order.MAX_PAYMENT_PROOF_BYTES + 1,
          }),
        /maksimum 10 MB/
      );
    });

    it("harus menyusun path Storage privat sesuai customer ID dan menolak path milik user lain", () => {
      const storagePath = service.buildPaymentProofStoragePath(
        "user-abc",
        "../hack/Bukti Bayar Final!!.webp",
        "image/webp"
      );
      assert.ok(storagePath.startsWith("user-abc/proof-"));
      assert.ok(!storagePath.includes(".."));
      assert.ok(storagePath.endsWith(".webp"));

      assert.throws(
        () =>
          service.prepareOrder({
            customerId: "user-abc",
            customerName: "Budi Santoso",
            whatsappNumber: "081234567890",
            material: activeFlexiMaterial,
            widthCm: 300,
            heightCm: 100,
            quantity: 1,
            requirePaymentProof: true,
            paymentProofPath: "",
          }),
        /Bukti pembayaran wajib diunggah/
      );

      assert.throws(
        () =>
          service.prepareOrder({
            customerId: "user-abc",
            customerName: "Budi Santoso",
            whatsappNumber: "081234567890",
            material: activeFlexiMaterial,
            widthCm: 300,
            heightCm: 100,
            quantity: 1,
            requirePaymentProof: true,
            paymentProofPath: "user-LAIN/proof-999.jpg",
          }),
        /direktori milik pengguna/
      );
    });
  });

  describe("Admin Order CRUD Logic (Create & Update Authoritative)", () => {
    it("harus membangun pesanan manual admin dengan status custom tervalidasi dan harga terhitung server", () => {
      const { order, payload } = service.prepareAdminOrder({
        adminId: "admin-123",
        customerName: "  Siti Rahma  ",
        whatsappNumber: "085712345678",
        material: activeFlexiMaterial,
        widthCm: 400,
        heightCm: 100,
        quantity: 2,
        status: "confirmed",
        notes: "Mata ayam 4 sudut",
      });

      assert.strictEqual(order.customerName, "Siti Rahma");
      assert.strictEqual(order.whatsappNumber, "+6285712345678");
      assert.strictEqual(order.areaSqm, 4);
      assert.strictEqual(order.totalPrice, 160000);
      assert.strictEqual(order.status, "confirmed");
      assert.strictEqual(payload.status, "confirmed");
      assert.strictEqual(payload.total_price, 160000);
      assert.strictEqual(payload.customer_id, "admin-123");
    });

    it("harus menghitung ulang total harga saat admin mengedit ukuran/bahan dan mengizinkan bahan historis nonaktif", () => {
      const inactiveMaterial = {
        ...activeFlexiMaterial,
        id: "mat-old",
        name: "Flexi Lama",
        pricePerSqm: 25000,
        isActive: false,
      };

      const updated = service.prepareAdminOrderUpdate({
        customerName: "Dewi Lestari",
        whatsappNumber: "+62 813-9999-8888",
        material: inactiveMaterial,
        widthCm: 200,
        heightCm: 150,
        quantity: 3,
        status: "processing",
        notes: "Kirim via Gojek",
      });

      assert.strictEqual(updated.customerName, "Dewi Lestari");
      assert.strictEqual(updated.whatsappNumber, "+6281399998888");
      assert.strictEqual(updated.payload.area_sqm, 3);
      assert.strictEqual(updated.payload.unit_price_snapshot, 25000);
      assert.strictEqual(updated.payload.total_price, 225000);
      assert.strictEqual(updated.payload.status, "processing");
    });

    it("harus menolak pembuatan pesanan admin baru dengan bahan nonaktif atau status tidak valid", () => {
      assert.throws(
        () =>
          service.prepareAdminOrder({
            adminId: "admin-123",
            customerName: "Andi",
            whatsappNumber: "081234567890",
            material: { ...activeFlexiMaterial, isActive: false },
            widthCm: 200,
            heightCm: 100,
            quantity: 1,
            status: "pending",
          }),
        /tidak aktif/
      );

      assert.throws(
        () =>
          service.prepareAdminOrderUpdate({
            customerName: "Andi",
            whatsappNumber: "081234567890",
            material: activeFlexiMaterial,
            widthCm: 200,
            heightCm: 100,
            quantity: 1,
            status: "hacked_status" as "pending",
          }),
        /Status pesanan tidak valid/
      );
    });
  });

  describe("Fase 12: Status Tracking & Isolasi Kepemilikan Konsumen", () => {
    it("harus mengembalikan metadata langkah timeline dan label Indonesia sesuai status", () => {
      const pending = Order.getCustomerStatusMeta("pending");
      const processing = Order.getCustomerStatusMeta("processing");
      const completed = Order.getCustomerStatusMeta("completed");
      const cancelled = Order.getCustomerStatusMeta("cancelled");

      assert.strictEqual(pending.step, 1);
      assert.strictEqual(pending.label, "Menunggu Konfirmasi");
      assert.strictEqual(processing.step, 3);
      assert.strictEqual(processing.label, "Sedang Dicetak");
      assert.strictEqual(completed.step, 4);
      assert.strictEqual(completed.tone, "emerald");
      assert.strictEqual(cancelled.step, 0);
      assert.strictEqual(cancelled.tone, "rose");
    });

    it("harus memverifikasi kepemilikan pesanan secara ketat (anti-IDOR antar konsumen)", () => {
      assert.strictEqual(Order.isOwnedBy("cust-A", "cust-A"), true);
      assert.strictEqual(Order.isOwnedBy("cust-A", "cust-B"), false);
      assert.strictEqual(Order.isOwnedBy("cust-A", ""), false);
      assert.strictEqual(Order.isOwnedBy(null, "cust-A"), false);
    });

    it("harus menyimpan kontak resmi WhatsApp toko BannerKu secara konsisten", () => {
      assert.strictEqual(BANNERKU_WHATSAPP.display, "+62 858-6360-1253");
      assert.strictEqual(BANNERKU_WHATSAPP.waMeDigits, "6285863601253");
      assert.strictEqual(BANNERKU_WHATSAPP.baseUrl, "https://wa.me/6285863601253");
      assert.strictEqual(
        Order.normalizeWhatsApp(BANNERKU_WHATSAPP.display).e164,
        `+${BANNERKU_WHATSAPP.waMeDigits}`
      );
    });
  });
});
