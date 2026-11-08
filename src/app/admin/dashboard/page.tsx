import { requireAuth } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // Hanya user dengan role 'admin' yang dapat melewati fungsi ini
  const profile = await requireAuth("admin");

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Banner Admin */}
        <div className="bg-white rounded-2xl border border-purple-200 p-6 sm:p-8 shadow-sm mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-full -z-0 opacity-70" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                  Panel Administrator
                </span>
                <span className="text-xs text-zinc-400">Akses Terproteksi Khusus</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
                Dashboard Operasional Admin
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Selamat bertugas, <span className="font-semibold text-zinc-800">{profile.full_name || "Admin"}</span>.
                Kelola bahan percetakan, harga per m², serta pantau pesanan banner konsumen.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/materials"
                className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition-colors"
              >
                Kelola Bahan & Harga
              </Link>
            </div>
          </div>

          {/* Info Akun Admin */}
          <div className="relative z-10 mt-6 pt-6 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-zinc-400 block font-medium">Admin ID</span>
              <span className="font-mono text-zinc-800 break-all">{profile.id}</span>
            </div>
            <div>
              <span className="text-zinc-400 block font-medium">Status Hak Akses</span>
              <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Role: ADMIN
              </span>
            </div>
            <div>
              <span className="text-zinc-400 block font-medium">Proteksi Role</span>
              <span className="text-zinc-600">
                Terproteksi Server-Side & RLS
              </span>
            </div>
          </div>
        </div>

        {/* Modul Admin */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Card 1: Pengelolaan Bahan */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6 flex flex-col justify-between hover:border-purple-300 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-4 font-bold text-lg">
                📋
              </div>
              <h3 className="font-semibold text-zinc-900 text-lg">Kelola Bahan & Harga Banner</h3>
              <p className="text-zinc-500 text-sm mt-1">
                Tambah bahan baru, update harga per m², dan aktifkan/nonaktifkan bahan percetakan secara real-time.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <Link
                href="/materials"
                className="text-sm font-semibold text-purple-600 hover:text-purple-700"
              >
                Buka Pengelolaan Bahan &rarr;
              </Link>
              <span className="text-xs px-2 py-0.5 rounded font-medium bg-zinc-100 text-zinc-600">
                Fase 7
              </span>
            </div>
          </div>

          {/* Card 2: Pesanan Masuk */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6 flex flex-col justify-between hover:border-purple-300 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4 font-bold text-lg">
                🖨️
              </div>
              <h3 className="font-semibold text-zinc-900 text-lg">Daftar Pesanan Masuk</h3>
              <p className="text-zinc-500 text-sm mt-1">
                Tinjau spesifikasi ukuran banner, unduh file desain asli via signed URL privat, dan perbarui status produksi.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-400">
                Siap diimplementasikan
              </span>
              <span className="text-xs px-2 py-0.5 rounded font-medium bg-zinc-100 text-zinc-600">
                Fase 11
              </span>
            </div>
          </div>
        </div>

        {/* Panduan Penetapan Admin */}
        <div className="bg-zinc-100/70 rounded-xl border border-zinc-200 p-5 text-xs text-zinc-600">
          <p className="font-semibold text-zinc-800 mb-1">Catatan Keamanan Penetapan Role Admin:</p>
          <p>
            Sesuai aturan keamanan proyek (SRS & Project Plan), role admin <strong>tidak dapat diubah dari sisi browser/client</strong>.
            Penetapan role admin dilakukan langsung lewat Supabase Dashboard atau query terproteksi:
          </p>
          <code className="block mt-2 p-2 bg-white rounded border border-zinc-300 font-mono text-[11px] text-zinc-800">
            UPDATE public.profiles SET role = &apos;admin&apos; WHERE id = &apos;&lt;USER_UUID&gt;&apos;;
          </code>
        </div>
      </main>

      <Footer />
    </div>
  );
}

