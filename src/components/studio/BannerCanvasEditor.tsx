'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from 'react'
import type { Canvas, FabricImage } from 'fabric'
import { designEditorService, type EditorConfig } from '@/domain'

export interface BannerCanvasEditorProps {
  widthCm: number
  heightCm: number
  zoom: number
  imageUrl: string | null
  lockProportions: boolean
  showBleedGrommets: boolean
  resetSignal: number
  ratioLabel: string
  orientationLabel: string
  onSelectFileClick: () => void
  onDropFile: (file: File) => void
  onConfigChange: (config: EditorConfig) => void
  onRegisterExporter: (exporter: (() => Promise<Blob | null>) | null) => void
}

/**
 * Komponen Editor Canvas berbasis Fabric.js v7 (hanya berjalan di sisi client / no SSR).
 * Mendukung rasio dinamis sesuai ukuran banner, drag posisi, dan resize dengan proporsi terkunci default.
 */
export default function BannerCanvasEditor({
  widthCm,
  heightCm,
  zoom,
  imageUrl,
  lockProportions,
  showBleedGrommets,
  resetSignal,
  ratioLabel,
  orientationLabel,
  onSelectFileClick,
  onDropFile,
  onConfigChange,
  onRegisterExporter,
}: BannerCanvasEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fabricCanvasRef = useRef<Canvas | null>(null)
  const fabricImageRef = useRef<FabricImage | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [maxCanvasWidth, setMaxCanvasWidth] = useState(540)

  // Deteksi lebar kontainer secara responsif agar kanvas tidak pernah overflow di layar HP
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const available = containerRef.current.clientWidth - 32
        if (available > 100) {
          const clamped = Math.min(540, Math.max(220, available))
          setMaxCanvasWidth(clamped)
          return
        }
      }
      if (typeof window !== 'undefined') {
        const w = window.innerWidth
        if (w < 640) {
          setMaxCanvasWidth(Math.max(220, w - 64))
        } else {
          setMaxCanvasWidth(540)
        }
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Simpan nilai terbaru di ref agar inisialisasi async Fabric tetap memakai konfigurasi terkini
  const latestPropsRef = useRef({
    widthCm,
    heightCm,
    lockProportions,
    showBleedGrommets,
    ratioLabel,
    onConfigChange,
  })

  const canvasDimensions = useMemo(
    () =>
      designEditorService.computeCanvasDimensions(
        widthCm,
        heightCm,
        maxCanvasWidth,
        Math.round(maxCanvasWidth * 0.52),
      ),
    [widthCm, heightCm, maxCanvasWidth],
  )

  const dimensionsRef = useRef(canvasDimensions)

  // Sinkronisasi ref lewat useEffect agar patuh aturan React Compiler (no ref write during render)
  useEffect(() => {
    latestPropsRef.current = {
      widthCm,
      heightCm,
      lockProportions,
      showBleedGrommets,
      ratioLabel,
      onConfigChange,
    }
    dimensionsRef.current = canvasDimensions
  })

  const buildCurrentConfig = useCallback(
    (canvas: Canvas, img: FabricImage): EditorConfig => {
      const latest = latestPropsRef.current
      const cw = canvas.getWidth()
      const ch = canvas.getHeight()

      return {
        version: 1,
        canvasWidthPx: Math.round(cw),
        canvasHeightPx: Math.round(ch),
        bannerWidthCm: latest.widthCm > 0 ? latest.widthCm : 300,
        bannerHeightCm: latest.heightCm > 0 ? latest.heightCm : 100,
        aspectRatio: `${latest.widthCm}:${latest.heightCm}`,
        lockProportions: latest.lockProportions,
        showBleedGrommets: latest.showBleedGrommets,
        imageTransform: {
          left: Math.round((img.left ?? cw / 2) * 100) / 100,
          top: Math.round((img.top ?? ch / 2) * 100) / 100,
          scaleX: Math.round((img.scaleX ?? 1) * 10000) / 10000,
          scaleY: Math.round((img.scaleY ?? 1) * 10000) / 10000,
          angle: Math.round((img.angle ?? 0) * 100) / 100,
          originX: String(img.originX ?? 'center'),
          originY: String(img.originY ?? 'center'),
          naturalWidth: img.width,
          naturalHeight: img.height,
        },
      }
    },
    [],
  )

  const applyProportionControlRules = useCallback(
    (canvas: Canvas, img: FabricImage, locked: boolean) => {
      canvas.uniformScaling = locked
      canvas.uniScaleKey = locked ? null : 'shiftKey'
      img.set({
        lockScalingFlip: true,
        cornerStyle: 'rect',
        cornerColor: '#2563eb',
        cornerStrokeColor: '#ffffff',
        cornerSize: 10,
        transparentCorners: false,
        borderColor: '#2563eb',
        borderScaleFactor: 2,
      })
      img.setControlsVisibility({
        mt: !locked,
        mb: !locked,
        ml: !locked,
        mr: !locked,
      })
    },
    [],
  )

  // 1. Inisialisasi Fabric.js Canvas saat imageUrl tersedia
  useEffect(() => {
    const container = hostRef.current
    if (!imageUrl || !container) {
      fabricCanvasRef.current = null
      fabricImageRef.current = null
      onRegisterExporter(null)
      return
    }

    let cancelled = false
    let currentCanvas: Canvas | null = null

    // Muat fabric.js secara dinamis hanya di browser saat gambar diunggah
    import('fabric')
      .then(({ Canvas, FabricImage }) => {
        if (cancelled || !container) return

        container.innerHTML = ''
        const canvasEl = document.createElement('canvas')
        container.appendChild(canvasEl)

        const { widthPx, heightPx } = dimensionsRef.current
        const canvas = new Canvas(canvasEl, {
          width: widthPx,
          height: heightPx,
          backgroundColor: '#0f172a',
          uniformScaling: latestPropsRef.current.lockProportions,
          uniScaleKey: latestPropsRef.current.lockProportions ? null : 'shiftKey',
          preserveObjectStacking: true,
        })

        currentCanvas = canvas
        fabricCanvasRef.current = canvas

        FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' })
          .then((img) => {
            if (cancelled || canvas.disposed) return

            const cw = canvas.getWidth()
            const ch = canvas.getHeight()
            const imgW = img.width || cw
            const imgH = img.height || ch
            const fitScale = Math.min(cw / imgW, ch / imgH)

            img.set({
              left: cw / 2,
              top: ch / 2,
              originX: 'center',
              originY: 'center',
              scaleX: fitScale,
              scaleY: fitScale,
              angle: 0,
            })

            applyProportionControlRules(
              canvas,
              img,
              latestPropsRef.current.lockProportions,
            )

            canvas.add(img)
            canvas.setActiveObject(img)
            canvas.requestRenderAll()

            fabricImageRef.current = img
            latestPropsRef.current.onConfigChange(buildCurrentConfig(canvas, img))

            const syncConfig = () => {
              if (!cancelled && !canvas.disposed) {
                latestPropsRef.current.onConfigChange(buildCurrentConfig(canvas, img))
              }
            }

            canvas.on('object:modified', syncConfig)
            canvas.on('object:moving', syncConfig)
            canvas.on('object:scaling', syncConfig)
            canvas.on('object:rotating', syncConfig)

            onRegisterExporter(async () => {
              if (canvas.disposed) return null
              const active = canvas.getActiveObject()
              canvas.discardActiveObject()
              canvas.requestRenderAll()
              const blob = await canvas.toBlob({ format: 'png', multiplier: 1 })
              if (active) {
                canvas.setActiveObject(active)
                canvas.requestRenderAll()
              }
              return blob
            })
          })
          .catch((err) => {
            console.error('Gagal memuat gambar ke kanvas Fabric.js:', err)
          })
      })
      .catch((err) => {
        console.error('Gagal memuat pustaka Fabric.js:', err)
      })

    return () => {
      cancelled = true
      onRegisterExporter(null)
      fabricImageRef.current = null
      fabricCanvasRef.current = null
      if (currentCanvas) {
        void currentCanvas.dispose().catch(() => {})
      }
      if (container) {
        container.innerHTML = ''
      }
    }
  }, [
    imageUrl,
    applyProportionControlRules,
    buildCurrentConfig,
    onRegisterExporter,
  ])

  // 2. Perbarui dimensi kanvas Fabric.js saat lebar/tinggi banner (cm) berubah
  useEffect(() => {
    const canvas = fabricCanvasRef.current
    const img = fabricImageRef.current
    if (!canvas || canvas.disposed) return

    canvas.setDimensions({
      width: canvasDimensions.widthPx,
      height: canvasDimensions.heightPx,
    })

    if (img) {
      const cw = canvasDimensions.widthPx
      const ch = canvasDimensions.heightPx
      // Jaga objek tetap terlihat di dalam frame saat rasio berubah drastis
      const left = Math.min(cw, Math.max(0, img.left ?? cw / 2))
      const top = Math.min(ch, Math.max(0, img.top ?? ch / 2))
      img.set({ left, top })
      img.setCoords()
      latestPropsRef.current.onConfigChange(buildCurrentConfig(canvas, img))
    }

    canvas.requestRenderAll()
  }, [canvasDimensions.widthPx, canvasDimensions.heightPx, buildCurrentConfig])

  // 3. Perbarui aturan proporsi terkunci secara dinamis
  useEffect(() => {
    const canvas = fabricCanvasRef.current
    const img = fabricImageRef.current
    if (!canvas || !img || canvas.disposed) return

    applyProportionControlRules(canvas, img, lockProportions)
    img.setCoords()
    canvas.requestRenderAll()
    latestPropsRef.current.onConfigChange(buildCurrentConfig(canvas, img))
  }, [lockProportions, applyProportionControlRules, buildCurrentConfig])

  // 4. Reset posisi & ukuran gambar ke tengah kanvas saat resetSignal bertambah
  useEffect(() => {
    if (resetSignal === 0) return
    const canvas = fabricCanvasRef.current
    const img = fabricImageRef.current
    if (!canvas || !img || canvas.disposed) return

    const cw = canvas.getWidth()
    const ch = canvas.getHeight()
    const fitScale = Math.min(cw / (img.width || cw), ch / (img.height || ch))

    img.set({
      left: cw / 2,
      top: ch / 2,
      scaleX: fitScale,
      scaleY: fitScale,
      angle: 0,
    })
    img.setCoords()
    canvas.setActiveObject(img)
    canvas.requestRenderAll()
    latestPropsRef.current.onConfigChange(buildCurrentConfig(canvas, img))
  }, [resetSignal, buildCurrentConfig])

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) onDropFile(droppedFile)
  }

  return (
    <div
      ref={containerRef}
      className="canvas-grid relative mt-4 sm:mt-6 rounded-xl border border-slate-200 p-3 sm:p-6 md:p-8 min-h-[260px] sm:min-h-[380px] flex flex-col items-center justify-center overflow-hidden w-full max-w-full"
    >
      {/* Top Ruler Line */}
      <div className="absolute top-2 sm:top-3 inset-x-6 sm:inset-x-12 flex items-center justify-center z-10 pointer-events-none">
        <div className="h-px bg-slate-300 flex-1" />
        <span className="px-2 text-[10px] sm:text-[11px] font-mono font-bold text-slate-600 bg-white/90 rounded shadow-2xs">
          {widthCm > 0 ? widthCm : 0} cm
        </span>
        <div className="h-px bg-slate-300 flex-1" />
      </div>

      {/* Left Ruler Line */}
      <div className="absolute left-1.5 sm:left-3 inset-y-8 sm:inset-y-12 flex flex-col items-center justify-center z-10 pointer-events-none">
        <div className="w-px bg-slate-300 flex-1" />
        <span className="py-1 sm:py-2 text-[9px] sm:text-[11px] font-mono font-bold text-slate-600 bg-white/90 rounded px-0.5 sm:px-1 shadow-2xs -rotate-90">
          {heightCm > 0 ? heightCm : 0} cm
        </span>
        <div className="w-px bg-slate-300 flex-1" />
      </div>

      {/* Scaling Wrapper */}
      <div
        className="relative flex items-center justify-center transition-transform max-w-full"
        style={{
          transform: `scale(${zoom / 100})`,
        }}
      >
        {/* Canvas / Dropzone Frame */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          style={{
            width: `${canvasDimensions.widthPx}px`,
            height: `${canvasDimensions.heightPx}px`,
            maxWidth: '100%',
          }}
          className={`relative flex items-center justify-center rounded-xl border-2 overflow-hidden transition cursor-pointer ${
            imageUrl
              ? 'border-blue-600 shadow-md bg-slate-900'
              : isDragOver
              ? 'border-dashed border-blue-500 bg-blue-50/70'
              : 'border-dashed border-blue-400 bg-white shadow-xs hover:border-blue-500'
          }`}
          onClick={!imageUrl ? onSelectFileClick : undefined}
        >
          {/* Grommets / Mata Ayam overlay */}
          {showBleedGrommets && (
            <>
              <span className="absolute top-2 left-2 size-3 rounded-full border-2 border-blue-400 bg-white shadow-2xs z-20 pointer-events-none" />
              <span className="absolute top-2 right-2 size-3 rounded-full border-2 border-blue-400 bg-white shadow-2xs z-20 pointer-events-none" />
              <span className="absolute bottom-2 left-2 size-3 rounded-full border-2 border-blue-400 bg-white shadow-2xs z-20 pointer-events-none" />
              <span className="absolute bottom-2 right-2 size-3 rounded-full border-2 border-blue-400 bg-white shadow-2xs z-20 pointer-events-none" />
            </>
          )}

          {/* Bleed line overlay */}
          {showBleedGrommets && (
            <div className="absolute inset-2 border border-dashed border-blue-300/80 pointer-events-none z-20" />
          )}

          {/* Fabric.js Canvas Host */}
          <div
            ref={hostRef}
            className={imageUrl ? 'relative z-10' : 'hidden'}
          />

          {/* Dropzone State jika belum ada gambar */}
          {!imageUrl && (
            <div className="flex flex-col items-center justify-center p-6 text-center z-10 select-none">
              <strong className="text-sm font-bold text-slate-800">
                Pratinjau desain Anda
              </strong>
              <p className="mt-1 font-mono text-xs text-slate-500">
                {widthCm} × {heightCm} cm
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Subtext below canvas */}
      <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-between gap-2 sm:gap-4 w-full text-[10px] sm:text-[11px] text-slate-500 px-2 sm:px-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <span className="inline-flex items-center gap-1 sm:gap-1.5">
            <span className="w-2.5 sm:w-3 border-b-2 border-dashed border-amber-500" />
            Garis potong
          </span>
          <span className="inline-flex items-center gap-1 sm:gap-1.5">
            <span className="size-2 rounded-full border border-slate-600 bg-slate-200" />
            Mata ayam
          </span>
          {imageUrl && (
            <span className="inline-flex items-center gap-1 text-blue-700 font-semibold">
              {lockProportions ? '🔒 Terkunci' : '🔓 Bebas'}
            </span>
          )}
        </div>
        <span className="font-mono font-semibold text-slate-700">
          {ratioLabel}
        </span>
      </div>
    </div>
  )
}

