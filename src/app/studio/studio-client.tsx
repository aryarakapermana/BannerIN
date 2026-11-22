'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import './studio.css'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'

const BannerCanvasEditor = dynamic(
  () => import('@/components/studio/BannerCanvasEditor'),
  {
    ssr: false,
    loading: () => (
      <div className="canvas-grid relative mt-4 rounded-xl border border-slate-200 p-8 min-h-[260px] flex flex-col items-center justify-center text-xs font-medium text-slate-500">
        <div className="size-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
        Menyiapkan kanvas editor...
      </div>
    ),
  },
)
import {
  BANNERIN_WHATSAPP,
  Banner,
  designEditorService,
  priceCalculator,
  type EditorConfig,
  type PriceBreakdown,
} from '@/domain'
import { calculatePriceAction, type CalculatePriceResult } from '@/app/actions/calculator'
import {
  getDesignSignedUrlsAction,
  updateDesignConfigAction,
} from '@/app/actions/designs'
import { NumericInput } from '@/components/ui/NumericInput'
import type { Database, UserRole } from '@/types/database'

type MaterialRow = Database['public']['Tables']['materials']['Row']

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const PRESET_SIZES = [
  { label: '300 × 100 cm (Standar)', w: 300, h: 100, desc: 'Spanduk jalan & acara' },
  { label: '200 × 100 cm', w: 200, h: 100, desc: 'Banner warung & toko' },
  { label: '160 × 60 cm', w: 160, h: 60, desc: 'X-Banner standar' },
  { label: '200 × 80 cm', w: 200, h: 80, desc: 'Roll-up banner' },
  { label: '400 × 100 cm', w: 400, h: 100, desc: 'Spanduk rentang panjang' },
]

interface SavedDesignInfo {
  id: string
  originalFilePath: string
  previewFilePath: string | null
  fileType: string
  signedOriginalUrl: string | null
  signedPreviewUrl: string | null
  savedAt: string
}

interface StudioClientProps {
  materials: MaterialRow[]
  initialParams?: {
    materialId?: string
    width?: number
    height?: number
    quantity?: number
  }
  currentUser?: {
    id: string
    fullName: string
    role: UserRole
  } | null
}

