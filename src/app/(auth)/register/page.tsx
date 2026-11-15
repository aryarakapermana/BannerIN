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
                alt="BannerKu Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <span className="text-3xl font-black tracking-tight text-blue-600">
              Banner<span className="text-amber-500">Ku</span>
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
            <div className="mb-6 p-4 rounded-md bg-green-50 border border-green-200 text-sm text-green-800">
              <p className="font-semibold">Pendaftaran Berhasil!</p>
              <p className="mt-1 text-xs">{state.message}</p>
              <div className="mt-4">
                <Link
                  href="/login"
                  className="inline-block bg-green-600 text-white font-semibold text-xs px-3.5 py-2 rounded-md hover:bg-green-700"
                >
                  Lanjut ke Halaman Masuk &rarr;
                </Link>
              </div>
            </div>
          )}

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

