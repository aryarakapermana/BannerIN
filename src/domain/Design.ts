import type { Json } from "@/types/database";

export type AllowedDesignMimeType = "image/jpeg" | "image/png" | "image/jpg";

export interface DesignTransformConfig {
  left: number;
  top: number;
  scaleX: number;
  scaleY: number;
  angle: number;
  originX: string;
  originY: string;
  naturalWidth?: number;
  naturalHeight?: number;
}

export interface EditorConfig {
  version: number;
  canvasWidthPx: number;
  canvasHeightPx: number;
  bannerWidthCm: number;
  bannerHeightCm: number;
  aspectRatio: string;
  lockProportions: boolean;
  showBleedGrommets: boolean;
  imageTransform: DesignTransformConfig;
}

export interface DesignProps {
  id?: string;
  customerId: string;
  originalFilePath: string;
  previewFilePath?: string | null;
  fileType: AllowedDesignMimeType;
  editorConfig: EditorConfig;
  createdAt?: string;
}

/**
 * Domain Model: Design
 * Merepresentasikan file desain banner pelanggan serta konfigurasi editor Fabric.js.
 */
export class Design {
  public static readonly MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
  public static readonly STORAGE_BUCKET = "designs";
  public static readonly ALLOWED_MIME_TYPES: readonly AllowedDesignMimeType[] = [
    "image/jpeg",
    "image/png",
    "image/jpg",
  ];

  private _id?: string;
  private _customerId: string;
  private _originalFilePath: string;
  private _previewFilePath: string | null;
  private _fileType: AllowedDesignMimeType;
  private _editorConfig: EditorConfig;
  private _createdAt?: string;

  constructor(props: DesignProps) {
    this._id = props.id;
    this._customerId = props.customerId;
    this._originalFilePath = props.originalFilePath;
    this._previewFilePath = props.previewFilePath ?? null;
    this._fileType = props.fileType;
    this._editorConfig = props.editorConfig;
    this._createdAt = props.createdAt;
    this.validate();
  }

  public get id(): string | undefined {
    return this._id;
  }

  public get customerId(): string {
    return this._customerId;
  }

  public get originalFilePath(): string {
    return this._originalFilePath;
  }

  public get previewFilePath(): string | null {
    return this._previewFilePath;
  }

  public get fileType(): AllowedDesignMimeType {
    return this._fileType;
  }

  public get editorConfig(): EditorConfig {
    return this._editorConfig;
  }

  public get createdAt(): string | undefined {
    return this._createdAt;
  }

  /**
   * Memperbarui konfigurasi editor dengan validasi struktur dan rasio banner.
   */
  public updateEditorConfig(config: EditorConfig): void {
    this._editorConfig = config;
    this.validate();
  }

  public validate(): void {
    if (!this._customerId || !this._customerId.trim()) {
      throw new Error("Customer ID wajib diisi pada entitas desain.");
    }

    if (
      !this._originalFilePath ||
      !this._originalFilePath.startsWith(`${this._customerId}/`)
    ) {
      throw new Error(
        "Path file asli harus berada di dalam direktori milik pengguna pada bucket privat."
      );
    }

    if (
      this._previewFilePath &&
      !this._previewFilePath.startsWith(`${this._customerId}/`)
    ) {
      throw new Error(
        "Path file preview harus berada di dalam direktori milik pengguna."
      );
    }

    if (!Design.ALLOWED_MIME_TYPES.includes(this._fileType)) {
      throw new Error("Tipe file desain harus JPG, JPEG, atau PNG.");
    }

    if (
      !this._editorConfig ||
      this._editorConfig.canvasWidthPx <= 0 ||
      this._editorConfig.canvasHeightPx <= 0 ||
      this._editorConfig.bannerWidthCm <= 0 ||
      this._editorConfig.bannerHeightCm <= 0
    ) {
      throw new Error("Konfigurasi ukuran kanvas dan banner tidak valid.");
    }
  }

  /**
   * Mengonversi entitas domain ke payload insert tabel `public.designs`.
   */
  public toInsertPayload(): {
    customer_id: string;
    original_file_path: string;
    preview_file_path: string | null;
    file_type: string;
    editor_config: Json;
  } {
    return {
      customer_id: this._customerId,
      original_file_path: this._originalFilePath,
      preview_file_path: this._previewFilePath,
      file_type: this._fileType,
      editor_config: this._editorConfig as unknown as Json,
    };
  }
}

