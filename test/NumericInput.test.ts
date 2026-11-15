import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeNumericText } from "../src/lib/numeric";

describe("Normalisasi Input Numerik (NumericInput)", () => {
  it("harus mengembalikan string kosong saat kolom dihapus habis", () => {
    assert.strictEqual(normalizeNumericText(""), "");
  });

  it("harus mempertahankan angka 0 tunggal saat diketik manual", () => {
    assert.strictEqual(normalizeNumericText("0"), 0);
  });

  it("harus menghapus angka 0 di depan ketika mengetik angka manual (mis. 0250 -> 250)", () => {
    assert.strictEqual(normalizeNumericText("0250"), 250);
    assert.strictEqual(normalizeNumericText("0150"), 150);
    assert.strictEqual(normalizeNumericText("00025000"), 25000);
    assert.strictEqual(normalizeNumericText("00"), 0);
  });

  it("harus membersihkan karakter non-digit dari tempelan teks seperti format rupiah", () => {
    assert.strictEqual(normalizeNumericText("Rp 25.000"), 25000);
    assert.strictEqual(normalizeNumericText("300 cm"), 300);
    assert.strictEqual(normalizeNumericText("-50"), 50);
  });
});

