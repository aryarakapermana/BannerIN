'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled'

export type DashboardOrder = {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  material: string
  width: number
  height: number
  total: number
  status: OrderStatus
  preview: string
  fileSize: string
  createdAt: string
  dateFormatted: string
}

export type DashboardMaterial = {
  id: string
  code: string
  name: string
  category: string
  weight: string
  description: string
  price: number
  active: boolean
  lastUpdated: string
}

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const defaultOrders: DashboardOrder[] = [
  {
    id: 'ord-1',
    orderNumber: '#BK-202611-007',
    customerName: 'Dewi Lestari',
    customerPhone: '0813 ···· 2408',
    material: 'Flexi Korea 440g',
    width: 200,
    height: 100,
    total: 90000,
    status: 'pending',
    preview: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80',
    fileSize: 'PDF · 8,2 MB',
    createdAt: '08 Nov · 10.42',
    dateFormatted: '08 November 2026',
  },
  {
    id: 'ord-2',
    orderNumber: '#BK-202611-006',
    customerName: 'Budi Santoso',
    customerPhone: '0857 ···· 1132',
    material: 'Flexi Premium 340g',
    width: 200,
    height: 100,
    total: 56000,
    status: 'pending',
    preview: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=300&q=80',
    fileSize: 'PDF · 5,6 MB',
    createdAt: '08 Nov · 10.18',
    dateFormatted: '08 November 2026',
  },
  {
    id: 'ord-3',
    orderNumber: '#BK-202611-005',
    customerName: 'Siti Rahma',
    customerPhone: '0812 ···· 7821',
    material: 'Flexi Korea 440g',
    width: 300,
    height: 100,
    total: 135000,
    status: 'confirmed',
    preview: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=300&q=80',
    fileSize: 'PNG · 6,4 MB',
    createdAt: '08 Nov · 09.50',
    dateFormatted: '08 November 2026',
  },
  {
    id: 'ord-4',
    orderNumber: '#BK-202611-001',
    customerName: 'Andi Pratama',
    customerPhone: '0812 ···· 6789',
    material: 'Flexi Premium 340g',
    width: 300,
    height: 100,
    total: 168000,
    status: 'processing',
    preview: 'https://images.unsplash.com/photo-1506617420156-8e4536971650?auto=format&fit=crop&w=300&q=80',
    fileSize: 'PNG · 4,8 MB',
    createdAt: '06 Nov · 14.20',
    dateFormatted: '06 November 2026',
  },
  {
    id: 'ord-5',
    orderNumber: '#BK-202611-004',
    customerName: 'Rizky Saputra',
    customerPhone: '0821 ···· 4490',
    material: 'Flexi 280g',
    width: 200,
    height: 100,
    total: 50000,
    status: 'completed',
    preview: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=300&q=80',
    fileSize: 'PDF · 3,1 MB',
    createdAt: '08 Nov · 09.12',
    dateFormatted: '08 November 2026',
  },
  {
    id: 'ord-6',
    orderNumber: '#BK-202611-003',
    customerName: 'Nadia Putri',
    customerPhone: '0819 ···· 9054',
    material: 'Flexi 280g',
    width: 100,
    height: 100,
    total: 25000,
    status: 'cancelled',
    preview: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=300&q=80',
    fileSize: 'PDF · 2,7 MB',
    createdAt: '08 Nov · 08.46',
    dateFormatted: '08 November 2026',
  },
]

