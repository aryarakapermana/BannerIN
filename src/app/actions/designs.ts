"use server";

import { createClient } from "@/lib/supabase/server";
import { Design, designEditorService, type EditorConfig } from "@/domain";
import type { Json } from "@/types/database";

export interface DesignActionResult {
  success: boolean;
  error?: string;
  designId?: string;
  signedOriginalUrl?: string | null;
  signedPreviewUrl?: string | null;
}

/**
 * Memperbarui konfigurasi posisi/skala editor Fabric.js (`editor_config`) pada tabel `public.designs`.
 */
export async function updateDesignConfigAction(input: {
  designId: string;
  editorConfig: Partial<EditorConfig>;
}): Promise<DesignActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Sesi login tidak ditemukan. Silakan masuk kembali.",
      };
    }

    const normalizedConfig = designEditorService.normalizeEditorConfig(
      input.editorConfig
    );

    const { data, error } = await supabase
      .from("designs")
      .update({
        editor_config: normalizedConfig as unknown as Json,
      })
      .eq("id", input.designId)
      .eq("customer_id", user.id)
      .select("id")
      .single();

    if (error || !data) {
      return {
        success: false,
        error: "Gagal memperbarui konfigurasi desain atau akses ditolak.",
      };
    }

    return {
      success: true,
      designId: data.id,
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memperbarui konfigurasi editor.",
    };
  }
}

/**
 * Menerbitkan signed URL berdurasi terbatas (1 jam) untuk file desain privat.
 * Hanya dapat dipanggil oleh pemilik desain atau admin (ditegakkan oleh RLS Supabase).
 */
export async function getDesignSignedUrlsAction(
  designId: string
): Promise<DesignActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Autentikasi diperlukan untuk mengakses file desain privat.",
      };
    }

    const { data: designRow, error: fetchError } = await supabase
      .from("designs")
      .select("id, original_file_path, preview_file_path")
      .eq("id", designId)
      .single();

    if (fetchError || !designRow) {
      return {
        success: false,
        error: "Desain tidak ditemukan atau Anda tidak memiliki akses.",
      };
    }

    const { data: origSigned } = await supabase.storage
      .from(Design.STORAGE_BUCKET)
      .createSignedUrl(designRow.original_file_path, 3600);

    let signedPreviewUrl: string | null = null;
    if (designRow.preview_file_path) {
      const { data: prevSigned } = await supabase.storage
        .from(Design.STORAGE_BUCKET)
        .createSignedUrl(designRow.preview_file_path, 3600);
      signedPreviewUrl = prevSigned?.signedUrl ?? null;
    }

    return {
      success: true,
      designId: designRow.id,
      signedOriginalUrl: origSigned?.signedUrl ?? null,
      signedPreviewUrl,
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Gagal menerbitkan URL akses desain.",
    };
  }
}

