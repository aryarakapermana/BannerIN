import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Database, UserRole } from "@/types/database";

export type CurrentProfile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Mengambil session dan profil pengguna saat ini di server.
 * Mengembalikan null jika belum login.
 */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile || null;
}

/**
 * Memastikan user sudah login dan memiliki role yang sesuai.
 * Jika tidak memenuhi syarat, akan langsung me-redirect.
 */
export async function requireAuth(requiredRole?: UserRole): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (requiredRole && profile.role !== requiredRole) {
    if (requiredRole === "admin") {
      redirect("/customer/dashboard");
    } else {
      redirect("/login");
    }
  }

  return profile;
}

