import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDesignSignedUrlsAction } from "@/app/actions/designs";
import { Banner, orderService, STATIC_QRIS_INFO } from "@/domain";
import CheckoutClient, {
  type CheckoutInitialData,
} from "./checkout-client";

export const dynamic = "force-dynamic";

interface CheckoutSearchParams {
  designId?: string;
  materialId?: string;
  width?: string;
  height?: string;
  qty?: string;
}

function parsePositiveInt(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number
): number {
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.round(parsed);
  if (rounded < min) return min;
  if (rounded > max) return max;
  return rounded;
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<CheckoutSearchParams>;
}) {
  const params = await searchParams;

  const currentQuery = new URLSearchParams();
  if (params.designId) currentQuery.set("designId", params.designId);
  if (params.materialId) currentQuery.set("materialId", params.materialId);
  if (params.width) currentQuery.set("width", params.width);
  if (params.height) currentQuery.set("height", params.height);
  if (params.qty) currentQuery.set("qty", params.qty);
  const queryString = currentQuery.toString();
  const currentPath = queryString ? `/checkout?${queryString}` : "/checkout";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(currentPath)}`);
  }

  // Ambil profil user untuk prefill & header badge
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, role")
    .eq("id", user.id)
    .maybeSingle();

  // Ambil daftar bahan cetak aktif dari Supabase (authoritative source)
  const { data: activeMaterials } = await supabase
    .from("materials")
    .select("id, name, description, price_per_sqm, is_active")
    .eq("is_active", true)
    .order("price_per_sqm", { ascending: true });

  const materials = activeMaterials ?? [];
  const selectedMaterial =
    materials.find((m) => m.id === params.materialId) ?? materials[0] ?? null;

  const widthCm = parsePositiveInt(
    params.width,
    300,
    Banner.MIN_DIMENSION_CM,
    Banner.MAX_DIMENSION_CM
  );
  const heightCm = parsePositiveInt(
    params.height,
    100,
    Banner.MIN_DIMENSION_CM,
    Banner.MAX_DIMENSION_CM
  );
  const quantity = parsePositiveInt(params.qty, 1, Banner.MIN_QUANTITY, 1000);

  // Hitung estimasi terverifikasi server langsung dari DB
  let quote = null;
  if (selectedMaterial) {
    quote = orderService.buildAuthoritativeQuote(
      {
        id: selectedMaterial.id,
        name: selectedMaterial.name,
        pricePerSqm: Number(selectedMaterial.price_per_sqm),
        isActive: selectedMaterial.is_active,
      },
      widthCm,
      heightCm,
      quantity
    );
  }

  // Muat preview desain tersimpan (hanya jika designId valid & milik user)
  let verifiedDesignId: string | null = null;
  let designPreviewUrl: string | null = null;
  let designMissingNotice: string | null = null;

  if (params.designId) {
    const signedResult = await getDesignSignedUrlsAction(params.designId);
    if (signedResult.success && signedResult.designId) {
      verifiedDesignId = signedResult.designId;
      designPreviewUrl =
        signedResult.signedPreviewUrl ?? signedResult.signedOriginalUrl ?? null;
    } else {
      designMissingNotice =
        signedResult.error ||
        "Desain yang dipilih tidak ditemukan atau bukan milik akun ini.";
    }
  }

  const displayName =
    profile?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "Pelanggan BannerIN";

  // Siapkan nomor WA prefill bersih (tanpa prefix +62 double) jika sudah tersimpan di profil
  const cleanInitialPhone = profile?.phone
    ? profile.phone.replace(/^\+62/, "0").trim()
    : "";

  const studioBackQuery = new URLSearchParams();
  if (selectedMaterial) studioBackQuery.set("materialId", selectedMaterial.id);
  studioBackQuery.set("width", String(widthCm));
  studioBackQuery.set("height", String(heightCm));
  studioBackQuery.set("qty", String(quantity));

  const initialData: CheckoutInitialData = {
    userDisplayName: displayName,
    initialCustomerName: profile?.full_name?.trim() || "",
    initialWhatsapp: cleanInitialPhone,
    studioBackHref: `/studio?${studioBackQuery.toString()}`,
    material: selectedMaterial
      ? {
          id: selectedMaterial.id,
          name: selectedMaterial.name,
          description: selectedMaterial.description,
          pricePerSqm: Number(selectedMaterial.price_per_sqm),
        }
      : null,
    widthCm,
    heightCm,
    quantity,
    quote,
    designId: verifiedDesignId,
    designPreviewUrl,
    designMissingNotice,
    qrisInfo: STATIC_QRIS_INFO,
  };

  return <CheckoutClient initialData={initialData} />;
}

