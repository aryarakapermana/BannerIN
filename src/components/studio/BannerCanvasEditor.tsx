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
 * Komponen Editor Canvas berbasis Fabric.js v7.
 * Mendukung tampilan desktop lebar & adaptif mobile tanpa overflow horizontal.
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

  // Deteksi lebar kontainer secara responsif agar di mobile tidak pernah overflow horizontal
  useEffect(() => {
    const updateWidth = (availableWidth?: number) => {
      let targetW = 540
      if (typeof availableWidth === 'number' && availableWidth > 50) {
        targetW = availableWidth
      } else if (containerRef.current) {
        const cw = containerRef.current.clientWidth - 24
        if (cw > 50) targetW = cw
      } else if (typeof window !== 'undefined') {
        targetW = window.innerWidth < 640 ? window.innerWidth - 48 : 540
      }
      const clamped = Math.min(540, Math.max(180, Math.floor(targetW)))
      setMaxCanvasWidth(clamped)
    }

    updateWidth()

    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = entry.contentRect.width
          if (w > 50) {
            updateWidth(w - 24)
          }
        }
      })
      ro.observe(containerRef.current)
      return () => ro.disconnect()
    }

    const handleResize = () => updateWidth()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
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

    // Muat fabric.js secara dinamis di browser saat gambar siap
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

        const isBlobOrData = imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')
        FabricImage.fromURL(
          imageUrl,
          isBlobOrData ? undefined : { crossOrigin: 'anonymous' },
        )
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

            const emitChange = () => {
              if (canvas.disposed) return
              latestPropsRef.current.onConfigChange(buildCurrentConfig(canvas, img))
            }

            canvas.on('object:modified', emitChange)
            canvas.on('object:scaling', emitChange)
            canvas.on('object:moving', emitChange)
            canvas.on('object:rotating', emitChange)

            onRegisterExporter(() => {
              return new Promise<Blob | null>((resolve) => {
                if (canvas.disposed) {
                  resolve(null)
                  return
                }
                try {
                  const dataUrl = canvas.toDataURL({
                    format: 'png',
                    quality: 0.9,
                    multiplier: 1,
                  })
                  fetch(dataUrl)
                    .then((r) => r.blob())
                    .then((b) => resolve(b))
                    .catch(() => resolve(null))
                } catch {
                  resolve(null)
                }
              })
            })
          })
          .catch(() => {
            // Abaikan kegagalan gambar lokal
          })
      })
      .catch(() => {
        // Abaikan kegagalan import
      })

    return () => {
      cancelled = true
      if (currentCanvas) {
        try {
          currentCanvas.dispose()
        } catch {
          // ignore
        }
      }
      fabricCanvasRef.current = null
      fabricImageRef.current = null
    }
  }, [imageUrl, applyProportionControlRules, buildCurrentConfig, onRegisterExporter])

  // 2. Resize Canvas Dinamis saat Dimensi Banner Diubah
  useEffect(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas || canvas.disposed) return

    const { widthPx, heightPx } = canvasDimensions
    canvas.setDimensions({ width: widthPx, height: heightPx })

    const img = fabricImageRef.current
    if (img) {
      img.set({
        left: widthPx / 2,
        top: heightPx / 2,
      })
      img.setCoords()
    }
    canvas.requestRenderAll()
  }, [canvasDimensions])

  // 3. Update Aturan Proporsi (Lock / Free Ratio)
  useEffect(() => {
    const canvas = fabricCanvasRef.current
    const img = fabricImageRef.current
    if (!canvas || !img || canvas.disposed) return

    applyProportionControlRules(canvas, img, lockProportions)
    canvas.requestRenderAll()
    latestPropsRef.current.onConfigChange(buildCurrentConfig(canvas, img))
  }, [lockProportions, applyProportionControlRules, buildCurrentConfig])

  // 4. Signal Reset Posisi & Skala Desain
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
      className="canvas-grid relative mt-4 rounded-xl border border-slate-200 p-4 sm:p-8 min-h-[280px] sm:min-h-[380px] flex flex-col items-center justify-center overflow-hidden w-full max-w-full min-w-0"
    >
      {/* Top Ruler Line (Muncul di tablet/desktop, tersembunyi di mobile agar tidak overflow) */}
      <div className="hidden sm:flex absolute top-3 inset-x-12 items-center justify-center z-10 pointer-events-none">
        <div className="h-px bg-slate-300 flex-1" />
        <span className="px-2.5 text-[11px] font-mono font-bold text-slate-600 bg-white/90 rounded shadow-2xs">
          {widthCm > 0 ? widthCm : 0} cm
        </span>
        <div className="h-px bg-slate-300 flex-1" />
      </div>

      {/* Left Ruler Line (Muncul di tablet/desktop, tersembunyi di mobile agar tidak overflow) */}
      <div className="hidden sm:flex absolute left-3 inset-y-12 flex-col items-center justify-center z-10 pointer-events-none">
        <div className="w-px bg-slate-300 flex-1" />
        <span className="py-2 text-[11px] font-mono font-bold text-slate-600 bg-white/90 rounded px-1 shadow-2xs -rotate-90">
          {heightCm > 0 ? heightCm : 0} cm
        </span>
        <div className="w-px bg-slate-300 flex-1" />
      </div>

      {/* Scaling Wrapper */}
      <div
        className="relative flex items-center justify-center transition-transform w-full max-w-full min-w-0 overflow-hidden"
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
          className={`relative flex items-center justify-center rounded-xl border-2 overflow-hidden transition cursor-pointer max-w-full shrink-0 ${
            imageUrl
              ? 'border-blue-600 shadow-md bg-slate-900'
              : isDragOver
              ? 'border-dashed border-blue-500 bg-blue-50/70'
              : 'border-dashed border-blue-400 bg-white shadow-xs hover:border-blue-500'
          }`}
          onClick={!imageUrl ? onSelectFileClick : undefined}
        >
          {/* Grommets / Mata Ayam overlay non-destruktif */}
          {showBleedGrommets && (
            <>
              <span className="absolute top-2.5 left-2.5 size-3.5 rounded-full border-2 border-blue-400/80 bg-white flex items-center justify-center z-20 pointer-events-none">
                <span className="size-1.5 rounded-full border border-blue-400/80 bg-white" />
              </span>
              <span className="absolute top-2.5 right-2.5 size-3.5 rounded-full border-2 border-blue-400/80 bg-white flex items-center justify-center z-20 pointer-events-none">
                <span className="size-1.5 rounded-full border border-blue-400/80 bg-white" />
              </span>
              <span className="absolute bottom-2.5 left-2.5 size-3.5 rounded-full border-2 border-blue-400/80 bg-white flex items-center justify-center z-20 pointer-events-none">
                <span className="size-1.5 rounded-full border border-blue-400/80 bg-white" />
              </span>
              <span className="absolute bottom-2.5 right-2.5 size-3.5 rounded-full border-2 border-blue-400/80 bg-white flex items-center justify-center z-20 pointer-events-none">
                <span className="size-1.5 rounded-full border border-blue-400/80 bg-white" />
              </span>
            </>
          )}

          {/* Bleed line overlay */}
          {showBleedGrommets && (
            <div className="absolute inset-2 border border-dashed border-blue-400/80 rounded pointer-events-none z-20" />
          )}

          {/* Fabric.js Canvas Host */}
          <div
            ref={hostRef}
            className={imageUrl ? 'relative z-10 max-w-full overflow-hidden' : 'hidden'}
          />

          {/* Dropzone State jika belum ada gambar (sesuai UI Figma / mobile screenshot) */}
          {!imageUrl && (
            <div className="flex flex-col items-center justify-center p-3 sm:p-6 text-center z-10 select-none">
              <strong className="text-xs sm:text-sm font-bold text-slate-800">
                Pratinjau desain Anda
              </strong>
              <p className="mt-1 font-mono text-[11px] sm:text-xs text-slate-500">
                {widthCm} × {heightCm} cm
              </p>
              <span className="hidden sm:inline-block mt-2 font-mono text-[10px] text-slate-400">
                Klik atau tarik berkas ke sini (JPG/PNG maks 20MB)
              </span>
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
          {ratioLabel} ({orientationLabel})
        </span>
      </div>
    </div>
  )
}
