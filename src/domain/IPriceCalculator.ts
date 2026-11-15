/**
 * Domain Model: IPriceCalculator
 * Kontrak antarmuka untuk kalkulasi luas dan harga banner
 */

export interface PriceCalculationInput {
  widthCm: number;
  heightCm: number;
  pricePerSqm: number;
  quantity: number;
}

export interface PriceBreakdown {
  widthCm: number;
  heightCm: number;
  areaSqm: number;
  pricePerSqm: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  formattedArea: string;
  formattedTotal: string;
  formulaDescription: string;
}

export interface IPriceCalculator {
  calculateArea(widthCm: number, heightCm: number): number;
  calculateTotal(
    widthCm: number,
    heightCm: number,
    pricePerSqm: number,
    quantity: number
  ): number;
  calculateBreakdown(input: PriceCalculationInput): PriceBreakdown;
}

