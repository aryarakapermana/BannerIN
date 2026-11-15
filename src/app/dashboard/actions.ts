"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { Order, orderService } from "@/domain";
import type { OrderStatus } from "@/types/database";

export interface MaterialActionResult {
  success: boolean;
  error?: string;
  material?: {
    id: string;
    name: string;
    description: string | null;
    price_per_sqm: number;
    is_active: boolean;
  };
}

/**
 * 1. Tambah bahan baru (Khusus Admin)
 */
export async function createMaterialAction(data: {
  name: string;
  description?: string;
  price_per_sqm: number;
  is_active?: boolean;
}): Promise<MaterialActionResult> {
  try {
    await requireAuth("admin");

    const name = data.name?.trim();
    if (!name) {
      return { success: false, error: "Nama bahan wajib diisi." };
    }

    const price = Number(data.price_per_sqm);
    if (isNaN(price) || price < 0) {
      return { success: false, error: "Harga per m² tidak boleh negatif atau kosong." };
    }

    const supabase = await createClient();
    const { data: newMaterial, error } = await supabase
      .from("materials")
      .insert({
        name,
        description: data.description?.trim() || null,
        price_per_sqm: price,
        is_active: data.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      material: {
        id: newMaterial.id,
        name: newMaterial.name,
        description: newMaterial.description,
        price_per_sqm: Number(newMaterial.price_per_sqm),
        is_active: newMaterial.is_active,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Terjadi kesalahan saat menambah bahan.",
    };
  }
}

/**
 * 2. Perbarui detail bahan lengkap (Khusus Admin)
 */
export async function updateMaterialAction(data: {
  id: string;
  name: string;
  description?: string;
  price_per_sqm: number;
  is_active: boolean;
}): Promise<MaterialActionResult> {
  try {
    await requireAuth("admin");

    if (!data.id) {
      return { success: false, error: "ID bahan tidak valid." };
    }

    const name = data.name?.trim();
    if (!name) {
      return { success: false, error: "Nama bahan wajib diisi." };
    }

    const price = Number(data.price_per_sqm);
    if (isNaN(price) || price < 0) {
      return { success: false, error: "Harga per m² tidak boleh negatif." };
    }

    const supabase = await createClient();
    const { data: updatedMaterial, error } = await supabase
      .from("materials")
      .update({
        name,
        description: data.description?.trim() || null,
        price_per_sqm: price,
        is_active: data.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      material: {
        id: updatedMaterial.id,
        name: updatedMaterial.name,
        description: updatedMaterial.description,
        price_per_sqm: Number(updatedMaterial.price_per_sqm),
        is_active: updatedMaterial.is_active,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui bahan.",
    };
  }
}

/**
 * 3. Quick Edit Harga per m² (Khusus Admin)
 */
export async function updateMaterialPriceAction(
  materialId: string,
  price: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth("admin");

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return { success: false, error: "Harga per m² tidak boleh negatif." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("materials")
      .update({ price_per_sqm: numPrice, updated_at: new Date().toISOString() })
      .eq("id", materialId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memperbarui harga bahan.",
    };
  }
}

/**
 * 4. Toggle Status Aktif/Nonaktif Bahan (Khusus Admin)
 */
export async function toggleMaterialStatusAction(
  materialId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth("admin");
    const supabase = await createClient();
    const { error } = await supabase
      .from("materials")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", materialId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memperbarui status bahan.",
    };
  }
}

/**
 * 5. Hapus Bahan (Khusus Admin)
 */
export async function deleteMaterialAction(
  materialId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth("admin");
    const supabase = await createClient();

    // Periksa apakah bahan sudah dipakai pada pesanan yang ada
    const { count, error: countErr } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("material_id", materialId);

    if (countErr) {
      return { success: false, error: countErr.message };
    }

    if (count && count > 0) {
      // Jika sudah ada pesanan terkait, nonaktifkan bahan alih-alih menghapus fisik (soft-delete)
      const { error: deactivateErr } = await supabase
        .from("materials")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", materialId);

      if (deactivateErr) {
        return { success: false, error: deactivateErr.message };
      }
      return {
        success: true,
        error: "Bahan ini memiliki riwayat transaksi, sehingga statusnya dinonaktifkan alih-alih dihapus permanen.",
      };
    }

    const { error } = await supabase.from("materials").delete().eq("id", materialId);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menghapus bahan.",
    };
  }
}

