import type { Database, OrderStatus } from "@/types/database";
import { Banner } from "./Banner";
import type { IPriceCalculator, PriceBreakdown } from "./IPriceCalculator";
import { priceCalculator as defaultPriceCalculator } from "./PriceCalculator";
import { Order, type OrderInsertPayload, type PaymentMethod } from "./Order";
import {
  ImageFileValidator,
  type FileValidationResult,
  type ImageValidationPolicy,
  type ValidatableFileMeta,
} from "./ImageFileValidator";

export type PaymentProofMimeType = "image/jpeg" | "image/png" | "image/webp";

const PAYMENT_PROOF_POLICY: ImageValidationPolicy<PaymentProofMimeType> = {
  itemLabel: "bukti pembayaran",
  maxFileSizeBytes: Order.MAX_PAYMENT_PROOF_BYTES,
  allowedExtensions: ["jpg", "jpeg", "png", "webp"],
  allowedMimeTypes: Order.ALLOWED_PROOF_MIME_TYPES,
  allowedFormatsLabel: "JPG, JPEG, PNG, atau WEBP",
};

export interface AuthoritativeMaterialSpec {
  id: string;
  name: string;
  pricePerSqm: number;
  isActive: boolean;
}

export interface CreateAuthoritativeOrderInput {
  customerId?: string | null;
  trackingToken?: string | null;
  customerName: string;
  whatsappNumber: string;
  material: AuthoritativeMaterialSpec;
  designId?: string | null;
  designOwnedByCustomer?: boolean;
  widthCm: number;
  heightCm: number;
  quantity: number;
  notes?: string | null;
  paymentMethod?: PaymentMethod;
  paymentProofPath?: string | null;
  requirePaymentProof?: boolean;
  /**
   * Field manipulatif yang mungkin dikirim dari browser/DevTools;
   * selalu diabaikan oleh OrderService dan diganti dengan kalkulasi server.
   */
  clientUnitPrice?: unknown;
  clientTotalPrice?: unknown;
  clientAreaSqm?: unknown;
  clientStatus?: unknown;
}

export interface AdminCreateOrderInput {
  adminId: string;
  customerName: string;
  whatsappNumber: string;
  material: AuthoritativeMaterialSpec;
  widthCm: number;
  heightCm: number;
  quantity: number;
  status?: OrderStatus;
  notes?: string | null;
  paymentMethod?: PaymentMethod;
}

export interface AdminUpdateOrderInput {
  customerName: string;
  whatsappNumber: string;
  material: AuthoritativeMaterialSpec;
  widthCm: number;
  heightCm: number;
  quantity: number;
  status: OrderStatus;
  notes?: string | null;
}

export type OrderUpdatePayload = Database["public"]["Tables"]["orders"]["Update"];

export interface AuthoritativeQuoteResult {
  materialId: string;
  materialName: string;
  pricePerSqm: number;
  breakdown: PriceBreakdown;
  totalAreaSqm: number;
}

/**
 * Domain Service: OrderService
 * Menjembatani spesifikasi pesanan & validasi kepemilikan desain,
 * serta memastikan seluruh perhitungan harga menggunakan harga bahan aktif dari database (server-authoritative).
 */
export class OrderService {
  private readonly calculator: IPriceCalculator;

  constructor(calculator: IPriceCalculator = defaultPriceCalculator) {
    this.calculator = calculator;
  }

  public buildAuthoritativeQuote(
    material: AuthoritativeMaterialSpec | null | undefined,
    widthCm: number,
    heightCm: number,
    quantity: number,
    options?: { allowInactive?: boolean }
  ): AuthoritativeQuoteResult {
    if (!material || !material.id) {
      throw new Error("Bahan cetak tidak ditemukan.");
    }
    if (!options?.allowInactive && !material.isActive) {
      throw new Error("Bahan cetak yang dipilih sedang tidak aktif.");
    }
    if (!Number.isFinite(material.pricePerSqm) || material.pricePerSqm <= 0) {
      throw new Error("Harga bahan di database tidak valid.");
    }

    const banner = new Banner(widthCm, heightCm, quantity);
    const breakdown = this.calculator.calculateBreakdown({
      widthCm: banner.widthCm,
      heightCm: banner.heightCm,
      pricePerSqm: material.pricePerSqm,
      quantity: banner.quantity,
    });

    return {
      materialId: material.id,
      materialName: material.name,
      pricePerSqm: material.pricePerSqm,
      breakdown,
      totalAreaSqm: banner.getTotalArea(),
    };
  }

  public validateDesignReference(
    designId?: string | null,
    designOwnedByCustomer?: boolean
  ): string | null {
    if (!designId || !designId.trim()) {
      return null;
    }

    if (designOwnedByCustomer === false) {
      throw new Error("Desain tidak ditemukan atau bukan milik akun Anda.");
    }

    return designId.trim();
  }

  public validatePaymentProofMetadata(file: ValidatableFileMeta): {
    canonicalMimeType: PaymentProofMimeType;
    extension: "jpg" | "png" | "webp";
  } {
    return ImageFileValidator.validateMetadata(file, PAYMENT_PROOF_POLICY);
  }

  public validatePaymentProofBuffer(
    file: ValidatableFileMeta,
    bytes: Uint8Array
  ): FileValidationResult<PaymentProofMimeType> {
    return ImageFileValidator.validateBuffer(file, bytes, PAYMENT_PROOF_POLICY);
  }

