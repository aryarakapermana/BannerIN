import { createClient } from "@/lib/supabase/server";
import DashboardClient, {
  type DashboardMaterial,
  type DashboardOrder,
} from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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

  // Ambil data pesanan dari Supabase
  const { data: dbOrders } = await supabase
    .from("orders")
    .select("*, profiles:customer_id(full_name, phone), materials:material_id(name)")
    .order("created_at", { ascending: false });

  const orders: DashboardOrder[] =
    dbOrders && dbOrders.length > 0
      ? dbOrders.map((o) => {
          const profile = Array.isArray(o.profiles) ? o.profiles[0] : o.profiles;
          const mat = Array.isArray(o.materials) ? o.materials[0] : o.materials;
          return {
            id: o.id,
            orderNumber: `#BK-${o.id.substring(0, 8).toUpperCase()}`,
            customerName: profile?.full_name || "Pelanggan",
            customerPhone: profile?.phone || "-",
            material: mat?.name || "Bahan Banner",
            width: Number(o.width_cm),
            height: Number(o.height_cm),
            total: Number(o.total_price),
            status: o.status as DashboardOrder["status"],
            preview:
              "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80",
            fileSize: "PDF · 5,2 MB",
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
      : [];

  return (
    <DashboardClient
      initialMaterials={materials}
      initialOrders={orders}
      isDemo={false}
    />
  );
}
