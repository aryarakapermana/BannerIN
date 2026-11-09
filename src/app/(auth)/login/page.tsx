'use client'

import { useActionState, Suspense, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { loginAction } from '@/app/(auth)/actions'

function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || ''
  const [state, formAction, isPending] = useActionState(loginAction, null)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left Column: Navy Branding Panel */}
      <div className="relative flex flex-col justify-between bg-slate-950 p-8 text-white sm:p-12 lg:w-5/12 lg:p-16">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="relative size-10 shrink-0 overflow-hidden rounded-xl shadow-sm">
              <Image
                src="/bannerku-logo.png"
                alt="Logo BannerKu"
                width={40}
                height={40}
                className="size-full object-cover"
                priority
              />
            </span>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                Banner<span className="text-blue-500">Ku</span>
              </span>
              <span className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                ADMIN PERCETAKAN
              </span>
            </div>
          </Link>
        </div>

        <div className="my-12">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
            — RUANG KERJA ADMIN
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
            Setiap pesanan,
            <br />
            terkelola dengan
            <br />
            <span className="text-blue-400">lebih baik.</span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            Dari desain masuk hingga siap dicetak. Kelola seluruh operasional BannerKu dalam satu ruang kerja.
          </p>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              ALUR KERJA LEBIH TERARAH
            </span>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="grid size-7 place-items-center rounded-lg bg-slate-800 text-slate-300">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </span>
                <div>
                  <strong className="block text-white">Terima pesanan</strong>
                  <span className="text-[11px] text-slate-400">Semua pesanan masuk, tersusun rapi.</span>
                </div>
              </div>
              <span className="text-emerald-400">✓</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="grid size-7 place-items-center rounded-lg bg-slate-800 text-slate-300">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
                <div>
                  <strong className="block text-white">Periksa desain</strong>
                  <span className="text-[11px] text-slate-400">Pastikan file siap untuk produksi.</span>
                </div>
              </div>
              <span className="text-emerald-400">✓</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="grid size-7 place-items-center rounded-lg bg-purple-600/30 text-purple-400 border border-purple-500/30">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </span>
                <div>
                  <strong className="block text-white">Lanjutkan ke produksi</strong>
                  <span className="text-[11px] text-slate-400">Cetak berkualitas, pelanggan puas.</span>
                </div>
              </div>
              <span className="text-purple-400">→</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <svg className="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Khusus tim internal BannerKu. Akses sesuai peran.
        </div>
      </div>

      {/* Right Column: Form Panel */}
      <div className="flex flex-1 flex-col justify-between bg-white p-8 sm:p-12 lg:p-16">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-400">BannerKu Admin</span>
          <Link href="/" className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-blue-600 transition">
            Ke toko BannerKu ↗
          </Link>
        </div>

        <div className="mx-auto my-12 w-full max-w-md">
          <span className="grid size-10 place-items-center rounded-xl bg-purple-50 text-purple-600 mb-4">
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-2.18-7.904a48.507 48.507 0 0110.38 0c.928.09 1.62.868 1.62 1.8V12c0 6.627-5.373 12-12 12S0 18.627 0 12V6.646c0-.932.692-1.71 1.62-1.8a48.507 48.507 0 0110.38 0z" />
            </svg>
          </span>

          <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Masuk sebagai admin
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Selamat datang kembali. Gunakan akun admin Anda untuk mengelola pesanan dan operasional toko.
          </p>

          {redirectTo && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              Silakan masuk terlebih dahulu untuk mengakses halaman yang dituju.
            </div>
          )}

          {state?.error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {state.error}
            </div>
          )}

          <form action={formAction} className="mt-6 space-y-4">
            <input type="hidden" name="redirectTo" value={redirectTo} />

            <div>
              <label className="block text-xs font-bold text-slate-700">Email admin</label>
              <div className="relative mt-1.5">
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="nama@bannerku.id"
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-xs font-medium text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Kata sandi</label>
              <div className="relative mt-1.5">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Masukkan kata sandi"
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-10 py-2.5 text-xs font-medium text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" className="size-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
                <span className="font-medium text-slate-600">Ingat saya</span>
              </label>
              <a href="#" className="font-semibold text-purple-600 hover:underline">
                Lupa kata sandi?
              </a>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-purple-700 disabled:opacity-50"
            >
              {isPending ? 'Memproses...' : 'Masuk ke Dashboard'}
              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </form>

          <div className="mt-8 rounded-xl border border-slate-200/80 bg-slate-50 p-4 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <svg className="size-4 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <strong className="block text-slate-900 font-bold">Belum memiliki akses admin?</strong>
                Hubungi pengelola BannerKu untuk mendapatkan akun atau bantuan akses.
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>© 2026 BannerKu. Hak cipta dilindungi.</span>
          <span className="flex items-center gap-1 font-semibold">
            🔒 Akses internal
          </span>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs">Memuat halaman login...</div>}>
      <LoginForm />
    </Suspense>
  )
}
