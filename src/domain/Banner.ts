/**
 * Domain Model: Banner
 * Merepresentasikan entitas spesifikasi fisik banner dengan validasi ukuran dan kuantitas
 */

export class Banner {
  public static readonly MIN_DIMENSION_CM = 10;
  public static readonly MAX_DIMENSION_CM = 5000;
  public static readonly MIN_QUANTITY = 1;

  private _widthCm: number;
  private _heightCm: number;
  private _quantity: number;

  constructor(widthCm: number, heightCm: number, quantity: number = 1) {
    this._widthCm = widthCm;
    this._heightCm = heightCm;
    this._quantity = quantity;
    this.validate();
  }

  public get widthCm(): number {
    return this._widthCm;
  }

  public set widthCm(value: number) {
    this._widthCm = value;
    this.validate();
  }

  public get heightCm(): number {
    return this._heightCm;
  }

  public set heightCm(value: number) {
    this._heightCm = value;
    this.validate();
  }

  public get quantity(): number {
    return this._quantity;
  }

  public set quantity(value: number) {
    this._quantity = value;
    this.validate();
  }

  /**
   * Validasi integritas data fisik banner
   * Melempar Error jika ukuran nol, negatif, di luar batas, atau kuantitas < 1
   */
  public validate(): void {
    if (
      typeof this._widthCm !== "number" ||
      isNaN(this._widthCm) ||
      this._widthCm <= 0 ||
      typeof this._heightCm !== "number" ||
      isNaN(this._heightCm) ||
      this._heightCm <= 0
    ) {
      throw new Error("Ukuran harus lebih besar dari nol");
    }

    if (
      this._widthCm < Banner.MIN_DIMENSION_CM ||
      this._heightCm < Banner.MIN_DIMENSION_CM
    ) {
      throw new Error(
        `Ukuran minimal banner adalah ${Banner.MIN_DIMENSION_CM} cm`
      );
    }

    if (
      this._widthCm > Banner.MAX_DIMENSION_CM ||
      this._heightCm > Banner.MAX_DIMENSION_CM
    ) {
      throw new Error(
        `Ukuran maksimal banner adalah ${Banner.MAX_DIMENSION_CM} cm`
      );
    }

    if (
      typeof this._quantity !== "number" ||
      isNaN(this._quantity) ||
      this._quantity < Banner.MIN_QUANTITY ||
      !Number.isInteger(this._quantity)
    ) {
      throw new Error("Harga atau jumlah tidak valid");
    }
  }

  /**
   * Menghitung luas satu lembar banner dalam meter persegi (m²)
   * Rumus: (lebar_cm / 100) * (tinggi_cm / 100)
   */
  public getArea(): number {
    return (this._widthCm / 100) * (this._heightCm / 100);
  }

  /**
   * Menghitung total luas seluruh lembar banner (m²)
   */
  public getTotalArea(): number {
    return this.getArea() * this._quantity;
  }

  /**
   * Menghitung rasio aspek (lebar : tinggi)
   */
  public getRatio(): number {
    return this._widthCm / this._heightCm;
  }

  /**
   * Mengembalikan orientasi banner
   */
  public getOrientation(): "landscape" | "portrait" | "square" {
    if (this._widthCm > this._heightCm) return "landscape";
    if (this._heightCm > this._widthCm) return "portrait";
    return "square";
  }

  /**
   * Format teks spesifikasi
   */
  public getSpecification(): string {
    const area = this.getArea().toFixed(2);
    return `${this._widthCm} × ${this._heightCm} cm (${area} m²) · ${this._quantity} pcs`;
  }
}

