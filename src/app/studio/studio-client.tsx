'use client'

import Image from 'next/image'
import Link from 'next/link'
import './studio.css'
import BannerCanvasEditor from '@/components/studio/BannerCanvasEditor'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
} from 'react'
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

const emptySubscribe = () => () => {}

export default function StudioClient({
  materials,
  initialParams,
  currentUser,
}: StudioClientProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )

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

    if (!currentUser) {
      setRequiresAuthNotice(true)
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* 1. Header */}
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
            <Link href="/materials" className="hover:text-blue-600 transition">Katalog Bahan</Link>
            <Link href="/#produk" className="hover:text-blue-600 transition">Produk</Link>
            <Link href="/#cara-pesan" className="hover:text-blue-600 transition">Cara pesan</Link>
            <Link href="/#panduan-berkas" className="hover:text-blue-600 transition">Panduan cetak</Link>
          </nav>

          <div className="flex items-center gap-4">
            {currentUser ? (
              <Link
                href={currentUser.role === 'admin' ? '/dashboard' : '/customer/dashboard'}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 hover:border-blue-300 transition"
              >
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>{currentUser.fullName}</span>
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
              <Link href="/" className="hover:text-blue-600">Beranda</Link>
              <span>›</span>
              <Link href="/materials" className="hover:text-blue-600">Katalog Bahan</Link>
              <span>›</span>
              <span className="font-semibold text-blue-600">Studio & Editor Desain</span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                Studio Banner & Editor Desain
              </h1>
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-[11px] font-bold">
                Fabric.js + Private Storage
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-extrabold text-blue-600">
              Langkah {activeStep} dari 3 ·{' '}
              {activeStep === 1
                ? 'Bahan & ukuran'
                : activeStep === 2
                  ? 'Upload & atur desain'
                  : 'Desain tersimpan'}
            </span>
            <p className="text-xs text-slate-500">
              {savedDesign
                ? 'File asli tersimpan aman di bucket privat & konfigurasi tercatat.'
                : imageUrl
                  ? 'Geser & ubah ukuran desain di kanvas, lalu simpan.'
                  : 'Sesuaikan dimensi & bahan, lalu unggah file cetakmu.'}
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
                  <span className="text-xs font-bold text-slate-900">Bahan & Ukuran</span>
                </div>
                <span className="text-slate-300">›</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`grid size-5 place-items-center rounded-full text-xs font-bold ${savedDesign
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-blue-600 text-white'
                      }`}
                  >
                    {savedDesign ? '✓' : '2'}
                  </span>
                  <span
                    className={`text-xs font-bold ${savedDesign ? 'text-slate-900' : 'text-blue-600'
                      }`}
                  >
                    Upload & Edit
                  </span>
                </div>
                <span className="text-slate-300">›</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`grid size-5 place-items-center rounded-full text-xs font-bold ${savedDesign
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-300 text-slate-400'
                      }`}
                  >
                    3
                  </span>
                  <span
                    className={`text-xs ${savedDesign ? 'font-bold text-blue-600' : 'font-medium text-slate-400'
                      }`}
                  >
                    Tersimpan
                  </span>
                </div>
              </div>

              {/* Form Title */}
              <div className="mt-6 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950">Kalkulasi Spesifikasi</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Perhitungan otomatis berbasis rumus baku percetakan.
                  </p>
                </div>
                <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                </span>
              </div>

              {/* Preset Ukuran Cepat */}
              <div className="mt-5">
                <label className="block text-xs font-bold text-slate-700">Preset Ukuran Populer</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PRESET_SIZES.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      suppressHydrationWarning
                      onClick={() => {
                        setWidth(preset.w)
                        setHeight(preset.h)
                      }}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium border transition ${width === preset.w && height === preset.h
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      {preset.w}×{preset.h} cm
                    </button>
                  ))}
                </div>
              </div>

              {/* Ukuran (Lebar & Tinggi) */}
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Lebar (cm) <span className="text-slate-400 font-normal">Min 10</span>
                  </label>
                  <div className="relative mt-1.5">
                    <NumericInput
                      placeholder="Contoh: 300"
                      value={width}
                      onValueChange={setWidth}
                      className={`w-full rounded-xl border px-3.5 py-2.5 pr-10 text-xs font-bold font-mono focus:outline-none ${numericWidth <= 0 || numericWidth < 10
                          ? 'border-rose-300 bg-rose-50/50 text-rose-900 focus:border-rose-500'
                          : 'border-slate-200 text-slate-900 focus:border-blue-600'
                        }`}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                      cm
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Tinggi (cm) <span className="text-slate-400 font-normal">Min 10</span>
                  </label>
                  <div className="relative mt-1.5">
                    <NumericInput
                      placeholder="Contoh: 100"
                      value={height}
                      onValueChange={setHeight}
                      className={`w-full rounded-xl border px-3.5 py-2.5 pr-10 text-xs font-bold font-mono focus:outline-none ${numericHeight <= 0 || numericHeight < 10
                          ? 'border-rose-300 bg-rose-50/50 text-rose-900 focus:border-rose-500'
                          : 'border-slate-200 text-slate-900 focus:border-blue-600'
                        }`}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
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

              {/* Luas Badge */}
              <div className="mt-3 flex items-center justify-between rounded-xl bg-amber-50/70 border border-amber-200/60 px-3.5 py-2.5 text-xs font-semibold text-amber-900">
                <span className="inline-flex items-center gap-2 font-bold">
                  <svg className="size-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="4" y="3" width="16" height="18" rx="2" strokeWidth={2} />
                    <line x1="8" y1="7" x2="16" y2="7" strokeWidth={2} />
                  </svg>
                  Luas per Lembar: {bannerValidation.area.toFixed(2)} m²
                </span>
                <span className="text-[11px] font-mono text-amber-800">
                  {numericWidth} cm × {numericHeight} cm
                </span>
              </div>

              {/* Pilih Bahan Radio Cards */}
              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Pilih Bahan Cetak</label>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    Live dari Supabase
                  </span>
                </div>

                <div className="mt-2.5 space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {materials.map((m) => {
                    const isSelected = selectedMaterial?.id === m.id
                    return (
                      <button
                        key={m.id}
                        type="button"
                        suppressHydrationWarning
                        onClick={() => setSelectedMaterial(m)}
                        className={`flex w-full items-start justify-between rounded-xl border p-3.5 text-left transition ${isSelected
                            ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-0.5 grid size-4.5 place-items-center rounded-full border transition ${isSelected ? 'border-blue-600 bg-white' : 'border-slate-300'
                              }`}
                          >
                            {isSelected && <span className="size-2 rounded-full bg-blue-600" />}
                          </span>
                          <div>
                            <strong className="block text-xs font-extrabold text-slate-900">{m.name}</strong>
                            <span className="text-[11px] text-slate-500 line-clamp-1">
                              {m.description || 'Bahan berkualitas resmi percetakan'}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-blue-700 font-mono shrink-0 pl-2">
                          {rupiah.format(Number(m.price_per_sqm))}<span className="text-[10px] text-slate-400 font-normal">/m²</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Jumlah Pesanan */}
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
                <div>
                  <strong className="block text-xs font-bold text-slate-900">Jumlah Cetak (Quantity)</strong>
                  <span className="text-[11px] text-slate-400">Total lembar pesanan (pcs)</span>
                </div>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="grid size-7 place-items-center rounded-lg bg-white text-slate-700 shadow-sm disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="min-w-10 text-center text-xs font-bold font-mono text-slate-900">
                    {quantity} pcs
                  </span>
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setQuantity((q) => q + 1)}
                    className="grid size-7 place-items-center rounded-lg bg-white text-slate-700 shadow-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Rincian Harga & Formula Transparan */}
              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <svg className="size-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Transparansi Rumus Harga
                  </span>
                  {isVerifying ? (
                    <span className="text-[10px] font-semibold text-blue-600 animate-pulse">
                      Sinkronisasi server...
                    </span>
                  ) : serverVerification?.success ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      <span>✓</span> Server Verified
                    </span>
                  ) : null}
                </div>

                {breakdown ? (
                  <div className="mt-2.5 space-y-2 text-xs">
                    <div className="rounded-lg bg-white/80 p-2.5 font-mono text-slate-600 text-[11px] border border-blue-100/60">
                      <div className="text-slate-500 font-sans text-[10px] uppercase font-bold tracking-wider">
                        1. Rumus Luas:
                      </div>
                      <div className="mt-0.5">
                        ({numericWidth} cm ÷ 100) × ({numericHeight} cm ÷ 100) = <strong className="text-slate-900">{breakdown.formattedArea}</strong>
                      </div>
                      <div className="mt-2 text-slate-500 font-sans text-[10px] uppercase font-bold tracking-wider">
                        2. Rumus Subtotal:
                      </div>
                      <div className="mt-0.5">
                        {breakdown.formattedArea} × {rupiah.format(breakdown.pricePerSqm)} × {quantity} pcs
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between border-t border-blue-200/50 pt-3">
                      <span className="text-xs font-semibold text-slate-700">Total Estimasi Cetak</span>
                      <strong className="text-2xl font-black text-blue-900 font-mono">
                        {breakdown.formattedTotal}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-rose-600">
                    {bannerValidation.error || 'Silakan perbaiki ukuran banner.'}
                  </p>
                )}
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

              {/* Action Button */}
              <div className="mt-6">
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={handleSaveDesign}
                  disabled={Boolean(bannerValidation.error) || isUploading}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${imageUrl
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-600 shadow-amber-500/20 cursor-pointer'
                      : 'bg-amber-100/70 text-amber-700/80 cursor-pointer'
                    }`}
                >
                  {isUploading
                    ? 'Mengunggah ke Storage Privat...'
                    : savedDesign
                      ? 'Simpan Pembaruan Posisi Editor'
                      : imageUrl
                        ? 'Unggah & Simpan Desain ke Server'
                        : 'Pilih & Unggah File Desain'}
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>

                <p className="mt-2 text-center text-[11px] text-slate-400">
                  {savedDesign
                    ? 'Desain sudah tersimpan di tabel designs & siap untuk tahap pemesanan.'
                    : imageUrl
                      ? 'File akan divalidasi di server dan disimpan ke bucket privat Supabase.'
                      : 'Unggah file JPG/JPEG/PNG (maks. 20 MB) terlebih dahulu.'}
                </p>
              </div>

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
                  <div className="rounded-lg bg-white/80 p-2.5 font-mono text-[10px] text-slate-700 space-y-1 border border-emerald-200/70">
                    <div className="truncate">ID Desain: {savedDesign.id}</div>
                    <div className="truncate">Path Privat: {savedDesign.originalFilePath}</div>
                    {editorConfig && (
                      <div>
                        Transform: x={editorConfig.imageTransform.left}, y={editorConfig.imageTransform.top}, skala={editorConfig.imageTransform.scaleX}×
                      </div>
                    )}
                  </div>
                  {savedDesign.signedOriginalUrl && (
                    <div className="pt-1 flex flex-wrap items-center gap-3">
                      <a
                        href={savedDesign.signedOriginalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-emerald-700 underline"
                      >
                        Uji Akses Signed URL (1 Jam) ↗
                      </a>
                    </div>
                  )}

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
                    <h2 className="text-base font-bold text-slate-900">Costumisasi Banner Anda</h2>
                    <p className="text-xs text-slate-500">
                      Geser gambar &amp; tarik sudut untuk ubah ukuran sesuai rasio {numericWidth} × {numericHeight} cm.
                    </p>
                  </div>
                </div>

                {savedDesign ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    ✓ Tersimpan di Storage Privat
                  </span>
                ) : imageUrl ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                    <span className="size-1.5 rounded-full bg-blue-500" />
                    Preview Lokal Siap Disimpan
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                    Belum ada desain
                  </span>
                )}
              </div>

              {/* Controls Bar */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setZoom((z) => Math.max(50, z - 10))}
                      className="px-2 py-1 text-slate-600 hover:bg-slate-50 rounded"
                    >
                      −
                    </button>
                    <span className="px-2 font-mono font-semibold text-slate-700">{zoom}%</span>
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setZoom((z) => Math.min(150, z + 10))}
                      className="px-2 py-1 text-slate-600 hover:bg-slate-50 rounded"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setZoom(100)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    Pas ke layar
                  </button>

                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setResetSignal((s) => s + 1)}
                    disabled={!imageUrl}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-40"
                  >
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset posisi
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <span className="font-semibold text-slate-700">Kunci proporsi</span>
                    <input
                      type="checkbox"
                      suppressHydrationWarning
                      checked={lockProportions}
                      onChange={(e) => setLockProportions(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 relative"></div>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <span className="font-semibold text-slate-700">Garis potong &amp; mata ayam</span>
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
              </div>

              {/* Client-Only Fabric.js Canvas Editor */}
              {isMounted ? (
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
              ) : (
                <div className="canvas-grid relative mt-6 rounded-xl border border-slate-200 p-8 min-h-[380px] flex flex-col items-center justify-center text-xs font-medium text-slate-500">
                  Menyiapkan kanvas editor...
                </div>
              )}

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
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span>
                        {fileMeta
                          ? `${fileMeta.dimensions} · ${fileMeta.size}`
                          : 'Format JPG / JPEG / PNG · Maksimal 20 MB'}
                      </span>
                      {fileMeta && (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          {lockProportions ? '🔒 Proporsi terkunci' : '🔓 Bebas skala'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    {imageUrl ? 'Ganti file' : 'Pilih file'}
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </button>

                  {imageUrl && (
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={removeFile}
                      aria-label="Hapus file"
                      className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Mandatory Preview Disclaimer Box */}
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-950">
                <svg className="size-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span>
                  <strong>Catatan Penting: Preview di layar bukan jaminan hasil cetak.</strong>{' '}
                  Tampilan editor adalah simulasi tata letak; kualitas hasil cetak bergantung pada resolusi berkas asli, ukuran cetak, karakter bahan, dan pemeriksaan tim produksi sebelum cetak.
                </span>
              </div>

              <p className="mt-3 text-[11px] text-slate-400">
                Jauhkan teks dan logo penting minimal 3–5 cm dari garis potong (bleed) serta titik mata ayam.
              </p>
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
