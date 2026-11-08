import { requireAuth } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";

export const dynamic = "force-dynamic";

export default async function CustomerDashboardPage() {
  const profile = await requireAuth();

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Banner Selamat Datang */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  Dashboard Konsumen
                </span>
                {profile.role === "admin" && (
                  <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                    Akses Admin
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
                Halo, {profile.full_name || "Pelanggan BannerKu"}!
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Selamat datang di panel pemesanan banner. Kelola pesanan dan desain Anda di sini.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/materials"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                + Pesan Banner Baru
              </Link>
            </div>
          </div>

          {/* Ringkasan Profil Pengguna */}
          <div className="mt-6 pt-6 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-zinc-400 block font-medium">User ID</span>
              <span className="font-mono text-zinc-800 break-all">{profile.id}</span>
            </div>
            <div>
              <span className="text-zinc-400 block font-medium">Nomor Telepon</span>
              <span className="text-zinc-800 font-medium">
                {profile.phone || "Belum diisi"}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 block font-medium">Peran Akun</span>
              <span className="capitalize font-semibold text-zinc-800">
                {profile.role}
              </span>
            </div>
          </div>
        </div>

        {/* Menu Aksi & Modul */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Katalog Bahan */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6 flex flex-col justify-between hover:border-blue-300 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4 font-bold text-lg">
                📦
              </div>
              <h3 className="font-semibold text-zinc-900 text-lg">Katalog Bahan</h3>
              <p className="text-zinc-500 text-sm mt-1">
                Lihat pilihan bahan Flexi Standard, Premium, Korea, hingga Albatros beserta tarif per m².
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/materials"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Buka Katalog &rarr;
              </Link>
            </div>
          </div>

          {/* Card 2: Kalkulator & Pemesanan */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6 flex flex-col justify-between hover:border-blue-300 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4 font-bold text-lg">
                📐
              </div>
              <h3 className="font-semibold text-zinc-900 text-lg">Hitung Ukuran & Desain</h3>
              <p className="text-zinc-500 text-sm mt-1">
                Kalkulasi otomatis harga berdasarkan panjang & lebar banner (cm) dan unggah preview desain.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-xs px-2 py-0.5 rounded font-medium bg-zinc-100 text-zinc-600">
                Fase 8 & 9
              </span>
            </div>
          </div>

          {/* Card 3: Riwayat Pesanan */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6 flex flex-col justify-between hover:border-blue-300 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mb-4 font-bold text-lg">
                🧾
              </div>
              <h3 className="font-semibold text-zinc-900 text-lg">Riwayat Pesanan</h3>
              <p className="text-zinc-500 text-sm mt-1">
                Pantau status pesanan banner Anda: menunggu konfirmasi, diproses, hingga selesai.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-xs px-2 py-0.5 rounded font-medium bg-zinc-100 text-zinc-600">
                Fase 12
              </span>
            </div>
          </div>
        </div>

        {/* Informasi Keamanan Akun */}
        <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-5 text-xs text-blue-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold mb-0.5">Keamanan Akun Terproteksi (Row Level Security)</p>
            <p className="text-blue-700">
              Data pesanan dan file desain Anda hanya dapat diakses oleh Anda sendiri dan tim admin produksi kami.
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-xs px-3.5 py-1.5 rounded-md bg-white border border-blue-200 text-red-600 font-semibold hover:bg-red-50 hover:border-red-200 transition-colors"
            >
              Keluar dari Akun
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

