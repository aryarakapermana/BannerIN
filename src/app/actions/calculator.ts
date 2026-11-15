"use server";

import { createClient } from "@/lib/supabase/server";
import { PriceCalculator, Banner, type PriceBreakdown } from "@/domain";

export interface CalculatePriceResult {
  success: boolean;
  error?: string;
  data?: PriceBreakdown & {
    materialName: string;
    unitPriceSnapshot: number;
  };
}

/**
 * Server Action: Menghitung ulang harga banner secara aman di sisi server
 * Mengambil harga bahan terbaru langsung dari basis data Supabase
 */
export async function calculatePriceAction(input: {
  widthCm: number;
  heightCm: number;
  materialId: string;
  quantity: number;
}): Promise<CalculatePriceResult> {
  try {
    const { widthCm, heightCm, materialId, quantity } = input;

    // 1. Validasi dimensi dengan entitas domain Banner
    const banner = new Banner(widthCm, heightCm, quantity);

    // 2. Ambil harga bahan terbaru dari Supabase
    const supabase = await createClient();
    const { data: material, error: matErr } = await supabase
      .from("materials")
      .select("id, name, price_per_sqm, is_active")
      .eq("id", materialId)
      .single();

    if (matErr || !material) {
      return { success: false, error: "Bahan yang dipilih tidak ditemukan." };
    }

    if (!material.is_active) {
      return { success: false, error: "Bahan yang dipilih saat ini tidak aktif." };
    }

    const pricePerSqm = Number(material.price_per_sqm);

    // 3. Hitung harga menggunakan domain PriceCalculator
    const calculator = new PriceCalculator();
    const breakdown = calculator.calculateBreakdown({
      widthCm: banner.widthCm,
      heightCm: banner.heightCm,
      pricePerSqm,
      quantity: banner.quantity,
    });

    return {
      success: true,
      data: {
        ...breakdown,
        materialName: material.name,
        unitPriceSnapshot: pricePerSqm,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menghitung harga di server.",
    };
  }
}

