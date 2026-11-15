"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import {
  Order,
  orderService,
  type AuthoritativeQuoteResult,
  type StaticQrisInfo,
} from "@/domain";
import {
  createOrderAction,
  type CreatedOrderReceipt,
} from "@/app/actions/orders";

export interface CheckoutInitialData {
  userDisplayName: string;
  initialCustomerName: string;
  initialWhatsapp: string;
  studioBackHref: string;
  material: {
    id: string;
    name: string;
    description: string | null;
    pricePerSqm: number;
  } | null;
  widthCm: number;
  heightCm: number;
  quantity: number;
  quote: AuthoritativeQuoteResult | null;
  designId: string | null;
  designPreviewUrl: string | null;
  designMissingNotice: string | null;
  qrisInfo: StaticQrisInfo;
}

function formatRupiah(amount: number): string {
  return `Rp ${new Intl.NumberFormat("id-ID").format(Math.round(amount))}`;
}

export default function CheckoutClient({
  initialData,
}: {
  initialData: CheckoutInitialData;
}) {
  const {
    userDisplayName,
    studioBackHref,
    material,
    widthCm,
    heightCm,
    quantity,
    quote,
    designId,
    designPreviewUrl,
    designMissingNotice,
    qrisInfo,
  } = initialData;

  const [customerName, setCustomerName] = useState(
    initialData.initialCustomerName
  );
  const [whatsappInput, setWhatsappInput] = useState(
    initialData.initialWhatsapp
  );
  const [notes, setNotes] = useState("");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreviewUrl, setPaymentProofPreviewUrl] = useState<
    string | null
  >(null);
  const [proofError, setProofError] = useState<string | null>(null);
  const [isDraggingProof, setIsDraggingProof] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStepLabel, setUploadStepLabel] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [submittedOrder, setSubmittedOrder] =
    useState<CreatedOrderReceipt | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const proofInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (paymentProofPreviewUrl) {
        URL.revokeObjectURL(paymentProofPreviewUrl);
      }
    };
  }, [paymentProofPreviewUrl]);

  const firstName = userDisplayName.split(" ")[0] || userDisplayName;

  const areaSqm = quote?.breakdown.areaSqm ?? (widthCm * heightCm) / 10000;
  const totalAreaSqm = quote?.totalAreaSqm ?? areaSqm * quantity;
  const totalPrice = quote?.breakdown.totalPrice ?? 0;
  const tarifSnapshot = material?.pricePerSqm ?? 0;

  function handleSelectPaymentProof(selected: File | null | undefined) {
    setProofError(null);
    setFormError(null);
    if (!selected) return;

    try {
      orderService.validatePaymentProofMetadata({
        name: selected.name,
        type: selected.type,
        size: selected.size,
      });
    } catch (err: unknown) {
      setProofError(
        err instanceof Error
          ? err.message
          : "File bukti pembayaran tidak valid."
      );
      return;
    }

    if (paymentProofPreviewUrl) {
      URL.revokeObjectURL(paymentProofPreviewUrl);
    }
    setPaymentProofFile(selected);
    setPaymentProofPreviewUrl(URL.createObjectURL(selected));
  }

  function handleProofInputChange(event: ChangeEvent<HTMLInputElement>) {
    handleSelectPaymentProof(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleProofDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingProof(false);
    handleSelectPaymentProof(event.dataTransfer.files?.[0]);
  }

  function handleRemovePaymentProof() {
    if (paymentProofPreviewUrl) {
      URL.revokeObjectURL(paymentProofPreviewUrl);
    }
    setPaymentProofFile(null);
    setPaymentProofPreviewUrl(null);
    setProofError(null);
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setProofError(null);
    setRequiresAuth(false);

    if (!material || !quote) {
      setFormError(
        "Data bahan cetak tidak tersedia. Kembali ke Studio untuk memilih bahan."
      );
      return;
    }

    // Validasi ringan di UI menggunakan aturan domain yang sama sebelum kirim ke server
    try {
      Order.normalizeCustomerName(customerName);
      Order.normalizeWhatsApp(whatsappInput);
      Order.normalizeNotes(notes);
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Periksa kembali data pemesan."
      );
      return;
    }

    if (!paymentProofFile) {
      setProofError(
        "Unggah foto atau screenshot bukti pembayaran QRIS terlebih dahulu."
      );
      setFormError(
        "Bukti pembayaran wajib diunggah sebelum konfirmasi pesanan."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Unggah bukti pembayaran ke bucket privat `payment-proofs`
      setUploadStepLabel("Mengunggah bukti pembayaran...");
      const uploadBody = new FormData();
      uploadBody.append("file", paymentProofFile);

      const uploadRes = await fetch("/api/orders/payment-proof", {
        method: "POST",
        body: uploadBody,
      });
      const uploadJson = (await uploadRes.json()) as {
        success?: boolean;
        paymentProofPath?: string;
        requiresAuth?: boolean;
        error?: string;
      };

      if (!uploadRes.ok || !uploadJson.success || !uploadJson.paymentProofPath) {
        if (uploadRes.status === 401 || uploadJson.requiresAuth) {
          setRequiresAuth(true);
        }
        setFormError(
          uploadJson.error || "Gagal mengunggah gambar bukti pembayaran."
        );
        return;
      }

      // 2. Simpan pesanan ke Supabase melalui Server Action (hitung ulang harga di server)
      setUploadStepLabel("Menyimpan pesanan...");
      const result = await createOrderAction({
        customerName,
        whatsappNumber: whatsappInput,
        materialId: material.id,
        designId,
        widthCm,
        heightCm,
        quantity,
        notes: notes || null,
        paymentMethod: "qris_static",
        paymentProofPath: uploadJson.paymentProofPath,
      });

      if (!result.success || !result.order) {
        if (result.requiresAuth) {
          setRequiresAuth(true);
        }
        setFormError(result.error || "Gagal mengirim pesanan.");
        return;
      }

      setSubmittedOrder(result.order);
    } catch {
      setFormError("Terjadi gangguan jaringan. Silakan coba kembali.");
    } finally {
      setIsSubmitting(false);
      setUploadStepLabel(null);
    }
  }

  async function handleCopySummary() {
    if (!submittedOrder) return;
    const summaryText = [
      `Halo Admin BannerIN, saya sudah melakukan pemesanan:`,
      `No. Pesanan: ${submittedOrder.orderNumber}`,
      `Nama: ${submittedOrder.customerName}`,
      `WhatsApp: ${submittedOrder.whatsappNumber}`,
      `Bahan: ${submittedOrder.materialName}`,
      `Ukuran: ${submittedOrder.widthCm} x ${submittedOrder.heightCm} cm (${submittedOrder.quantity} pcs)`,
      `Total Bayar (QRIS): ${formatRupiah(submittedOrder.totalPrice)}`,
      submittedOrder.notes ? `Catatan: ${submittedOrder.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch {
      // Abaikan jika browser membatasi clipboard
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center">
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              <span className="text-blue-600">Banner</span>Ku
            </span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href={studioBackHref}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 transition"
            >
              <span aria-hidden="true">←</span>
              <span className="hidden sm:inline">Kembali ke Studio</span>
              <span className="sm:hidden">Studio</span>
            </Link>

            <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
              <span className="hidden sm:inline">{userDisplayName}</span>
              <span className="sm:hidden">{firstName}</span>
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
        {/* Top Heading */}
        <div>
          <span className="block text-[11px] font-bold uppercase tracking-widest text-blue-600">
            PESANAN SIAP DIPROSES
          </span>
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {submittedOrder
              ? "Pesanan Berhasil Dikirim!"
              : "Checkout & Konfirmasi Pesanan"}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
            {submittedOrder
              ? "Pesananmu sudah tercatat dengan harga terkunci dan menunggu verifikasi admin."
              : "Lengkapi data pemesan dan selesaikan pembayaran melalui QRIS resmi BannerIN."}
          </p>
        </div>

        {/* 3-Step Progress Stepper */}
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 sm:px-6 shadow-2xs">
          <div className="flex items-center justify-between gap-2 sm:gap-4 text-[11px] sm:text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
              <span className="font-bold text-emerald-600" aria-hidden="true">
                ✓
              </span>
              <span className="font-medium">1. Bahan &amp; Ukuran</span>
            </div>

            <div className="h-px flex-1 bg-slate-200 min-w-3" />

            <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
              <span className="font-bold text-emerald-600" aria-hidden="true">
                ✓
              </span>
              <span className="font-medium">2. Desain di Studio</span>
            </div>

            <div className="h-px flex-1 bg-slate-200 min-w-3" />

            <div
              className={`flex items-center gap-1.5 shrink-0 font-bold ${
                submittedOrder ? "text-emerald-600" : "text-blue-600"
              }`}
            >
              {submittedOrder ? (
                <span aria-hidden="true">✓</span>
              ) : (
                <span className="size-2 rounded-full bg-blue-600" />
              )}
              <span>3. Checkout &amp; Bayar</span>
            </div>
          </div>
        </div>

        {/* Order Success Confirmation Screen OR Checkout Form */}
        {submittedOrder ? (
          <section className="mt-6 rounded-2xl border border-emerald-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  ✓ Pesanan Terdaftar · Menunggu Verifikasi Pembayaran
                </span>
                <h2 className="mt-3 text-xl sm:text-2xl font-extrabold font-mono text-slate-900">
                  {submittedOrder.orderNumber}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Metode: {submittedOrder.paymentLabel} ·{" "}
                  {submittedOrder.qrisMerchantName} (NMID:{" "}
                  {submittedOrder.qrisNmid})
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left sm:text-right">
                <span className="block text-[11px] font-medium text-slate-500">
                  Total Terkunci Server
                </span>
                <strong className="mt-0.5 block text-xl sm:text-2xl font-extrabold font-mono text-slate-900">
                  {formatRupiah(submittedOrder.totalPrice)}
                </strong>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left receipt specs */}
              <div className="lg:col-span-7 space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5 text-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Detail Pemesan &amp; Spesifikasi Cetak
                  </h3>
                  <div className="flex justify-between gap-4 border-t border-slate-200/70 pt-2.5">
                    <span className="text-slate-500">Nama Pemesan</span>
                    <strong className="text-slate-900 text-right">
                      {submittedOrder.customerName}
                    </strong>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Nomor WhatsApp</span>
                    <strong className="font-mono text-slate-900">
                      {submittedOrder.whatsappNumber}
                    </strong>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Bahan Pilihan</span>
                    <strong className="text-slate-900 text-right">
                      {submittedOrder.materialName}
                    </strong>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Ukuran &amp; Luas</span>
                    <strong className="font-mono text-slate-900">
                      {submittedOrder.widthCm} × {submittedOrder.heightCm} cm ·{" "}
                      {submittedOrder.areaSqm.toFixed(2)} m²
                    </strong>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Jumlah</span>
                    <strong className="font-mono text-slate-900">
                      {submittedOrder.quantity} pcs
                    </strong>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Tarif Snapshot</span>
                    <strong className="font-mono text-slate-900">
                      {formatRupiah(submittedOrder.unitPriceSnapshot)} / m²
                    </strong>
                  </div>
                  {submittedOrder.notes && (
                    <div className="flex justify-between gap-4 border-t border-slate-200/70 pt-2.5">
                      <span className="text-slate-500 shrink-0">
                        Catatan Finishing
                      </span>
                      <span className="text-slate-800 text-right">
                        {submittedOrder.notes}
                      </span>
                    </div>
                  )}
                </div>

                {designPreviewUrl && (
                  <div className="rounded-xl border border-slate-200 p-4">
                    <span className="block text-xs font-bold text-slate-800 mb-2.5">
                      Preview Desain Terlampir
                    </span>
                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-900 aspect-video max-h-48 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={designPreviewUrl}
                        alt="Preview Desain Pesanan"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link
                    href="/customer/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
                  >
                    Lihat Status Pesanan →
                  </Link>

                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={handleCopySummary}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    {copiedSummary ? "✓ Ringkasan Disalin" : "Salin Ringkasan"}
                  </button>

                  <Link
                    href="/studio"
                    className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
                  >
                    + Pesan Banner Lain
                  </Link>
                </div>
              </div>

              {/* Right column: Bukti Pembayaran & QRIS summary */}
              <div className="lg:col-span-5 space-y-4">
                {(submittedOrder.paymentProofUrl || paymentProofPreviewUrl) && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800">
                      ✓ Bukti Pembayaran Terunggah ke Server
                    </span>
                    <div className="mt-3 overflow-hidden rounded-xl border border-emerald-200 bg-white p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          submittedOrder.paymentProofUrl ||
                          paymentProofPreviewUrl ||
                          ""
                        }
                        alt="Bukti Pembayaran Pelanggan"
                        className="mx-auto max-h-56 w-auto rounded-lg object-contain"
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-emerald-800">
                      Tim admin akan mencocokkan bukti ini di Dashboard Admin.
                    </p>
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 flex flex-col items-center text-center">
                  <span className="text-xs font-bold text-slate-800">
                    Informasi QRIS BannerIN
                  </span>
                  <span className="mt-1 text-[11px] text-slate-500">
                    Nominal terverifikasi:{" "}
                    <strong className="font-mono text-slate-800">
                      {formatRupiah(submittedOrder.totalPrice)}
                    </strong>
                  </span>

                  <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                    <Image
                      src={qrisInfo.imagePath}
                      alt={`QRIS ${qrisInfo.merchantName}`}
                      width={220}
                      height={300}
                      className="w-40 h-auto rounded-lg object-contain"
                    />
                  </div>

                  <strong className="mt-3 text-xs font-extrabold text-slate-900">
                    {qrisInfo.merchantName}
                  </strong>
                  <span className="text-[11px] font-mono text-slate-500">
                    NMID: {qrisInfo.nmid}
                  </span>

                  <a
                    href={qrisInfo.imagePath}
                    download={qrisInfo.downloadFileName}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-100 transition"
                  >
                    ↓ Unduh Gambar QR
                  </a>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start"
          >
            {/* Left Column (7 cols): Data Pemesan + Ringkasan Pesanan */}
            <div className="space-y-6 lg:col-span-7">
              {/* Card 1: Data Pemesan */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">
                    Data Pemesan
                  </h2>
                  <span className="text-xs font-medium text-slate-400">
                    * Wajib diisi
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  {/* Nama Pemesan */}
                  <div>
                    <label
                      htmlFor="checkout-customer-name"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Nama Pemesan *
                    </label>
                    <input
                      id="checkout-customer-name"
                      type="text"
                      suppressHydrationWarning
                      required
                      maxLength={100}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15"
                    />
                  </div>

                  {/* Nomor WhatsApp */}
                  <div>
                    <label
                      htmlFor="checkout-whatsapp"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Nomor WhatsApp *
                    </label>
                    <div className="mt-1.5 flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15">
                      <span className="border-r border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-600 select-none">
                        +62
                      </span>
                      <input
                        id="checkout-whatsapp"
                        type="tel"
                        inputMode="numeric"
                        suppressHydrationWarning
                        required
                        maxLength={20}
                        value={whatsappInput}
                        onChange={(e) => setWhatsappInput(e.target.value)}
                        placeholder="081234567890"
                        className="w-full px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      Digunakan untuk konfirmasi desain &amp; pemberitahuan
                      selesai cetak
                    </p>
                  </div>

                  {/* Catatan Pesanan / Finishing */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="checkout-notes"
                        className="block text-xs font-semibold text-slate-700"
                      >
                        Catatan Pesanan / Finishing
                      </label>
                      <span className="text-[11px] text-slate-400">
                        Opsional
                      </span>
                    </div>
                    <textarea
                      id="checkout-notes"
                      suppressHydrationWarning
                      rows={3}
                      maxLength={500}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Contoh: Mata ayam di 4 sudut, lipat tepi rapi"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 resize-y"
                    />
                  </div>
                </div>
              </section>

              {/* Card 2: Ringkasan Pesanan & Preview Desain */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
                <h2 className="text-base font-bold text-slate-900">
                  Ringkasan Pesanan &amp; Preview Desain
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Pastikan spesifikasi sudah sesuai sebelum membayar.
                </p>

                {designMissingNotice && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    {designMissingNotice}
                  </div>
                )}

                <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-12 sm:items-start">
                  {/* Design Preview Column */}
                  <div className="sm:col-span-5">
                    <div className="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
                      {designPreviewUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={designPreviewUrl}
                          alt="Preview Desain Tersimpan"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center px-4 text-center text-white/80">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">
                            SPESIFIKASI BANNER
                          </span>
                          <span className="mt-1 text-sm font-extrabold font-mono">
                            {widthCm} × {heightCm} cm
                          </span>
                          <span className="mt-1 text-[11px] text-slate-300">
                            Belum ada gambar terlampir
                          </span>
                        </div>
                      )}
                    </div>

                    {designId && designPreviewUrl ? (
                      <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                        <span aria-hidden="true">✓</span>
                        <span>Preview Desain Tersimpan</span>
                      </div>
                    ) : (
                      <Link
                        href={studioBackHref}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                      >
                        Unggah / edit desain di Studio →
                      </Link>
                    )}
                  </div>

                  {/* Spec Key-Values Column */}
                  <div className="sm:col-span-7 space-y-2.5">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        BAHAN PILIHAN
                      </span>
                      <strong className="mt-0.5 block text-sm sm:text-base font-bold text-slate-900">
                        {material ? material.name : "Bahan tidak tersedia"}
                      </strong>
                    </div>

                    <div className="space-y-2 pt-1 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">Ukuran</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {widthCm} × {heightCm} cm · {areaSqm.toFixed(2)} m²
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">Jumlah</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {quantity} pcs
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">Tarif Snapshot</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {formatRupiah(tarifSnapshot)} / m²
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtotal Row */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs font-medium text-slate-500">
                    Subtotal · {quantity} item
                  </span>
                  <strong className="text-base font-extrabold font-mono text-slate-900">
                    {formatRupiah(totalPrice)}
                  </strong>
                </div>

                {/* Server Lock Info Banner */}
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-3.5 py-2.5 text-xs text-blue-700">
                  <svg
                    className="size-4 shrink-0 mt-0.5 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    Harga dihitung ulang oleh server dan terkunci sebagai
                    snapshot pesanan.
                  </span>
                </div>
              </section>
            </div>

            {/* Right Column (5 cols): Pembayaran QRIS Statis */}
            <div className="lg:col-span-5">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
                {/* Server Verified Badge aligned top-right just like Figma mockup */}
                <div className="flex justify-end">
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                    ✓ Terverifikasi Server
                  </span>
                </div>

                <div className="mt-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Pembayaran QRIS Statis
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Satu scan untuk semua aplikasi pembayaran.
                  </p>
                </div>

                {/* Total Pembayaran Card */}
                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <span className="block text-xs font-medium text-slate-500">
                    Total Pembayaran
                  </span>
                  <div className="mt-1 text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-slate-900">
                    {formatRupiah(totalPrice)}
                  </div>
                  <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                    <span className="truncate">
                      {quantity} banner · {material?.name ?? "Bahan Banner"}
                    </span>
                    <span className="font-mono font-semibold text-slate-700 shrink-0">
                      {totalAreaSqm.toFixed(2)} m²
                    </span>
                  </div>
                </div>

                {/* Static QRIS Frame */}
                <div className="mt-4 flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-4 text-center">
                  <div className="overflow-hidden rounded-lg">
                    <Image
                      src={qrisInfo.imagePath}
                      alt={`QRIS BannerIN - ${qrisInfo.merchantName}`}
                      width={260}
                      height={360}
                      className="h-auto w-48 sm:w-52 object-contain"
                      priority
                    />
                  </div>

                  <strong className="mt-3 text-xs font-extrabold tracking-wide text-slate-900">
                    {qrisInfo.merchantName}
                  </strong>
                  <span className="mt-0.5 text-[11px] font-mono text-slate-500">
                    NMID: {qrisInfo.nmid}
                  </span>

                  <a
                    href={qrisInfo.imagePath}
                    download={qrisInfo.downloadFileName}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-100 transition"
                  >
                    <span aria-hidden="true">↓</span>
                    <span>Unduh Gambar QR</span>
                  </a>
                </div>

                {/* Cara Membayar Steps */}
                <div className="mt-5">
                  <h3 className="text-xs font-bold text-slate-900">
                    Cara membayar
                  </h3>
                  <ol className="mt-3 space-y-2.5 text-xs text-slate-600 leading-relaxed">
                    <li className="flex items-start gap-2.5">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-600">
                        1
                      </span>
                      <span>
                        Buka aplikasi e-wallet atau mobile banking (GoPay, BCA,
                        Mandiri, BRI, DANA, OVO, dll).
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-600">
                        2
                      </span>
                      <span>
                        Scan QRIS di atas dan masukkan nominal tepat{" "}
                        <strong className="font-semibold text-slate-900">
                          {formatRupiah(totalPrice)}
                        </strong>
                        .
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-600">
                        3
                      </span>
                      <span>
                        Unggah bukti transfer di bawah lalu tekan konfirmasi agar
                        admin segera memverifikasi pembayaran &amp; desainmu.
                      </span>
                    </li>
                  </ol>
                </div>

                {/* Upload Bukti Pembayaran Section */}
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="checkout-payment-proof"
                      className="block text-xs font-bold text-slate-900"
                    >
                      Upload Bukti Pembayaran *
                    </label>
                    <span className="text-[11px] font-medium text-slate-400">
                      JPG / PNG / WEBP · Maks 10 MB
                    </span>
                  </div>

                  <input
                    id="checkout-payment-proof"
                    ref={proofInputRef}
                    type="file"
                    suppressHydrationWarning
                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    onChange={handleProofInputChange}
                    className="sr-only"
                  />

                  {paymentProofFile && paymentProofPreviewUrl ? (
                    <div className="mt-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-3.5">
                      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={paymentProofPreviewUrl}
                          alt="Preview Bukti Pembayaran"
                          className="mx-auto max-h-48 w-auto rounded-lg object-contain"
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            ✓ Bukti siap dikirim
                          </span>
                          <p className="truncate text-[11px] text-slate-600">
                            {paymentProofFile.name} ·{" "}
                            {formatFileSize(paymentProofFile.size)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            suppressHydrationWarning
                            onClick={() => proofInputRef.current?.click()}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                          >
                            Ganti
                          </button>
                          <button
                            type="button"
                            suppressHydrationWarning
                            onClick={handleRemovePaymentProof}
                            className="rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingProof(true);
                      }}
                      onDragLeave={() => setIsDraggingProof(false)}
                      onDrop={handleProofDrop}
                      className={`mt-2.5 rounded-2xl border-2 border-dashed p-4 text-center transition ${
                        isDraggingProof
                          ? "border-blue-500 bg-blue-50/60"
                          : "border-slate-200 bg-slate-50/60 hover:border-blue-400 hover:bg-blue-50/30"
                      }`}
                    >
                      <button
                        type="button"
                        suppressHydrationWarning
                        onClick={() => proofInputRef.current?.click()}
                        className="flex w-full flex-col items-center justify-center gap-1.5 py-1 cursor-pointer"
                      >
                        <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
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
                              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                            />
                          </svg>
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          Pilih atau seret gambar bukti bayar
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Screenshot transfer QRIS dari m-banking / e-wallet
                        </span>
                      </button>
                    </div>
                  )}

                  {proofError && (
                    <p className="mt-2 text-xs font-medium text-rose-600">
                      {proofError}
                    </p>
                  )}
                </div>

                {/* Validation / Server Error */}
                {formError && (
                  <div
                    role="alert"
                    className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 space-y-2"
                  >
                    <p>{formError}</p>
                    {requiresAuth && (
                      <Link
                        href="/login?redirect=/checkout"
                        className="inline-block font-bold text-rose-900 underline"
                      >
                        Masuk kembali ke akun →
                      </Link>
                    )}
                  </div>
                )}

                {/* Amber Confirm CTA Button */}
                <button
                  type="submit"
                  suppressHydrationWarning
                  disabled={isSubmitting || !material || !quote}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3.5 text-sm font-bold text-slate-950 shadow-sm shadow-amber-500/20 hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting
                    ? uploadStepLabel || "Memproses Pesanan..."
                    : "Konfirmasi & Kirim Pesanan →"}
                </button>

                <p className="mt-2.5 text-center text-[11px] text-slate-400 leading-relaxed">
                  Dengan menekan konfirmasi, pesanan masuk ke antrean verifikasi
                  admin.
                </p>
              </section>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

