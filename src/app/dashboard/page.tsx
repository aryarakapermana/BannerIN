import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { Design, Order } from "@/domain";
import DashboardClient, {
  type DashboardMaterial,
  type DashboardOrder,
} from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await requireAuth("admin");
  const supabase = await createClient();

  // Ambil data bahan nyata dari Supabase
  const { data: dbMaterials } = await supabase
    .from("materials")
    .select("*")
    .order("name", { ascending: true });

  const materials: DashboardMaterial[] =
    dbMaterials && dbMaterials.length > 0
      ? dbMaterials.map((m, idx) => ({
          id: m.id,
          code: `BHN-00${idx + 1}`,
          name: m.name,
          category: "Banner outdoor",
          weight: m.name.includes("gram")
            ? m.name.split("gram")[0].trim().split(" ").pop() + "g"
            : "340g",
          description: m.description || "Material cetak banner berkualitas tinggi.",
          price: Number(m.price_per_sqm),
          active: m.is_active,
          lastUpdated: "Diperbarui baru saja",
        }))
      : [];

  // Ambil data pesanan beserta desain & bukti pembayaran dari Supabase
  const { data: dbOrders } = await supabase
    .from("orders")
    .select(
      "*, profiles:customer_id(full_name, phone), materials:material_id(name), designs:design_id(original_file_path, preview_file_path, file_type)"
    )
    .order("created_at", { ascending: false });

  const orders: DashboardOrder[] =
    dbOrders && dbOrders.length > 0
      ? await Promise.all(
          dbOrders.map(async (o) => {
            const custProfile = Array.isArray(o.profiles)
              ? o.profiles[0]
              : o.profiles;
            const mat = Array.isArray(o.materials)
              ? o.materials[0]
              : o.materials;
            const design = Array.isArray(o.designs)
              ? o.designs[0]
              : o.designs;

            let signedPreviewUrl = "";
            let signedOriginalUrl: string | undefined;

            if (design?.original_file_path) {
              const { data: origData } = await supabase.storage
                .from(Design.STORAGE_BUCKET)
                .createSignedUrl(design.original_file_path, 3600);
              signedOriginalUrl = origData?.signedUrl ?? undefined;
            }

            if (design?.preview_file_path) {
              const { data: prevData } = await supabase.storage
                .from(Design.STORAGE_BUCKET)
                .createSignedUrl(design.preview_file_path, 3600);
              signedPreviewUrl = prevData?.signedUrl ?? "";
            }

            const proofPath = o.payment_proof_path ?? null;
            let signedPaymentProofUrl: string | null = null;
            if (proofPath) {
              const { data: proofData } = await supabase.storage
                .from(Order.PAYMENT_PROOF_BUCKET)
                .createSignedUrl(proofPath, 3600);
              signedPaymentProofUrl = proofData?.signedUrl ?? null;
            }

            return {
              id: o.id,
              orderNumber: Order.formatOrderNumber(o.id),
              customerName:
                o.customer_name || custProfile?.full_name || "Pelanggan",
              customerPhone: o.whatsapp_number || custProfile?.phone || "-",
              materialId: o.material_id,
              material: mat?.name || "Bahan Banner",
              width: Number(o.width_cm),
              height: Number(o.height_cm),
              quantity: Number(o.quantity),
              areaSqm: Number(o.area_sqm),
              total: Number(o.total_price),
              status: o.status as DashboardOrder["status"],
              notes: o.notes ?? null,
              paymentMethod: o.payment_method ?? "qris_static",
              paymentProofPath: proofPath,
              paymentProofUrl: signedPaymentProofUrl,
              preview: signedPreviewUrl || signedOriginalUrl || "",
              originalFilePath: signedOriginalUrl,
              fileSize: design
                ? design.file_type === "image/png"
                  ? "PNG · Resolusi Penuh"
                  : "JPG · Resolusi Penuh"
                : "Tanpa lampiran desain",
              createdAt: new Date(o.created_at).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              dateFormatted: new Date(o.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
            };
          })
        )
      : [];

  return (
    <DashboardClient
      initialMaterials={materials}
      initialOrders={orders}
      adminName={profile.full_name || "Arya"}
      isDemo={false}
    />
  );
}
