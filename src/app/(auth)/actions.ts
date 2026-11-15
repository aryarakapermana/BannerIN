"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface AuthActionResult {
  error?: string;
  success?: boolean;
  message?: string;
}

export async function loginAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();
  const redirectTo = formData.get("redirectTo")?.toString();
  const loginRole = formData.get("loginRole")?.toString();

  if (!email || !password) {
    return { error: "Email dan kata sandi wajib diisi." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const errorMsg = error.message.toLowerCase();
    if (errorMsg.includes("email not confirmed")) {
      return {
        error:
          "Email Anda belum dikonfirmasi. Silakan periksa kotak masuk/spam email Anda untuk verifikasi, atau minta admin untuk mengonfirmasi akun Anda.",
      };
    }
    return {
      error:
        "Email atau kata sandi tidak valid. Pastikan kata sandi benar dan akun Anda telah terkonfirmasi di Supabase.",
    };
  }

  if (!data.user) {
    return { error: "Gagal masuk. Pengguna tidak ditemukan." };
  }

  // Ambil profil untuk menentukan rute redirect
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const userRole = profile?.role || "customer";

  if (loginRole === "admin" && userRole !== "admin") {
    await supabase.auth.signOut();
    return {
      error:
        "Akun ini terdaftar sebagai pelanggan. Silakan masuk melalui formulir Login Pelanggan.",
    };
  }

  if (redirectTo && redirectTo.startsWith("/")) {
    if (redirectTo === "/admin" || redirectTo === "/admin/dashboard") {
      redirect("/dashboard");
    }
    // Validasi agar redirect tetap aman
    if ((redirectTo.startsWith("/admin") || redirectTo.startsWith("/dashboard")) && userRole !== "admin") {
      redirect("/customer/dashboard");
    }
    redirect(redirectTo);
  }

  if (userRole === "admin") {
    redirect("/dashboard");
  } else {
    redirect("/customer/dashboard");
  }
}

export async function registerAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const fullName = formData.get("fullName")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();

  if (!fullName || !phone || !email || !password) {
    return { error: "Semua kolom pendaftaran wajib diisi." };
  }

  if (password.length < 6) {
    return { error: "Kata sandi minimal 6 karakter." };
  }

  if (password !== confirmPassword) {
    return { error: "Konfirmasi kata sandi tidak cocok." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phone,
      },
    },
  });

  if (error) {
    return { error: error.message || "Pendaftaran gagal. Silakan coba lagi." };
  }

  // Jika konfirmasi email aktif di Supabase
  if (data.session) {
    redirect("/customer/dashboard");
  }

  return {
    success: true,
    message:
      "Pendaftaran berhasil! Silakan periksa email Anda untuk verifikasi atau silakan masuk jika verifikasi email tidak diwajibkan.",
  };
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

