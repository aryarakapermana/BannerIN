export type SupportedImageMime = "image/jpeg" | "image/png" | "image/webp";

export interface ValidatableFileMeta {
  name: string;
  type: string;
  size: number;
}

export interface FileValidationResult<
  TMime extends SupportedImageMime = SupportedImageMime,
> {
  valid: boolean;
  canonicalMimeType: TMime;
  extension: "jpg" | "png" | "webp";
}

export interface ImageValidationPolicy<
  TMime extends SupportedImageMime = SupportedImageMime,
> {
  itemLabel: string;
  maxFileSizeBytes: number;
  allowedExtensions: readonly string[];
  allowedMimeTypes: readonly TMime[];
  allowedFormatsLabel: string;
}

const MIME_ALIASES: Record<string, SupportedImageMime | undefined> = {
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
};

/**
 * Utility Domain Validator: ImageFileValidator
 * Satu sumber kebenaran validasi metadata, ekstensi, ukuran, dan magic bytes gambar
 * agar tidak ada duplikasi antar layanan Desain dan Bukti Pembayaran.
 */
export class ImageFileValidator {
  public static detectImageFormatByMagicBytes(
    bytes: Uint8Array,
    allowWebp: boolean = false
  ): SupportedImageMime | null {
    if (!bytes || bytes.length < 3) {
      return null;
    }

    // JPEG magic header: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return "image/jpeg";
    }

    // PNG magic header: 89 50 4E 47 0D 0A 1A 0A
    if (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return "image/png";
    }

    // WEBP magic header: RIFF....WEBP (bytes 0..3 = "RIFF", bytes 8..11 = "WEBP")
    if (
      allowWebp &&
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return "image/webp";
    }

    return null;
  }

  public static extensionForMime(
    mime: SupportedImageMime
  ): "jpg" | "png" | "webp" {
    if (mime === "image/png") return "png";
    if (mime === "image/webp") return "webp";
    return "jpg";
  }

  public static validateMetadata<TMime extends SupportedImageMime>(
    file: ValidatableFileMeta,
    policy: ImageValidationPolicy<TMime>
  ): { canonicalMimeType: TMime; extension: "jpg" | "png" | "webp" } {
    if (!file || !file.name) {
      throw new Error(`File ${policy.itemLabel} belum dipilih.`);
    }

    if (typeof file.size !== "number" || isNaN(file.size) || file.size <= 0) {
      throw new Error(
        `File ${policy.itemLabel} kosong (0 byte) dan tidak dapat diproses.`
      );
    }

    const maxMb = Math.round(policy.maxFileSizeBytes / (1024 * 1024));
    if (file.size > policy.maxFileSizeBytes) {
      throw new Error(`Ukuran file melebihi batas maksimum ${maxMb} MB.`);
    }

    const parts = file.name.toLowerCase().split(".");
    const ext = parts.length > 1 ? parts.pop() || "" : "";
    if (!policy.allowedExtensions.includes(ext)) {
      throw new Error(
        `Ekstensi file tidak didukung. Gunakan ${policy.allowedFormatsLabel}.`
      );
    }

    const canonical = MIME_ALIASES[file.type.toLowerCase().trim()];
    if (!canonical || !policy.allowedMimeTypes.includes(canonical as TMime)) {
      throw new Error(
        `Format file tidak diizinkan. Gunakan ${policy.allowedFormatsLabel}.`
      );
    }

    return {
      canonicalMimeType: canonical as TMime,
      extension: ImageFileValidator.extensionForMime(canonical),
    };
  }

  public static validateBuffer<TMime extends SupportedImageMime>(
    file: ValidatableFileMeta,
    bytes: Uint8Array,
    policy: ImageValidationPolicy<TMime>
  ): FileValidationResult<TMime> {
    ImageFileValidator.validateMetadata(file, policy);

    if (!bytes || bytes.byteLength <= 0) {
      throw new Error("Isi file kosong dan tidak dapat diunggah.");
    }

    const maxMb = Math.round(policy.maxFileSizeBytes / (1024 * 1024));
    if (bytes.byteLength > policy.maxFileSizeBytes) {
      throw new Error(
        `Ukuran file di server melebihi batas maksimum ${maxMb} MB.`
      );
    }

    const allowWebp = policy.allowedMimeTypes.includes("image/webp" as TMime);
    const detectedMime = ImageFileValidator.detectImageFormatByMagicBytes(
      bytes,
      allowWebp
    );

    if (
      !detectedMime ||
      !policy.allowedMimeTypes.includes(detectedMime as TMime)
    ) {
      throw new Error(
        `Signature file tidak valid. Pastikan file benar-benar gambar ${policy.allowedFormatsLabel}.`
      );
    }

    return {
      valid: true,
      canonicalMimeType: detectedMime as TMime,
      extension: ImageFileValidator.extensionForMime(detectedMime),
    };
  }

  public static sanitizeFileBase(
    originalFileName: string,
    fallback: string = "gambar"
  ): string {
    const rawBase = originalFileName.replace(/\.[^/.]+$/, "");
    return (
      rawBase
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || fallback
    );
  }
}

