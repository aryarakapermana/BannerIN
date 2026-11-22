import type { Database, OrderStatus } from "@/types/database";
import { Banner } from "./Banner";

export type PaymentMethod = "qris_static";

export interface StaticQrisInfo {
  merchantName: string;
  nmid: string;
  imagePath: string;
  downloadFileName: string;
  providerLabel: string;
}

export const STATIC_QRIS_INFO: StaticQrisInfo = {
  merchantName: "SYAKIR ALAMSYAH",
  nmid: "ID1026622671455",
  imagePath: "/qris-bannerku.jpg",
  downloadFileName: "QRIS-BannerIN-SYAKIR-ALAMSYAH.jpg",
  providerLabel: "GoPay Merchant / QRIS Nasional",
};

export interface StoreWhatsAppContact {
  display: string;
  waMeDigits: string;
  baseUrl: string;
}

/** Kontak WhatsApp resmi toko/admin BannerIN untuk tautan bantuan pelanggan. */
export const BANNERIN_WHATSAPP: StoreWhatsAppContact = {
  display: "+62 858-6360-1253",
  waMeDigits: "6285863601253",
  baseUrl: "https://wa.me/6285863601253",
};

/** Alias kompatibilitas ke belakang untuk BANNERIN_WHATSAPP */
export const BANNERKU_WHATSAPP = BANNERIN_WHATSAPP;

export interface NormalizedWhatsApp {
  localDigits: string;
  display: string;
  e164: string;
  waMeDigits: string;
}

export interface OrderProps {
  id?: string;
  customerId?: string | null;
  trackingToken?: string | null;
  customerName: string;
  whatsappNumber: string;
  materialId: string;
  materialName: string;
  designId: string | null;
  banner: Banner;
  areaSqm: number;
  unitPriceSnapshot: number;
  perBannerPrice: number;
  totalPrice: number;
  paymentMethod?: PaymentMethod;
  paymentProofPath?: string | null;
  notes?: string | null;
  status?: OrderStatus;
}

export type OrderInsertPayload = Database["public"]["Tables"]["orders"]["Insert"];

export interface CustomerOrderStatusMeta {
  status: OrderStatus;
  label: string;
  shortLabel: string;
  step: number; // 1..4 atau 0 jika dibatalkan
  tone: "amber" | "indigo" | "blue" | "emerald" | "rose";
  description: string;
}

const CUSTOMER_STATUS_META: Record<OrderStatus, CustomerOrderStatusMeta> = {
  pending: {
    status: "pending",
    label: "Menunggu Konfirmasi",
    shortLabel: "Menunggu",
    step: 1,
    tone: "amber",
    description:
      "Pesanan diterima. Tim kami sedang memeriksa desain & bukti pembayaran Anda.",
  },
  confirmed: {
    status: "confirmed",
    label: "Dikonfirmasi",
    shortLabel: "Dikonfirmasi",
    step: 2,
    tone: "indigo",
    description:
      "Pembayaran terverifikasi. Pesanan dijadwalkan masuk ke antrean mesin cetak.",
  },
  processing: {
    status: "processing",
    label: "Sedang Dicetak",
    shortLabel: "Sedang Dicetak",
    step: 3,
    tone: "blue",
    description:
      "Banner Anda sedang diproses dan dicetak oleh tim produksi BannerIN.",
  },
  completed: {
    status: "completed",
    label: "Siap Diambil / Selesai",
    shortLabel: "Selesai",
    step: 4,
    tone: "emerald",
    description:
      "Cetak selesai dan telah lolos pemeriksaan kualitas. Siap diambil atau dikirim.",
  },
  cancelled: {
    status: "cancelled",
    label: "Dibatalkan",
    shortLabel: "Dibatalkan",
    step: 0,
    tone: "rose",
    description:
      "Pesanan ini dibatalkan. Hubungi admin apabila memerlukan informasi lebih lanjut.",
  },
};

/**
 * Domain Entity: Order
 * Merepresentasikan pesanan cetak banner dengan validasi identitas pemesan,
 * nomor WhatsApp Indonesia, spesifikasi fisik Banner, serta harga snapshot terverifikasi server.
 */
