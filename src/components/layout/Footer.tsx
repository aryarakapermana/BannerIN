import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
          <div>
            <p suppressHydrationWarning className="font-semibold text-zinc-700">
              BannerIN &copy; {new Date().getFullYear()} Arya Raka Permana All rights reserved.
            </p>
            <p>
              Platform Layanan Pemesanan Banner Online (Proyek Sistem Informasi)
            </p>
          </div>
          <div className="flex space-x-6">
            <Link href="/materials" className="hover:text-blue-600 transition-colors">
              Bahan & Tarif
            </Link>
            <Link href="/login" className="hover:text-blue-600 transition-colors">
              Area Konsumen
            </Link>
            <Link href="/admin/dashboard" className="hover:text-purple-600 transition-colors">
              Area Administrator
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

