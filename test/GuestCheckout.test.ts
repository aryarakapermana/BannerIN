import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  Banner,
  Design,
  Order,
  designEditorService,
  orderService,
  type EditorConfig,
} from "../src/domain";

describe("Fase 15: Guest Checkout (Hybrid) Domain & Service Tests", () => {
  const dummyEditorConfig: EditorConfig = {
    version: 1,
    canvasWidthPx: 600,
    canvasHeightPx: 200,
    bannerWidthCm: 300,
    bannerHeightCm: 100,
    aspectRatio: "3:1",
    lockProportions: true,
    showBleedGrommets: true,
    imageTransform: {
      left: 300,
      top: 100,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      originX: "center",
      originY: "center",
    },
  };

  describe("1. Guest Design & Storage Paths", () => {
    it("harus menyusun path Storage tamu di dalam folder guest/", () => {
      const paths = designEditorService.buildStoragePaths(
        null,
        "spanduk-tamu.png",
        "image/png"
      );
      assert.match(paths.originalPath, /^guest\/original\/\d+-[a-f0-9-]+-spanduk-tamu\.png$/);
      assert.match(paths.previewPath, /^guest\/preview\/\d+-[a-f0-9-]+-spanduk-tamu-preview\.png$/);
    });

    it("harus membuat entitas Design tamu dengan customerId null dan payload yang sesuai", () => {
      const paths = designEditorService.buildStoragePaths(
        undefined,
        "sample.jpg",
        "image/jpeg"
      );
      const guestDesign = new Design({
        customerId: null,
        originalFilePath: paths.originalPath,
        previewFilePath: paths.previewPath,
        fileType: "image/jpeg",
        editorConfig: dummyEditorConfig,
      });

      assert.equal(guestDesign.customerId, null);
      const payload = guestDesign.toInsertPayload();
      assert.equal(payload.customer_id, null);
      assert.equal(payload.original_file_path, paths.originalPath);
    });

    it("harus menolak entitas Design tamu jika path file tidak diawali 'guest/'", () => {
      assert.throws(
        () =>
          new Design({
            customerId: null,
            originalFilePath: "user-123/original/test.jpg",
            fileType: "image/jpeg",
            editorConfig: dummyEditorConfig,
          }),
        /Path file tamu harus berada di dalam direktori guest/
      );
    });
  });

  describe("2. Guest Payment Proof & Path Isolation", () => {
    it("harus menyusun path bukti pembayaran tamu di dalam folder guest/", () => {
      const proofPath = orderService.buildPaymentProofStoragePath(
        null,
        "transfer-qris.png",
        "image/png"
      );
      assert.match(proofPath, /^guest\/proof-\d+-[a-f0-9-]+-transfer-qris\.png$/);
    });

    it("harus menerima path bukti pembayaran tamu yang valid", () => {
      const validGuestPath = "guest/proof-123456789-abc-transfer.jpg";
      const verified = Order.validatePaymentProofPath(null, validGuestPath);
      assert.equal(verified, validGuestPath);
    });

    it("harus menolak path bukti pembayaran tamu jika mencoba traversal atau mengakses direktori lain", () => {
      assert.throws(
        () => Order.validatePaymentProofPath(null, "user-secret/proof.jpg"),
        /Path bukti pembayaran tamu harus berada di direktori guest/
      );
      assert.throws(
        () => Order.validatePaymentProofPath(null, "guest/../sensitive/proof.jpg"),
        /Path bukti pembayaran tidak valid/
      );
    });
  });

  describe("3. Guest Order Creation & Tracking Token", () => {
    const dummyMaterial = {
      id: "mat-flexi-standard",
      name: "Flexi Standard 280g",
      pricePerSqm: 20000,
      isActive: true,
    };

    it("harus berhasil menyusun pesanan tamu tanpa customerId dan menghasilkan trackingToken", () => {
      const mockTrackingToken = "trk-550e8400-e29b-41d4-a716-446655440000";
      const order = orderService.prepareOrder({
        customerId: null,
        trackingToken: mockTrackingToken,
        customerName: "Budi Santoso (Tamu)",
        whatsappNumber: "081234567890",
        material: dummyMaterial,
        widthCm: 300,
        heightCm: 100,
        quantity: 2,
        paymentProofPath: "guest/proof-123-bukti.png",
        requirePaymentProof: true,
      });

      assert.equal(order.customerId, null);
      assert.equal(order.trackingToken, mockTrackingToken);
      assert.equal(order.customerName, "Budi Santoso (Tamu)");
      assert.equal(order.whatsappNumber, "+6281234567890");
      assert.equal(order.totalPrice, 120000); // 3 m² * Rp20.000 * 2 pcs

      const payload = order.toInsertPayload();
      assert.equal(payload.customer_id, null);
      assert.equal(payload.tracking_token, mockTrackingToken);
      assert.equal(payload.status, "pending");
    });

    it("harus membedakan kepemilikan pesanan: isOwnedBy false untuk guest atau id yang tidak cocok", () => {
      assert.equal(Order.isOwnedBy(null, "user-uuid-123"), false);
      assert.equal(Order.isOwnedBy("user-uuid-123", null), false);
      assert.equal(Order.isOwnedBy("user-uuid-123", "user-uuid-456"), false);
      assert.equal(Order.isOwnedBy("user-uuid-123", "user-uuid-123"), true);
    });
  });
});
