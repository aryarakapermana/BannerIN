import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Design, Order, STATIC_QRIS_INFO } from "@/domain";
import type { Database, OrderStatus } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface CustomerOrderDTO {
  id: string;
  orderNumber: string;
  customerId: string | null;
  customerName: string;
  whatsappNumber: string;
  materialName: string;
  materialDescription: string | null;
  widthCm: number;
  heightCm: number;
  areaSqm: number;
  quantity: number;
  unitPriceSnapshot: number;
  totalPrice: number;
  status: OrderStatus;
  notes: string | null;
  paymentMethod: string;
  paymentProviderLabel: string;
  previewUrl: string;
  originalDesignUrl: string | null;
  designFileType: string | null;
  paymentProofUrl: string | null;
  createdAtIso: string;
  dateFormatted: string;
  timeFormatted: string;
  updatedAtFormatted: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(id: string): boolean {
  return UUID_REGEX.test((id ?? "").trim());
}

/**
 * Memastikan request berasal dari pengguna ber-role `customer` yang terautentikasi.
 * Admin diarahkan ke `/dashboard`, pengunjung belum login diarahkan ke `/login`.
 */
export async function requireCustomerSession(currentPath: string): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  email: string;
  profile: ProfileRow;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(currentPath)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect(`/login?redirect=${encodeURIComponent(currentPath)}`);
  }

  if (profile.role === "admin") {
    redirect("/dashboard");
  }

  return {
    supabase,
    userId: user.id,
    email: user.email || "",
    profile,
  };
}

interface JoinedOrderRow {
  id: string;
  customer_id: string | null;
  customer_name: string | null;
  whatsapp_number: string | null;
  width_cm: number;
  height_cm: number;
  area_sqm: number;
  quantity: number;
  unit_price_snapshot: number;
  total_price: number;
  notes: string | null;
  payment_method: string;
  payment_proof_path: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  materials:
    | { name: string; description: string | null }
    | { name: string; description: string | null }[]
    | null;
  designs:
    | {
        original_file_path: string;
        preview_file_path: string | null;
        file_type: string;
      }
    | {
        original_file_path: string;
        preview_file_path: string | null;
        file_type: string;
      }[]
    | null;
}

