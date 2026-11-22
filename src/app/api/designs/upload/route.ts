import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Design, designEditorService, type EditorConfig } from "@/domain";

export const runtime = "nodejs";

/**
 * Route Handler: POST /api/designs/upload
 * Memvalidasi file desain di server (tipe JPG/JPEG/PNG, magic bytes, maks 20 MB),
 * mengunggahnya ke bucket privat Supabase Storage (`designs`), dan menyimpan konfigurasi ke `public.designs`.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Verifikasi sesi autentikasi di server (Opsional untuk Guest Checkout)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isGuest = !user;
    const storageUserId = isGuest ? "guest" : user.id;
    const customerId = isGuest ? null : user.id;

    // 2. Parse FormData multipart
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { success: false, error: "Format permintaan unggahan tidak valid." },
        { status: 400 }
      );
    }

    const fileEntry = formData.get("file");
    if (!(fileEntry instanceof File)) {
      return NextResponse.json(
        { success: false, error: "File desain asli (JPG/PNG) wajib diunggah." },
        { status: 400 }
      );
    }

    const rawConfig = formData.get("editorConfig");
    let parsedConfig: Partial<EditorConfig>;
    try {
      parsedConfig =
        typeof rawConfig === "string" && rawConfig.trim()
          ? JSON.parse(rawConfig)
          : {};
    } catch {
      return NextResponse.json(
        { success: false, error: "Format konfigurasi editor tidak valid." },
        { status: 400 }
      );
    }

    // 3. Validasi konfigurasi editor (rasio, lebar/tinggi banner, transformasi)
    let normalizedConfig: EditorConfig;
    try {
      normalizedConfig = designEditorService.normalizeEditorConfig(parsedConfig);
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          error:
            err instanceof Error
              ? err.message
              : "Konfigurasi ukuran desain tidak valid.",
        },
        { status: 400 }
      );
    }

    // 4. Validasi file asli di sisi server (ekstensi, MIME, ukuran <= 20 MB, dan magic bytes gambar)
    const originalBuffer = new Uint8Array(await fileEntry.arrayBuffer());
    let fileValidation;
    try {
      fileValidation = designEditorService.validateFileBuffer(
        {
          name: fileEntry.name,
          type: fileEntry.type,
          size: fileEntry.size,
        },
        originalBuffer
      );
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          error:
            err instanceof Error
              ? err.message
              : "File desain tidak memenuhi persyaratan.",
        },
        { status: 400 }
      );
    }

    // 5. Susun path Storage privat berbasis user.id atau guest (sesuai policy RLS Storage)
    const { originalPath, previewPath } = designEditorService.buildStoragePaths(
      storageUserId,
      fileEntry.name,
      fileValidation.canonicalMimeType
    );

    // 6. Unggah file asli ke bucket privat 'designs'
    const { error: uploadOriginalErr } = await supabase.storage
      .from(Design.STORAGE_BUCKET)
      .upload(originalPath, originalBuffer, {
        contentType: fileValidation.canonicalMimeType,
        upsert: false,
      });

    if (uploadOriginalErr) {
      return NextResponse.json(
        {
          success: false,
          error: `Gagal mengunggah file ke penyimpanan privat: ${uploadOriginalErr.message}`,
        },
        { status: 500 }
      );
    }

    // 7. Jika ada snapshot preview canvas dari Fabric.js, validasi & unggah ke bucket privat
    let storedPreviewPath: string | null = null;
    const previewEntry = formData.get("previewFile");
    if (previewEntry instanceof File && previewEntry.size > 0) {
      const previewBuffer = new Uint8Array(await previewEntry.arrayBuffer());
      const previewMime = designEditorService.detectImageFormatByMagicBytes(
        previewBuffer
      );
      if (previewMime && previewBuffer.byteLength <= 5 * 1024 * 1024) {
        const { error: uploadPreviewErr } = await supabase.storage
          .from(Design.STORAGE_BUCKET)
          .upload(previewPath, previewBuffer, {
            contentType: previewMime,
            upsert: false,
          });
        if (!uploadPreviewErr) {
          storedPreviewPath = previewPath;
        }
      }
    }

    // 8. Bentuk entitas domain Design & simpan metadata + editor_config ke tabel public.designs
    const designEntity = new Design({
      customerId,
      originalFilePath: originalPath,
      previewFilePath: storedPreviewPath,
      fileType: fileValidation.canonicalMimeType,
      editorConfig: normalizedConfig,
    });

    const { data: savedRow, error: dbError } = await supabase
      .from("designs")
      .insert(designEntity.toInsertPayload())
      .select()
      .single();

    if (dbError || !savedRow) {
      // Bersihkan file di Storage agar tidak meninggalkan orphan jika insert DB gagal
      const cleanupPaths = storedPreviewPath
        ? [originalPath, storedPreviewPath]
        : [originalPath];
      await supabase.storage.from(Design.STORAGE_BUCKET).remove(cleanupPaths);

      return NextResponse.json(
        {
          success: false,
          error: `Gagal menyimpan konfigurasi desain: ${dbError?.message || "Database error"}`,
        },
        { status: 500 }
      );
    }

    // 9. Terbitkan signed URL berbatas waktu (1 jam) untuk akses privat pemilik
    const { data: signedOriginal } = await supabase.storage
      .from(Design.STORAGE_BUCKET)
      .createSignedUrl(originalPath, 3600);

    let signedPreviewUrl: string | null = null;
    if (storedPreviewPath) {
      const { data: signedPrev } = await supabase.storage
        .from(Design.STORAGE_BUCKET)
        .createSignedUrl(storedPreviewPath, 3600);
      signedPreviewUrl = signedPrev?.signedUrl ?? null;
    }

    return NextResponse.json(
      {
        success: true,
        design: savedRow,
        signedOriginalUrl: signedOriginal?.signedUrl ?? null,
        signedPreviewUrl,
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan pada server saat mengunggah desain.",
      },
      { status: 500 }
    );
  }
}

