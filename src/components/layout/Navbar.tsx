import Link from "next/link";
import Image from "next/image";
import { getCurrentProfile } from "@/lib/auth";
import { logoutAction } from "@/app/(auth)/actions";

export async function Navbar() {
  const profile = await getCurrentProfile();

  return (
    <header className="border-b border-zinc-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm border border-zinc-200 transition-transform group-hover:scale-105">
                <Image
                  src="/logo.png"
                  alt="BannerKu Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              <span className="text-2xl font-black tracking-tight text-blue-600">
                Banner<span className="text-amber-500">Ku</span>
              </span>
            </Link>
            <span className="hidden sm:inline-block text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
              Layanan Cetak Banner
            </span>
          </div>

          {/* Navigasi Utama */}
          <nav className="flex items-center space-x-4 sm:space-x-6 text-sm font-medium">
            <Link
              href="/"
              className="text-zinc-600 hover:text-blue-600 transition-colors"
            >
              Beranda
            </Link>
            <Link
              href="/materials"
              className="text-zinc-600 hover:text-blue-600 transition-colors"
            >
              Katalog Bahan
            </Link>

            {profile ? (
              <div className="flex items-center space-x-3 border-l border-zinc-200 pl-4 sm:pl-6">
                <Link
                  href={
                    profile.role === "admin"
                      ? "/admin/dashboard"
                      : "/customer/dashboard"
                  }
                  className="flex items-center space-x-2 text-zinc-900 font-semibold hover:text-blue-600 transition-colors"
                >
                  <span className="truncate max-w-[120px] sm:max-w-[160px]">
                    {profile.full_name || "Akun Saya"}
                  </span>
                  <span
                    className={`text-[11px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                      profile.role === "admin"
                        ? "bg-purple-100 text-purple-700 border border-purple-200"
                        : "bg-blue-100 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {profile.role}
                  </span>
                </Link>

                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="text-xs px-3 py-1.5 rounded-md border border-zinc-300 text-zinc-600 hover:bg-zinc-50 hover:text-red-600 hover:border-red-200 transition-colors"
                  >
                    Keluar
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center space-x-2 border-l border-zinc-200 pl-4 sm:pl-6">
                <Link
                  href="/login"
                  className="text-zinc-700 hover:text-blue-600 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 text-sm font-semibold rounded-md shadow-sm transition-colors"
                >
                  Daftar
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

