import { createClient } from "@/lib/supabase/server";
import LandingClient, { type LandingMaterial } from "./landing-client";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const supabase = await createClient();

  // Ambil data bahan aktif secara dinamis dari basis data Supabase
  const { data: dbMaterials } = await supabase
    .from("materials")
    .select("*")
    .eq("is_active", true)
    .order("price_per_sqm", { ascending: true });

  const materials: LandingMaterial[] =
    dbMaterials && dbMaterials.length > 0
      ? dbMaterials.map((m, idx) => ({
          id: m.id,
          name: m.name,
          badge:
            idx === 0
              ? "Pilihan ekonomis"
              : m.name.includes("440")
              ? "Tahan lama outdoor"
              : m.name.includes("340")
              ? "Lebih tebal"
              : "Untuk dalam ruang",
          weight: m.name.includes("gram")
            ? m.name.split("gram")[0].trim().split(" ").pop() + " gsm"
            : "280 gsm",
          forUse: m.description || "Spanduk acara & promosi toko",
          character: m.description || "Bahan berkualitas cetak tinggi",
          finishing: "Mata ayam · Lipat tepi",
          price: Number(m.price_per_sqm),
        }))
      : [];

  return <LandingClient initialMaterials={materials} />;
}
