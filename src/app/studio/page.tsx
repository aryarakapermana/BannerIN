'use client'

import Image from 'next/image'
import Link from 'next/link'
import './studio.css'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

interface Material {
  id: string
  name: string
  weight: string
  price: number
  note: string
}

const materials: Material[] = [
  {
    id: 'flexi-korea',
    name: 'Flexi Korea 440g',
    weight: '440g',
    price: 45000,
    note: 'Bahan lebih tebal untuk banner promosi',
  },
  {
    id: 'flexi-280',
    name: 'Flexi 280g',
    weight: '280g',
    price: 25000,
    note: 'Pilihan ringan untuk promosi harian',
  },
  {
    id: 'flexi-340',
    name: 'Flexi Premium 340g',
    weight: '340g',
    price: 35000,
    note: 'Hasil warna tajam dengan ketahanan lebih baik',
  },
  {
    id: 'albatros',
    name: 'Albatros',
    weight: '260g',
    price: 65000,
    note: 'Permukaan halus untuk banner indoor & display',
  },
]

export default function StudioPage() {
  const [selectedMaterial, setSelectedMaterial] = useState<Material>(materials[0])
  const [width, setWidth] = useState(300)
  const [height, setHeight] = useState(100)
  const [quantity, setQuantity] = useState(1)
  const [zoom, setZoom] = useState(50)
  const [showBleedGrommets, setShowBleedGrommets] = useState(true)

  // Image upload & transform state
  const [, setFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [fileMeta, setFileMeta] = useState<{ name: string; size: string; dimensions?: string } | null>(null)
  const [imageTransform, setImageTransform] = useState({ x: 50, y: 50, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [activeStep, setActiveStep] = useState(2)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null)

  const area = useMemo(() => Math.max(0, (width * height) / 10000), [width, height])
  const subtotal = useMemo(
    () => Math.ceil(area * selectedMaterial.price * quantity),
    [area, selectedMaterial.price, quantity],
  )
  const ratio = useMemo(() => `${width} × ${height} cm · ${(width / Math.max(1, height)).toFixed(1)}:1`, [width, height])

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
  }, [imageUrl])

  const handleFileProcess = (selectedFile?: File) => {
    if (!selectedFile) return
    if (!['image/jpeg', 'image/png'].includes(selectedFile.type)) {
      alert('Format file harus JPG atau PNG.')
      return
    }
    if (selectedFile.size > 20 * 1024 * 1024) {
      alert('Ukuran file melebihi 20MB.')
      return
    }

    if (imageUrl) URL.revokeObjectURL(imageUrl)
    const url = URL.createObjectURL(selectedFile)
    const img = new window.Image()
    img.onload = () => {
      setFileMeta({
        name: selectedFile.name,
        size: `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`,
        dimensions: `${img.naturalWidth} × ${img.naturalHeight} px`,
      })
    }
    img.src = url

    setFile(selectedFile)
    setImageUrl(url)
    setImageTransform({ x: 50, y: 50, scale: 1 })
    setActiveStep(2)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileProcess(e.target.files?.[0])
    e.target.value = ''
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileProcess(e.dataTransfer.files?.[0])
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const removeFile = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setFile(null)
    setImageUrl(null)
    setFileMeta(null)
    setImageTransform({ x: 50, y: 50, scale: 1 })
  }

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!imageUrl) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDragging(true)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: imageTransform.x,
      initY: imageTransform.y,
    }
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragRef.current || !canvasRef.current) return
    const bounds = canvasRef.current.getBoundingClientRect()
    const deltaX = ((e.clientX - dragRef.current.startX) / bounds.width) * 100
    const deltaY = ((e.clientY - dragRef.current.startY) / bounds.height) * 100

    setImageTransform((prev) => ({
      ...prev,
      x: Math.min(100, Math.max(0, dragRef.current!.initX + deltaX)),
      y: Math.min(100, Math.max(0, dragRef.current!.initY + deltaY)),
    }))
  }

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false)
      dragRef.current = null
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        // ignore
      }
    }
  }

  const handleConfirmOrder = () => {
    if (!imageUrl) {
      fileInputRef.current?.click()
      return
    }
    setActiveStep(3)
    setIsSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* 1. Header */}
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

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs font-bold text-slate-700 hover:text-blue-600">
              Masuk
            </Link>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
            >
              <svg className="size-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-.777-.777c.057-.597.234-1.222.518-1.808C3.805 16.74 3 14.496 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              Butuh bantuan?
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
        {/* Breadcrumb & Heading */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Link href="/" className="hover:text-blue-600">Produk</Link>
              <span>›</span>
              <span className="text-slate-600">Banner custom</span>
              <span>›</span>
              <span className="font-semibold text-blue-600">Pemesanan</span>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                Atur banner, wujudkan idemu.
              </h1>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                Draf pesanan
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-extrabold text-blue-600">
              Langkah {activeStep} dari 3 · {activeStep === 1 ? 'Bahan & ukuran' : activeStep === 2 ? 'Upload desain' : 'Konfirmasi'}
            </span>
            <p className="text-xs text-slate-500">
              {imageUrl ? 'Atur posisi desain sebelum konfirmasi.' : 'Spesifikasi sudah terisi. Sekarang, unggah desainmu.'}
            </p>
          </div>
        </div>

        {/* 2-Column Content Layout */}
        <div className="mt-8 grid gap-8 lg:grid-cols-12 items-start">
          {/* Left Column: Form & Calculator (5 cols) */}
          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              {/* Stepper */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div className="flex items-center gap-2">
                  <span className="grid size-5 place-items-center rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold">
                    ✓
                  </span>
                  <span className="text-xs font-bold text-slate-900">Bahan & ukuran</span>
                </div>
                <span className="text-slate-300">›</span>
                <div className="flex items-center gap-2">
                  <span className="grid size-5 place-items-center rounded-full bg-blue-600 text-white text-xs font-bold">
                    2
                  </span>
                  <span className="text-xs font-bold text-blue-600">Upload desain</span>
                </div>
                <span className="text-slate-300">›</span>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="grid size-5 place-items-center rounded-full border border-slate-300 text-xs font-bold">
                    3
                  </span>
                  <span className="text-xs font-medium">Konfirmasi</span>
                </div>
              </div>

              {/* Form Title */}
              <div className="mt-6 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950">Banner custom</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Sesuaikan bahan dan ukuran cetakmu.</p>
                </div>
                <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                </span>
              </div>

              {/* Pilih Bahan Radio Cards */}
              <div className="mt-5">
                <label className="block text-xs font-bold text-slate-700">Pilih bahan</label>
                <div className="mt-2.5 space-y-2.5">
                  {materials.slice(0, 2).map((m) => {
                    const isSelected = selectedMaterial.id === m.id
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMaterial(m)}
                        className={`flex w-full items-start justify-between rounded-xl border p-3.5 text-left transition ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-600'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-0.5 grid size-4.5 place-items-center rounded-full border transition ${
                              isSelected ? 'border-blue-600 bg-white' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <span className="size-2 rounded-full bg-blue-600" />}
                          </span>
                          <div>
                            <strong className="block text-xs font-extrabold text-slate-900">{m.name}</strong>
                            <span className="text-[11px] text-slate-500">{m.note}</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-blue-700 font-mono">
                          {rupiah.format(m.price)}<span className="text-[10px] text-slate-400 font-normal">/m²</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Ukuran (Lebar & Tinggi) */}
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Lebar (cm)</label>
                  <div className="relative mt-1.5">
                    <input
                      type="number"
                      min="10"
                      value={width}
                      onChange={(e) => setWidth(Math.max(10, Number(e.target.value)))}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 pr-10 text-xs font-bold text-slate-900 font-mono focus:border-blue-600 focus:outline-none"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                      cm
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">Tinggi (cm)</label>
                  <div className="relative mt-1.5">
                    <input
                      type="number"
                      min="10"
                      value={height}
                      onChange={(e) => setHeight(Math.max(10, Number(e.target.value)))}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 pr-10 text-xs font-bold text-slate-900 font-mono focus:border-blue-600 focus:outline-none"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                      cm
                    </span>
                  </div>
                </div>
              </div>

              {/* Luas Badge */}
              <div className="mt-3 flex items-center justify-between rounded-xl bg-amber-50/70 border border-amber-200/60 px-3.5 py-2 text-xs font-semibold text-amber-900">
                <span className="inline-flex items-center gap-1.5 font-bold">
                  <svg className="size-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="4" y="3" width="16" height="18" rx="2" strokeWidth={2} />
                    <line x1="8" y1="7" x2="16" y2="7" strokeWidth={2} />
                  </svg>
                  Luas: {area.toFixed(2)} m²
                </span>
                <span className="text-[11px] text-amber-700">Dihitung otomatis</span>
              </div>

              {/* Jumlah Pesanan */}
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
                <div>
                  <strong className="block text-xs font-bold text-slate-900">Jumlah pesanan</strong>
                  <span className="text-[11px] text-slate-400">Dalam satuan lembar (pcs)</span>
                </div>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="grid size-7 place-items-center rounded-lg bg-white text-slate-700 shadow-sm disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center text-xs font-bold font-mono text-slate-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="grid size-7 place-items-center rounded-lg bg-white text-slate-700 shadow-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Rincian Harga Box */}
              <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <svg className="size-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Rincian harga
                </span>
                <p className="mt-1 text-xs text-slate-500 font-mono">
                  Luas ({area.toFixed(0)} m²) × {rupiah.format(selectedMaterial.price)} × {quantity} pcs
                </p>
                <div className="mt-3 flex items-baseline justify-between border-t border-slate-200/60 pt-3">
                  <span className="text-xs font-semibold text-slate-600">Subtotal</span>
                  <strong className="text-2xl font-black text-slate-950 font-mono">
                    {rupiah.format(subtotal)}
                  </strong>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold shadow-sm transition ${
                    imageUrl
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-600 shadow-amber-500/20'
                      : 'bg-amber-100/70 text-amber-700/80 cursor-pointer'
                  }`}
                >
                  Konfirmasi Pesanan
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>

                <p className="mt-2 text-center text-[11px] text-slate-400">
                  {imageUrl
                    ? 'Periksa desain dan detail sebelum lanjut ke pembayaran.'
                    : 'Unggah desain terlebih dahulu untuk melanjutkan.'}
                </p>
              </div>

              {isSubmitted && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
                  <strong>Pesanan berhasil dikonfirmasi!</strong>
                  <p className="mt-1">
                    Pesanan Anda dengan bahan {selectedMaterial.name} ({width} × {height} cm) senilai{' '}
                    {rupiah.format(subtotal)} telah masuk ke antrean verifikasi tim percetakan.
                  </p>
                  <Link
                    href="/customer/dashboard"
                    className="mt-3 inline-block font-bold text-emerald-700 underline"
                  >
                    Buka Dashboard Pesanan Saya →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Studio Banner Canvas (7 cols) */}
          <div className="space-y-6 lg:col-span-7">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              {/* Studio Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5" />
                    </svg>
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Studio banner</h2>
                    <p className="text-xs text-slate-500">Lihat dan sesuaikan desain sebelum dicetak.</p>
                  </div>
                </div>

                {imageUrl ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    ✓ Desain diunggah
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                    Belum ada desain
                  </span>
                )}
              </div>

              {/* Controls Bar */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(25, z - 10))}
                      className="px-2 py-1 text-slate-600 hover:bg-slate-50 rounded"
                    >
                      −
                    </button>
                    <span className="px-2 font-mono font-semibold text-slate-700">{zoom}%</span>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(150, z + 10))}
                      className="px-2 py-1 text-slate-600 hover:bg-slate-50 rounded"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setZoom(50)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    Pas ke layar
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageTransform({ x: 50, y: 50, scale: 1 })}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset posisi
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <svg className="size-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5" />
                    </svg>
                    <span className="font-semibold text-slate-700">Garis potong & mata ayam</span>
                    <input
                      type="checkbox"
                      checked={showBleedGrommets}
                      onChange={(e) => setShowBleedGrommets(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 relative"></div>
                  </label>
                </div>
              </div>

              {/* Dynamic Canvas Container with Grid */}
              <div className="canvas-grid relative mt-6 rounded-xl border border-slate-200 p-8 min-h-[380px] flex flex-col items-center justify-center overflow-hidden">
                {/* Top Ruler Line */}
                <div className="absolute top-3 inset-x-12 flex items-center justify-center">
                  <div className="h-px bg-slate-300 flex-1" />
                  <span className="px-3 text-[11px] font-mono font-bold text-slate-500 bg-white/80 rounded px-1.5 shadow-2xs">
                    {width} cm
                  </span>
                  <div className="h-px bg-slate-300 flex-1" />
                </div>

                {/* Left Ruler Line */}
                <div className="absolute left-3 inset-y-12 flex flex-col items-center justify-center">
                  <div className="w-px bg-slate-300 flex-1" />
                  <span className="py-2 text-[11px] font-mono font-bold text-slate-500 bg-white/80 rounded px-1 shadow-2xs -rotate-90">
                    {height} cm
                  </span>
                  <div className="w-px bg-slate-300 flex-1" />
                </div>

                {/* Bounding Banner Canvas */}
                <div
                  ref={canvasRef}
                  style={{
                    aspectRatio: `${width} / ${height}`,
                    width: `${Math.min(92, Math.max(45, (width / (width + height)) * 140))}%`,
                    maxWidth: '100%',
                    maxHeight: '260px',
                    transform: `scale(${zoom / 50})`,
                  }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`relative flex items-center justify-center transition-transform select-none rounded-sm border-2 ${
                    imageUrl
                      ? 'border-blue-600 shadow-md cursor-grab active:cursor-grabbing bg-slate-900'
                      : isDragOver
                      ? 'border-dashed border-blue-500 bg-blue-50/50'
                      : 'border-dashed border-amber-400 bg-white/90 shadow-sm'
                  }`}
                >
                  {/* Grommets / Mata Ayam simulation dots */}
                  {showBleedGrommets && (
                    <>
                      {/* 4 corners */}
                      <span className="absolute top-1.5 left-1.5 size-2.5 rounded-full border border-slate-700 bg-slate-200 shadow-xs z-20 pointer-events-none" />
                      <span className="absolute top-1.5 right-1.5 size-2.5 rounded-full border border-slate-700 bg-slate-200 shadow-xs z-20 pointer-events-none" />
                      <span className="absolute bottom-1.5 left-1.5 size-2.5 rounded-full border border-slate-700 bg-slate-200 shadow-xs z-20 pointer-events-none" />
                      <span className="absolute bottom-1.5 right-1.5 size-2.5 rounded-full border border-slate-700 bg-slate-200 shadow-xs z-20 pointer-events-none" />
                      {/* Midpoints */}
                      <span className="absolute top-1.5 left-1/2 -translate-x-1/2 size-2.5 rounded-full border border-slate-700 bg-slate-200 shadow-xs z-20 pointer-events-none" />
                      <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 size-2.5 rounded-full border border-slate-700 bg-slate-200 shadow-xs z-20 pointer-events-none" />
                    </>
                  )}

                  {/* Bleed line (garis potong) */}
                  {showBleedGrommets && (
                    <div className="absolute inset-1.5 border border-dashed border-amber-400/80 pointer-events-none z-10" />
                  )}

                  {/* State 1: Image Present */}
                  {imageUrl ? (
                    <div className="relative size-full overflow-hidden">
                      {/* Image Element */}
                      <img
                        src={imageUrl}
                        alt="Desain banner"
                        style={{
                          transform: `translate(${imageTransform.x - 50}%, ${imageTransform.y - 50}%) scale(${imageTransform.scale})`,
                        }}
                        className="size-full object-cover pointer-events-none transition-transform duration-75"
                      />

                      {/* Top-left Desain Terpilih Pill */}
                      <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm z-30">
                        <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                        </svg>
                        Desain terpilih
                      </span>

                      {/* Center move crosshair indicator */}
                      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 grid size-7 place-items-center rounded-full bg-white/90 text-blue-600 shadow-md pointer-events-none z-20">
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                        </svg>
                      </span>

                      {/* Corner Handles */}
                      <span className="absolute -top-1.5 -left-1.5 size-3 rounded-xs border-2 border-white bg-blue-600 z-30" />
                      <span className="absolute -top-1.5 -right-1.5 size-3 rounded-xs border-2 border-white bg-blue-600 z-30" />
                      <span className="absolute -bottom-1.5 -left-1.5 size-3 rounded-xs border-2 border-white bg-blue-600 z-30" />
                      <span className="absolute -bottom-1.5 -right-1.5 size-3 rounded-xs border-2 border-white bg-blue-600 z-30" />
                    </div>
                  ) : (
                    /* State 2: Empty Dropzone */
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <span className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600 mb-2">
                        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                      </span>
                      <strong className="text-xs font-bold text-slate-800">
                        Tarik file JPG / PNG ke sini (Maks 20MB)
                      </strong>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        atau pilih berkas desain dari perangkatmu
                      </p>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-primary mt-3 text-xs py-2 px-4"
                      >
                        Pilih file desain +
                      </button>

                      <span className="mt-2 text-[10px] text-slate-400">
                        Area cetak mengikuti ukuran banner yang kamu pilih
                      </span>
                    </div>
                  )}
                </div>

                {/* Subtext below canvas */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 w-full text-[11px] text-slate-500 px-4">
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 border-b-2 border-dashed border-amber-500" />
                      Garis potong (bleed)
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-full border border-slate-600 bg-slate-200" />
                      Simulasi mata ayam
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-slate-700">{ratio}</span>
                </div>
              </div>

              {/* File Info Card Row */}
              <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-600">
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </span>
                  <div>
                    <strong className="block text-xs font-bold text-slate-900">
                      {fileMeta ? fileMeta.name : 'Desainmu akan tampil di sini'}
                    </strong>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{fileMeta ? `${fileMeta.dimensions} · ${fileMeta.size}` : 'Format JPG / PNG · Maksimal 20MB'}</span>
                      {fileMeta && (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          🔒 Proporsi terkunci
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    {imageUrl ? 'Ganti file' : 'Pilih file'}
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </button>

                  {imageUrl && (
                    <button
                      type="button"
                      onClick={removeFile}
                      aria-label="Hapus file"
                      className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition"
                    >
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Info Alert Box */}
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/70 p-3.5 text-xs text-blue-900">
                <svg className="size-4 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <span>
                  <strong>Preview di layar adalah simulasi visual.</strong> Tim cetak akan memeriksa ketajaman resolusi sebelum produksi.
                </span>
              </div>

              <p className="mt-3 text-[11px] text-slate-400">
                Jauhkan teks penting dari garis potong dan area mata ayam.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  )
}
