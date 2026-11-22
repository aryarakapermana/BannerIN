"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  Order,
  orderService,
  STATIC_QRIS_INFO,
  type AuthoritativeQuoteResult,
  type PaymentMethod,
} from "@/domain";

export interface CheckoutQuoteResponse {
  success: boolean;
  quote?: AuthoritativeQuoteResult;
  error?: string;
}

export interface CreateOrderActionInput {
  customerName: string;
  whatsappNumber: string;
  materialId: string;
  designId?: string | null;
  widthCm: number;
  heightCm: number;
  quantity: number;
  notes?: string | null;
  paymentMethod?: PaymentMethod;
  paymentProofPath: string;
  // Field dari klien untuk membuktikan server selalu mengabaikan harga browser
  clientUnitPrice?: unknown;
  clientTotalPrice?: unknown;
  clientAreaSqm?: unknown;
  clientStatus?: unknown;
}

export interface CreatedOrderReceipt {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  whatsappNumber: string;
  materialName: string;
  widthCm: number;
  heightCm: number;
  areaSqm: number;
  quantity: number;
  totalAreaSqm: number;
  unitPriceSnapshot: number;
  totalPrice: number;
  notes: string | null;
  paymentLabel: string;
  paymentProofPath: string | null;
  paymentProofUrl: string | null;
  qrisMerchantName: string;
  qrisNmid: string;
  createdAt: string;
  trackingToken?: string | null;
  trackingUrl: string;
  isGuest: boolean;
}

export interface CreateOrderActionResult {
  success: boolean;
  requiresAuth?: boolean;
  order?: CreatedOrderReceipt;
  error?: string;
}

/**
 * Mengambil kalkulasi harga terverifikasi dari server berdasarkan tarif bahan aktif di database.
 */
export async function getCheckoutQuoteAction(input: {
  materialId: string;
  widthCm: number;
  heightCm: number;
  quantity: number;
}): Promise<CheckoutQuoteResponse> {
  try {
    const supabase = await createClient();
    const { data: material, error: matError } = await supabase
      .from("materials")
      .select("id, name, price_per_sqm, is_active")
      .eq("id", input.materialId)
      .eq("is_active", true)
      .maybeSingle();

    if (matError || !material) {
      return {
        success: false,
        error: "Bahan cetak tidak ditemukan atau sedang tidak aktif.",
      };
    }

    const quote = orderService.buildAuthoritativeQuote(
      {
        id: material.id,
        name: material.name,
        pricePerSqm: Number(material.price_per_sqm),
        isActive: material.is_active,
      },
      Number(input.widthCm),
      Number(input.heightCm),
      Number(input.quantity)
    );

    return { success: true, quote };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Gagal memverifikasi kalkulasi harga di server.",
    };
  }
}

/**
 * Memvalidasi input checkout, menghitung ulang seluruh harga dari DB,
 * dan menyimpan pesanan baru ke `public.orders` dengan status `pending`.
 */
