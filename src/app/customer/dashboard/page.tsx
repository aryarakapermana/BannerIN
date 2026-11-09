'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

interface CustomerOrder {
  id: string
  code: string
  date: string
  title: string
  material: string
  dimensions: string
  qty: number
  status: 'pending' | 'confirmed' | 'processing' | 'completed'
  statusLabel: string
  totalPrice: number
  notes: string
  image: string
}

const mockOrders: CustomerOrder[] = [
  {
    id: '1',
    code: '#BK-202611-001',
    date: '06 November 2026',
    title: 'Banner promosi Kopi Sore',
    material: 'Flexi Premium 340g',
    dimensions: '300 × 100 cm = 3 m²',
    qty: 2,
    status: 'processing',
    statusLabel: 'Sedang Dicetak',
    totalPrice: 168000,
    notes: 'Desain disetujui, pesanan dalam proses cetak.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: '2',
    code: '#BK-202611-002',
    date: '08 November 2026',
    title: 'Banner promo akhir tahun',
    material: 'Flexi Premium 340g',
    dimensions: '200 × 100 cm = 2 m²',
    qty: 1,
    status: 'pending',
    statusLabel: 'Menunggu',
    totalPrice: 56000,
    notes: 'Pesanan diterima, menunggu konfirmasi tim.',
    image: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: '3',
    code: '#BK-202610-018',
    date: '28 Oktober 2026',
    title: 'Banner acara Ruang Kreatif',
    material: 'Flexi Korea 440g',
    dimensions: '300 × 100 cm = 3 m²',
    qty: 1,
    status: 'completed',
    statusLabel: 'Selesai',
    totalPrice: 135000,
    notes: 'Pesanan sudah diambil pada 30 Oktober 2026.',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=500&q=80',
  },
]

