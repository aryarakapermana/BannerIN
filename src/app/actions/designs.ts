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
    } = await supabase.auth.getUser();

    const normalizedConfig = designEditorService.normalizeEditorConfig(
      input.editorConfig
    );

    let query = supabase
      .from("designs")
      .update({
        editor_config: normalizedConfig as unknown as Json,
      })
      .eq("id", input.designId);

    if (user) {
      query = query.or(`customer_id.eq.${user.id},customer_id.is.null`);
    } else {
      query = query.is("customer_id", null);
    }

    const { data, error } = await query.select("id").maybeSingle();

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
 * Terbuka untuk desain tamu (guest) serta pemilik desain atau admin untuk pengguna terdaftar.
 */
export async function getDesignSignedUrlsAction(
  designId: string
): Promise<DesignActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: designRow, error: fetchError } = await supabase
      .from("designs")
      .select("id, customer_id, original_file_path, preview_file_path")
      .eq("id", designId)
      .maybeSingle();

    if (fetchError || !designRow) {
      return {
        success: false,
        error: "Desain tidak ditemukan atau Anda tidak memiliki akses.",
      };
    }

    // Jika desain milik user terdaftar, pastikan diakses oleh pemiliknya atau admin
    if (designRow.customer_id) {
      if (!user) {
        return {
          success: false,
          error: "Autentikasi diperlukan untuk mengakses file desain akun ini.",
        };
      }
      if (designRow.customer_id !== user.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.role !== "admin") {
          return {
            success: false,
            error: "Akses ditolak: Desain ini bukan milik akun Anda.",
          };
        }
      }
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

