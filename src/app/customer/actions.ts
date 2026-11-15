"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Order } from "@/domain";

export interface UpdateProfileResult {
  success: boolean;
  error?: string;
  fullName?: string;
  phone?: string;
}

/**
 * Memperbarui nama lengkap & nomor WhatsApp pelanggan pada `public.profiles`.
 * RLS `profiles_update_own_prevent_role_escalation` memastikan pelanggan tidak bisa mengubah `role`.
 */
export async function updateCustomerProfileAction(input: {
  fullName: string;
  phone: string;
}): Promise<UpdateProfileResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Sesi login tidak ditemukan. Silakan masuk kembali.",
      };
    }

    const cleanName = Order.normalizeCustomerName(input.fullName);
    const normalizedPhone = Order.normalizeWhatsApp(input.phone).display;

    const { data: updated, error } = await supabase
      .from("profiles")
      .update({
        full_name: cleanName,
        phone: normalizedPhone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select("id")
      .maybeSingle();

    if (error || !updated) {
      return {
        success: false,
        error: error?.message || "Gagal memperbarui profil Anda.",
      };
    }

    revalidatePath("/customer/dashboard");
    revalidatePath("/checkout");
    return {
      success: true,
      fullName: cleanName,
      phone: normalizedPhone,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Gagal memperbarui profil Anda.",
    };
  }
}

