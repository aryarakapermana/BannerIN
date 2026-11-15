import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BANNERIN_WHATSAPP } from "@/domain";

export const dynamic = "force-dynamic";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default async function MaterialsPage() {
  const supabase = await createClient();

  // Ambil hanya bahan yang aktif untuk konsumen
  const { data: dbMaterials } = await supabase
    .from("materials")
    .select("*")
    .eq("is_active", true)
    .order("price_per_sqm", { ascending: true });

  const materials = dbMaterials || [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Navbar Konsumen */}
      <Navbar />

      <main className="flex-1 pb-20 pt-8 sm:pt-12">
        {/* Header Hero Section */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-12">
          <div className="rounded-3xl bg-linear-to-br from-slate-950 via-blue-950 to-slate-900 p-8 sm:p-14 text-white relative overflow-hidden shadow-xl">
            <div className="absolute right-0 top-0 size-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold text-blue-300">
                <span className="size-2 rounded-full bg-blue-400 animate-pulse" />
                Katalog Bahan Resmi Percetakan
              </span>
              <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Bahan Tepat.
                <br />
                <span className="text-blue-400">Pesan Lebih Terlihat.</span>
              </h1>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-300">
                Seluruh harga diperbarui secara transparan langsung dari sistem percetakan kami.
                Pilih bahan yang sesuai dengan peruntukan indoor, outdoor, hingga billboard jangka panjang.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span> Harga per meter persegi (m²)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span> Tahan cuaca & presisi
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span> Mata ayam & lipat tepi rapi
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Daftar Kartu Bahan Dinamis dari Database */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
                Pilihan Bahan Aktif ({materials.length})
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Data disinkronkan langsung dari basis data Supabase BannerIN.
              </p>
            </div>
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
            >
              Buka Studio Editor
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          {materials.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <span className="text-4xl">📋</span>
              <h3 className="mt-3 text-base font-bold text-slate-800">Katalog Sedang Diperbarui</h3>
              <p className="mt-1 text-xs text-slate-500">
                Saat ini tim admin sedang memperbarui daftar bahan. Silakan kembali beberapa saat lagi.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {materials.map((m, idx) => {
                const weight = m.name.includes("gram")
                  ? m.name.split("gram")[0].trim().split(" ").pop() + " gsm"
                  : m.name.includes("gsm")
                  ? m.name.split("gsm")[0].trim().split(" ").pop() + " gsm"
                  : "Standar";

                return (
                  <div
                    key={m.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-400 hover:shadow-md transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-extrabold text-blue-700 font-mono">
                          PILIHAN #{idx + 1}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                          {weight}
                        </span>
                      </div>

                      <h3 className="mt-4 text-lg font-bold text-slate-950 group-hover:text-blue-600 transition">
                        {m.name}
                      </h3>

                      <p className="mt-2 text-xs leading-relaxed text-slate-600 min-h-[50px]">
                        {m.description || "Bahan banner cetak berkualitas tinggi dengan daya rekat tinta maksimal."}
                      </p>

                      <div className="mt-6 border-t border-slate-100 pt-4">
                        <span className="block text-[11px] font-medium text-slate-400">Tarif Resmi</span>
                        <div className="mt-1 flex items-baseline gap-1.5">
                          <strong className="text-2xl font-black text-slate-950 font-mono">
                            {rupiah.format(Number(m.price_per_sqm))}
                          </strong>
                          <span className="text-xs text-slate-500">/ m²</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <Link
                        href={`/studio?material=${m.id}`}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-blue-600 group-hover:bg-blue-600"
                      >
                        Pilih Bahan Ini
                        <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Tabel Perbandingan Spesifikasi */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-16">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-950">Panduan Karakteristik Bahan</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gunakan panduan berikut untuk menentukan bahan terbaik untuk kebutuhan Anda.
                </p>
              </div>
              <a
                href={BANNERIN_WHATSAPP.baseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2 hover:bg-emerald-100 transition"
              >
                <span>💬</span> Konsultasi WhatsApp
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
                  <tr>
                    <th className="py-3 px-4">Nama Bahan</th>
                    <th className="py-3 px-4">Harga / m²</th>
                    <th className="py-3 px-4">Ketahanan</th>
                    <th className="py-3 px-4">Area Pemasangan</th>
                    <th className="py-3 px-4">Finishing Rekomendasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {materials.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{m.name}</td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {rupiah.format(Number(m.price_per_sqm))}
                      </td>
                      <td className="py-3 px-4">
                        {m.name.includes("440") ? "Outdoor 12+ Bulan" : m.name.includes("340") ? "Outdoor 6-12 Bulan" : m.name.includes("280") ? "Promosi 1-3 Bulan" : "Indoor Premium"}
                      </td>
                      <td className="py-3 px-4">
                        {m.name.toLowerCase().includes("albatros") ? "Indoor / Exhibition Stand" : "Outdoor / Spanduk / Baliho"}
                      </td>
                      <td className="py-3 px-4 text-slate-500">Mata ayam keliling · Lipat tepi rapi</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