async function mapJoinedOrderToDTO(
  supabase: Awaited<ReturnType<typeof createClient>>,
  row: JoinedOrderRow,
  fallbackName: string,
  fallbackPhone: string
): Promise<CustomerOrderDTO> {
  const mat = Array.isArray(row.materials) ? row.materials[0] : row.materials;
  const design = Array.isArray(row.designs) ? row.designs[0] : row.designs;

  const [previewResult, originalResult, proofResult] = await Promise.all([
    design?.preview_file_path
      ? supabase.storage
          .from(Design.STORAGE_BUCKET)
          .createSignedUrl(design.preview_file_path, 3600)
      : Promise.resolve({ data: null }),
    design?.original_file_path
      ? supabase.storage
          .from(Design.STORAGE_BUCKET)
          .createSignedUrl(design.original_file_path, 3600)
      : Promise.resolve({ data: null }),
    row.payment_proof_path
      ? supabase.storage
          .from(Order.PAYMENT_PROOF_BUCKET)
          .createSignedUrl(row.payment_proof_path, 3600)
      : Promise.resolve({ data: null }),
  ]);

  const createdDate = new Date(row.created_at);
  const updatedDate = new Date(row.updated_at || row.created_at);

  return {
    id: row.id,
    orderNumber: Order.formatOrderNumber(row.id),
    customerId: row.customer_id,
    customerName: row.customer_name || fallbackName || "Pelanggan",
    whatsappNumber: row.whatsapp_number || fallbackPhone || "-",
    materialName: mat?.name || "Bahan Banner",
    materialDescription: mat?.description ?? null,
    widthCm: Number(row.width_cm),
    heightCm: Number(row.height_cm),
    areaSqm: Number(row.area_sqm),
    quantity: Number(row.quantity),
    unitPriceSnapshot: Number(row.unit_price_snapshot),
    totalPrice: Number(row.total_price),
    status: Order.validateStatus(row.status),
    notes: row.notes ?? null,
    paymentMethod: row.payment_method || "qris_static",
    paymentProviderLabel: STATIC_QRIS_INFO.providerLabel,
    previewUrl:
      previewResult.data?.signedUrl || originalResult.data?.signedUrl || "",
    originalDesignUrl: originalResult.data?.signedUrl ?? null,
    designFileType: design?.file_type ?? null,
    paymentProofUrl: proofResult.data?.signedUrl ?? null,
    createdAtIso: row.created_at,
    dateFormatted: createdDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    timeFormatted: createdDate.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    updatedAtFormatted: updatedDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

/**
 * Mengambil seluruh pesanan milik pelanggan yang sedang login.
 * Terfilter ganda melalui `customer_id = profile.id` dan Postgres RLS (`orders_select_own_or_admin`).
 */
export async function getCustomerOrders(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profile: ProfileRow
): Promise<CustomerOrderDTO[]> {
  const { data: rows, error } = await supabase
    .from("orders")
    .select(
      "*, materials:material_id(name, description), designs:design_id(original_file_path, preview_file_path, file_type)"
    )
    .eq("customer_id", profile.id)
    .order("created_at", { ascending: false });

  if (error || !rows || rows.length === 0) {
    return [];
  }

  return Promise.all(
    (rows as unknown as JoinedOrderRow[]).map((row) =>
      mapJoinedOrderToDTO(
        supabase,
        row,
        profile.full_name || "Pelanggan",
        profile.phone || "-"
      )
    )
  );
}

/**
 * Mengambil detail satu pesanan milik pelanggan berdasarkan ID.
 * Mengembalikan `null` jika UUID tidak valid, tidak ada, atau dimiliki pelanggan lain.
 */
export async function getCustomerOrderById(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profile: ProfileRow,
  orderId: string
): Promise<CustomerOrderDTO | null> {
  const cleanId = (orderId ?? "").trim();
  if (!isValidUuid(cleanId)) {
    return null;
  }

  const { data: row, error } = await supabase
    .from("orders")
    .select(
      "*, materials:material_id(name, description), designs:design_id(original_file_path, preview_file_path, file_type)"
    )
    .eq("id", cleanId)
    .eq("customer_id", profile.id)
    .maybeSingle();

  if (error || !row) {
    return null;
  }

  const typedRow = row as unknown as JoinedOrderRow;
  if (!Order.isOwnedBy(typedRow.customer_id, profile.id)) {
    return null;
  }

  return mapJoinedOrderToDTO(
    supabase,
    typedRow,
    profile.full_name || "Pelanggan",
    profile.phone || "-"
  );
}

/**
 * Mengambil detail pesanan pengunjung (Guest Checkout) berdasarkan ID dan tracking_token yang sah.
 * Mengembalikan `null` jika ID atau token tidak cocok.
 */
export async function getGuestOrderByToken(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string,
  trackingToken: string
): Promise<CustomerOrderDTO | null> {
  const cleanId = (orderId ?? "").trim();
  const cleanToken = (trackingToken ?? "").trim();

  if (!isValidUuid(cleanId) || !cleanToken) {
    return null;
  }

  const { data: row, error } = await supabase
    .from("orders")
    .select(
      "*, materials:material_id(name, description), designs:design_id(original_file_path, preview_file_path, file_type)"
    )
    .eq("id", cleanId)
    .eq("tracking_token", cleanToken)
    .maybeSingle();

  if (error || !row) {
    return null;
  }

  const typedRow = row as unknown as JoinedOrderRow;
  return mapJoinedOrderToDTO(
    supabase,
    typedRow,
    typedRow.customer_name || "Pelanggan (Tamu)",
    typedRow.whatsapp_number || "-"
  );
}

