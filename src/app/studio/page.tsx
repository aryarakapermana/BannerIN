import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import StudioClient from "./studio-client";

export const dynamic = "force-dynamic";

interface StudioPageProps {
  searchParams: Promise<{
    material?: string;
    width?: string;
    height?: string;
    qty?: string;
    product?: string;
  }>;
}

export default async function StudioPage({ searchParams }: StudioPageProps) {
  const params = await searchParams;
  const [supabase, currentProfile] = await Promise.all([
    createClient(),
    getCurrentProfile(),
  ]);

  // Ambil hanya bahan aktif dari basis data Supabase
  const { data: dbMaterials } = await supabase
    .from("materials")
    .select("*")
    .eq("is_active", true)
    .order("price_per_sqm", { ascending: true });

  const materials = dbMaterials || [];

  const initialParams = {
    materialId: typeof params?.material === "string" ? params.material : undefined,
    width: params?.width && !isNaN(Number(params.width)) ? Number(params.width) : 300,
    height: params?.height && !isNaN(Number(params.height)) ? Number(params.height) : 100,
    quantity: params?.qty && !isNaN(Number(params.qty)) ? Number(params.qty) : 1,
  };

  return (
    <StudioClient
      materials={materials}
      initialParams={initialParams}
      currentUser={
        currentProfile
          ? {
              id: currentProfile.id,
              fullName: currentProfile.full_name || "Konsumen",
              role: currentProfile.role,
            }
          : null
      }
    />
  );
}
