import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Order, orderService } from "@/domain";

export const runtime = "nodejs";

/**
 * Route Handler: POST /api/orders/payment-proof
 * Memvalidasi file gambar bukti transfer/QRIS (JPG/JPEG/PNG/WEBP, magic bytes, maks 10 MB)
 * untuk pengguna terautentikasi dan mengunggahnya ke bucket privat `payment-proofs`.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isGuest = !user;
    const storageUserId = isGuest ? "guest" : user.id;

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { success: false, error: "Format unggahan bukti pembayaran tidak valid." },
        { status: 400 }
      );
    }

    const fileEntry = formData.get("file");
    if (!(fileEntry instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "Gambar bukti pembayaran wajib dipilih sebelum melanjutkan.",
        },
        { status: 400 }
      );
    }

    const bytes = new Uint8Array(await fileEntry.arrayBuffer());
    let validation;
    try {
      validation = orderService.validatePaymentProofBuffer(
        {
          name: fileEntry.name,
          type: fileEntry.type,
          size: fileEntry.size,
        },
        bytes
      );
    } catch (err: unknown) {
      return NextResponse.json(
        {
          success: false,
          error:
            err instanceof Error
              ? err.message
              : "File bukti pembayaran tidak valid.",
        },
        { status: 400 }
      );
    }

    const storagePath = orderService.buildPaymentProofStoragePath(
      storageUserId,
      fileEntry.name,
      validation.canonicalMimeType
    );

    const { error: uploadError } = await supabase.storage
      .from(Order.PAYMENT_PROOF_BUCKET)
      .upload(storagePath, bytes, {
        contentType: validation.canonicalMimeType,
        upsert: false,
      });

    if (uploadError) {
      const msg = uploadError.message || "";
      if (msg.toLowerCase().includes("bucket") || msg.toLowerCase().includes("not found")) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Bucket privat payment-proofs belum tersedia di Supabase Storage. Jalankan migrasi SQL Fase 10 (20261112000001_add_checkout_fields_to_orders.sql) terlebih dahulu.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: `Gagal mengunggah bukti pembayaran: ${uploadError.message}`,
        },
        { status: 500 }
      );
    }

    const { data: signedData } = await supabase.storage
      .from(Order.PAYMENT_PROOF_BUCKET)
      .createSignedUrl(storagePath, 3600);

    return NextResponse.json(
      {
        success: true,
        paymentProofPath: storagePath,
        signedPreviewUrl: signedData?.signedUrl ?? null,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat memproses bukti pembayaran.",
      },
      { status: 500 }
    );
  }
}