  public buildPaymentProofStoragePath(
    customerId: string | null | undefined,
    originalFileName: string,
    mimeType: PaymentProofMimeType
  ): string {
    const isGuest =
      !customerId || !customerId.trim() || customerId.trim().toLowerCase() === "guest";
    const cleanFolder = isGuest
      ? "guest"
      : customerId.trim().replace(/[^a-zA-Z0-9_-]/g, "");

    const safeBase = ImageFileValidator.sanitizeFileBase(
      originalFileName,
      "bukti-pembayaran"
    );
    const uniqueId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const timestamp = Date.now();
    const ext = ImageFileValidator.extensionForMime(mimeType);

    return `${cleanFolder}/proof-${timestamp}-${uniqueId}-${safeBase}.${ext}`;
  }

  /**
   * Membangun objek Order yang tervalidasi penuh dari sisi server.
   * Semua nilai harga atau status yang disuntikkan klien diabaikan secara total.
   */
  public prepareOrder(input: CreateAuthoritativeOrderInput): Order {
    // Abaikan seluruh angka harga/status dari sisi browser secara eksplisit
    void input.clientUnitPrice;
    void input.clientTotalPrice;
    void input.clientAreaSqm;
    void input.clientStatus;

    if (input.requirePaymentProof && !input.paymentProofPath?.trim()) {
      throw new Error("Bukti pembayaran wajib diunggah terlebih dahulu.");
    }

    const validatedDesignId = this.validateDesignReference(
      input.designId,
      input.designOwnedByCustomer
    );

    const quote = this.buildAuthoritativeQuote(
      input.material,
      input.widthCm,
      input.heightCm,
      input.quantity
    );

    const banner = new Banner(
      quote.breakdown.widthCm,
      quote.breakdown.heightCm,
      quote.breakdown.quantity
    );

    return new Order({
      customerId: input.customerId ?? null,
      trackingToken: input.trackingToken ?? null,
      customerName: input.customerName,
      whatsappNumber: input.whatsappNumber,
      materialId: quote.materialId,
      materialName: quote.materialName,
      designId: validatedDesignId,
      banner,
      areaSqm: quote.breakdown.areaSqm,
      unitPriceSnapshot: quote.pricePerSqm,
      perBannerPrice: quote.breakdown.unitPrice,
      totalPrice: quote.breakdown.totalPrice,
      paymentMethod: input.paymentMethod ?? "qris_static",
      paymentProofPath: input.paymentProofPath ?? null,
      notes: input.notes,
      status: "pending",
    });
  }

  /**
   * Membangun entitas & payload insert pesanan baru dari Dashboard Admin.
   * Mengkalkulasi ulang luas & harga total dari harga bahan aktif DB.
   */
  public prepareAdminOrder(input: AdminCreateOrderInput): {
    order: Order;
    payload: OrderInsertPayload;
  } {
    const validatedStatus = Order.validateStatus(input.status ?? "pending");
    const quote = this.buildAuthoritativeQuote(
      input.material,
      input.widthCm,
      input.heightCm,
      input.quantity
    );
    const banner = new Banner(
      quote.breakdown.widthCm,
      quote.breakdown.heightCm,
      quote.breakdown.quantity
    );

    const order = new Order({
      customerId: input.adminId,
      customerName: input.customerName,
      whatsappNumber: input.whatsappNumber,
      materialId: quote.materialId,
      materialName: quote.materialName,
      designId: null,
      banner,
      areaSqm: quote.breakdown.areaSqm,
      unitPriceSnapshot: quote.pricePerSqm,
      perBannerPrice: quote.breakdown.unitPrice,
      totalPrice: quote.breakdown.totalPrice,
      paymentMethod: input.paymentMethod ?? "qris_static",
      paymentProofPath: null,
      notes: input.notes,
      status: validatedStatus,
    });

    return {
      order,
      payload: order.toAdminInsertPayload(),
    };
  }

  /**
   * Membangun payload update pesanan dari Dashboard Admin.
   * Memvalidasi identitas pemesan, WhatsApp, dimensi, status, dan mengkalkulasi ulang harga server.
   */
  public prepareAdminOrderUpdate(input: AdminUpdateOrderInput): {
    payload: OrderUpdatePayload;
    quote: AuthoritativeQuoteResult;
    customerName: string;
    whatsappNumber: string;
    notes: string | null;
    status: OrderStatus;
  } {
    const customerName = Order.normalizeCustomerName(input.customerName);
    const whatsappNumber = Order.normalizeWhatsApp(input.whatsappNumber).e164;
    const notes = Order.normalizeNotes(input.notes);
    const status = Order.validateStatus(input.status);
    const quote = this.buildAuthoritativeQuote(
      input.material,
      input.widthCm,
      input.heightCm,
      input.quantity,
      { allowInactive: true }
    );

    const payload: OrderUpdatePayload = {
      customer_name: customerName,
      whatsapp_number: whatsappNumber,
      material_id: quote.materialId,
      width_cm: quote.breakdown.widthCm,
      height_cm: quote.breakdown.heightCm,
      area_sqm: Number(quote.breakdown.areaSqm.toFixed(4)),
      quantity: quote.breakdown.quantity,
      unit_price_snapshot: Math.round(quote.pricePerSqm * 100) / 100,
      total_price: Math.ceil(quote.breakdown.totalPrice),
      notes,
      status,
    };

    return {
      payload,
      quote,
      customerName,
      whatsappNumber,
      notes,
      status,
    };
  }
}

export const orderService = new OrderService();