export default function CustomerDashboardPage() {
  const [filterTab, setFilterTab] = useState<'all' | 'processing' | 'completed'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = mockOrders.filter((order) => {
    if (filterTab === 'processing' && !['pending', 'confirmed', 'processing'].includes(order.status)) return false
    if (filterTab === 'completed' && order.status !== 'completed') return false
    if (
      searchQuery &&
      !order.code.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !order.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }
    return true
  })

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="relative size-8 shrink-0 overflow-hidden rounded-lg shadow-sm">
              <Image
                src="/bannerku-logo.png"
                alt="Logo BannerKu"
                width={32}
                height={32}
                className="size-full object-cover"
                priority
              />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-slate-950">
              Banner<span className="text-blue-600">Ku</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex text-xs font-semibold text-slate-600">
            <Link href="/#produk" className="hover:text-blue-600 transition">Produk</Link>
            <Link href="/#cara-pesan" className="hover:text-blue-600 transition">Cara pesan</Link>
            <Link href="/#panduan-berkas" className="hover:text-blue-600 transition">Panduan cetak</Link>
            <Link href="/#faq" className="hover:text-blue-600 transition">Bantuan</Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800">
              <span className="grid size-6 place-items-center rounded-full bg-blue-100 text-[11px] text-blue-700 font-extrabold">
                AP
              </span>
              <span>Andi Pratama</span>
            </div>
          </div>
        </div>
      </header>

      {/* Subheader Navigation */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-8 text-xs font-bold">
            <button
              type="button"
              className="flex items-center gap-2 border-b-2 border-blue-600 py-4 text-blue-600"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </button>
            <button
              type="button"
              className="flex items-center gap-2 border-b-2 border-transparent py-4 text-slate-500 hover:text-slate-900"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profil saya
            </button>
          </div>

          <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition">
            Kembali ke beranda ↗
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        {/* Welcome Banner */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Halo, Andi. Selamat datang kembali!
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Pantau proses cetak dan kelola semua pesananmu di sini.
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 font-medium">
              <span>Andi Pratama</span>
              <span>·</span>
              <span className="font-mono">0812 ···· 6789</span>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                Konsumen
              </span>
            </div>
          </div>

          <Link
            href="/studio"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
          >
            + Buat Pesanan Baru
          </Link>
        </div>

        {/* 3 Stat Cards */}
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <span className="text-xs font-semibold text-slate-500">Total Pesanan</span>
              <div className="mt-1 text-3xl font-black text-slate-950">3</div>
              <span className="mt-1 block text-[11px] text-slate-400">Seluruh pesananmu</span>
            </div>
            <span className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <span className="text-xs font-semibold text-slate-500">Pesanan Sedang Diproses</span>
              <div className="mt-1 text-3xl font-black text-slate-950">2</div>
              <span className="mt-1 block text-[11px] text-slate-400">1 menunggu · 1 sedang dicetak</span>
            </div>
            <span className="grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <span className="text-xs font-semibold text-slate-500">Pesanan Selesai</span>
              <div className="mt-1 text-3xl font-black text-slate-950">1</div>
              <span className="mt-1 block text-[11px] text-slate-400">Sudah diambil</span>
            </div>
            <span className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
        </div>

        {/* Orders Section */}
        <div className="mt-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-black text-slate-950">Riwayat pesanan</h2>
              <p className="text-xs text-slate-500">Dari desain dikirim sampai cetakan diterima.</p>
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Cari nomor atau nama pesanan"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs font-medium focus:border-blue-600 focus:outline-none"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                filterTab === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Semua pesanan <span className="ml-1 opacity-80 font-mono">3</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('processing')}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                filterTab === 'processing'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Diproses <span className="ml-1 opacity-80 font-mono">2</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('completed')}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                filterTab === 'completed'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Selesai <span className="ml-1 opacity-80 font-mono">1</span>
            </button>
          </div>

          {/* Order Cards List */}
          <div className="mt-6 space-y-5">
            {filtered.map((order) => {
              const isCompleted = order.status === 'completed'
              const isProcessing = order.status === 'processing'
              const isConfirmed = order.status === 'confirmed' || isProcessing || isCompleted
              const isPrinted = isProcessing || isCompleted

              return (
                <div
                  key={order.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-3.5 text-xs">
                    <div className="flex items-center gap-2 font-mono font-bold text-slate-700">
                      <span>{order.code}</span>
                      <span className="text-slate-400 font-normal">·</span>
                      <span className="font-sans font-normal text-slate-500">{order.date}</span>
                    </div>

                    <span
                      className={`rounded-full px-3 py-0.5 text-[11px] font-bold ${
                        order.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : order.status === 'processing'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      ● {order.statusLabel}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-5">
                        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                          <Image
                            src={order.image}
                            alt={order.title}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-slate-950">{order.title}</h3>
                          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-600">
                            <div>
                              <span className="text-slate-400">Bahan</span>
                              <strong className="block text-slate-900">{order.material}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400">Ukuran</span>
                              <strong className="block text-slate-900 font-mono">{order.dimensions}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400">Qty</span>
                              <strong className="block text-slate-900 font-mono">{order.qty} pcs</strong>
                            </div>
                          </div>
                          <p className="mt-2.5 text-xs text-slate-500">{order.notes}</p>
                        </div>
                      </div>

                      <div className="text-left lg:text-right">
                        <span className="text-[11px] text-slate-400">Total biaya</span>
                        <div className="text-2xl font-black text-slate-950 font-mono">
                          {rupiah.format(order.totalPrice)}
                        </div>
                        <span className="text-[10px] text-slate-400">Tercatat saat pemesanan</span>
                      </div>
                    </div>

                    {/* Progress Stepper Timeline */}
                    <div className="mt-8 border-t border-slate-100 pt-6">
                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div className="flex flex-col items-center">
                          <span className="grid size-6 place-items-center rounded-full bg-emerald-500 text-white text-[11px] font-bold">
                            ✓
                          </span>
                          <span className="mt-2 font-bold text-slate-800">Menunggu</span>
                        </div>

                        <div className="flex flex-col items-center">
                          <span
                            className={`grid size-6 place-items-center rounded-full text-[11px] font-bold ${
                              isConfirmed ? 'bg-emerald-500 text-white' : 'border border-slate-300 bg-white text-slate-400'
                            }`}
                          >
                            {isConfirmed ? '✓' : '2'}
                          </span>
                          <span className={`mt-2 font-bold ${isConfirmed ? 'text-slate-800' : 'text-slate-400'}`}>
                            Dikonfirmasi
                          </span>
                        </div>

                        <div className="flex flex-col items-center">
                          <span
                            className={`grid size-6 place-items-center rounded-full text-[11px] font-bold ${
                              isCompleted
                                ? 'bg-emerald-500 text-white'
                                : isPrinted
                                ? 'bg-blue-600 text-white'
                                : 'border border-slate-300 bg-white text-slate-400'
                            }`}
                          >
                            {isCompleted ? '✓' : '3'}
                          </span>
                          <span className={`mt-2 font-bold ${isPrinted ? 'text-blue-600' : 'text-slate-400'}`}>
                            Sedang Dicetak
                          </span>
                        </div>

                        <div className="flex flex-col items-center">
                          <span
                            className={`grid size-6 place-items-center rounded-full text-[11px] font-bold ${
                              isCompleted ? 'bg-emerald-500 text-white' : 'border border-slate-300 bg-white text-slate-400'
                            }`}
                          >
                            {isCompleted ? '✓' : '4'}
                          </span>
                          <span className={`mt-2 font-bold ${isCompleted ? 'text-emerald-700' : 'text-slate-400'}`}>
                            Siap Diambil / Selesai
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
                        <button
                          type="button"
                          className="rounded-xl bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
                        >
                          Lihat Rincian
                        </button>

                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                        >
                          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Invoice
                        </button>

                        <a
                          href="https://wa.me/6281234567890"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                        >
                          <svg className="size-3.5 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
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

          <div className="mt-8 flex flex-col items-center justify-between gap-4 text-xs text-slate-400 sm:flex-row">
            <span>Menampilkan seluruh 3 pesanan</span>
            <span className="flex items-center gap-1.5">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Status menunjukkan tahap terakhir pesananmu.
            </span>
          </div>
        </div>
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-white py-6 text-xs text-slate-400">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 lg:px-8">
          <span>© 2026 BannerKu. Hak cipta dilindungi.</span>
          <span>Privasi akunmu tetap penting.</span>
        </div>
      </footer>
    </div>
  )
}
