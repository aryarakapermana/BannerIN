"use client";

import { useActionState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { loginAction } from "@/app/(auth)/actions";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "";
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="bg-white py-8 px-4 shadow-sm sm:rounded-xl sm:px-10 border border-zinc-200">
      {redirectTo && (
        <div className="mb-6 p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-800">
          Silakan masuk terlebih dahulu untuk mengakses halaman yang dituju.
        </div>
      )}

      {state?.error && (
        <div className="mb-6 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-800"
          >
            Alamat Email
          </label>
          <div className="mt-1.5">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="nama@email.com"
              className="block w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-zinc-800"
          >
            Kata Sandi
          </label>
          <div className="mt-1.5">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="block w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isPending}
            className="flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Sedang masuk..." : "Masuk"}
          </button>
        </div>
      </form>

      <div className="mt-6 border-t border-zinc-200 pt-4 text-center">
        <Link
          href="/"
          className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          &larr; Kembali ke Halaman Utama
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
            Masuk ke Akun Anda
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
            >
              Daftar sebagai konsumen
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense
          fallback={
            <div className="bg-white py-8 px-4 shadow-sm sm:rounded-xl sm:px-10 border border-zinc-200 text-center text-sm text-zinc-400">
              Memuat formulir masuk...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