export async function createOrderAction(
  input: CreateOrderActionInput
): Promise<CreateOrderActionResult> {
  try {
    const supabase = await createClient();

    // 1. Dapatkan info pengguna jika ada (Mendukung Guest Checkout Hybrid)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isGuest = !user;
    const trackingToken = isGuest
      ? typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
      : null;

    // 2. Ambil tarif bahan aktif langsung dari Supabase (abaikan angka harga dari browser)
    const materialId = (input.materialId ?? "").trim();
    if (!materialId) {
      return { success: false, error: "Bahan cetak wajib dipilih." };
    }

    const { data: material, error: materialError } = await supabase
      .from("materials")
      .select("id, name, price_per_sqm, is_active")
      .eq("id", materialId)
      .eq("is_active", true)
      .maybeSingle();

    if (materialError || !material) {
      return {
        success: false,
        error: "Bahan cetak tidak tersedia atau sudah dinonaktifkan.",
      };
    }

    // 3. Jika melampirkan designId, verifikasi desain memang ada & sesuai hak akses
    const requestedDesignId = input.designId?.trim() || null;
    let designOwnedByCustomer = true;

    if (requestedDesignId) {
      const { data: design, error: designError } = await supabase
        .from("designs")
        .select("id, customer_id")
        .eq("id", requestedDesignId)
        .maybeSingle();

      if (designError || !design) {
        designOwnedByCustomer = false;
      } else if (design.customer_id) {
        // Desain terikat akun: wajib dicocokkan dengan user login
        if (!user || design.customer_id !== user.id) {
          designOwnedByCustomer = false;
        }
      }
    }

    // 4. Susun Order domain object (recalculate penuh oleh server, abaikan harga browser)
    const order = orderService.prepareOrder({
      customerId: user ? user.id : null,
      trackingToken,
      customerName: input.customerName,
      whatsappNumber: input.whatsappNumber,
      material: {
        id: material.id,
        name: material.name,
        pricePerSqm: Number(material.price_per_sqm),
        isActive: material.is_active,
      },
      designId: requestedDesignId,
      designOwnedByCustomer,
      widthCm: Number(input.widthCm),
      heightCm: Number(input.heightCm),
      quantity: Number(input.quantity),
      notes: input.notes,
      paymentMethod: "qris_static",
      paymentProofPath: input.paymentProofPath,
      requirePaymentProof: true,
      clientUnitPrice: input.clientUnitPrice,
      clientTotalPrice: input.clientTotalPrice,
      clientAreaSqm: input.clientAreaSqm,
      clientStatus: input.clientStatus,
    });

    // 5. Simpan ke public.orders dengan status = 'pending'
    const payload = order.toInsertPayload();
    const { data: insertedOrder, error: insertError } = await supabase
      .from("orders")
      .insert(payload)
      .select("*")
      .single();

    if (insertError || !insertedOrder) {
      const errCode = insertError?.code || "";
      const errMsg = insertError?.message || "";
      if (
        errCode === "PGRST204" ||
        errCode === "42703" ||
        errMsg.includes("customer_name") ||
        errMsg.includes("whatsapp_number") ||
        errMsg.includes("payment_proof_path")
      ) {
        return {
          success: false,
          error:
            "Kolom checkout / bukti pembayaran pada tabel orders belum tersedia di database. Jalankan migrasi SQL Fase 10 (20261112000001_add_checkout_fields_to_orders.sql) terlebih dahulu.",
        };
      }

      return {
        success: false,
        error: insertError?.message || "Gagal menyimpan pesanan ke database.",
      };
    }

    let signedProofUrl: string | null = null;
    if (insertedOrder.payment_proof_path) {
      const { data: signedProof } = await supabase.storage
        .from(Order.PAYMENT_PROOF_BUCKET)
        .createSignedUrl(insertedOrder.payment_proof_path, 3600);
      signedProofUrl = signedProof?.signedUrl ?? null;
    }

    // 6. Sinkronkan cache Next.js agar dashboard pelanggan & admin terbaru
    revalidatePath("/customer/dashboard");
    revalidatePath("/dashboard");

    const finalTrackingToken = insertedOrder.tracking_token ?? trackingToken;
    const trackingUrl = `/customer/orders/${insertedOrder.id}${finalTrackingToken ? `?token=${finalTrackingToken}` : ""}`;

    return {
      success: true,
      order: {
        id: insertedOrder.id,
        orderNumber: Order.formatOrderNumber(insertedOrder.id),
        status: insertedOrder.status,
        customerName: insertedOrder.customer_name ?? order.customerName,
        whatsappNumber: insertedOrder.whatsapp_number ?? order.whatsappNumber,
        materialName: material.name,
        widthCm: Number(insertedOrder.width_cm),
        heightCm: Number(insertedOrder.height_cm),
        areaSqm: Number(insertedOrder.area_sqm),
        quantity: Number(insertedOrder.quantity),
        totalAreaSqm: Number(
          (Number(insertedOrder.area_sqm) * Number(insertedOrder.quantity)).toFixed(4)
        ),
        unitPriceSnapshot: Number(insertedOrder.unit_price_snapshot),
        totalPrice: Number(insertedOrder.total_price),
        notes: insertedOrder.notes ?? null,
        paymentLabel: STATIC_QRIS_INFO.providerLabel,
        paymentProofPath: insertedOrder.payment_proof_path ?? null,
        paymentProofUrl: signedProofUrl,
        qrisMerchantName: STATIC_QRIS_INFO.merchantName,
        qrisNmid: STATIC_QRIS_INFO.nmid,
        createdAt: insertedOrder.created_at,
        trackingToken: finalTrackingToken,
        trackingUrl,
        isGuest,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memproses pesanan Anda.",
    };
  }
}

