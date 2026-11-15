import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Design, DesignEditorService } from "../src/domain";

describe("Fase 9: Domain Model Design & DesignEditorService", () => {
  const service = new DesignEditorService();

  // Sample magic bytes header valid
  const validJpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
  const validPngBytes = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
  ]);

  describe("1. Validasi Metadata & Biner File Desain (Server & Client)", () => {
    it("harus menerima file JPG/JPEG yang valid beserta magic bytes JPEG", () => {
      const result = service.validateFileBuffer(
        { name: "spanduk-promo.jpg", type: "image/jpeg", size: 1024 * 500 },
        validJpegBytes
      );
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.canonicalMimeType, "image/jpeg");
      assert.strictEqual(result.extension, "jpg");
    });

    it("harus menerima file PNG yang valid beserta magic bytes PNG", () => {
      const result = service.validateFileBuffer(
        { name: "backdrop.PNG", type: "image/png", size: 2048 },
        validPngBytes
      );
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.canonicalMimeType, "image/png");
      assert.strictEqual(result.extension, "png");
    });

    it("harus menolak format file di luar JPG/JPEG/PNG seperti PDF atau SVG", () => {
      assert.throws(
        () =>
          service.validateFileMetadata({
            name: "desain.pdf",
            type: "application/pdf",
            size: 1024,
          }),
        /Ekstensi file tidak didukung/
      );

      assert.throws(
        () =>
          service.validateFileMetadata({
            name: "vektor.svg",
            type: "image/svg+xml",
            size: 1024,
          }),
        /Ekstensi file tidak didukung/
      );
    });

    it("harus menolak file palsu yang ekstensinya .png tetapi isi binernya bukan PNG/JPEG (magic bytes check)", () => {
      const spoofedPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
      assert.throws(
        () =>
          service.validateFileBuffer(
            { name: "palsu.png", type: "image/png", size: 512 },
            spoofedPdfBytes
          ),
        /Signature file tidak valid/
      );
    });

    it("harus menolak file kosong (0 byte) atau melebihi batas 20 MB", () => {
      assert.throws(
        () =>
          service.validateFileMetadata({
            name: "kosong.jpg",
            type: "image/jpeg",
            size: 0,
          }),
        /kosong \(0 byte\)/
      );

      assert.throws(
        () =>
          service.validateFileMetadata({
            name: "terlalu-besar.png",
            type: "image/png",
            size: Design.MAX_FILE_SIZE_BYTES + 1,
          }),
        /melebihi batas maksimum 20 MB/
      );
    });
  });

  describe("2. Keamanan Path Storage Privat & Dimensi Kanvas Fabric.js", () => {
    it("harus menyusun path Storage di dalam folder customer ID dan membersihkan path traversal", () => {
      const customerId = "user-123-abc";
      const paths = service.buildStoragePaths(
        customerId,
        "../../hack/Spanduk Promo!! Final.png",
        "image/png"
      );

      assert.ok(paths.originalPath.startsWith(`${customerId}/original/`));
      assert.ok(paths.originalPath.endsWith(".png"));
      assert.ok(!paths.originalPath.includes(".."));
      assert.ok(paths.previewPath.startsWith(`${customerId}/preview/`));
      assert.ok(paths.previewPath.endsWith("-preview.png"));
    });

    it("harus menghitung ukuran kanvas Fabric.js sesuai rasio banner", () => {
      // 300 x 100 cm -> rasio 3:1 dalam area max 600 x 300 => 600 x 200 px
      const landscape = service.computeCanvasDimensions(300, 100, 600, 300);
      assert.strictEqual(landscape.widthPx, 600);
      assert.strictEqual(landscape.heightPx, 200);

      // 100 x 200 cm -> rasio 1:2 dalam area max 600 x 300 => 150 x 300 px
      const portrait = service.computeCanvasDimensions(100, 200, 600, 300);
      assert.strictEqual(portrait.widthPx, 150);
      assert.strictEqual(portrait.heightPx, 300);
    });
  });

  describe("3. Enkapsulasi Class Domain Design", () => {
    it("harus memvalidasi kepemilikan path privat dan menghasilkan payload insert tabel designs", () => {
      const config = service.normalizeEditorConfig({
        bannerWidthCm: 300,
        bannerHeightCm: 100,
        canvasWidthPx: 540,
        canvasHeightPx: 180,
        lockProportions: true,
        showBleedGrommets: true,
        imageTransform: {
          left: 270,
          top: 90,
          scaleX: 0.45,
          scaleY: 0.45,
          angle: 0,
          originX: "center",
          originY: "center",
        },
      });

      const design = new Design({
        customerId: "cust-001",
        originalFilePath: "cust-001/original/123-banner.jpg",
        previewFilePath: "cust-001/preview/123-banner-preview.png",
        fileType: "image/jpeg",
        editorConfig: config,
      });

      const payload = design.toInsertPayload();
      assert.strictEqual(payload.customer_id, "cust-001");
      assert.strictEqual(payload.file_type, "image/jpeg");
      assert.strictEqual(config.lockProportions, true);

      // Harus menolak jika path Storage tidak berada di folder milik customer tersebut
      assert.throws(
        () =>
          new Design({
            customerId: "cust-001",
            originalFilePath: "cust-LAIN/original/123-banner.jpg",
            fileType: "image/jpeg",
            editorConfig: config,
          }),
        /direktori milik pengguna/
      );
    });
  });
});

