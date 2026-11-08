import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const profile = await getCurrentProfile();

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-white border-b border-zinc-200 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
            ✨ Layanan Pemesanan Banner Online Modern
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-zinc-900 tracking-tight max-w-4xl mx-auto">
            Pesan Banner Cetak Kustom{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Tanpa Komunikasi Rumit
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-zinc-600 max-w-2xl mx-auto leading-relaxed">
            Pilih bahan terbaik, isi ukuran dalam sentimeter, unggah desain Anda,
            dan dapatkan rincian estimasi harga otomatis secara transparan.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {profile ? (
              <Link
                href={
                  profile.role === "admin"
                    ? "/admin/dashboard"
                    : "/customer/dashboard"
                }
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
              >
                Buka Dashboard {profile.role === "admin" ? "Admin" : "Konsumen"} &rarr;
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                >
                  Mulai Pesan Sekarang
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 font-semibold text-base transition-colors"
                >
                  Masuk ke Akun
                </Link>
              </>
            )}
            <Link
              href="/materials"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-zinc-600 hover:text-blue-600 font-medium text-base transition-colors"
            >
              Lihat Katalog Bahan &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 4 Langkah Pemesanan */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
            Alur Pemesanan BannerKu
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Empat langkah praktis dari pemilihan bahan hingga pesanan diproses percetakan
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center mb-4">
              1
            </div>
            <h3 className="font-semibold text-zinc-900 text-base">Pilih Bahan</h3>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              Tersedia Flexi Standard 280g, Premium 340g, Korea 440g, dan Albatros sesuai kebutuhan indoor atau outdoor Anda.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 font-bold flex items-center justify-center mb-4">
              2
            </div>
            <h3 className="font-semibold text-zinc-900 text-base">Tentukan Ukuran</h3>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              Masukkan lebar dan tinggi dalam sentimeter (cm). Luas (m²) dan total harga dihitung otomatis oleh sistem.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center mb-4">
              3
            </div>
            <h3 className="font-semibold text-zinc-900 text-base">Unggah & Preview</h3>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              Unggah file gambar (JPG/PNG). Sesuaikan posisi dan perbesaran gambar pada area canvas simulasi banner.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-green-100 text-green-700 font-bold flex items-center justify-center mb-4">
              4
            </div>
            <h3 className="font-semibold text-zinc-900 text-base">Pantau Status</h3>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              Kirim pesanan. Server memvalidasi dan menyimpan snapshot harga, sementara admin memproses pesanan Anda.
            </p>
          </div>
        </div>
      </section>

      {/* Rincian Rumus Transparan */}
      <section className="bg-white border-y border-zinc-200 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Aturan Bisnis Inti
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 mt-3">
            Transparansi Rumus Perhitungan Harga
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-xl mx-auto">
            Harga dihitung murni berbasis luas meter persegi (m²), bukan keliling.
          </p>

          <div className="mt-6 bg-zinc-900 text-zinc-100 p-6 rounded-2xl font-mono text-xs sm:text-sm text-left shadow-inner">
            <p className="text-zinc-400">{"// 1. Konversi sentimeter ke meter persegi (m²)"}</p>
            <p className="text-amber-400 font-semibold">
              luas_m2 = (lebar_cm / 100) * (tinggi_cm / 100)
            </p>
            <p className="mt-3 text-zinc-400">{"// 2. Total harga pesanan"}</p>
            <p className="text-emerald-400 font-semibold">
              total_harga = luas_m2 * harga_per_m2 * jumlah
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
