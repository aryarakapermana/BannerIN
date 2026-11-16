'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { logoutAction } from '@/app/(auth)/actions'
import { updateCustomerProfileAction } from '@/app/customer/actions'
import {
  OrderStatusBadge,
  OrderStatusTimeline,
} from '@/components/customer/OrderStatusTimeline'
import { BANNERIN_WHATSAPP, Order } from '@/domain'
import type { CustomerOrderDTO } from '@/lib/customer-orders'

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

interface CustomerDashboardClientProps {
  profile: {
    id: string
    fullName: string
    phone: string
    email: string
  }
  initialOrders: CustomerOrderDTO[]
}

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return 'BK'
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function CustomerDashboardClient({
  profile: initialProfile,
  initialOrders,
}: CustomerDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders')
  const [filterTab, setFilterTab] = useState<'all' | 'processing' | 'completed'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Profil state
  const [profileName, setProfileName] = useState(initialProfile.fullName)
  const [profilePhone, setProfilePhone] = useState(initialProfile.phone)
  const [editFullName, setEditFullName] = useState(initialProfile.fullName)
  const [editPhone, setEditPhone] = useState(initialProfile.phone)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const metrics = useMemo(() => {
    const total = initialOrders.length
    const pendingCount = initialOrders.filter((o) => o.status === 'pending').length
    const confirmedOrPrinting = initialOrders.filter(
      (o) => o.status === 'confirmed' || o.status === 'processing'
    ).length
    const processingTotal = pendingCount + confirmedOrPrinting
    const completed = initialOrders.filter((o) => o.status === 'completed').length

    return {
      total,
      pendingCount,
      confirmedOrPrinting,
      processingTotal,
      completed,
    }
  }, [initialOrders])

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return initialOrders.filter((order) => {
      if (
        filterTab === 'processing' &&
        !['pending', 'confirmed', 'processing'].includes(order.status)
      ) {
        return false
      }
      if (filterTab === 'completed' && order.status !== 'completed') {
        return false
      }
      if (
        q &&
        !order.orderNumber.toLowerCase().includes(q) &&
        !order.materialName.toLowerCase().includes(q) &&
        !order.customerName.toLowerCase().includes(q) &&
        !(order.notes ?? '').toLowerCase().includes(q)
      ) {
        return false
      }
      return true
    })
  }, [initialOrders, filterTab, searchQuery])

  const firstName = profileName.trim().split(/\s+/)[0] || 'Pelanggan'
  const initials = getInitials(profileName)

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    setProfileMessage(null)

    try {
      const res = await updateCustomerProfileAction({
        fullName: editFullName,
        phone: editPhone,
      })
      if (!res.success) {
        setProfileMessage({
          type: 'error',
          text: res.error || 'Gagal memperbarui profil.',
        })
        return
      }
      if (res.fullName) {
        setProfileName(res.fullName)
        setEditFullName(res.fullName)
      }
      if (res.phone) {
        setProfilePhone(res.phone)
        setEditPhone(res.phone)
      }
      setProfileMessage({
        type: 'success',
        text: 'Profil Anda berhasil diperbarui.',
      })
    } catch {
      setProfileMessage({
        type: 'error',
        text: 'Terjadi kesalahan saat menyimpan perubahan profil.',
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="relative size-8 shrink-0 overflow-hidden rounded-lg shadow-sm">
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

          <nav className="hidden items-center gap-7 md:flex text-xs font-semibold text-slate-600">
            <Link href="/#produk" className="hover:text-blue-600 transition">
              Produk
            </Link>
            <Link href="/materials" className="hover:text-blue-600 transition">
              Katalog Bahan
            </Link>
            <Link href="/studio" className="hover:text-blue-600 transition">
              Studio Banner
            </Link>
            <Link href="/#faq" className="hover:text-blue-600 transition">
              Bantuan
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800">
              <span className="grid size-6 place-items-center rounded-full bg-blue-100 text-[11px] text-blue-700 font-extrabold">
                {initials}
              </span>
              <span className="hidden sm:inline">{profileName}</span>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                suppressHydrationWarning
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Subheader Navigation */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-8 text-xs font-bold">
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 border-b-2 py-4 transition cursor-pointer ${
                activeTab === 'orders'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              Dashboard
            </button>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 border-b-2 py-4 transition cursor-pointer ${
                activeTab === 'profile'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Profil saya
            </button>
          </div>

          <Link
            href="/"
            className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
          >
            Kembali ke beranda ↗
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        {/* Welcome Banner */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Halo, {firstName}. Selamat datang kembali!
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Pantau proses cetak dan kelola semua pesananmu di sini secara real-time.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600 font-medium">
              <span>{profileName}</span>
              <span>·</span>
              <span className="font-mono">{profilePhone || '-'}</span>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                Pelanggan
              </span>
            </div>
          </div>

          <Link
            href="/studio"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
          >
            + Buat Pesanan Baru
          </Link>
        </div>

        {activeTab === 'orders' ? (
          <>
            {/* 3 Dynamic Stat Cards */}
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                  <span className="text-xs font-semibold text-slate-500">
                    Total Pesanan
                  </span>
                  <div className="mt-1 text-3xl font-black font-mono text-slate-950">
                    {metrics.total}
                  </div>
                  <span className="mt-1 block text-[11px] text-slate-400">
                    Seluruh pesanan akunmu
                  </span>
                </div>
                <span className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                  <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                  <span className="text-xs font-semibold text-slate-500">
                    Pesanan Sedang Diproses
                  </span>
                  <div className="mt-1 text-3xl font-black font-mono text-slate-950">
                    {metrics.processingTotal}
                  </div>
                  <span className="mt-1 block text-[11px] text-slate-400">
                    {metrics.pendingCount} menunggu · {metrics.confirmedOrPrinting}{' '}
                    dikonfirmasi / dicetak
                  </span>
                </div>
                <span className="grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
                  <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                  <span className="text-xs font-semibold text-slate-500">
                    Pesanan Selesai
                  </span>
                  <div className="mt-1 text-3xl font-black font-mono text-slate-950">
                    {metrics.completed}
                  </div>
                  <span className="mt-1 block text-[11px] text-slate-400">
                    Siap diambil / selesai cetak
                  </span>
                </div>
                <span className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </span>
              </div>
            </div>

            {/* Orders Section */}
            <div className="mt-10">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    Riwayat pesanan
                  </h2>
                  <p className="text-xs text-slate-500">
                    Dari desain dikirim sampai cetakan selesai diproduksi.
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    suppressHydrationWarning
                    placeholder="Cari nomor #BK, bahan, atau catatan"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs font-medium focus:border-blue-600 focus:outline-none"
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setFilterTab('all')}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
                    filterTab === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Semua pesanan{' '}
                  <span className="ml-1 opacity-80 font-mono">{metrics.total}</span>
                </button>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setFilterTab('processing')}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
                    filterTab === 'processing'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Diproses{' '}
                  <span className="ml-1 opacity-80 font-mono">
                    {metrics.processingTotal}
                  </span>
                </button>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setFilterTab('completed')}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
                    filterTab === 'completed'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Selesai{' '}
                  <span className="ml-1 opacity-80 font-mono">
                    {metrics.completed}
                  </span>
                </button>
              </div>

              {/* Order Cards List */}
              {filteredOrders.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                  <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-2xl text-blue-600">
                    🖼️
                  </span>
                  <h3 className="mt-4 text-base font-extrabold text-slate-950">
                    {initialOrders.length === 0
                      ? 'Belum ada pesanan banner'
                      : 'Pesanan tidak ditemukan'}
                  </h3>
                  <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">
                    {initialOrders.length === 0
                      ? 'Mulai atur ukuran, unggah desainmu di Studio, dan pantau setiap tahap produksi langsung dari halaman ini.'
                      : 'Coba ubah filter status atau kata kunci pencarian nomor pesanan.'}
                  </p>
                  {initialOrders.length === 0 && (
                    <Link
                      href="/studio"
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
                    >
                      Mulai Desain di Studio →
                    </Link>
                  )}
                </div>
              ) : (
                <div className="mt-6 space-y-5">
                  {filteredOrders.map((order) => {
                    const statusMeta = Order.getCustomerStatusMeta(order.status)
                    const waHelpText = encodeURIComponent(
                      `Halo Admin BannerIN, saya ingin menanyakan progres pesanan ${order.orderNumber} (${order.materialName}, ${order.widthCm}x${order.heightCm} cm).`
                    )

                    return (
                      <div
                        key={order.id}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300"
                      >
                        {/* Card Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-6 py-3.5 text-xs">
                          <div className="flex items-center gap-2 font-mono font-bold text-slate-800">
                            <Link
                              href={`/customer/orders/${order.id}`}
                              className="hover:text-blue-600 transition"
                            >
                              {order.orderNumber}
                            </Link>
                            <span className="text-slate-400 font-normal">·</span>
                            <span className="font-sans font-normal text-slate-500">
                              {order.dateFormatted} · {order.timeFormatted}
                            </span>
                          </div>

                          <OrderStatusBadge status={order.status} />
                        </div>

                        {/* Card Body */}
                        <div className="p-6">
                          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-start gap-4 sm:gap-5">
                              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center">
                                {order.previewUrl ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={order.previewUrl}
                                    alt={`Desain ${order.orderNumber}`}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-2xl text-slate-400">🖼️</span>
                                )}
                              </div>

                              <div>
                                <Link
                                  href={`/customer/orders/${order.id}`}
                                  className="text-base font-bold text-slate-950 hover:text-blue-600 transition"
                                >
                                  Banner {order.materialName} ({order.widthCm} ×{' '}
                                  {order.heightCm} cm)
                                </Link>
                                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-600">
                                  <div>
                                    <span className="text-slate-400">Bahan</span>
                                    <strong className="block text-slate-900">
                                      {order.materialName}
                                    </strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">Ukuran &amp; Luas</span>
                                    <strong className="block text-slate-900 font-mono">
                                      {order.widthCm} × {order.heightCm} cm ={' '}
                                      {order.areaSqm.toFixed(2)} m²
                                    </strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">Qty</span>
                                    <strong className="block text-slate-900 font-mono">
                                      {order.quantity} pcs
                                    </strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">Tarif Snapshot</span>
                                    <strong className="block text-slate-900 font-mono">
                                      {rupiah.format(order.unitPriceSnapshot)}/m²
                                    </strong>
                                  </div>
                                </div>
                                <p className="mt-2.5 text-xs text-slate-500">
                                  {order.notes
                                    ? `Catatan: ${order.notes}`
                                    : statusMeta.description}
                                </p>
                              </div>
                            </div>

                            <div className="text-left lg:text-right shrink-0">
                              <span className="text-[11px] text-slate-400">
                                Total biaya
                              </span>
                              <div className="text-2xl font-black text-slate-950 font-mono">
                                {rupiah.format(order.totalPrice)}
                              </div>
                              <span className="text-[10px] text-slate-400">
                                🔒 Harga snapshot saat pemesanan
                              </span>
                            </div>
                          </div>

                          {/* Progress Stepper Timeline */}
                          <div className="mt-8 border-t border-slate-100 pt-6">
                            <OrderStatusTimeline status={order.status} />

                            {/* Action Buttons */}
                            <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
                              <Link
                                href={`/customer/orders/${order.id}`}
                                className="rounded-xl bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
                              >
                                Lihat Rincian
                              </Link>

                              <Link
                                href={`/customer/orders/${order.id}?print=1`}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                              >
                                <svg
                                  className="size-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                  />
                                </svg>
                                Download Invoice
                              </Link>

                              <a
                                href={`${BANNERIN_WHATSAPP.baseUrl}?text=${waHelpText}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                              >
                                <svg
                                  className="size-3.5 text-emerald-600"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                                </svg>
                                Bantuan WhatsApp
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="mt-8 flex flex-col items-center justify-between gap-4 text-xs text-slate-400 sm:flex-row">
                <span>
                  Menampilkan {filteredOrders.length} dari {initialOrders.length}{' '}
                  pesanan
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Status menunjukkan tahap produksi terbaru dari database BannerIN.
                </span>
              </div>
            </div>
          </>
        ) : (
          /* TAB 2: PROFIL SAYA */
          <div className="mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-black text-slate-950">Profil Pelanggan</h2>
            <p className="mt-1 text-xs text-slate-500">
              Informasi ini digunakan untuk mengisi nama pemesan dan kontak WhatsApp saat checkout.
            </p>

            {profileMessage && (
              <div
                className={`mt-4 rounded-xl border p-3 text-xs font-medium ${
                  profileMessage.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}
              >
                {profileMessage.text}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="mt-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700">Email Akun</label>
                <input
                  type="email"
                  suppressHydrationWarning
                  value={initialProfile.email}
                  disabled
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 font-medium text-slate-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700">Nama Lengkap *</label>
                <input
                  type="text"
                  suppressHydrationWarning
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700">
                  Nomor WhatsApp *
                </label>
                <input
                  type="tel"
                  suppressHydrationWarning
                  required
                  placeholder="081234567890"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  suppressHydrationWarning
                  disabled={isSavingProfile}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-white py-6 text-xs text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-2 px-5 lg:px-8 text-center sm:text-left">
          <span suppressHydrationWarning>&copy; {new Date().getFullYear()} Arya Raka Permana All rights reserved.</span>
          <span>Privasi akunmu terjamin melalui Row Level Security.</span>
        </div>
      </footer>
    </div>
  )
}