export interface AdminOrderActionDTO {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  materialId: string;
  material: string;
  width: number;
  height: number;
  quantity: number;
  areaSqm: number;
  total: number;
  status: OrderStatus;
  notes: string | null;
  paymentMethod: string;
  createdAt: string;
  dateFormatted: string;
}

export interface AdminOrderActionResult {
  success: boolean;
  error?: string;
  order?: AdminOrderActionDTO;
}

async function fetchAuthoritativeMaterial(
  supabase: Awaited<ReturnType<typeof createClient>>,
  materialId: string
) {
  const cleanId = materialId?.trim();
  if (!cleanId) {
    throw new Error("Bahan cetak wajib dipilih.");
  }

  const { data: matRow, error: matError } = await supabase
    .from("materials")
    .select("id, name, price_per_sqm, is_active")
    .eq("id", cleanId)
    .maybeSingle();

  if (matError) {
    throw new Error(matError.message);
  }
  if (!matRow) {
    throw new Error("Bahan cetak tidak ditemukan di katalog.");
  }

  return {
    id: matRow.id,
    name: matRow.name,
    pricePerSqm: Number(matRow.price_per_sqm),
    isActive: Boolean(matRow.is_active),
  };
}

function formatOrderTimestamps(isoDate?: string | null) {
  const dateObj = isoDate ? new Date(isoDate) : new Date();
  return {
    createdAt: dateObj.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    dateFormatted: dateObj.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };
}

/**
 * 6. Update Status Pesanan (Khusus Admin)
 */
export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth("admin");
    const validatedStatus = Order.validateStatus(status);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .update({ status: validatedStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .select("id")
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }
    if (!data) {
      return {
        success: false,
        error: "Pesanan tidak ditemukan atau tidak dapat diperbarui.",
      };
    }

    revalidatePath("/dashboard");
    revalidatePath("/customer/dashboard");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memperbarui status pesanan.",
    };
  }
}

/**
 * 7. Tambah Pesanan Manual Baru (Khusus Admin — Create)
 */
