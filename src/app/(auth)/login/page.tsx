'use client'

import { useActionState, Suspense, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { loginAction } from '@/app/(auth)/actions'

function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || ''
  const initialAdminMode =
    searchParams.get('mode') === 'admin' ||
    redirectTo.startsWith('/dashboard') ||
    redirectTo.startsWith('/admin')

  const [customerState, customerFormAction, isCustomerPending] = useActionState(
    loginAction,
    null
  )
  const [adminState, adminFormAction, isAdminPending] = useActionState(
    loginAction,
    null
  )

  const [showCustomerPassword, setShowCustomerPassword] = useState(false)
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [showForgotNote, setShowForgotNote] = useState(false)
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(initialAdminMode)

  const registerHref = redirectTo
    ? `/register?redirect=${encodeURIComponent(redirectTo)}`
    : '/register'

  return (
    <div className="flex min-h-screen flex-col bg-white lg:flex-row">
      {/* 1A. Mobile Compact Header */}
      <header className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3.5 lg:hidden">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <span className="relative size-8 shrink-0 overflow-hidden rounded-lg shadow-xs">
            <Image
              src="/bannerku-logo.png"
              alt="Logo BannerIN"
              width={32}
              height={32}
              className="size-full object-cover"
              priority
            />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-950">
            Banner<span className="text-blue-600">IN</span>
          </span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
        >
          ← Beranda
        </Link>
      </header>

      {/* 1B. Mobile Compact Customer Welcome Card */}
      <div className="mx-5 mt-5 rounded-2xl bg-gradient-to-br from-slate-950 via-[#0a1938] to-[#0f2b6b] p-5 text-white shadow-sm lg:hidden">
        <span className="inline-block rounded-full border border-blue-400/20 bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-extrabold tracking-widest text-blue-200 uppercase">
          PORTAL PELANGGAN
        </span>
        <h1 className="mt-2.5 text-xl font-black tracking-tight text-white">
          Cetak &amp; Pantau Banner Anda
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-slate-300">
          Lanjutkan desain Studio dan cek status pesanan real-time.
        </p>
      </div>

      {/* 2. Desktop Left Column: Dark Navy Customer Branding Panel */}
      <div className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:w-[44%] lg:flex-col lg:justify-between lg:p-14 xl:p-16">
        <div
          className="pointer-events-none absolute -top-28 -right-24 size-96 rounded-full bg-blue-600/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 size-80 rounded-full bg-blue-500/15 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="relative size-10 shrink-0 overflow-hidden rounded-xl shadow-sm">
              <Image
                src="/bannerku-logo.png"
                alt="Logo BannerIN"
                width={40}
                height={40}
                className="size-full object-cover"
                priority
              />
            </span>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              Banner<span className="text-blue-500">IN</span>
            </span>
          </Link>

          <div className="mt-4">
            <span className="inline-block rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              LAYANAN CETAK BANNER ONLINE
            </span>
          </div>
        </div>

        <div className="relative my-10">
          <span className="inline-flex items-center rounded-full border border-blue-500/25 bg-blue-950/60 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-400">
            — PORTAL PELANGGAN
          </span>
          <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-white xl:text-4xl">
            Cetak banner cepat,
            <br />
            pantau pesanan
            <br />
            <span className="text-blue-400">kapan saja.</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
            Masuk untuk melanjutkan desain di Studio, melihat riwayat transaksi, dan memantau progres produksi banner Anda secara real-time.
          </p>

          <div className="mt-8 space-y-4 rounded-2xl border border-slate-800/90 bg-slate-900/60 p-5">
            <div className="flex items-start gap-3 text-xs">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-blue-500/15 text-blue-400">
                ✓
              </span>
              <div>
                <strong className="block font-bold text-white">
                  Simpan &amp; Lanjutkan Desain
                </strong>
                <span className="mt-0.5 block text-[11px] text-slate-400">
                  File desain dan ukuran banner tersimpan aman di akun.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-blue-500/15 text-blue-400">
                ✓
              </span>
              <div>
                <strong className="block font-bold text-white">
                  Pembayaran QRIS Praktis
                </strong>
                <span className="mt-0.5 block text-[11px] text-slate-400">
                  Upload bukti transfer dan tunggu konfirmasi cepat.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-blue-500/15 text-blue-400">
                ✓
              </span>
              <div>
                <strong className="block font-bold text-white">
                  Lacak Status Cetak
                </strong>
                <span className="mt-0.5 block text-[11px] text-slate-400">
                  Pantau dari antrean cetak hingga banner siap diambil.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-slate-400">
          <svg
            className="size-4 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span>Akun pelanggan terdaftar aman • Data &amp; desain privat</span>
        </div>
      </div>

      {/* 3. Right Column (Desktop) & Main Content (Mobile): Customer Login Highlight */}
      <div className="flex flex-1 flex-col justify-between bg-white px-5 py-6 sm:p-10 lg:p-14 xl:p-16">
        <div className="hidden items-center justify-between text-xs lg:flex">
          <span className="font-semibold text-slate-400">
            Portal Pelanggan BannerIN
          </span>
          <Link
            href="/"
            className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-blue-600 transition"
          >
            ← Kembali ke Beranda
          </Link>
        </div>

        <div className="mx-auto my-auto w-full max-w-[420px] py-2 lg:py-8">
          {/* Highlight Badge */}
          <div className="mb-3 flex items-center gap-2.5 lg:mb-4">
            <span className="hidden size-10 place-items-center rounded-xl bg-blue-50 text-blue-600 lg:grid">
              <svg
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </span>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-600">
              <span className="hidden lg:inline">Akun Pelanggan</span>
              <span className="lg:hidden">Masuk Pelanggan</span>
            </span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Masuk ke Akun Anda
          </h2>
          <p className="mt-2 hidden text-xs leading-relaxed text-slate-500 lg:block">
            Masuk untuk mulai memesan, mengunggah desain, atau melacak status cetak banner Anda.
          </p>

          {redirectTo && !isAdminModalOpen && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              Silakan masuk ke akun pelanggan Anda terlebih dahulu untuk melanjutkan.
            </div>
          )}

          {customerState?.error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 space-y-1.5">
              <div className="font-semibold text-rose-700">{customerState.error}</div>
              <p className="border-t border-rose-200/60 pt-1.5 text-[11px] leading-relaxed text-rose-700/90">
                💡 <strong>Belum konfirmasi email?</strong> Jika Anda baru saja mendaftar, pastikan sudah membuka tautan aktivasi di folder Kotak Masuk atau Spam email pribadi Anda sebelum masuk.
              </p>
            </div>
          )}

          {showForgotNote && (
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
              Lupa kata sandi? Hubungi tim CS / Admin BannerIN untuk bantuan reset akses akun Anda.
            </div>
          )}

          <form action={customerFormAction} className="mt-5 space-y-4">
            <input
              type="hidden"
              suppressHydrationWarning
              name="redirectTo"
              value={redirectTo}
            />
            <input
              type="hidden"
              suppressHydrationWarning
              name="loginRole"
              value="customer"
            />

            <div>
              <label
                htmlFor="customer-email"
                className="block text-xs font-bold text-slate-800"
              >
                Email Pelanggan
              </label>
              <div className="relative mt-1.5">
                <input
                  id="customer-email"
                  suppressHydrationWarning
                  name="email"
                  type="email"
                  required
                  placeholder="nama@email.com"
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
                />
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>

            <div>
              <label
                htmlFor="customer-password"
                className="block text-xs font-bold text-slate-800"
              >
                Kata Sandi
              </label>
              <div className="relative mt-1.5">
                <input
                  id="customer-password"
                  suppressHydrationWarning
                  name="password"
                  type={showCustomerPassword ? 'text' : 'password'}
                  required
                  placeholder="Masukkan kata sandi"
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
                />
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setShowCustomerPassword(!showCustomerPassword)}
                  aria-label="Tampilkan atau sembunyikan kata sandi"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <svg
                    className="size-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5 text-xs">
              <label className="flex cursor-pointer items-center gap-2 select-none">
                <input
                  type="checkbox"
                  suppressHydrationWarning
                  className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-slate-600">Ingat saya</span>
              </label>
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setShowForgotNote(!showForgotNote)}
                className="font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Lupa kata sandi?
              </button>
            </div>

            <button
              type="submit"
              suppressHydrationWarning
              disabled={isCustomerPending}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50 cursor-pointer sm:text-sm"
            >
              <span className="hidden lg:inline">
                {isCustomerPending ? 'Memproses...' : 'Masuk sebagai Pelanggan'}
              </span>
              <span className="lg:hidden">
                {isCustomerPending ? 'Memproses...' : 'Masuk Sekarang'}
              </span>
              <svg
                className="size-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </button>
          </form>

          {/* Highlighted Customer Register Card */}
          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-center">
            <p className="text-xs text-slate-600">
              <span className="hidden lg:inline">Belum punya akun BannerIN?</span>
              <span className="lg:hidden">Baru pertama kali memesan?</span>
            </p>
            <Link
              href={registerHref}
              className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-900 shadow-2xs transition hover:border-blue-300 hover:text-blue-700 lg:text-slate-900"
            >
              <span className="hidden lg:inline">Daftar Akun Gratis →</span>
              <span className="text-blue-600 lg:hidden">Daftar Akun Baru →</span>
            </Link>
          </div>

          {/* Subtle Divider */}
          <div className="my-6 hidden items-center gap-3 lg:flex">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] font-medium text-slate-400">
              atau akses internal
            </span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Subtle Admin Login Access at Bottom */}
          <div className="mt-6 rounded-xl border border-slate-200/90 bg-slate-50/80 px-4 py-3.5 lg:mt-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-purple-50 text-purple-600">
                  <svg
                    className="size-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-2.18-7.904a48.507 48.507 0 0110.38 0c.928.09 1.62.868 1.62 1.8V12c0 6.627-5.373 12-12 12S0 18.627 0 12V6.646c0-.932.692-1.71 1.62-1.8a48.507 48.507 0 0110.38 0z"
                    />
                  </svg>
                </span>
                <div>
                  <span className="hidden text-xs font-medium text-slate-600 lg:inline">
                    Tim Operasional Percetakan?
                  </span>
                  <div className="lg:hidden">
                    <span className="block text-[11px] font-medium text-slate-500">
                      Khusus pengelola toko
                    </span>
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setIsAdminModalOpen(true)}
                      className="mt-0.5 text-xs font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
                    >
                      Masuk sebagai Admin Percetakan →
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setIsAdminModalOpen(true)}
                className="hidden shrink-0 text-xs font-bold text-purple-600 hover:text-purple-700 transition cursor-pointer lg:inline-flex"
              >
                Masuk sebagai Admin →
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-[11px] text-slate-400">
          <span className="hidden lg:inline">
            © 2026 BannerIN. Hak cipta dilindungi.
          </span>
          <span className="lg:hidden">© 2026 BannerIN</span>
        </div>
      </div>

      {/* 4. Secondary Admin Login Modal */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-purple-50 text-purple-600">
                  <svg
                    className="size-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-2.18-7.904a48.507 48.507 0 0110.38 0c.928.09 1.62.868 1.62 1.8V12c0 6.627-5.373 12-12 12S0 18.627 0 12V6.646c0-.932.692-1.71 1.62-1.8a48.507 48.507 0 0110.38 0z"
                    />
                  </svg>
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600">
                  AKSES INTERNAL
                </span>
              </div>

              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setIsAdminModalOpen(false)}
                aria-label="Tutup login admin"
                className="grid size-8 place-items-center rounded-xl bg-slate-100 text-sm font-bold text-slate-500 hover:bg-slate-200 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-950">
              Masuk sebagai Admin
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Khusus tim operasional percetakan BannerIN. Kelola pesanan, pembayaran, dan proses produksi.
            </p>

            {adminState?.error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                {adminState.error}
              </div>
            )}

            <form action={adminFormAction} className="mt-5 space-y-4">
              <input
                type="hidden"
                suppressHydrationWarning
                name="redirectTo"
                value={redirectTo}
              />
              <input
                type="hidden"
                suppressHydrationWarning
                name="loginRole"
                value="admin"
              />

              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-xs font-bold text-slate-800"
                >
                  Email Admin
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="admin-email"
                    suppressHydrationWarning
                    name="email"
                    type="email"
                    required
                    placeholder="admin@bannerin.com"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/15"
                  />
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-bold text-slate-800"
                >
                  Kata Sandi
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="admin-password"
                    suppressHydrationWarning
                    name="password"
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan kata sandi"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/15"
                  />
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    aria-label="Tampilkan atau sembunyikan kata sandi admin"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <svg
                      className="size-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                suppressHydrationWarning
                disabled={isAdminPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-purple-700 disabled:opacity-50 cursor-pointer sm:text-sm"
              >
                {isAdminPending ? 'Memproses...' : 'Masuk sebagai Admin'}
                <svg
                  className="size-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setIsAdminModalOpen(false)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                ← Kembali ke login pelanggan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white p-8 text-xs font-medium text-slate-500">
          Memuat halaman masuk BannerIN...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
