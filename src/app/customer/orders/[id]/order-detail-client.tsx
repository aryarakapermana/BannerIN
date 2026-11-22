'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect } from 'react'
import {
  OrderStatusBadge,
  OrderStatusTimeline,
} from '@/components/customer/OrderStatusTimeline'
import { BANNERIN_WHATSAPP, Order, STATIC_QRIS_INFO } from '@/domain'
import type { CustomerOrderDTO } from '@/lib/customer-orders'

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

interface OrderDetailClientProps {
  order: CustomerOrderDTO
  autoPrint?: boolean
}

export default function OrderDetailClient({
  order,
  autoPrint = false,
}: OrderDetailClientProps) {
  useEffect(() => {
    if (autoPrint) {
      const timer = window.setTimeout(() => {
        window.print()
      }, 350)
      return () => window.clearTimeout(timer)
    }
  }, [autoPrint])

  const statusMeta = Order.getCustomerStatusMeta(order.status)
  const subtotalPerSheet = Math.ceil(order.areaSqm * order.unitPriceSnapshot)
  const waHelpText = encodeURIComponent(
    `Halo Admin BannerIN, saya ingin menanyakan detail pesanan ${order.orderNumber} (${order.materialName}, ${order.widthCm}x${order.heightCm} cm).`
  )

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 print:bg-white">
      {/* Header (Hidden when printing invoice) */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md print:hidden">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 lg:px-8">
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

          <div className="flex items-center gap-2.5">
            <Link
              href={order.customerId ? "/customer/dashboard" : "/"}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              ← {order.customerId ? "Kembali ke Riwayat" : "Kembali ke Beranda"}
            </Link>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition cursor-pointer"
            >
              🖨️ Cetak / Simpan Invoice
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8 lg:px-8 print:py-4">
        {/* Top Summary Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-lg bg-slate-950 px-2.5 py-1 font-mono text-xs font-bold text-white">
                  {order.orderNumber}
                </span>
                <OrderStatusBadge status={order.status} />
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                Detail Pesanan &amp; Invoice Transaksi
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Dibuat pada {order.dateFormatted} · {order.timeFormatted} WIB ·
                Pembaruan status terakhir: {order.updatedAtFormatted}
              </p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-left sm:text-right">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-700">
                Total Harga Snapshot
              </span>
              <strong className="mt-0.5 block text-2xl font-black font-mono text-slate-950">
                {rupiah.format(order.totalPrice)}
              </strong>
              <span className="block text-[10px] text-slate-500">
                Terkunci saat transaksi dibuat
              </span>
            </div>
          </div>

          {/* Latest Status Stepper */}
          <div className="mt-6">
            <div className="mb-4 flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Progres Produksi Saat Ini
              </h2>
              <span className="text-xs font-medium text-slate-600">
                {statusMeta.description}
              </span>
            </div>
            <OrderStatusTimeline status={order.status} />
          </div>
        </div>

        {/* Specification & Snapshot Price + Customer Details */}
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* Left 7 cols: Specs & Snapshot Breakdown */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-extrabold text-slate-950">
                Spesifikasi Cetak &amp; Snapshot Tarif
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Harga berikut terkunci sesuai tarif bahan pada saat Anda memesan.
              </p>

              <dl className="mt-5 divide-y divide-slate-100 text-xs">
                <div className="flex items-start justify-between gap-4 py-3">
                  <dt className="text-slate-500">Bahan Banner</dt>
                  <dd className="text-right">
                    <strong className="block font-bold text-slate-950">
                      {order.materialName}
                    </strong>
                    {order.materialDescription && (
                      <span className="mt-0.5 block text-[11px] text-slate-400">
                        {order.materialDescription}
                      </span>
                    )}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-slate-500">Dimensi Fisik</dt>
                  <dd className="font-mono font-bold text-slate-950">
                    {order.widthCm} cm × {order.heightCm} cm
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-slate-500">Luas per Lembar</dt>
                  <dd className="font-mono font-bold text-slate-950">
                    {order.areaSqm.toFixed(2)} m²
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-slate-500">Jumlah Cetak (Qty)</dt>
                  <dd className="font-mono font-bold text-slate-950">
                    {order.quantity} pcs
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-slate-500">Tarif Snapshot Bahan</dt>
                  <dd className="font-mono font-bold text-blue-700">
                    {rupiah.format(order.unitPriceSnapshot)} / m²
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-slate-500">Harga per Lembar</dt>
                  <dd className="font-mono font-semibold text-slate-800">
                    {order.areaSqm.toFixed(2)} m² ×{' '}
                    {rupiah.format(order.unitPriceSnapshot)} ={' '}
                    {rupiah.format(subtotalPerSheet)}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-4 pt-4 text-sm">
                  <dt className="font-extrabold text-slate-950">
                    Total Pembayaran ({order.quantity} pcs)
                  </dt>
                  <dd className="font-mono text-lg font-black text-slate-950">
                    {rupiah.format(order.totalPrice)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Design Preview Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-extrabold text-slate-950">
                    Lampiran Desain Banner
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Akses desain bersifat privat milik akun Anda (Signed URL berbatas waktu).
                  </p>
                </div>
                {order.originalDesignUrl && (
                  <a
                    href={order.originalDesignUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition print:hidden"
                  >
                    Unduh Desain Asli ⬇
                  </a>
                )}
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                {order.previewUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={order.previewUrl}
                    alt={`Preview Desain ${order.orderNumber}`}
                    className="max-h-80 w-full object-contain bg-slate-950/5"
                  />
                ) : (
                  <div className="flex h-40 flex-col items-center justify-center text-xs text-slate-400">
                    <span className="text-2xl mb-1.5">📄</span>
                    <span>Pesanan tanpa lampiran file desain Studio.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right 5 cols: Customer Info & Payment Proof */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-extrabold text-slate-950">
                Data Pemesan &amp; Finishing
              </h2>

              <dl className="mt-4 space-y-3 text-xs">
                <div>
                  <dt className="text-slate-400">Nama Pemesan</dt>
                  <dd className="mt-0.5 font-bold text-slate-900">
                    {order.customerName}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Nomor WhatsApp Konfirmasi</dt>
                  <dd className="mt-0.5 font-mono font-bold text-slate-900">
                    {order.whatsappNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Catatan Pesanan / Finishing</dt>
                  <dd className="mt-1 rounded-xl border border-slate-100 bg-slate-50 p-3 text-slate-700">
                    {order.notes || 'Tidak ada catatan khusus.'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-extrabold text-slate-950">
                Metode &amp; Bukti Pembayaran
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {order.paymentProviderLabel} · Merchant{' '}
                <strong className="text-slate-800">
                  {STATIC_QRIS_INFO.merchantName}
                </strong>
              </p>

              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {order.paymentProofUrl ? (
                  <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={order.paymentProofUrl}
                      alt={`Bukti Pembayaran ${order.orderNumber}`}
                      className="max-h-72 w-full object-contain bg-white"
                    />
                    <div className="flex items-center justify-between border-t border-slate-200 bg-emerald-50/70 px-3.5 py-2 text-[11px] font-bold text-emerald-800 print:hidden">
                      <span>✓ Bukti transfer tersimpan privat</span>
                      <a
                        href={order.paymentProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-emerald-950"
                      >
                        Buka penuh ↗
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-xs text-slate-400">
                    Belum ada lampiran bukti pembayaran pada pesanan ini.
                  </div>
                )}
              </div>

              <div className="mt-5 print:hidden">
                <a
                  href={`${BANNERIN_WHATSAPP.baseUrl}?text=${waHelpText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  💬 Hubungi Admin via WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