const defaultMaterials: DashboardMaterial[] = [
  {
    id: 'mat-1',
    code: 'BHN-001',
    name: 'Flexi Premium 340g',
    category: 'Banner outdoor',
    weight: '340g',
    description: 'Permukaan halus untuk banner promosi harian.',
    price: 28000,
    active: true,
    lastUpdated: '08 Nov 2026 oleh Rani Aditya',
  },
  {
    id: 'mat-2',
    code: 'BHN-002',
    name: 'Flexi Korea 440g',
    category: 'Banner outdoor',
    weight: '440g',
    description: 'Bahan lebih tebal untuk banner promosi jangka panjang.',
    price: 45000,
    active: true,
    lastUpdated: '06 Nov 2026 oleh Rani Aditya',
  },
  {
    id: 'mat-3',
    code: 'BHN-003',
    name: 'Flexi 280g',
    category: 'Banner outdoor',
    weight: '280g',
    description: 'Pilihan ringan dan ekonomis untuk promosi harian.',
    price: 25000,
    active: true,
    lastUpdated: '05 Nov 2026 oleh Rani Aditya',
  },
  {
    id: 'mat-4',
    code: 'BHN-004',
    name: 'Albatros',
    category: 'Display indoor',
    weight: '260g',
    description: 'Hasil cetak tajam untuk poster dan display indoor.',
    price: 65000,
    active: true,
    lastUpdated: '04 Nov 2026 oleh Rani Aditya',
  },
  {
    id: 'mat-5',
    code: 'BHN-005',
    name: 'Luster',
    category: 'Display indoor',
    weight: '260g',
    description: 'Finishing semi-gloss untuk roll banner dan display.',
    price: 70000,
    active: true,
    lastUpdated: '04 Nov 2026 oleh Rani Aditya',
  },
  {
    id: 'mat-6',
    code: 'BHN-006',
    name: 'Stiker Vinyl',
    category: 'Stiker',
    weight: '120g',
    description: 'Media perekat tahan air untuk kaca dan permukaan rata.',
    price: 85000,
    active: false,
    lastUpdated: '02 Nov 2026 oleh Rani Aditya',
  },
  {
    id: 'mat-7',
    code: 'BHN-007',
    name: 'Backlite',
    category: 'Signage',
    weight: '510g',
    description: 'Media tembus cahaya untuk neon box dan signage.',
    price: 95000,
    active: false,
    lastUpdated: '01 Nov 2026 oleh Rani Aditya',
  },
]

interface DashboardClientProps {
  initialMaterials?: DashboardMaterial[]
  initialOrders?: DashboardOrder[]
  isDemo?: boolean
}

