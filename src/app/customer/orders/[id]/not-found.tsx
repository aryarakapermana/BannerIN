import Link from "next/link";

export default function OrderNotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12 font-sans text-slate-900">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-rose-50 text-2xl text-rose-600">
          🔒
        </span>
        <h1 className="mt-4 text-xl font-black tracking-tight text-slate-950">
          Pesanan Tidak Ditemukan
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          Nomor pesanan yang Anda buka tidak tersedia atau tidak termasuk dalam
          akun Anda. Demi privasi, pelanggan hanya dapat melihat detail
          pesanannya sendiri.
        </p>
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link
            href="/customer/dashboard"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
          >
            ← Kembali ke Dashboard Saya
          </Link>
          <Link
            href="/studio"
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            Buat Pesanan Baru
          </Link>
        </div>
      </div>
    </div>
  );
}

