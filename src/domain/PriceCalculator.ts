import { Banner } from "./Banner";
import type {
  IPriceCalculator,
  PriceCalculationInput,
  PriceBreakdown,
} from "./IPriceCalculator";

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

/**
 * Domain Service: PriceCalculator
 * Menangani kalkulasi luas dan harga banner secara presisi dan konsisten
 * Digunakan secara identik di frontend (preview/kalkulator) dan backend (order recalculation)
 */
export class PriceCalculator implements IPriceCalculator {
  /**
   * Menghitung luas dalam meter persegi (m²)
   * Rumus: (lebar_cm / 100) * (tinggi_cm / 100)
   */
  public calculateArea(widthCm: number, heightCm: number): number {
    if (
      typeof widthCm !== "number" ||
      isNaN(widthCm) ||
      widthCm <= 0 ||
      typeof heightCm !== "number" ||
      isNaN(heightCm) ||
      heightCm <= 0
    ) {
      throw new Error("Ukuran harus lebih besar dari nol");
    }

    return (widthCm / 100) * (heightCm / 100);
  }

  /**
   * Menghitung total harga banner
   * Rumus: luas_m2 * harga_per_m2 * jumlah
   */
  public calculateTotal(
    widthCm: number,
    heightCm: number,
    pricePerSqm: number,
    quantity: number
  ): number {
    const area = this.calculateArea(widthCm, heightCm);

    if (
      typeof pricePerSqm !== "number" ||
      isNaN(pricePerSqm) ||
      pricePerSqm < 0 ||
      typeof quantity !== "number" ||
      isNaN(quantity) ||
      quantity < 1
    ) {
      throw new Error("Harga atau jumlah tidak valid");
    }

    // Pembulatan ke atas (rupiah) untuk kepastian transaksi percetakan
    return Math.ceil(area * pricePerSqm * quantity);
  }

  /**
   * Menghitung total harga langsung dari objek Banner
   */
  public calculateTotalFromBanner(banner: Banner, pricePerSqm: number): number {
    if (typeof pricePerSqm !== "number" || isNaN(pricePerSqm) || pricePerSqm < 0) {
      throw new Error("Harga atau jumlah tidak valid");
    }

    return Math.ceil(banner.getArea() * pricePerSqm * banner.quantity);
  }

  /**
   * Menghasilkan rincian kalkulasi lengkap dan deskripsi rumus transparan
   */
  public calculateBreakdown(input: PriceCalculationInput): PriceBreakdown {
    const { widthCm, heightCm, pricePerSqm, quantity } = input;
    const areaSqm = this.calculateArea(widthCm, heightCm);
    const unitPrice = Math.ceil(areaSqm * pricePerSqm);
    const totalPrice = this.calculateTotal(widthCm, heightCm, pricePerSqm, quantity);

    const formattedArea = `${areaSqm.toFixed(2)} m²`;
    const formattedTotal = rupiahFormatter.format(totalPrice);
    const formulaDescription = `${widthCm} cm × ${heightCm} cm = ${areaSqm.toFixed(
      2
    )} m² × ${rupiahFormatter.format(pricePerSqm)} × ${quantity} pcs = ${formattedTotal}`;

    return {
      widthCm,
      heightCm,
      areaSqm,
      pricePerSqm,
      quantity,
      unitPrice,
      totalPrice,
      formattedArea,
      formattedTotal,
      formulaDescription,
    };
  }
}

/**
 * Singleton instance untuk kemudahan pakai ulang
 */
export const priceCalculator = new PriceCalculator();

