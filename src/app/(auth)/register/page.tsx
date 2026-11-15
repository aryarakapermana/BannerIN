"use client";

import { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { registerAction } from "@/app/(auth)/actions";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, null);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-zinc-200">
              <Image
                src="/logo.png"
                alt="BannerIN Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <span className="text-3xl font-black tracking-tight text-blue-600">
              Banner<span className="text-amber-500">IN</span>
            </span>
          </Link>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900">
            Daftar Akun Baru
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Sudah memiliki akun?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
            >
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-xl sm:px-10 border border-zinc-200">
          {state?.error && (
            <div className="mb-6 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
              {state.error}
            </div>
          )}

          {state?.success && (
            <div className="mb-6 rounded-2xl border-2 border-emerald-300 bg-emerald-50/90 p-5 text-sm text-emerald-950 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-xs">
                  <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </span>
                <div>
                  <h3 className="font-extrabold text-emerald-950 text-base">Pendaftaran Berhasil! Tinggal 1 Langkah Lagi</h3>
                  <span className="text-xs text-emerald-700">Tautan verifikasi akun telah dikirim ke email Anda.</span>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-white/90 p-3.5 border border-emerald-200/80 text-xs text-slate-700 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-emerald-600">1.</span>
                  <span>Buka aplikasi email Anda (periksa folder <strong>Kotak Masuk (Inbox)</strong> atau <strong>Spam / Promosi</strong>).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-emerald-600">2.</span>
                  <span>Klik tombol <strong>Confirm your email / Konfirmasi Email</strong> dari BannerIN.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-emerald-600">3.</span>
                  <span>Setelah terkonfirmasi, Anda dapat langsung masuk dengan kata sandi yang telah didaftarkan.</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                >
                  Lanjut ke Halaman Masuk &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* Pengingat Konfirmasi Akun via Email */}
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 text-xs text-blue-900 flex items-start gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-blue-600 text-white mt-0.5">
              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </span>
            <div className="leading-relaxed">
              <strong className="block font-bold text-blue-950">Penting: Verifikasi Email Pribadi</strong>
              Setelah mendaftar, pastikan Anda membuka kotak masuk (atau folder spam) email Anda dan mengklik tautan konfirmasi agar akun aktif sebelum mencoba masuk (*login*).
            </div>
          </div>

          <form action={formAction} className="space-y-4">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-zinc-800"
              >
                Nama Lengkap
              </label>
              <div className="mt-1">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  suppressHydrationWarning
                  required
                  placeholder="Contoh: Budi Santoso"
                  className="block w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-zinc-800"
              >
                Nomor Telepon / WhatsApp
              </label>
              <div className="mt-1">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  suppressHydrationWarning
                  required
                  placeholder="081234567890"
                  className="block w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-800"
              >
                Alamat Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  suppressHydrationWarning
                  required
                  placeholder="nama@email.com"
                  className="block w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                />
                <p className="mt-1 text-[11px] text-zinc-500">
                  Gunakan email pribadi aktif. Tautan konfirmasi aktivasi akun akan dikirimkan ke email ini.
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-800"
              >
                Kata Sandi (Minimal 6 karakter)
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  suppressHydrationWarning
                  required
                  placeholder="••••••••"
                  className="block w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-zinc-800"
              >
                Konfirmasi Kata Sandi
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  suppressHydrationWarning
                  required
                  placeholder="••••••••"
                  className="block w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                suppressHydrationWarning
                disabled={isPending}
                className="flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Sedang mendaftarkan..." : "Daftar Akun"}
              </button>
            </div>
          </form>

          <p className="mt-4 text-center text-xs text-zinc-500">
            Setiap pendaftaran baru otomatis mendapatkan peran sebagai{" "}
            <span className="font-semibold text-zinc-700">Konsumen</span>.
          </p>

          <div className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-zinc-500">
            <span>✉️</span>
            <span>Tautan aktivasi akun akan dikirim otomatis ke email Anda.</span>
          </div>

          <div className="mt-6 border-t border-zinc-200 pt-4 text-center">
            <Link
              href="/"
              className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              &larr; Kembali ke Halaman Utama
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

