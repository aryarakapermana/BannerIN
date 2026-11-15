import {
  Design,
  type EditorConfig,
} from "./Design";
import {
  ImageFileValidator,
  type FileValidationResult as BaseFileValidationResult,
  type ImageValidationPolicy,
  type ValidatableFileMeta,
} from "./ImageFileValidator";

export type { ValidatableFileMeta };
export type DesignFileValidationResult = BaseFileValidationResult<"image/jpeg" | "image/png">;

export interface CanvasDimensionResult {
  widthPx: number;
  heightPx: number;
  ratioLabel: string;
}

const DESIGN_IMAGE_POLICY: ImageValidationPolicy<"image/jpeg" | "image/png"> = {
  itemLabel: "desain",
  maxFileSizeBytes: Design.MAX_FILE_SIZE_BYTES,
  allowedExtensions: ["jpg", "jpeg", "png"],
  allowedMimeTypes: ["image/jpeg", "image/png"],
  allowedFormatsLabel: "JPG, JPEG, atau PNG",
};

/**
 * Domain Service: DesignEditorService
 * Mengelola validasi file desain (client & server), penentuan ukuran kanvas sesuai rasio banner,
 * penyusunan path Storage privat, serta pembuatan konfigurasi editor.
 */
export class DesignEditorService {
  /**
   * Memeriksa metadata dasar file (nama/ekstensi, tipe MIME, dan batas ukuran maks 20 MB).
   */
  public validateFileMetadata(file: ValidatableFileMeta): {
    canonicalMimeType: "image/jpeg" | "image/png";
    extension: "jpg" | "png";
  } {
    const res = ImageFileValidator.validateMetadata(file, DESIGN_IMAGE_POLICY);
    return {
      canonicalMimeType: res.canonicalMimeType,
      extension: res.extension as "jpg" | "png",
    };
  }

  /**
   * Memeriksa magic bytes biner file untuk mencegah pemalsuan ekstensi di server.
   */
  public detectImageFormatByMagicBytes(
    bytes: Uint8Array
  ): "image/jpeg" | "image/png" | null {
    const detected = ImageFileValidator.detectImageFormatByMagicBytes(bytes, false);
    return detected === "image/jpeg" || detected === "image/png" ? detected : null;
  }

  /**
   * Validasi file lengkap di server: metadata + batas ukuran + verifikasi isi biner gambar asli.
   */
  public validateFileBuffer(
    file: ValidatableFileMeta,
    bytes: Uint8Array
  ): DesignFileValidationResult {
    return ImageFileValidator.validateBuffer(file, bytes, DESIGN_IMAGE_POLICY);
  }

  /**
   * Membuat path aman di bucket privat `designs`, diawali ID pemilik sesuai policy RLS Storage.
   */
  public buildStoragePaths(
    customerId: string,
    originalFileName: string,
    mimeType: "image/jpeg" | "image/png"
  ): { originalPath: string; previewPath: string } {
    if (!customerId || !customerId.trim()) {
      throw new Error("Customer ID diperlukan untuk menyusun path penyimpanan.");
    }

    const cleanCustomerId = customerId.trim().replace(/[^a-zA-Z0-9_-]/g, "");
    const safeBase = ImageFileValidator.sanitizeFileBase(
      originalFileName,
      "desain-banner"
    );

    const uniqueId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const timestamp = Date.now();
    const ext = ImageFileValidator.extensionForMime(mimeType);

    return {
      originalPath: `${cleanCustomerId}/original/${timestamp}-${uniqueId}-${safeBase}.${ext}`,
      previewPath: `${cleanCustomerId}/preview/${timestamp}-${uniqueId}-${safeBase}-preview.png`,
    };
  }

  /**
   * Menghitung ukuran kanvas piksel yang mempertahankan rasio presisi dimensi banner (cm).
   */
  public computeCanvasDimensions(
    bannerWidthCm: number,
    bannerHeightCm: number,
    maxWidthPx: number = 600,
    maxHeightPx: number = 300
  ): CanvasDimensionResult {
    const safeW = bannerWidthCm > 0 ? bannerWidthCm : 300;
    const safeH = bannerHeightCm > 0 ? bannerHeightCm : 100;
    const ratio = safeW / safeH;

    let widthPx = maxWidthPx;
    let heightPx = Math.round(widthPx / ratio);

    if (heightPx > maxHeightPx) {
      heightPx = maxHeightPx;
      widthPx = Math.round(heightPx * ratio);
    }

    widthPx = Math.max(80, widthPx);
    heightPx = Math.max(80, heightPx);

    return {
      widthPx,
      heightPx,
      ratioLabel: `${safeW} × ${safeH} cm (${ratio.toFixed(2)}:1)`,
    };
  }

  /**
   * Memvalidasi & menormalisasi payload `editorConfig` dari client sebelum disimpan ke database.
   */
  public normalizeEditorConfig(input: Partial<EditorConfig>): EditorConfig {
    const bannerWidthCm = Number(input.bannerWidthCm);
    const bannerHeightCm = Number(input.bannerHeightCm);
    const canvasWidthPx = Number(input.canvasWidthPx);
    const canvasHeightPx = Number(input.canvasHeightPx);

    if (
      isNaN(bannerWidthCm) ||
      bannerWidthCm <= 0 ||
      isNaN(bannerHeightCm) ||
      bannerHeightCm <= 0 ||
      isNaN(canvasWidthPx) ||
      canvasWidthPx <= 0 ||
      isNaN(canvasHeightPx) ||
      canvasHeightPx <= 0
    ) {
      throw new Error("Konfigurasi dimensi editor tidak valid.");
    }

    const t = input.imageTransform;
    return {
      version: 1,
      canvasWidthPx: Math.round(canvasWidthPx),
      canvasHeightPx: Math.round(canvasHeightPx),
      bannerWidthCm,
      bannerHeightCm,
      aspectRatio:
        typeof input.aspectRatio === "string" && input.aspectRatio.trim()
          ? input.aspectRatio
          : `${bannerWidthCm}:${bannerHeightCm}`,
      lockProportions: input.lockProportions !== false,
      showBleedGrommets: input.showBleedGrommets !== false,
      imageTransform: {
        left: Number.isFinite(Number(t?.left)) ? Number(t?.left) : canvasWidthPx / 2,
        top: Number.isFinite(Number(t?.top)) ? Number(t?.top) : canvasHeightPx / 2,
        scaleX: Number.isFinite(Number(t?.scaleX)) && Number(t?.scaleX) > 0 ? Number(t?.scaleX) : 1,
        scaleY: Number.isFinite(Number(t?.scaleY)) && Number(t?.scaleY) > 0 ? Number(t?.scaleY) : 1,
        angle: Number.isFinite(Number(t?.angle)) ? Number(t?.angle) : 0,
        originX: typeof t?.originX === "string" ? t.originX : "center",
        originY: typeof t?.originY === "string" ? t.originY : "center",
        naturalWidth: Number.isFinite(Number(t?.naturalWidth)) ? Number(t?.naturalWidth) : undefined,
        naturalHeight: Number.isFinite(Number(t?.naturalHeight)) ? Number(t?.naturalHeight) : undefined,
      },
    };
  }
}

export const designEditorService = new DesignEditorService();

