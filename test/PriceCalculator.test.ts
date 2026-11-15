import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Banner } from "../src/domain/Banner";
import { PriceCalculator } from "../src/domain/PriceCalculator";

describe("Fase 8: Domain Model & Kalkulasi Harga Banner", () => {
  const calculator = new PriceCalculator();

  describe("1. Spesifikasi Standar README (300 × 100 cm)", () => {
    it("harus menghasilkan luas 3 m² dan total Rp60.000 untuk 300x100 cm, tarif Rp20.000/m², jumlah 1", () => {
      const widthCm = 300;
      const heightCm = 100;
      const pricePerSqm = 20000;
      const quantity = 1;

      const area = calculator.calculateArea(widthCm, heightCm);
      const total = calculator.calculateTotal(
        widthCm,
        heightCm,
        pricePerSqm,
        quantity
      );

      assert.strictEqual(area, 3, "Luas 300x100 cm harus tepat 3.0 m²");
      assert.strictEqual(
        total,
        60000,
        "Total 3 m² × Rp20.000 × 1 harus tepat Rp60.000"
      );
    });

    it("harus menghasilkan breakdown kalkulasi yang akurat dan deskripsi rumus transparan", () => {
      const breakdown = calculator.calculateBreakdown({
        widthCm: 300,
        heightCm: 100,
        pricePerSqm: 20000,
        quantity: 1,
      });

      assert.strictEqual(breakdown.areaSqm, 3);
      assert.strictEqual(breakdown.unitPrice, 60000);
      assert.strictEqual(breakdown.totalPrice, 60000);
      assert.strictEqual(breakdown.formattedArea, "3.00 m²");
      assert.match(breakdown.formattedTotal, /60\.000/);
      assert.match(breakdown.formulaDescription, /300 cm × 100 cm/);
    });
  });

  describe("2. Kalkulasi Multi-Kuantitas & Bahan Lain", () => {
    it("harus menghitung benar untuk 200 × 150 cm Flexi 340g (Rp28.000/m²) jumlah 2", () => {
      // Luas = (200/100) * (150/100) = 2 * 1.5 = 3 m²
      // Harga per lembar = 3 * 28.000 = Rp84.000
      // Total 2 lembar = Rp168.000
      const widthCm = 200;
      const heightCm = 150;
      const pricePerSqm = 28000;
      const quantity = 2;

      const area = calculator.calculateArea(widthCm, heightCm);
      const total = calculator.calculateTotal(
        widthCm,
        heightCm,
        pricePerSqm,
        quantity
      );

      assert.strictEqual(area, 3);
      assert.strictEqual(total, 168000);
    });

    it("harus menghitung benar dari objek class Banner", () => {
      const banner = new Banner(200, 100, 3);
      assert.strictEqual(banner.getArea(), 2);
      assert.strictEqual(banner.getTotalArea(), 6);

      const total = calculator.calculateTotalFromBanner(banner, 45000);
      // 2 m² * 45.000 * 3 pcs = Rp270.000
      assert.strictEqual(total, 270000);
    });
  });

  describe("3. Pengujian Penolakan Input Nol & Negatif (Validation)", () => {
    it("harus menolak lebar nol (0)", () => {
      assert.throws(
        () => calculator.calculateArea(0, 100),
        /Ukuran harus lebih besar dari nol/
      );
      assert.throws(
        () => new Banner(0, 100, 1),
        /Ukuran harus lebih besar dari nol/
      );
    });

    it("harus menolak tinggi nol (0)", () => {
      assert.throws(
        () => calculator.calculateArea(300, 0),
        /Ukuran harus lebih besar dari nol/
      );
      assert.throws(
        () => new Banner(300, 0, 1),
        /Ukuran harus lebih besar dari nol/
      );
    });

    it("harus menolak lebar negatif", () => {
      assert.throws(
        () => calculator.calculateArea(-300, 100),
        /Ukuran harus lebih besar dari nol/
      );
      assert.throws(
        () => new Banner(-300, 100, 1),
        /Ukuran harus lebih besar dari nol/
      );
    });

    it("harus menolak tinggi negatif", () => {
      assert.throws(
        () => calculator.calculateArea(300, -100),
        /Ukuran harus lebih besar dari nol/
      );
      assert.throws(
        () => new Banner(300, -100, 1),
        /Ukuran harus lebih besar dari nol/
      );
    });

    it("harus menolak harga per m² negatif", () => {
      assert.throws(
        () => calculator.calculateTotal(300, 100, -20000, 1),
        /Harga atau jumlah tidak valid/
      );
    });

    it("harus menolak jumlah (quantity) kurang dari 1 atau desimal", () => {
      assert.throws(
        () => calculator.calculateTotal(300, 100, 20000, 0),
        /Harga atau jumlah tidak valid/
      );
      assert.throws(
        () => calculator.calculateTotal(300, 100, 20000, -1),
        /Harga atau jumlah tidak valid/
      );
      assert.throws(
        () => new Banner(300, 100, 0),
        /Harga atau jumlah tidak valid/
      );
    });

    it("harus menolak input kosong / NaN", () => {
      assert.throws(
        () => calculator.calculateArea(Number(""), 100),
        /Ukuran harus lebih besar dari nol/
      );
      assert.throws(
        () => calculator.calculateArea(NaN, 100),
        /Ukuran harus lebih besar dari nol/
      );
    });
  });

  describe("4. Pengujian Fitur Enkapsulasi Class Banner", () => {
    it("harus menghitung orientasi dan rasio dengan tepat", () => {
      const landscape = new Banner(300, 100);
      assert.strictEqual(landscape.getOrientation(), "landscape");
      assert.strictEqual(landscape.getRatio(), 3);

      const portrait = new Banner(100, 200);
      assert.strictEqual(portrait.getOrientation(), "portrait");
      assert.strictEqual(portrait.getRatio(), 0.5);

      const square = new Banner(150, 150);
      assert.strictEqual(square.getOrientation(), "square");
      assert.strictEqual(square.getRatio(), 1);
    });

    it("harus menghasilkan teks spesifikasi yang rapi", () => {
      const banner = new Banner(300, 100, 2);
      assert.strictEqual(banner.getSpecification(), "300 × 100 cm (3.00 m²) · 2 pcs");
    });

    it("harus memvalidasi batas dimensi minimum dan maksimum", () => {
      assert.throws(
        () => new Banner(5, 100),
        /Ukuran minimal banner adalah 10 cm/
      );
      assert.throws(
        () => new Banner(6000, 100),
        /Ukuran maksimal banner adalah 5000 cm/
      );
    });
  });
});