export class Order {
  public static readonly VALID_STATUSES: readonly OrderStatus[] = [
    "pending",
    "confirmed",
    "processing",
    "completed",
    "cancelled",
  ] as const;
  public static readonly PAYMENT_PROOF_BUCKET = "payment-proofs";
  public static readonly MAX_PAYMENT_PROOF_BYTES = 10 * 1024 * 1024; // 10 MB
  public static readonly ALLOWED_PROOF_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ] as const;

  public readonly id?: string;
  public readonly customerId: string | null;
  public readonly trackingToken?: string | null;
  public readonly customerName: string;
  public readonly whatsappNumber: string;
  public readonly materialId: string;
  public readonly materialName: string;
  public readonly designId: string | null;
  public readonly banner: Banner;
  public readonly areaSqm: number;
  public readonly unitPriceSnapshot: number;
  public readonly perBannerPrice: number;
  public readonly totalPrice: number;
  public readonly paymentMethod: PaymentMethod;
  public readonly paymentProofPath: string | null;
  public readonly notes: string | null;
  public readonly status: OrderStatus;

  constructor(props: OrderProps) {
    if (!props.materialId || !props.materialId.trim()) {
      throw new Error("Bahan cetak wajib dipilih.");
    }
    if (!props.materialName || !props.materialName.trim()) {
      throw new Error("Nama bahan cetak tidak valid.");
    }
    if (!Number.isFinite(props.areaSqm) || props.areaSqm <= 0) {
      throw new Error("Luas area banner tidak valid.");
    }
    if (!Number.isFinite(props.unitPriceSnapshot) || props.unitPriceSnapshot <= 0) {
      throw new Error("Tarif snapshot bahan tidak valid.");
    }
    if (!Number.isFinite(props.totalPrice) || props.totalPrice <= 0) {
      throw new Error("Total harga pesanan tidak valid.");
    }

    this.id = props.id;
    this.customerId = props.customerId ? props.customerId.trim() : null;
    this.trackingToken = props.trackingToken ? props.trackingToken.trim() : null;
    this.customerName = Order.normalizeCustomerName(props.customerName);
    this.whatsappNumber = Order.normalizeWhatsApp(props.whatsappNumber).e164;
    this.materialId = props.materialId.trim();
    this.materialName = props.materialName.trim();
    this.designId = props.designId ? props.designId.trim() : null;
    this.banner = props.banner;
    this.areaSqm = Number(props.areaSqm.toFixed(4));
    this.unitPriceSnapshot = Math.round(props.unitPriceSnapshot * 100) / 100;
    this.perBannerPrice = Math.ceil(props.perBannerPrice);
    this.totalPrice = Math.ceil(props.totalPrice);
    this.paymentMethod = props.paymentMethod ?? "qris_static";
    this.paymentProofPath = Order.validatePaymentProofPath(
      this.customerId,
      props.paymentProofPath
    );
    this.notes = Order.normalizeNotes(props.notes);
    this.status = props.status ? Order.validateStatus(props.status) : "pending";
  }

  public get widthCm(): number {
    return this.banner.widthCm;
  }

  public get heightCm(): number {
    return this.banner.heightCm;
  }

  public get quantity(): number {
    return this.banner.quantity;
  }

  public get totalAreaSqm(): number {
    return Number((this.areaSqm * this.quantity).toFixed(4));
  }

  /**
   * Menghasilkan payload aman untuk insert ke tabel `public.orders`.
   * Status awal selalu dikunci `pending`.
   */
  public toInsertPayload(): OrderInsertPayload {
    return {
      customer_id: this.customerId,
      tracking_token: this.trackingToken,
      customer_name: this.customerName,
      whatsapp_number: this.whatsappNumber,
      material_id: this.materialId,
      design_id: this.designId,
      width_cm: this.banner.widthCm,
      height_cm: this.banner.heightCm,
      area_sqm: this.areaSqm,
      quantity: this.banner.quantity,
      unit_price_snapshot: this.unitPriceSnapshot,
      total_price: this.totalPrice,
      notes: this.notes,
      payment_method: this.paymentMethod,
      payment_proof_path: this.paymentProofPath,
      status: "pending",
    };
  }

  public static validatePaymentProofPath(
    customerId: string | null | undefined,
    rawPath?: string | null
  ): string | null {
    if (!rawPath || !rawPath.trim()) {
      return null;
    }
    const cleanPath = rawPath.trim();
    if (cleanPath.includes("..")) {
      throw new Error("Path bukti pembayaran tidak valid.");
    }
    if (customerId && customerId.trim()) {
      if (!cleanPath.startsWith(`${customerId.trim()}/`)) {
        throw new Error(
          "Path bukti pembayaran harus berada di direktori milik pengguna."
        );
      }
    } else {
      // Guest payment proof path
      if (!cleanPath.startsWith("guest/")) {
        throw new Error(
          "Path bukti pembayaran tamu harus berada di direktori guest."
        );
      }
    }
    return cleanPath;
  }

  public static normalizeCustomerName(name: string): string {
    const cleaned = (name ?? "").replace(/\s+/g, " ").trim();
    if (!cleaned) {
      throw new Error("Nama pemesan wajib diisi.");
    }
    if (cleaned.length < 2) {
      throw new Error("Nama pemesan minimal 2 karakter.");
    }
    if (cleaned.length > 100) {
      throw new Error("Nama pemesan maksimal 100 karakter.");
    }
    return cleaned;
  }

  /**
   * Normalisasi input nomor WhatsApp dari form (prefix +62, 62, 08xx, atau 8xx)
   * menjadi format E.164 Indonesia `+628...`.
   */
  public static normalizeWhatsApp(rawPhone: string): NormalizedWhatsApp {
    const trimmed = (rawPhone ?? "").trim();
    if (!trimmed) {
      throw new Error("Nomor WhatsApp wajib diisi.");
    }

    const stripped = trimmed.replace(/[\s\-().]/g, "");
    const digitsOnly = stripped.startsWith("+")
      ? "+" + stripped.slice(1).replace(/\D/g, "")
      : stripped.replace(/\D/g, "");

    let localDigits: string;
    if (digitsOnly.startsWith("+62")) {
      localDigits = digitsOnly.slice(3);
    } else if (digitsOnly.startsWith("62")) {
      localDigits = digitsOnly.slice(2);
    } else if (digitsOnly.startsWith("0")) {
      localDigits = digitsOnly.slice(1);
    } else {
      localDigits = digitsOnly.replace(/^\+/, "");
    }

    // Jika user mengetik 0812... di dalam kolom ber-prefix +62 atau mengetik ulang 0 setelah +62
    if (localDigits.startsWith("0")) {
      localDigits = localDigits.replace(/^0+/, "");
    }

    if (!/^8\d{7,12}$/.test(localDigits)) {
      throw new Error(
        "Nomor WhatsApp tidak valid. Gunakan nomor seluler Indonesia aktif (contoh: 081234567890)."
      );
    }

    return {
      localDigits,
      display: `0${localDigits}`,
      e164: `+62${localDigits}`,
      waMeDigits: `62${localDigits}`,
    };
  }

  public static normalizeNotes(notes?: string | null): string | null {
    if (notes === undefined || notes === null) return null;
    const cleaned = notes.replace(/\r\n/g, "\n").trim();
    if (!cleaned) return null;
    if (cleaned.length > 500) {
      throw new Error("Catatan pesanan maksimal 500 karakter.");
    }
    return cleaned;
  }

  /**
   * Menghasilkan payload aman untuk insert pesanan dari Admin Dashboard
   * dengan status awal tervalidasi (boleh confirmed/processing, dst).
   */
  public toAdminInsertPayload(): OrderInsertPayload {
    return {
      ...this.toInsertPayload(),
      status: this.status,
    };
  }

  public static validateStatus(rawStatus: string): OrderStatus {
    const clean = (rawStatus ?? "").trim() as OrderStatus;
    if (!Order.VALID_STATUSES.includes(clean)) {
      throw new Error("Status pesanan tidak valid.");
    }
    return clean;
  }

  public static formatOrderNumber(orderId: string): string {
    const clean = (orderId ?? "").trim();
    if (!clean) return "#BK-PENDING";
    return `#BK-${clean.substring(0, 8).toUpperCase()}`;
  }

  public static getCustomerStatusMeta(
    rawStatus: OrderStatus | string
  ): CustomerOrderStatusMeta {
    const clean = (rawStatus ?? "pending").trim() as OrderStatus;
    return CUSTOMER_STATUS_META[clean] ?? CUSTOMER_STATUS_META.pending;
  }

  public static isOwnedBy(
    orderCustomerId: string | null | undefined,
    actorUserId: string | null | undefined
  ): boolean {
    if (!orderCustomerId || !actorUserId) return false;
    return orderCustomerId.trim() === actorUserId.trim();
  }
}