export default function DashboardClient({
  initialMaterials,
  initialOrders,
}: DashboardClientProps = {}) {
  const [currentView, setCurrentView] = useState<'orders' | 'materials'>('orders')
  const [orders, setOrders] = useState<DashboardOrder[]>(initialOrders && initialOrders.length > 0 ? initialOrders : defaultOrders)
  const [materials, setMaterials] = useState<DashboardMaterial[]>(initialMaterials && initialMaterials.length > 0 ? initialMaterials : defaultMaterials)

  // Orders filters
  const [orderSearch, setOrderSearch] = useState('')
  const [orderFilterTab, setOrderFilterTab] = useState<'all' | 'pending' | 'processing'>('all')

  // Materials filters & quick edit
  const [materialSearch, setMaterialSearch] = useState('')
  const [materialFilterTab, setMaterialFilterTab] = useState<'all' | 'active' | 'inactive'>('all')
  const [quickEditId, setQuickEditId] = useState<string | null>('mat-1')
  const [quickEditPrice, setQuickEditPrice] = useState<number>(28000)

  // Edit Modal State
  const [editingMaterial, setEditingMaterial] = useState<DashboardMaterial | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (orderFilterTab === 'pending' && o.status !== 'pending') return false
      if (orderFilterTab === 'processing' && o.status !== 'processing') return false
      if (
        orderSearch &&
        !o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) &&
        !o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) &&
        !o.customerPhone.includes(orderSearch)
      ) {
        return false
      }
      return true
    })
  }, [orders, orderFilterTab, orderSearch])

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (materialFilterTab === 'active' && !m.active) return false
      if (materialFilterTab === 'inactive' && m.active) return false
      if (
        materialSearch &&
        !m.name.toLowerCase().includes(materialSearch.toLowerCase()) &&
        !m.code.toLowerCase().includes(materialSearch.toLowerCase())
      ) {
        return false
      }
      return true
    })
  }, [materials, materialFilterTab, materialSearch])

  // Metrics
  const metrics = useMemo(() => {
    const todayOrders = orders.length
    const pendingOrders = orders.filter((o) => o.status === 'pending').length
    const processingOrders = orders.filter((o) => o.status === 'processing').length
    const revenue = 12480000
    const activeMaterials = materials.filter((m) => m.active).length
    const inactiveMaterials = materials.filter((m) => !m.active).length
    return {
      todayOrders,
      pendingOrders,
      processingOrders,
      revenue,
      totalMaterials: materials.length,
      activeMaterials,
      inactiveMaterials,
    }
  }, [orders, materials])

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
    )
  }

  const handleToggleMaterial = (matId: string) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === matId ? { ...m, active: !m.active } : m)),
    )
  }

  const handleSaveQuickPrice = (matId: string) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === matId ? { ...m, price: quickEditPrice } : m)),
    )
    setQuickEditId(null)
  }

  const handleOpenEditModal = (m: DashboardMaterial) => {
    setEditingMaterial({ ...m })
    setIsModalOpen(true)
  }

  const handleSaveModal = () => {
    if (!editingMaterial) return
    setMaterials((prev) =>
      prev.map((m) => (m.id === editingMaterial.id ? editingMaterial : m)),
    )
    setIsModalOpen(false)
  }

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      {/* 1. Left Dark Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between bg-slate-950 p-5 text-white">
        <div>
          {/* Brand */}
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
            <div>
              <span className="text-lg font-black tracking-tight text-white">
                Banner<span className="text-blue-500">Ku</span>
              </span>
              <span className="block text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                ADMIN PERCETAKAN
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <div className="mt-8">
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              OPERASIONAL
            </span>
            <nav className="mt-3 space-y-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setCurrentView('orders')}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition ${
                  currentView === 'orders'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Ringkasan Pesanan
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentView('orders')
                  setOrderFilterTab('pending')
                }}
                className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-slate-400 hover:bg-white/5 hover:text-white transition"
              >
                <div className="flex items-center gap-3">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Kelola Pesanan Masuk
                </div>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300 font-mono">
                  2
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentView('materials')}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition ${
                  currentView === 'materials'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Katalog & Harga Bahan
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-slate-400 hover:bg-white/5 hover:text-white transition"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Pelanggan
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-slate-400 hover:bg-white/5 hover:text-white transition"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Pengaturan
              </button>
            </nav>
          </div>

          {/* Green Status Card */}
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400" />
              <strong className="text-xs font-bold text-white">Toko menerima pesanan</strong>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              Kelola pesanan dan harga cetak dalam satu ruang kerja.
            </p>
            <Link
              href="/"
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300"
            >
              Lihat toko BannerKu ↗
            </Link>
          </div>
        </div>

        {/* User Card */}
        <div className="border-t border-slate-800 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-slate-800 text-xs font-bold text-slate-200">
                RA
              </span>
              <div>
                <strong className="block text-xs font-bold text-white">Rani Aditya</strong>
                <span className="text-[10px] text-slate-400">Administrator</span>
              </div>
            </div>
            <Link href="/login" className="text-slate-500 hover:text-slate-300">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Link>
          </div>
          <span className="mt-3 block text-[10px] text-slate-500">BannerKu Admin · v1.0</span>
        </div>
      </aside>

      {/* 2. Main Area */}
      <div className="flex-1 pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-8 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span>Admin</span>
            <span>›</span>
            <span className="font-bold text-slate-900">
              {currentView === 'orders' ? 'Ringkasan Pesanan' : 'Katalog & Harga Bahan'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <div className="flex items-center gap-1.5 font-medium">
              <svg className="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Minggu, 8 November 2026</span>
            </div>
            <span className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-600">
              🔔
            </span>
            <span className="font-bold text-slate-700 font-mono">WIB</span>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-8">
          {/* VIEW 1: RINGKASAN PESANAN */}
          {currentView === 'orders' && (
            <div>
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-950">Ringkasan pesanan</h1>
                  <p className="mt-1 text-xs text-slate-500">
                    Dari pesanan masuk hingga siap diambil. Semua dalam kendalimu.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs"
                  >
                    📅 8 November 2026
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50"
                  >
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Ekspor laporan
                  </button>
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="mt-6 grid grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Pesanan Hari Ini</span>
                    <span className="grid size-7 place-items-center rounded-lg bg-purple-50 text-purple-600">
                      📦
                    </span>
                  </div>
                  <div className="mt-2 text-3xl font-black text-slate-950 font-mono">
                    {metrics.todayOrders}
                  </div>
                  <span className="mt-1 block text-[11px] text-slate-400">Masuk pada 8 November</span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Perlu Konfirmasi</span>
                    <span className="grid size-7 place-items-center rounded-lg bg-amber-50 text-amber-600">
                      ⏰
                    </span>
                  </div>
                  <div className="mt-2 text-3xl font-black text-slate-950 font-mono">
                    {metrics.pendingOrders}
                  </div>
                  <span className="mt-1 block text-[11px] text-slate-400">Menunggu pemeriksaan desain</span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Sedang Produksi</span>
                    <span className="grid size-7 place-items-center rounded-lg bg-blue-50 text-blue-600">
                      🖨️
                    </span>
                  </div>
                  <div className="mt-2 text-3xl font-black text-slate-950 font-mono">
                    {metrics.processingOrders}
                  </div>
                  <span className="mt-1 block text-[11px] text-slate-400">Dalam antrean cetak aktif</span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Omset Bulan Ini</span>
                    <span className="grid size-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                      💳
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-black text-slate-950 font-mono">
                    {rupiah.format(metrics.revenue)}
                  </div>
                  <span className="mt-1 block text-[11px] text-slate-400">1–8 November 2026</span>
                </div>
              </div>

              {/* Table Card */}
              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-950">Antrean pesanan masuk</h2>
                      <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                        {orders.length} pesanan
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Prioritaskan konfirmasi, lalu teruskan ke tim produksi.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative w-64">
                      <input
                        type="text"
                        placeholder="Cari ID, nama, atau nomor HP"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs focus:border-purple-600 focus:outline-none"
                      />
                      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="mt-4 flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderFilterTab('all')}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                        orderFilterTab === 'all'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Semua {orders.length}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderFilterTab('pending')}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                        orderFilterTab === 'pending'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Perlu konfirmasi 2
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderFilterTab('processing')}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                        orderFilterTab === 'processing'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Produksi 1
                    </button>
                  </div>

                  <span className="text-xs text-slate-500 font-medium">Perlu konfirmasi dahulu ▾</span>
                </div>

                {/* Orders Table */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50/70 font-bold text-slate-600">
                      <tr>
                        <th className="py-3 px-3">ID Pesanan</th>
                        <th className="py-3 px-3">Pelanggan</th>
                        <th className="py-3 px-3">Bahan</th>
                        <th className="py-3 px-3">Dimensi</th>
                        <th className="py-3 px-3">Preview Desain</th>
                        <th className="py-3 px-3">Snapshot Total Harga</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Aksi operasional</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-mono">
                            <strong className="block text-slate-900">{ord.orderNumber}</strong>
                            <span className="text-[10px] text-slate-400">{ord.createdAt}</span>
                          </td>
                          <td className="py-3 px-3">
                            <strong className="block text-slate-900">{ord.customerName}</strong>
                            <span className="text-[10px] text-slate-400 font-mono">{ord.customerPhone}</span>
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-800">{ord.material}</td>
                          <td className="py-3 px-3 font-mono">
                            <strong className="block text-slate-900">{ord.width} × {ord.height}</strong>
                            <span className="text-[10px] text-slate-400">
                              {((ord.width * ord.height) / 10000).toFixed(0)} m² × 1 pcs
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="relative size-10 shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-100">
                                <Image
                                  src={ord.preview}
                                  alt="Preview"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">{ord.fileSize}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <strong className="block text-slate-900 font-mono">{rupiah.format(ord.total)}</strong>
                            <span className="text-[10px] text-slate-400">🔒 Saat pemesanan</span>
                          </td>
                          <td className="py-3 px-3">
                            <select
                              value={ord.status}
                              onChange={(e) => handleStatusChange(ord.id, e.target.value as OrderStatus)}
                              className={`rounded-full px-2.5 py-1 text-[11px] font-bold border outline-none ${
                                ord.status === 'pending'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : ord.status === 'confirmed'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : ord.status === 'processing'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : ord.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              <option value="pending">● Pending</option>
                              <option value="confirmed">● Confirmed</option>
                              <option value="processing">● Processing</option>
                              <option value="completed">● Completed</option>
                              <option value="cancelled">● Cancelled</option>
                            </select>
                          </td>
                          <td className="py-3 px-3">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 font-bold text-purple-600 hover:text-purple-700 text-[11px]"
                            >
                              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download File Desain Asli (Resolusi Tinggi)
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
                  <span>Menampilkan 1–6 dari 6 pesanan</span>
                  <div className="flex items-center gap-1">
                    <span className="grid size-6 place-items-center rounded bg-purple-600 text-white font-bold">1</span>
                  </div>
                </div>
              </div>

              {/* Bottom Verification Banner */}
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="grid size-8 place-items-center rounded-xl bg-purple-50 text-purple-600 shrink-0">
                      📄
                    </span>
                    <div>
                      <strong className="block text-xs font-bold text-slate-900">
                        Periksa file asli sebelum konfirmasi
                      </strong>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Gunakan file desain asli beresolusi tinggi untuk produksi, bukan gambar preview. Pastikan ukuran, ketajaman, dan area aman sesuai spesifikasi pesanan.
                      </p>
                    </div>
                  </div>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600 font-bold">
                    #BK-202611-007
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-700">
                  <span className="inline-flex items-center gap-1 text-purple-600">✓ Unduh file asli</span>
                  <span className="inline-flex items-center gap-1 text-purple-600">✓ Periksa resolusi & dimensi</span>
                  <span className="inline-flex items-center gap-1 text-purple-600">✓ Konfirmasi untuk produksi</span>
                </div>

                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600 flex items-center gap-2">
                  <span>🔒</span>
                  <span>
                    <strong>Snapshot total harga tetap tersimpan.</strong> Perubahan harga katalog tidak mengubah pesanan yang sudah dibuat.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: KATALOG & HARGA BAHAN */}
          {currentView === 'materials' && (
            <div>
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-950">Katalog & harga bahan</h1>
                  <p className="mt-1 text-xs text-slate-500">
                    Atur bahan, perbarui harga, dan tentukan pilihan yang tampil di toko.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50"
                  >
                    Ekspor katalog
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMaterial({
                        id: `mat-${Date.now()}`,
                        code: `BHN-00${materials.length + 1}`,
                        name: '',
                        category: 'Banner outdoor',
                        weight: '340g',
                        description: '',
                        price: 30000,
                        active: true,
                        lastUpdated: 'Baru saja oleh Rani Aditya',
                      })
                      setIsModalOpen(true)
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700"
                  >
                    + Tambah bahan
                  </button>
                </div>
              </div>

              {/* 3 Stat Cards */}
              <div className="mt-6 grid grid-cols-3 gap-5">
                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <span className="grid size-10 place-items-center rounded-xl bg-purple-50 text-purple-600 text-base">
                    📦
                  </span>
                  <div>
                    <span className="text-xs text-slate-500">Total bahan</span>
                    <div className="text-2xl font-black text-slate-950 font-mono">
                      {metrics.totalMaterials}
                    </div>
                    <span className="text-[10px] text-slate-400">Dalam katalog percetakan</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 text-base">
                    ✓
                  </span>
                  <div>
                    <span className="text-xs text-slate-500">Bahan aktif</span>
                    <div className="text-2xl font-black text-slate-950 font-mono">
                      {metrics.activeMaterials}
                    </div>
                    <span className="text-[10px] text-slate-400">Tampil di pilihan pemesanan</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-500 text-base">
                    👁️‍🗨️
                  </span>
                  <div>
                    <span className="text-xs text-slate-500">Bahan nonaktif</span>
                    <div className="text-2xl font-black text-slate-950 font-mono">
                      {metrics.inactiveMaterials}
                    </div>
                    <span className="text-[10px] text-slate-400">Disembunyikan dari toko</span>
                  </div>
                </div>
              </div>

              {/* Alert Info Banner */}
              <div className="mt-6 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">🛡️</span>
                  <span>
                    <strong>Harga baru hanya berlaku untuk pesanan baru.</strong> Snapshot total harga pesanan yang sudah dibuat tidak berubah saat harga katalog diperbarui.
                  </span>
                </div>
                <span className="font-mono font-bold text-blue-700">Rupiah / m²</span>
              </div>

              {/* Materials Table Card */}
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-base font-bold text-slate-950">Daftar bahan percetakan</h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Edit harga langsung di tabel, atau buka Edit untuk rincian bahan.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative w-64">
                      <input
                        type="text"
                        placeholder="Cari nama atau kode bahan"
                        value={materialSearch}
                        onChange={(e) => setMaterialSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs focus:border-purple-600 focus:outline-none"
                      />
                      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <span className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">
                      Semua kategori ▾
                    </span>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="mt-4 flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMaterialFilterTab('all')}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                        materialFilterTab === 'all'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Semua bahan {materials.length}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMaterialFilterTab('active')}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                        materialFilterTab === 'active'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Aktif {metrics.activeMaterials}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMaterialFilterTab('inactive')}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                        materialFilterTab === 'inactive'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Nonaktif {metrics.inactiveMaterials}
                    </button>
                  </div>

                  <span className="text-xs text-purple-600 font-semibold">● 1 baris dalam mode edit cepat</span>
                </div>

                {/* Table */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50/70 font-bold text-slate-600">
                      <tr>
                        <th className="py-3 px-3">Nama bahan</th>
                        <th className="py-3 px-3">Deskripsi & kategori</th>
                        <th className="py-3 px-3">Harga per m²</th>
                        <th className="py-3 px-3">Ketersediaan</th>
                        <th className="py-3 px-3">Terakhir diperbarui</th>
                        <th className="py-3 px-3">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredMaterials.map((mat) => {
                        const isQuickEditing = quickEditId === mat.id

                        return (
                          <tr key={mat.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2.5">
                                <span className="grid size-8 place-items-center rounded-lg bg-purple-50 text-purple-600 text-xs">
                                  📦
                                </span>
                                <div>
                                  <strong className="block text-slate-900 font-bold">{mat.name}</strong>
                                  <span className="text-[10px] text-slate-400 font-mono">{mat.code}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 max-w-xs">
                              <p className="truncate text-slate-900">{mat.description}</p>
                              <span className="text-[10px] text-slate-400">{mat.category}</span>
                            </td>
                            <td className="py-3 px-3">
                              {isQuickEditing ? (
                                <div>
                                  <div className="flex items-center rounded-lg border-2 border-purple-600 bg-white px-2 py-1 shadow-xs">
                                    <span className="text-[11px] font-bold text-slate-400 mr-1">Rp</span>
                                    <input
                                      type="number"
                                      value={quickEditPrice}
                                      onChange={(e) => setQuickEditPrice(Number(e.target.value))}
                                      className="w-20 font-bold font-mono text-xs outline-none"
                                    />
                                    <span className="text-[10px] text-slate-400">/m²</span>
                                  </div>
                                  <span className="text-[9px] text-purple-600 mt-0.5 block">Edit cepat · harga per m²</span>
                                </div>
                              ) : (
                                <strong className="font-mono text-slate-900 text-xs">{rupiah.format(mat.price)}</strong>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <label className="inline-flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={mat.active}
                                  onChange={() => handleToggleMaterial(mat.id)}
                                  className="sr-only peer"
                                />
                                <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-purple-600 relative"></div>
                                <span className={`text-[11px] font-bold ${mat.active ? 'text-purple-600' : 'text-slate-400'}`}>
                                  {mat.active ? 'Aktif' : 'Nonaktif'}
                                </span>
                              </label>
                            </td>
                            <td className="py-3 px-3 text-slate-500 text-[11px]">{mat.lastUpdated}</td>
                            <td className="py-3 px-3">
                              {isQuickEditing ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveQuickPrice(mat.id)}
                                    className="rounded-lg bg-purple-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-purple-700"
                                  >
                                    ✓ Simpan
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setQuickEditId(null)}
                                    className="rounded-lg border border-slate-200 p-1 text-slate-400 hover:text-slate-600"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(mat)}
                                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuickEditId(mat.id)
                                      setQuickEditPrice(mat.price)
                                    }}
                                    className="text-slate-400 hover:text-slate-600 p-1"
                                  >
                                    •••
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
                  <span>Menampilkan seluruh {materials.length} bahan</span>
                  <span>(i) Semua harga dalam rupiah per meter persegi (m²).</span>
                </div>
              </div>

              {/* Bottom Guidance Cards */}
              <div className="mt-6 grid grid-cols-2 gap-4 text-xs text-slate-600">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-start gap-3">
                  <span className="text-slate-400 text-sm">👁️‍🗨️</span>
                  <div>
                    <strong className="block text-slate-900 font-bold">Nonaktif bukan berarti dihapus</strong>
                    Bahan nonaktif tidak muncul di toko. Riwayat pesanan dan harga tersimpan tetap aman.
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-start gap-3">
                  <span className="text-purple-600 text-sm">✏️</span>
                  <div>
                    <strong className="block text-slate-900 font-bold">Perubahan tetap dalam kendali</strong>
                    Tekan Simpan pada baris untuk menerapkan harga. Gunakan Edit untuk mengubah nama dan deskripsi.
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 3. Full Modal Edit Bahan */}
      {isModalOpen && editingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-purple-50 text-purple-600">
                  📦
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-950">Edit bahan</h3>
                  <p className="text-xs text-slate-500">Perbarui informasi, harga, dan ketersediaan bahan di toko.</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400">{editingMaterial.code}</span>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700">Nama bahan *</label>
                <input
                  type="text"
                  value={editingMaterial.name}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, name: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-medium text-slate-900 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between">
                  <label className="block font-bold text-slate-700">Deskripsi</label>
                  <span className="text-slate-400 font-mono text-[10px]">{editingMaterial.description.length} / 200</span>
                </div>
                <textarea
                  rows={3}
                  value={editingMaterial.description}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, description: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-medium text-slate-900 focus:border-purple-600 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Ditampilkan kepada pelanggan saat memilih bahan.</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700">Harga per m² *</label>
                <div className="relative mt-1.5 flex items-center rounded-xl border border-slate-200 px-3.5 py-2.5 focus-within:border-purple-600">
                  <span className="font-bold text-slate-400 mr-2">Rp</span>
                  <input
                    type="number"
                    value={editingMaterial.price}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, price: Number(e.target.value) })}
                    className="w-full font-bold font-mono text-slate-900 outline-none text-xs"
                  />
                  <span className="text-slate-400 font-medium">/ m²</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Masukkan angka tanpa titik atau koma.</span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <div>
                  <strong className="block text-slate-900 font-bold">Status bahan</strong>
                  <span className="text-[11px] text-slate-400">Bahan aktif ditampilkan di pilihan pemesanan.</span>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <span className={`text-xs font-bold ${editingMaterial.active ? 'text-purple-600' : 'text-slate-400'}`}>
                    {editingMaterial.active ? 'Aktif' : 'Nonaktif'}
                  </span>
                  <input
                    type="checkbox"
                    checked={editingMaterial.active}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 relative"></div>
                </label>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-[11px] text-blue-900 flex items-start gap-2">
                <span>🛡️</span>
                <span>
                  Perubahan hanya berlaku untuk pesanan baru. Snapshot total harga pesanan sebelumnya tetap tersimpan.
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-[10px] text-slate-400">* Wajib diisi</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveModal}
                  className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700"
                >
                  ✓ Simpan perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