export async function adminCreateOrderAction(input: {
  customerName: string;
  whatsappNumber: string;
  materialId: string;
  widthCm: number;
  heightCm: number;
  quantity: number;
  status?: OrderStatus;
  notes?: string | null;
}): Promise<AdminOrderActionResult> {
  try {
    const adminProfile = await requireAuth("admin");
    const supabase = await createClient();
    const material = await fetchAuthoritativeMaterial(supabase, input.materialId);

    const { order, payload } = orderService.prepareAdminOrder({
      adminId: adminProfile.id,
      customerName: input.customerName,
      whatsappNumber: input.whatsappNumber,
      material,
      widthCm: Number(input.widthCm),
      heightCm: Number(input.heightCm),
      quantity: Number(input.quantity),
      status: input.status ?? "pending",
      notes: input.notes,
      paymentMethod: "qris_static",
    });

    const { data: inserted, error } = await supabase
      .from("orders")
      .insert(payload)
      .select("id, created_at")
      .single();

    if (error || !inserted) {
      const msg = error?.message || "Gagal membuat pesanan.";
      if (msg.toLowerCase().includes("row-level security")) {
        return {
          success: false,
          error:
            "Akses INSERT admin pada tabel orders belum aktif di database. Jalankan migrasi 20261112000002_orders_admin_crud_rls.sql terlebih dahulu.",
        };
      }
      return { success: false, error: msg };
    }

    const timestamps = formatOrderTimestamps(inserted.created_at);
    revalidatePath("/dashboard");
    revalidatePath("/customer/dashboard");

    return {
      success: true,
      order: {
        id: inserted.id,
        orderNumber: Order.formatOrderNumber(inserted.id),
        customerName: order.customerName,
        customerPhone: order.whatsappNumber,
        materialId: order.materialId,
        material: order.materialName,
        width: order.widthCm,
        height: order.heightCm,
        quantity: order.quantity,
        areaSqm: order.areaSqm,
        total: order.totalPrice,
        status: order.status,
        notes: order.notes,
        paymentMethod: order.paymentMethod,
        createdAt: timestamps.createdAt,
        dateFormatted: timestamps.dateFormatted,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menambahkan pesanan baru.",
    };
  }
}

/**
 * 8. Ubah Detail & Spesifikasi Pesanan (Khusus Admin — Update)
 */
export async function adminUpdateOrderAction(input: {
  orderId: string;
  customerName: string;
  whatsappNumber: string;
  materialId: string;
  widthCm: number;
  heightCm: number;
  quantity: number;
  status: OrderStatus;
  notes?: string | null;
}): Promise<AdminOrderActionResult> {
  try {
    await requireAuth("admin");
    const orderId = input.orderId?.trim();
    if (!orderId) {
      return { success: false, error: "ID pesanan tidak valid." };
    }

    const supabase = await createClient();
    const material = await fetchAuthoritativeMaterial(supabase, input.materialId);
    const prepared = orderService.prepareAdminOrderUpdate({
      customerName: input.customerName,
      whatsappNumber: input.whatsappNumber,
      material,
      widthCm: Number(input.widthCm),
      heightCm: Number(input.heightCm),
      quantity: Number(input.quantity),
      status: input.status,
      notes: input.notes,
    });

    const { data: updated, error } = await supabase
      .from("orders")
      .update({
        ...prepared.payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select("id, created_at, payment_method")
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }
    if (!updated) {
      return {
        success: false,
        error: "Pesanan tidak ditemukan atau tidak memiliki izin perubahan.",
      };
    }

    const timestamps = formatOrderTimestamps(updated.created_at);
    revalidatePath("/dashboard");
    revalidatePath("/customer/dashboard");

    return {
      success: true,
      order: {
        id: updated.id,
        orderNumber: Order.formatOrderNumber(updated.id),
        customerName: prepared.customerName,
        customerPhone: prepared.whatsappNumber,
        materialId: material.id,
        material: material.name,
        width: prepared.quote.breakdown.widthCm,
        height: prepared.quote.breakdown.heightCm,
        quantity: prepared.quote.breakdown.quantity,
        areaSqm: prepared.quote.breakdown.areaSqm,
        total: Math.ceil(prepared.quote.breakdown.totalPrice),
        status: prepared.status,
        notes: prepared.notes,
        paymentMethod: updated.payment_method ?? "qris_static",
        createdAt: timestamps.createdAt,
        dateFormatted: timestamps.dateFormatted,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memperbarui data pesanan.",
    };
  }
}

/**
 * 9. Hapus Pesanan Permanen & Bersihkan Bukti Pembayaran (Khusus Admin — Delete)
 */
export async function deleteOrderAction(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth("admin");
    const cleanId = orderId?.trim();
    if (!cleanId) {
      return { success: false, error: "ID pesanan tidak valid." };
    }

    const supabase = await createClient();

    const { data: existing, error: fetchErr } = await supabase
      .from("orders")
      .select("id, payment_proof_path")
      .eq("id", cleanId)
      .maybeSingle();

    if (fetchErr) {
      return { success: false, error: fetchErr.message };
    }
    if (!existing) {
      return { success: false, error: "Pesanan tidak ditemukan." };
    }

    const { data: deleted, error: deleteErr } = await supabase
      .from("orders")
      .delete()
      .eq("id", cleanId)
      .select("id")
      .maybeSingle();

    if (deleteErr) {
      return { success: false, error: deleteErr.message };
    }
    if (!deleted) {
      return {
        success: false,
        error:
          "Penghapusan pesanan diblokir oleh policy database (RLS). Pastikan migrasi 20261112000002_orders_admin_crud_rls.sql sudah dijalankan ke Supabase.",
      };
    }

    if (existing.payment_proof_path) {
      // Pembersihan best-effort pada storage privat agar tidak gagal memblokir hapus order
      await supabase.storage
        .from(Order.PAYMENT_PROOF_BUCKET)
        .remove([existing.payment_proof_path])
        .catch(() => null);
    }

    revalidatePath("/dashboard");
    revalidatePath("/customer/dashboard");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menghapus pesanan.",
    };
  }
}