export default function StudioClient({
  materials,
  initialParams,
  currentUser,
}: StudioClientProps) {
  // 1. Initial State Resolution
  const defaultMaterial = useMemo(() => {
    const initialId = initialParams?.materialId
    if (initialId) {
      const found = materials.find((m) => m.id === initialId)
      if (found) return found
    }
    return materials[0] || null
  }, [materials, initialParams])

  const [selectedMaterial, setSelectedMaterial] = useState<MaterialRow | null>(defaultMaterial)
  const [isMaterialSelectorOpen, setIsMaterialSelectorOpen] = useState(false)
  const [width, setWidth] = useState<number | ''>(initialParams?.width || 300)
  const [height, setHeight] = useState<number | ''>(initialParams?.height || 100)
  const [quantity, setQuantity] = useState<number>(initialParams?.quantity || 1)
  const [zoom, setZoom] = useState(100)
  const [showBleedGrommets, setShowBleedGrommets] = useState(true)
  const [lockProportions, setLockProportions] = useState(true)
  const [resetSignal, setResetSignal] = useState(0)

  const numericWidth = width === '' ? 0 : width
  const numericHeight = height === '' ? 0 : height

  // Server verification state keyed by specification to avoid synchronous setState in useEffect
  const [serverVerificationEntry, setServerVerificationEntry] = useState<{
    key: string
    result: CalculatePriceResult
  } | null>(null)

  // File & Fabric.js editor state
  const [file, setFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [fileMeta, setFileMeta] = useState<{
    name: string
    size: string
    dimensions?: string
  } | null>(null)
  const [editorConfig, setEditorConfig] = useState<EditorConfig | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [requiresAuthNotice, setRequiresAuthNotice] = useState(false)

  // Persisted Supabase design state
  const [isUploading, setIsUploading] = useState(false)
  const [savedDesign, setSavedDesign] = useState<SavedDesignInfo | null>(null)
  const [activeStep, setActiveStep] = useState(2)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewExporterRef = useRef<(() => Promise<Blob | null>) | null>(null)

  // 2. Domain Validation & Calculation via Banner & PriceCalculator
  const bannerValidation = useMemo(() => {
    try {
      const b = new Banner(numericWidth, numericHeight, quantity)
      return {
        banner: b,
        error: null,
        area: b.getArea(),
        totalArea: b.getTotalArea(),
        ratio: b.getRatio(),
        ratioLabel: `${b.widthCm} × ${b.heightCm} cm · ${b.getRatio().toFixed(2)}:1`,
        orientation: b.getOrientation(),
        spec: b.getSpecification(),
      }
    } catch (err) {
      return {
        banner: null,
        error: err instanceof Error ? err.message : 'Ukuran banner tidak valid.',
        area: Math.max(0, (numericWidth * numericHeight) / 10000),
        totalArea: 0,
        ratio: 0,
        ratioLabel: `${numericWidth} × ${numericHeight} cm`,
        orientation: 'landscape' as const,
        spec: `${numericWidth} × ${numericHeight} cm (${quantity} pcs)`,
      }
    }
  }, [numericWidth, numericHeight, quantity])

  const breakdown: PriceBreakdown | null = useMemo(() => {
    if (!selectedMaterial || bannerValidation.error) return null
    try {
      return priceCalculator.calculateBreakdown({
        widthCm: numericWidth,
        heightCm: numericHeight,
        pricePerSqm: Number(selectedMaterial.price_per_sqm),
        quantity,
      })
    } catch {
      return null
    }
  }, [numericWidth, numericHeight, selectedMaterial, quantity, bannerValidation.error])

  const currentSpecKey =
    selectedMaterial && !bannerValidation.error
      ? `${selectedMaterial.id}:${numericWidth}:${numericHeight}:${quantity}`
      : null

  const isVerifying = Boolean(
    currentSpecKey && serverVerificationEntry?.key !== currentSpecKey,
  )
  const serverVerification =
    currentSpecKey && serverVerificationEntry?.key === currentSpecKey
      ? serverVerificationEntry.result
      : null

  // 3. Trigger Server-side Re-calculation to guarantee identical results
  useEffect(() => {
    if (!currentSpecKey || !selectedMaterial) {
      return
    }

    let isMounted = true

    const timer = setTimeout(async () => {
      try {
        const res = await calculatePriceAction({
          widthCm: numericWidth,
          heightCm: numericHeight,
          materialId: selectedMaterial.id,
          quantity,
        })
        if (isMounted) {
          setServerVerificationEntry({ key: currentSpecKey, result: res })
        }
      } catch {
        if (isMounted) {
          setServerVerificationEntry({
            key: currentSpecKey,
            result: { success: false, error: 'Gagal verifikasi server' },
          })
        }
      }
    }, 250)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [currentSpecKey, numericWidth, numericHeight, quantity, selectedMaterial])

  // Revoke object URL on unmount or file replace
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
  }, [imageUrl])

  // 4. File Selection & Domain Metadata Validation
  const handleFileProcess = useCallback(
    (selectedFile?: File) => {
      if (!selectedFile) return
      setFileError(null)
      setRequiresAuthNotice(false)

      try {
        designEditorService.validateFileMetadata({
          name: selectedFile.name,
          type: selectedFile.type,
          size: selectedFile.size,
        })
      } catch (err) {
        setFileError(
          err instanceof Error ? err.message : 'File desain tidak memenuhi syarat.',
        )
        return
      }

      if (imageUrl) URL.revokeObjectURL(imageUrl)
      const url = URL.createObjectURL(selectedFile)
      const img = new window.Image()
      img.onload = () => {
        setFileMeta({
          name: selectedFile.name,
          size: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
          dimensions: `${img.naturalWidth} × ${img.naturalHeight} px`,
        })
      }
      img.onerror = () => {
        setFileError('File gambar tidak dapat dibaca oleh browser. Pastikan gambar JPG/PNG valid.')
        URL.revokeObjectURL(url)
      }
      img.src = url

      setFile(selectedFile)
      setImageUrl(url)
      setSavedDesign(null)
      setActiveStep(2)
    },
    [imageUrl],
  )

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileProcess(e.target.files?.[0])
    e.target.value = ''
  }

  const removeFile = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setFile(null)
    setImageUrl(null)
    setFileMeta(null)
    setEditorConfig(null)
    setSavedDesign(null)
    setFileError(null)
    setActiveStep(2)
  }

  const registerExporter = useCallback(
    (exporter: (() => Promise<Blob | null>) | null) => {
      previewExporterRef.current = exporter
    },
    [],
  )

  // 5. Upload File ke Bucket Privat & Simpan editor_config ke public.designs
  const handleSaveDesign = async () => {
    setFileError(null)
    setRequiresAuthNotice(false)

    if (bannerValidation.error) {
      setFileError(`Validasi ukuran: ${bannerValidation.error}`)
      return
    }

    if (!file || !imageUrl) {
      fileInputRef.current?.click()
      return
    }

    const fallbackDimensions = designEditorService.computeCanvasDimensions(
      numericWidth,
      numericHeight,
      540,
      260,
    )
    const configToPersist: EditorConfig = editorConfig || {
      version: 1,
      canvasWidthPx: fallbackDimensions.widthPx,
      canvasHeightPx: fallbackDimensions.heightPx,
      bannerWidthCm: numericWidth,
      bannerHeightCm: numericHeight,
      aspectRatio: `${numericWidth}:${numericHeight}`,
      lockProportions,
      showBleedGrommets,
      imageTransform: {
        left: fallbackDimensions.widthPx / 2,
        top: fallbackDimensions.heightPx / 2,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        originX: 'center',
        originY: 'center',
      },
    }

    setIsUploading(true)
    try {
      // Jika desain sudah pernah diunggah untuk file ini, perbarui editor_config saja
      if (savedDesign) {
        const updateRes = await updateDesignConfigAction({
          designId: savedDesign.id,
          editorConfig: configToPersist,
        })
        if (!updateRes.success) {
          setFileError(updateRes.error || 'Gagal memperbarui konfigurasi desain.')
          return
        }
        const signedRes = await getDesignSignedUrlsAction(savedDesign.id)
        setSavedDesign((prev) =>
          prev
            ? {
              ...prev,
              signedOriginalUrl: signedRes.signedOriginalUrl ?? prev.signedOriginalUrl,
              signedPreviewUrl: signedRes.signedPreviewUrl ?? prev.signedPreviewUrl,
              savedAt: new Date().toLocaleTimeString('id-ID'),
            }
            : null,
        )
        setActiveStep(3)
        return
      }

      // Unggahan baru: kirim file asli + snapshot preview Fabric.js ke API Route server
      const formData = new FormData()
      formData.append('file', file)
      formData.append('editorConfig', JSON.stringify(configToPersist))

      if (previewExporterRef.current) {
        try {
          const previewBlob = await previewExporterRef.current()
          if (previewBlob && previewBlob.size > 0) {
            const previewFile = new File([previewBlob], 'preview.png', {
              type: 'image/png',
            })
            formData.append('previewFile', previewFile)
          }
        } catch {
          // Preview snapshot opsional; file asli tetap diunggah
        }
      }

      const response = await fetch('/api/designs/upload', {
        method: 'POST',
        body: formData,
      })
      const payload = await response.json()

      if (response.status === 401) {
        setRequiresAuthNotice(true)
        setFileError(payload.error || 'Silakan masuk terlebih dahulu.')
        return
      }

      if (!response.ok || !payload.success) {
        setFileError(payload.error || 'Gagal mengunggah desain ke server.')
        return
      }

      setSavedDesign({
        id: payload.design.id,
        originalFilePath: payload.design.original_file_path,
        previewFilePath: payload.design.preview_file_path,
        fileType: payload.design.file_type,
        signedOriginalUrl: payload.signedOriginalUrl ?? null,
        signedPreviewUrl: payload.signedPreviewUrl ?? null,
        savedAt: new Date().toLocaleTimeString('id-ID'),
      })
      setActiveStep(3)
    } catch {
      setFileError('Terjadi kesalahan jaringan saat mengunggah desain.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      {/* 1. Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
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
            <Link href="/materials" className="hover:text-blue-600 transition">Katalog Bahan</Link>
            <Link href="/#produk" className="hover:text-blue-600 transition">Produk</Link>
            <Link href="/#cara-pesan" className="hover:text-blue-600 transition">Cara pesan</Link>
            <Link href="/#panduan-berkas" className="hover:text-blue-600 transition">Panduan cetak</Link>
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            {currentUser ? (
              <Link
                href={currentUser.role === 'admin' ? '/dashboard' : '/customer/dashboard'}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 hover:border-blue-300 transition"
              >
                <span className="size-2 rounded-full bg-emerald-500" />
                <span className="max-w-[120px] truncate">{currentUser.fullName}</span>
              </Link>
            ) : (
              <Link
                href="/login?redirect=/studio"
                className="text-xs font-bold text-slate-700 hover:text-blue-600"
              >
                Masuk
              </Link>
            )}
            <a
              href={BANNERIN_WHATSAPP.baseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 sm:px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <svg className="size-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-.777-.777c.057-.597.234-1.222.518-1.808C3.805 16.74 3 14.496 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              <span>Butuh bantuan?</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6 w-full max-w-full min-w-0">
        {/* Breadcrumb & Heading */}
        <div className="flex flex-col gap-3 pb-3 sm:pb-4 border-b border-slate-200/80 w-full max-w-full min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Link href="/" className="hover:text-blue-600 transition">Beranda</Link>
              <span>›</span>
              <span className="font-semibold text-slate-700">Studio Desain</span>
            </div>
            <span className="rounded-full bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold">
              Fabric.js Canvas
            </span>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950">
              Studio Banner &amp; Editor Desain
            </h1>
          </div>

          {/* Stepper Pills matching Figma */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 w-full max-w-full">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1 text-xs font-semibold text-emerald-800 shrink-0">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>Bahan</span>
            </div>
            <span className="text-slate-300 text-xs">›</span>
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shrink-0 border ${
              savedDesign
                ? 'bg-emerald-50 border-emerald-200/80 text-emerald-800'
                : 'bg-blue-50 border-blue-200/80 text-blue-700'
            }`}>
              <span className={`grid size-4 place-items-center rounded-full text-[10px] font-bold ${
                savedDesign ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
              }`}>
                {savedDesign ? '✓' : '2'}
              </span>
              <span>Upload</span>
            </div>
            <span className="text-slate-300 text-xs">›</span>
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shrink-0 border ${
              savedDesign
                ? 'bg-blue-50 border-blue-200/80 text-blue-700'
                : 'bg-slate-100 border-slate-200/80 text-slate-600'
            }`}>
              <span className={`grid size-4 place-items-center rounded-full text-[10px] font-bold ${
                savedDesign ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-700'
              }`}>
                3
              </span>
              <span>Selesai</span>
            </div>
          </div>
        </div>

        {/* 2-Column Content Layout */}
        <div className="mt-5 sm:mt-6 grid gap-5 sm:gap-6 lg:grid-cols-12 items-start w-full max-w-full min-w-0">
          {/* Left Column: Form & Calculator (5 cols) */}
          <div className="space-y-5 lg:col-span-5 w-full max-w-full min-w-0">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs w-full max-w-full min-w-0">
              {/* Form Title & Number Indicator */}
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Kalkulasi Spesifikasi</h2>
                <span className="font-mono text-sm font-bold text-slate-400">01</span>
              </div>

              {/* Preset Ukuran Populer */}
              <div className="mt-4">
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_SIZES.slice(0, 3).map((preset) => {
                    const isActive = width === preset.w && height === preset.h
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        suppressHydrationWarning
                        onClick={() => {
                          setWidth(preset.w)
                          setHeight(preset.h)
                        }}
                        className={`rounded-xl py-2 px-2 text-center text-xs font-bold transition cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {preset.w}×{preset.h} cm
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Ukuran (Lebar & Tinggi) with inner cm */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lebar (cm)</label>
                  <div className="relative">
                    <NumericInput
                      placeholder="300"
                      value={width}
                      onValueChange={setWidth}
                      className={`w-full rounded-xl border bg-white px-3.5 py-2.5 pr-8 text-xs sm:text-sm font-bold font-mono focus:outline-none transition ${
                        numericWidth <= 0 || numericWidth < 10
                          ? 'border-rose-300 bg-rose-50/50 text-rose-900 focus:border-rose-500'
                          : 'border-slate-200 text-slate-900 focus:border-blue-600'
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 pointer-events-none">
                      cm
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tinggi (cm)</label>
                  <div className="relative">
                    <NumericInput
                      placeholder="100"
                      value={height}
                      onValueChange={setHeight}
                      className={`w-full rounded-xl border bg-white px-3.5 py-2.5 pr-8 text-xs sm:text-sm font-bold font-mono focus:outline-none transition ${
                        numericHeight <= 0 || numericHeight < 10
                          ? 'border-rose-300 bg-rose-50/50 text-rose-900 focus:border-rose-500'
                          : 'border-slate-200 text-slate-900 focus:border-blue-600'
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 pointer-events-none">
                      cm
                    </span>
                  </div>
                </div>
              </div>

              {/* Validation Warning Alert */}
              {bannerValidation.error && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  <svg className="size-4 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{bannerValidation.error}</span>
                </div>
              )}

              {/* Luas Alert Bar matching Figma */}
              <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-xs font-medium text-amber-900">
                <span className="size-2 rounded-full bg-amber-500 shrink-0" />
                <span>
                  Luas per Lembar: <strong className="font-bold">{bannerValidation.area.toFixed(2)} m²</strong> ({numericWidth} cm × {numericHeight} cm)
                </span>
              </div>

              {/* Pilih Bahan Card matching Figma */}
              <div className="mt-4">
                <div
                  onClick={() => setIsMaterialSelectorOpen(!isMaterialSelectorOpen)}
                  className="flex items-center justify-between rounded-xl border-2 border-blue-400 bg-blue-50/40 p-3 sm:p-3.5 cursor-pointer hover:border-blue-500 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="size-5 rounded-full border-2 border-blue-600 bg-white flex items-center justify-center shrink-0">
                      <span className="size-2 rounded-full bg-blue-600" />
                    </span>
                    <div>
                      <strong className="block text-xs sm:text-sm font-bold text-slate-900">
                        {selectedMaterial?.name || 'Flexi Standard 280g'}
                      </strong>
                      <span className="text-[11px] font-mono text-slate-500">
                        {rupiah.format(Number(selectedMaterial?.price_per_sqm || 20000))}/m²
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                      Terpilih
                    </span>
                  </div>
                </div>

                {/* Dropdown list to pick other materials */}
                {isMaterialSelectorOpen && (
                  <div className="mt-2 space-y-1.5 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                    <div className="text-[11px] font-bold text-slate-500 px-2 py-1">Pilih jenis bahan lain:</div>
                    {materials.map((m) => {
                      const isSelected = selectedMaterial?.id === m.id
                      return (
                        <button
                          key={m.id}
                          type="button"
                          suppressHydrationWarning
                          onClick={() => {
                            setSelectedMaterial(m)
                            setIsMaterialSelectorOpen(false)
                          }}
                          className={`flex w-full items-center justify-between rounded-lg p-2.5 text-left text-xs transition cursor-pointer ${
                            isSelected ? 'bg-blue-50 text-blue-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="font-bold">{m.name}</div>
                            <div className="text-[10px] text-slate-500 line-clamp-1">{m.description}</div>
                          </div>
                          <span className="font-mono font-bold text-blue-700 ml-2 shrink-0">
                            {rupiah.format(Number(m.price_per_sqm))}/m²
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Jumlah Cetak */}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-semibold text-slate-800">Jumlah cetak</span>
                <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="size-7 grid place-items-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="px-3 text-xs sm:text-sm font-bold font-mono text-slate-900">
                    {quantity} pcs
                  </span>
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setQuantity((q) => q + 1)}
                    className="size-7 grid place-items-center rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total Estimasi Cetak Box matching Figma */}
              <div className="mt-4 flex items-center justify-between rounded-xl bg-blue-50/50 border border-blue-100/80 p-3.5 sm:p-4">
                <div>
                  <span className="block text-[11px] sm:text-xs text-slate-500 font-medium">Total Estimasi Cetak</span>
                  <strong className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-mono">
                    {breakdown?.formattedTotal || 'Rp0'}
                  </strong>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <span className="text-emerald-600 font-bold">✓</span> Server Verified
                  </span>
                </div>
              </div>

              {/* Validation & Auth Error Alerts */}
              {fileError && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  <strong>Unggahan ditolak:</strong> {fileError}
                </div>
              )}

              {requiresAuthNotice && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                  <strong className="block font-bold">Login diperlukan untuk menyimpan file privat</strong>
                  <p className="mt-1 leading-relaxed text-amber-800">
                    Demi keamanan data pelanggan, file desain hanya dapat diunggah ke bucket privat Supabase atas nama akun Anda.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href="/login?redirect=/studio"
                      className="rounded-lg bg-amber-600 px-3 py-1.5 font-bold text-white hover:bg-amber-700 transition"
                    >
                      Masuk Akun →
                    </Link>
                    <Link
                      href="/register"
                      className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-bold text-amber-900 hover:bg-amber-100/50 transition"
                    >
                      Daftar Baru
                    </Link>
                  </div>
                </div>
              )}

              {/* Confirmation Card when saved to Supabase Storage + designs table */}
              {savedDesign && breakdown && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <strong>✓ Desain Tersimpan di Server</strong>
                    <span className="font-mono text-[10px] text-emerald-700">
                      {savedDesign.savedAt}
                    </span>
                  </div>
                  <p className="text-emerald-800 leading-relaxed">
                    File asli berhasil divalidasi di server dan diunggah ke bucket privat{' '}
                    <code className="rounded bg-emerald-100 px-1 py-0.5 font-mono text-[10px]">
                      designs
                    </code>
                    . Konfigurasi posisi &amp; skala tercatat di tabel{' '}
                    <code className="rounded bg-emerald-100 px-1 py-0.5 font-mono text-[10px]">
                      public.designs
                    </code>
                    .
                  </p>
                  <div className="pt-2">
                    <Link
                      href={`/checkout?${new URLSearchParams({
                        designId: savedDesign.id,
                        ...(selectedMaterial ? { materialId: selectedMaterial.id } : {}),
                        width: String(numericWidth),
                        height: String(numericHeight),
                        qty: String(quantity),
                      }).toString()}`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
                    >
                      Lanjut ke Checkout &amp; Pembayaran QRIS →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Fabric.js Studio Banner Canvas (7 cols) */}
          <div className="space-y-5 lg:col-span-7 w-full max-w-full min-w-0">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs w-full max-w-full min-w-0 overflow-hidden">
              {/* Card 2 Title */}
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Kustomisasi Banner Anda</h2>
                {savedDesign ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Tersimpan
                  </span>
                ) : imageUrl ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
                    <span className="size-1.5 rounded-full bg-blue-500" />
                    Preview Siap
                  </span>
                ) : null}
              </div>

              {/* Controls Bar Row 1: Zoom + Fit + Reset */}
              <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5">
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setZoom((z) => Math.max(50, z - 10))}
                    className="px-2.5 py-1 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold"
                  >
                    −
                  </button>
                  <span className="px-2 font-mono font-bold text-slate-700 text-xs">{zoom}%</span>
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setZoom((z) => Math.min(150, z + 10))}
                    className="px-2.5 py-1 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setZoom(100)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer text-xs transition"
                >
                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  <span>Pas layar</span>
                </button>

                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setResetSignal((s) => s + 1)}
                  disabled={!imageUrl}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-40 text-xs transition"
                >
                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Reset</span>
                </button>
              </div>

              {/* Controls Bar Row 2: Garis Potong & Mata Ayam Toggle */}
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                  Garis potong &amp; mata ayam
                </span>
                <label className="inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    suppressHydrationWarning
                    checked={showBleedGrommets}
                    onChange={(e) => setShowBleedGrommets(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 relative"></div>
                </label>
              </div>

              {/* Canvas Editor */}
              <BannerCanvasEditor
                widthCm={numericWidth}
                heightCm={numericHeight}
                zoom={zoom}
                imageUrl={imageUrl}
                lockProportions={lockProportions}
                showBleedGrommets={showBleedGrommets}
                resetSignal={resetSignal}
                ratioLabel={bannerValidation.ratioLabel}
                orientationLabel={bannerValidation.orientation}
                onSelectFileClick={() => fileInputRef.current?.click()}
                onDropFile={handleFileProcess}
                onConfigChange={setEditorConfig}
                onRegisterExporter={registerExporter}
              />

              {/* File Info Bar if image selected */}
              {imageUrl && fileMeta && (
                <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs">
                  <div className="truncate">
                    <strong className="block text-slate-900 truncate">{fileMeta.name}</strong>
                    <span className="text-slate-500 text-[11px]">{fileMeta.dimensions} · {fileMeta.size}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Ganti
                    </button>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="rounded-lg border border-slate-200 bg-white p-1 text-rose-600 hover:bg-rose-50"
                    >
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom CTA Button matching Figma */}
            <div className="pt-1">
              <button
                type="button"
                suppressHydrationWarning
                onClick={imageUrl ? handleSaveDesign : () => fileInputRef.current?.click()}
                disabled={Boolean(bannerValidation.error) || isUploading}
                className="w-full flex items-center justify-between rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 sm:px-5 shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span className="flex items-center gap-2.5 text-xs sm:text-sm">
                  <svg className="size-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <span>
                    {isUploading
                      ? 'Mengunggah ke Storage Privat...'
                      : savedDesign
                        ? 'Simpan Pembaruan Posisi Editor'
                        : imageUrl
                          ? 'Unggah & Simpan Desain ke Server'
                          : 'Pilih & Unggah File Desain'}
                  </span>
                </span>
                <span className="text-base sm:text-lg">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        suppressHydrationWarning
        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  )
}
