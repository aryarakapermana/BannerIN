'use client'

import Image from 'next/image'
import Link from 'next/link'
import './landing.css'
import { useMemo, useState, useEffect } from 'react'
import { motion } from 'motion/react'
import SmoothScrollProvider from '@/components/animation/SmoothScrollProvider'
import WordRevealHeading from '@/components/animation/WordRevealHeading'
import { priceCalculator, BANNERIN_WHATSAPP } from '@/domain'
import { NumericInput } from '@/components/ui/NumericInput'

export type LandingMaterial = {
  id: string
  name: string
  badge: string
  weight: string
  forUse: string
  character: string
  finishing: string
  price: number
}

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const defaultMaterials: LandingMaterial[] = [
  {
    id: 'flexi-280',
    name: 'Flexi 280 gsm',
    badge: 'Pilihan ekonomis',
    weight: '280 gsm',
    forUse: 'Spanduk acara & promosi toko',
    character: 'Ringan, untuk kebutuhan promosi harian',
    finishing: 'Mata ayam · Lipat tepi',
    price: 20000,
  },
  {
    id: 'flexi-340',
    name: 'Flexi 340 gsm',
    badge: 'Lebih tebal',
    weight: '340 gsm',
    forUse: 'Banner dengan kebutuhan bahan lebih tebal',
    character: 'Bobot bahan lebih tinggi dibanding 280 gsm',
    finishing: 'Mata ayam · Lipat tepi',
    price: 28000,
  },
  {
    id: 'flexi-korea',
    name: 'Flexi Korea 440g',
    badge: 'Tahan lama outdoor',
    weight: '440 gsm',
    forUse: 'Promosi outdoor jangka panjang & billboard',
    character: 'Sangat tebal, serat rapat, tahan cuaca ekstrem',
    finishing: 'Mata ayam · Lipat tepi · Selongsong',
    price: 45000,
  },
  {
    id: 'albatros',
    name: 'Albatros',
    badge: 'Untuk dalam ruang',
    weight: '260 gsm',
    forUse: 'Roll banner, X-banner & materi pameran',
    character: 'Permukaan halus untuk tampilan visual tajam',
    finishing: 'Dudukan display · Laminasi',
    price: 65000,
  },
]

const products = [
  {
    id: 'banner-custom',
    category: 'banner',
    title: 'Banner custom',
    badge: 'Sesuai ukuranmu',
    subtitle: 'Promosi toko & acara',
    spec: 'Ukuran fleksibel',
    priceText: 'Rp20.000 / m²',
    image: '/images/landing/banner-custom.jpg',
    alt: 'Banner custom cetak digital printing untuk promosi toko & acara',
  },
  {
    id: 'roll-banner',
    category: 'banner',
    title: 'Roll banner',
    badge: 'Praktis dibawa',
    subtitle: 'Presentasi & pameran',
    spec: 'Contoh: 60 × 160 cm',
    priceText: 'Rp150.000 / set',
    image: '/images/landing/roll-banner.jpg',
    alt: 'Roll banner stand praktis untuk presentasi & pameran',
  },
  {
    id: 'x-banner',
    category: 'banner',
    title: 'X-banner',
    badge: 'Ringkas & ringan',
    subtitle: 'Promosi dalam ruang',
    spec: 'Contoh: 60 × 160 cm',
    priceText: 'Rp85.000 / set',
    image: '/images/landing/x-banner.jpg',
    alt: 'X-banner ringkas dan ringan untuk promosi dalam ruang',
  },
  {
    id: 'poster',
    category: 'poster',
    title: 'Poster',
    badge: 'Detail yang bercerita',
    subtitle: 'Dekorasi & informasi',
    spec: 'Contoh: ukuran A3',
    priceText: 'Rp15.000 / lembar',
    image:
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=700&q=80',
    alt: 'Poster promosi tertata rapi di dinding',
  },
]

const inspirations = [
  {
    tag: 'UNTUK USAHA',
    title: 'Sambut pelanggan dari depan.',
    desc: 'Banner custom untuk wajah baru tokomu.',
    image: '/images/landing/sambut-pelanggan.jpg',
    alt: 'Sambut pelanggan dari depan - Banner custom untuk wajah baru tokomu',
  },
  {
    tag: 'UNTUK ACARA',
    title: 'Jadikan acaramu lebih berkesan.',
    desc: 'Display yang menyalurkan identitas acara.',
    image: '/images/landing/jadikan-acaramu.jpg',
    alt: 'Jadikan acaramu lebih berkesan - Display yang menyalurkan identitas acara',
  },
  {
    tag: 'UNTUK PROMOSI',
    title: 'Penawaran yang sulit terlewat.',
    desc: 'Bawa pesan usahamu ke lebih banyak mata.',
    image: '/images/landing/penawaran-terlewat.jpg',
    alt: 'Penawaran yang sulit terlewat - Bawa pesan usahamu ke lebih banyak mata',
  },
]

const faqs = [
  {
    q: 'Bagaimana menentukan ukuran banner?',
    a: 'Ukur lebar dan tinggi area pemasangan dalam sentimeter, lalu masukkan ke kalkulator estimasi. Sisakan ruang untuk pemasangan dan finishing. Jika ragu, kirim ukuran serta foto lokasi saat konsultasi.',
  },
  {
    q: 'Apakah estimasi sudah termasuk ongkir?',
    a: 'Estimasi di kalkulator mencakup biaya cetak bahan dan luas banner. Ongkos kirim dan finishing khusus akan dikonfirmasi secara transparan sebelum Anda melakukan pembayaran.',
  },
  {
    q: 'Bisa pesan kalau belum punya desain?',
    a: 'Bisa! Anda dapat berkonsultasi dengan tim kami melalui tombol bantuan atau WhatsApp. Kami dapat membantu penataan teks dan aset siap cetak Anda.',
  },
  {
    q: 'Berapa lama proses cetaknya?',
    a: 'Setelah desain disetujui (ACC), proses cetak standar memakan waktu 1 hari kerja tergantung antrean produksi dan jumlah pesanan.',
  },
  {
    q: 'Bagaimana pesanan akan dikirim?',
    a: 'Pesanan dapat diambil langsung di percetakan atau dikirim menggunakan kurir instan (ojek online) maupun ekspedisi kargo untuk luar kota.',
  },
]

interface LandingClientProps {
  initialMaterials?: LandingMaterial[]
}

export default function LandingClient({ initialMaterials }: LandingClientProps) {
  const materials = useMemo(
    () => (initialMaterials && initialMaterials.length > 0 ? initialMaterials : defaultMaterials),
    [initialMaterials],
  )

  const [selectedProductTab, setSelectedProductTab] = useState<'all' | 'banner' | 'poster'>('all')
  const [calculatorMaterial, setCalculatorMaterial] = useState<LandingMaterial>(materials[0])
  const [width, setWidth] = useState<number | ''>(300)
  const [height, setHeight] = useState<number | ''>(100)
  const [quantity, setQuantity] = useState<number | ''>(1)
  const [finishing, setFinishing] = useState('Tanpa tambahan')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('')

  useEffect(() => {
    const handleScroll = () => {
      const sectionIds = ['produk', 'cara-pesan', 'bahan', 'panduan-berkas', 'faq']
      const scrollPosition = window.scrollY + 160

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const id = sectionIds[i]
        const el = document.getElementById(id)
        if (el) {
          const top = el.offsetTop
          const height = el.offsetHeight
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(id)
            return
          }
        }
      }
      if (window.scrollY < 300) {
        setActiveSection('')
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const numericWidth = width === '' ? 0 : width
  const numericHeight = height === '' ? 0 : height
  const numericQuantity = quantity === '' ? 0 : quantity

  const calculation = useMemo(() => {
    if (numericWidth <= 0 || numericHeight <= 0 || numericQuantity < 1) {
      return null
    }
    try {
      return priceCalculator.calculateBreakdown({
        widthCm: numericWidth,
        heightCm: numericHeight,
        pricePerSqm: calculatorMaterial?.price || 20000,
        quantity: numericQuantity,
      })
    } catch {
      return null
    }
  }, [numericWidth, numericHeight, calculatorMaterial, numericQuantity])

  const area = calculation?.areaSqm ?? Math.max(0, (numericWidth * numericHeight) / 10000)
  const estimatedTotal = calculation?.totalPrice ?? 0

  const filteredProducts = useMemo(() => {
    if (selectedProductTab === 'all') return products
    return products.filter((p) => p.category === selectedProductTab)
  }, [selectedProductTab])

  return (
    <SmoothScrollProvider>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Header / Navbar */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="relative size-10 shrink-0 overflow-hidden rounded-xl shadow-sm ring-1 ring-black/5">
              <Image
                src="/bannerku-logo.png"
                alt="Logo BannerIN"
                width={40}
                height={40}
                className="size-full object-cover"
                priority
              />
            </span>
            <span className="text-xl font-extrabold tracking-tight text-slate-950">
              Banner<span className="text-blue-600">IN</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Navigasi utama">
            <a
              href="#produk"
              onClick={() => setActiveSection('produk')}
              className={`nav-link ${activeSection === 'produk' ? 'active' : ''}`}
            >
              Produk
            </a>
            <Link href="/materials" className="nav-link">
              Katalog Bahan
            </Link>
            <a
              href="#cara-pesan"
              onClick={() => setActiveSection('cara-pesan')}
              className={`nav-link ${activeSection === 'cara-pesan' ? 'active' : ''}`}
            >
              Cara pesan
            </a>
            <a
              href="#panduan-berkas"
              onClick={() => setActiveSection('panduan-berkas')}
              className={`nav-link ${activeSection === 'panduan-berkas' ? 'active' : ''}`}
            >
              Panduan cetak
            </a>
            <a
              href="#faq"
              onClick={() => setActiveSection('faq')}
              className={`nav-link ${activeSection === 'faq' ? 'active' : ''}`}
            >
              Bantuan
            </a>
          </nav>

          <div className="hidden items-center gap-5 md:flex">
            <Link
              href="/login"
              className="text-sm font-bold text-slate-700 hover:text-blue-600 transition"
            >
              Masuk
            </Link>
            <Link href="/studio" className="btn-primary">
              Mulai pesanan
              <svg
                className="size-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          <button
            type="button"
            suppressHydrationWarning
            className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-700 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-100 bg-white px-5 py-4 shadow-xl md:hidden">
            <div className="flex flex-col gap-2">
              <a
                href="#produk"
                onClick={() => {
                  setActiveSection('produk')
                  setMobileMenuOpen(false)
                }}
                className={`rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  activeSection === 'produk'
                    ? 'bg-blue-50 text-blue-600 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Produk
              </a>
              <Link
                href="/materials"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Katalog Bahan
              </Link>
              <a
                href="#cara-pesan"
                onClick={() => {
                  setActiveSection('cara-pesan')
                  setMobileMenuOpen(false)
                }}
                className={`rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  activeSection === 'cara-pesan'
                    ? 'bg-blue-50 text-blue-600 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Cara pesan
              </a>
              <a
                href="#panduan-berkas"
                onClick={() => {
                  setActiveSection('panduan-berkas')
                  setMobileMenuOpen(false)
                }}
                className={`rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  activeSection === 'panduan-berkas'
                    ? 'bg-blue-50 text-blue-600 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Panduan cetak
              </a>
              <a
                href="#faq"
                onClick={() => {
                  setActiveSection('faq')
                  setMobileMenuOpen(false)
                }}
                className={`rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  activeSection === 'faq'
                    ? 'bg-blue-50 text-blue-600 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Bantuan
              </a>
              <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Masuk
                </Link>
                <Link
                  href="/studio"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary"
                >
                  Mulai pesanan
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden bg-white pb-16 pt-32 lg:pb-24 lg:pt-40">
        <div className="hero-grid absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700">
                <span className="size-2 rounded-full bg-blue-600 animate-pulse" />
                Percetakan online, untuk idemu.
              </div>

              <WordRevealHeading
                as="h1"
                className="text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl"
                wordsList={[
                  { text: 'Ide' },
                  { text: 'besar.' },
                  { text: '', isBreak: true },
                  { text: 'Cetak', className: 'text-blue-600' },
                  { text: 'jadi', className: 'text-blue-600' },
                  { text: 'nyata.', className: 'text-blue-600' },
                ]}
                immediate
                stagger={0.08}
              />

              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Banner untuk usaha, acara, dan segala rencanamu. Pilih produk, atur ukuran, lalu kirim
                desain. Mulai dari satu tempat: <span className="font-semibold text-slate-900">BannerIN</span>.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="/studio" className="btn-primary text-base px-6 py-3.5">
                  Pesan banner sekarang
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <a href="#kalkulator" className="btn-secondary text-base px-6 py-3.5">
                  <svg className="size-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="4" y="3" width="16" height="18" rx="2" strokeWidth={2} />
                    <line x1="8" y1="7" x2="16" y2="7" strokeWidth={2} />
                    <line x1="8" y1="11" x2="10" y2="11" strokeWidth={2} />
                    <line x1="14" y1="11" x2="16" y2="11" strokeWidth={2} />
                    <line x1="8" y1="15" x2="10" y2="15" strokeWidth={2} />
                    <line x1="14" y1="15" x2="16" y2="15" strokeWidth={2} />
                  </svg>
                  Hitung estimasi
                </a>
              </div>

              <p className="mt-4 text-xs font-medium text-slate-500">
                Belum punya desain? Kita cari solusinya bersama.
              </p>
            </div>

            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="relative rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xl shadow-blue-500/10"
              >
                <div className="overflow-hidden rounded-xl bg-slate-900 relative aspect-4/3 flex items-center justify-center p-6 text-white text-center">
                  <Image
                    src="/images/landing/banner-custom.jpg"
                    alt="Mockup cetak banner BannerIN"
                    fill
                    className="object-cover opacity-50"
                  />
                  <div className="relative z-10 space-y-2">
                    <span className="inline-block rounded-full bg-blue-600/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                      Idemu, dalam ukuran nyata
                    </span>
                    <h3 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                      IDE BESAR JADI NYATA
                    </h3>
                    <p className="text-xs text-slate-200">KREASI TANPA BATAS · MULAI SEKARANG</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3.5 text-xs text-slate-700">
                  <span className="grid size-6 place-items-center rounded-full bg-emerald-100 text-emerald-600 shrink-0">
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                  <div>
                    <strong className="block font-bold text-slate-900">Dari layar ke ruang usahamu.</strong>
                    <span className="text-slate-500">Banner cetak · Roll banner · Poster</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* 3 Value Props Bar */}
          <div className="mt-14 grid gap-4 border-t border-slate-100 pt-8 sm:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: 0.05 }}
              whileHover={{ y: -5, borderColor: '#93c5fd', transition: { duration: 0.2 } }}
              className="flex items-start gap-3.5 rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 transition-colors"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Ukuran sesuai kebutuhan</h4>
                <p className="mt-0.5 text-xs text-slate-500">Dari meja promosi hingga fasad toko.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: 0.15 }}
              whileHover={{ y: -5, borderColor: '#86efac', transition: { duration: 0.2 } }}
              className="flex items-start gap-3.5 rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 transition-colors"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Konfirmasi sebelum cetak</h4>
                <p className="mt-0.5 text-xs text-slate-500">Periksa detail pesanan dan desain.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: 0.25 }}
              whileHover={{ y: -5, borderColor: '#fde68a', transition: { duration: 0.2 } }}
              className="flex items-start gap-3.5 rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 transition-colors"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-600 shrink-0">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-.777-.777c.057-.597.234-1.222.518-1.808C3.805 16.74 3 14.496 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Bisa tanya, bisa dibantu</h4>
                <p className="mt-0.5 text-xs text-slate-500">Konsultasikan bahan dan berkasmu.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. Section Produk Cetak */}
      <section id="produk" className="scroll-mt-24 border-t border-slate-200/80 bg-slate-50 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div>
            <div className="mb-2.5">
              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-blue-600">
                PRODUK CETAK
              </span>
            </div>
            <WordRevealHeading
              as="h2"
              className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl"
              text="Ada cetakan untuk setiap rencana."
            />
            <p className="mt-3 max-w-2xl text-base sm:text-lg text-slate-600">
              Pilih bentuk yang tepat untuk pesan yang ingin kamu sampaikan.
            </p>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setSelectedProductTab('all')}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${selectedProductTab === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
            >
              Semua produk
            </button>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setSelectedProductTab('banner')}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${selectedProductTab === 'banner'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
            >
              Banner
            </button>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setSelectedProductTab('poster')}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${selectedProductTab === 'poster'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
            >
              Poster & lainnya
            </button>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((p, idx) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                whileHover={{
                  y: -8,
                  scale: 1.015,
                  boxShadow:
                    '0 20px 25px -5px rgba(37, 99, 235, 0.12), 0 8px 10px -6px rgba(37, 99, 235, 0.08)',
                  borderColor: '#93c5fd',
                  transition: { duration: 0.25 },
                }}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-slate-100">
                    <Image
                      src={p.image}
                      alt={p.alt}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold text-slate-800 shadow-sm backdrop-blur-sm">
                      {p.badge}
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-bold text-slate-950">{p.title}</h3>
                  <p className="text-xs text-slate-500">{p.subtitle}</p>

                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <span className="block text-[11px] text-slate-400">{p.spec}</span>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-[11px] text-slate-500">Estimasi mulai</span>
                      <strong className="text-sm font-extrabold text-slate-900">{p.priceText}</strong>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/studio?product=${p.id}`}
                  className="mt-4 inline-flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-blue-600 group-hover:text-blue-700"
                >
                  Pilih produk
                  <svg className="size-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                  </svg>
                </Link>
              </motion.div>
            ))}
          </div>

          <p className="mt-6 text-xs text-slate-400">
            * Harga di atas adalah ilustrasi estimasi awal. Harga bahan akurat diambil langsung dari basis data percetakan.
          </p>
        </div>
      </section>

      {/* 4. Section Kalkulator Rencanakan Anggaran (Membaca Bahan dari Database) */}
      <section id="kalkulator" className="scroll-mt-24 border-t border-slate-200/80 bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid items-start gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600 mb-4">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="4" y="3" width="16" height="18" rx="2" />
                  <line x1="8" y1="7" x2="16" y2="7" />
                  <line x1="8" y1="11" x2="10" y2="11" />
                  <line x1="14" y1="11" x2="16" y2="11" />
                  <line x1="8" y1="15" x2="10" y2="15" />
                  <line x1="14" y1="15" x2="16" y2="15" />
                </svg>
              </span>
              <div className="mb-2.5">
                <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-blue-600">
                  RENCANAKAN ANGGARAN
                </span>
              </div>
              <WordRevealHeading
                as="h2"
                className="text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl"
                wordsList={[
                  { text: 'Ukuranmu.' },
                  { text: '', isBreak: true },
                  { text: 'Estimasimu.' },
                ]}
              />
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600">
                Tak perlu menebak-nebak. Tarif bahan disinkronkan langsung dari basis data percetakan BannerIN untuk menjamin kepastian harga.
              </p>

              <div className="mt-8 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                <svg className="size-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <div>
                  <strong className="block text-slate-900">Ukur area pemasangan dalam sentimeter.</strong>
                  Bahan aktif dapat dicek lengkap pada{' '}
                  <Link href="/materials" className="font-bold text-blue-600 hover:underline">
                    Katalog Bahan
                  </Link>
                  .
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6 }}
                whileHover={{ boxShadow: '0 25px 35px -5px rgba(15, 23, 42, 0.08)' }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100 sm:p-8 transition-shadow"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="font-bold text-slate-900">Hitung kebutuhan cetak</h3>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-200">
                    HARGA DATABASE AKTIF
                  </span>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">Produk</label>
                    <select
                      suppressHydrationWarning
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      <option>Banner custom</option>
                      <option>Roll banner</option>
                      <option>X-banner</option>
                      <option>Poster</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700">Lebar (cm)</label>
                      <div className="relative mt-1.5">
                        <NumericInput
                          placeholder="300"
                          value={width}
                          onValueChange={setWidth}
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 pr-10 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                          cm
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700">Tinggi (cm)</label>
                      <div className="relative mt-1.5">
                        <NumericInput
                          placeholder="100"
                          value={height}
                          onValueChange={setHeight}
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 pr-10 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                          cm
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700">Pilihan Bahan (Dari Database)</label>
                      <select
                        suppressHydrationWarning
                        value={calculatorMaterial?.id || ''}
                        onChange={(e) => {
                          const m = materials.find((item) => item.id === e.target.value)
                          if (m) setCalculatorMaterial(m)
                        }}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      >
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({rupiah.format(m.price)}/m²)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700">Jumlah (pcs)</label>
                      <NumericInput
                        placeholder="1"
                        value={quantity}
                        onValueChange={setQuantity}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700">Finishing</label>
                    <select
                      suppressHydrationWarning
                      value={finishing}
                      onChange={(e) => setFinishing(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      <option>Tanpa tambahan</option>
                      <option>Mata ayam di setiap sudut</option>
                      <option>Mata ayam keliling (tiap 1m)</option>
                      <option>Selongsong atas-bawah</option>
                      <option>Lipat tepi rapi</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Luas cetak: {area.toFixed(2)} m²
                    </span>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-5">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-500">Estimasi awal cetak</span>
                      <div className="text-3xl font-black text-slate-950">
                        {rupiah.format(estimatedTotal)}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-slate-400">
                      {area.toFixed(2)} m² × {rupiah.format(calculatorMaterial?.price || 20000)} × {numericQuantity} pcs
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                    Rumus: luas (m²) × harga bahan/m² × jumlah. Belum termasuk ongkos kirim.
                  </p>

                  <Link
                    href={`/studio?material=${calculatorMaterial?.id}&width=${numericWidth > 0 ? numericWidth : 300}&height=${numericHeight > 0 ? numericHeight : 100}&qty=${numericQuantity >= 1 ? numericQuantity : 1}`}
                    className="btn-accent mt-5 w-full justify-center text-center font-bold"
                  >
                    Lanjutkan ke Studio
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Section Cara Pesan */}
      <section id="cara-pesan" className="scroll-mt-24 border-t border-slate-200/80 bg-slate-50 py-14 sm:py-18 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="mb-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700 border border-blue-200/60 uppercase tracking-wider">
                  <span className="size-1.5 rounded-full bg-blue-600 animate-pulse" />
                  CARA PESAN
                </span>
              </div>
              <WordRevealHeading
                as="h2"
                className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950"
                text="Dari klik pertama, sampai siap dipasang."
              />
              <p className="mt-2.5 max-w-2xl text-xs sm:text-sm lg:text-base text-slate-600">
                4 langkah mudah mencetak banner tanpa harus buang waktu datang ke toko fisik.
              </p>
            </div>
            <Link href="/studio" className="btn-primary text-xs w-fit shrink-0">
              Mulai Pesan Sekarang ↗
            </Link>
          </div>

          <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: 0.05 }}
              whileHover={{
                y: -8,
                scale: 1.015,
                borderColor: '#60a5fa',
                boxShadow: '0 20px 25px -5px rgba(37, 99, 235, 0.12)',
                transition: { duration: 0.25 },
              }}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-3 py-1 text-xs font-mono font-bold text-white shadow-xs">
                    01
                  </span>
                  <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                    </svg>
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Pilih & sesuaikan
                </h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                  Tentukan jenis produk, masukkan ukuran panjang × tinggi (cm), pilih bahan cetak (Flexi/Albatros), dan jenis finishing.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span>Langkah 1 dari 4</span>
                <span className="text-blue-600 font-bold">Kalkulator Instant</span>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: 0.12 }}
              whileHover={{
                y: -8,
                scale: 1.015,
                borderColor: '#60a5fa',
                boxShadow: '0 20px 25px -5px rgba(37, 99, 235, 0.12)',
                transition: { duration: 0.25 },
              }}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-3 py-1 text-xs font-mono font-bold text-white shadow-xs">
                    02
                  </span>
                  <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Kirim desainmu
                </h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                  Unggah berkas siap cetak (PDF, TIFF, atau JPG) di Studio, atau konsultasikan kebutuhan desain Anda dengan desainer kami.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span>Langkah 2 dari 4</span>
                <span className="text-blue-600 font-bold">Pre-flight Otomatis</span>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: 0.19 }}
              whileHover={{
                y: -8,
                scale: 1.015,
                borderColor: '#60a5fa',
                boxShadow: '0 20px 25px -5px rgba(37, 99, 235, 0.12)',
                transition: { duration: 0.25 },
              }}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-3 py-1 text-xs font-mono font-bold text-white shadow-xs">
                    03
                  </span>
                  <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75V6.75ZM6.75 16.5h.75v.75h-.75V16.5ZM16.5 6.75h.75v.75h-.75V6.75ZM13.5 13.5h2.25v2.25H13.5V13.5ZM18 13.5h2.25v2.25H18V13.5ZM13.5 18h2.25v2.25H13.5V18ZM18 18h2.25v2.25H18V18Z" />
                    </svg>
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Periksa & bayar QRIS
                </h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                  Pratinjau visual banner, cek rincian biaya yang transparan, dan lakukan pembayaran instan via QRIS semua bank/e-wallet.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span>Langkah 3 dari 4</span>
                <span className="text-blue-600 font-bold">Bayar Aman QRIS</span>
              </div>
            </motion.div>

            {/* Step 4 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: 0.26 }}
              whileHover={{
                y: -8,
                scale: 1.015,
                borderColor: '#60a5fa',
                boxShadow: '0 20px 25px -5px rgba(37, 99, 235, 0.12)',
                transition: { duration: 0.25 },
              }}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-3 py-1 text-xs font-mono font-bold text-white shadow-xs">
                    04
                  </span>
                  <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V3.75A1.125 1.125 0 0 0 13.125 2.625H4.125C3.504 2.625 3 3.129 3 3.75v10.5m10.125-3.375h4.125" />
                    </svg>
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Cetak kilat & kirim
                </h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                  Pesanan langsung diproses mesin berkapasitas tinggi, dipasang mata ayam/finishing, lalu dikirim sampai ke alamat tujuan.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span>Langkah 4 dari 4</span>
                <span className="text-emerald-600 font-bold">1 Hari Jadi</span>
              </div>
            </motion.div>
          </div>

          {/* Quick Help & Guidance Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ borderColor: '#93c5fd', transition: { duration: 0.2 } }}
            className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 sm:p-6 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                </svg>
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-950">Punya pertanyaan seputar ukuran atau bahan?</h4>
                <p className="text-xs text-slate-600">Tim kami siap membantu merekomendasikan bahan paling pas untuk lokasi pemasangan Anda.</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
              <a
                href={`${BANNERIN_WHATSAPP.baseUrl}?text=Halo%20BannerIN%2C%20saya%20ingin%20tanya%20tentang%20cara%20pemesanan.`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary w-full sm:w-auto text-center justify-center text-xs"
              >
                Tanya WhatsApp
              </a>
              <Link href="/studio" className="btn-primary w-full sm:w-auto text-center justify-center text-xs">
                Mulai Pesanan ↗
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 6. Section Kenali Bahannya (Data Dinamis Database) */}
      <section id="bahan" className="scroll-mt-24 border-t border-slate-200/80 bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2.5">
                <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-blue-600">
                  KENALI BAHANNYA
                </span>
              </div>
              <WordRevealHeading
                as="h2"
                className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl"
                text="Bahan tepat. Pesan lebih terlihat."
              />
              <p className="mt-3 max-w-2xl text-base sm:text-lg text-slate-600">
                Tarif resmi disinkronkan langsung dari basis data percetakan BannerIN.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/materials" className="btn-primary text-xs">
                Buka Katalog Lengkap ↗
              </Link>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.5 }}
            className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
                  <tr>
                    <th className="px-6 py-4">Bahan</th>
                    <th className="px-6 py-4">Tarif / m²</th>
                    <th className="px-6 py-4">Cocok untuk</th>
                    <th className="px-6 py-4">Opsi finishing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {materials.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-5">
                        <strong className="block text-sm font-bold text-slate-900">{m.name}</strong>
                        <span className="mt-1 inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          {m.badge}
                        </span>
                      </td>
                      <td className="px-6 py-5 font-bold font-mono text-blue-600">
                        {rupiah.format(m.price)}
                      </td>
                      <td className="px-6 py-5">{m.forUse}</td>
                      <td className="px-6 py-5">{m.finishing}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 7. Section Ide Untuk Cetakanmu */}
      <section className="border-t border-slate-200/80 bg-slate-50 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div>
            <div className="mb-2.5">
              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-blue-600">
                IDE UNTUK CETAKANMU
              </span>
            </div>
            <WordRevealHeading
              as="h2"
              className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl"
              text="Kecil usahanya. Besar kesannya."
            />
            <p className="mt-3 max-w-2xl text-base sm:text-lg text-slate-600">
              Inspirasi visual untuk promosi, ruang usaha, dan momen yang kamu rencanakan.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {inspirations.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -8, scale: 1.015, borderColor: '#93c5fd', transition: { duration: 0.25 } }}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-slate-100">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                  <span className="absolute left-2.5 top-2.5 rounded-full bg-slate-900/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                    {item.tag}
                  </span>
                </div>
                <h3 className="mt-4 flex items-center justify-between text-sm font-bold text-slate-900">
                  {item.title}
                  <svg className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                  </svg>
                </h3>
                <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Section Panduan Cetak & Berkas */}
      <section id="panduan-berkas" className="scroll-mt-24 border-t border-slate-200/80 bg-slate-50 py-14 sm:py-18 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl bg-slate-950 p-6 sm:p-10 lg:p-14 text-white shadow-2xl relative">
            {/* Ambient glow */}
            <div className="absolute right-0 top-0 size-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute left-0 bottom-0 size-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid gap-10 lg:grid-cols-12 lg:gap-12 items-center">
              {/* Kolom Kiri: Pengantar & CTA */}
              <div className="lg:col-span-5 flex flex-col justify-between">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3.5 py-1 text-xs font-bold text-blue-300">
                    <span className="size-1.5 rounded-full bg-blue-400 animate-pulse" />
                    PANDUAN CETAK & BERKAS
                  </span>
                  <WordRevealHeading
                    as="h2"
                    className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-white"
                    wordsList={[
                      { text: 'Desain' },
                      { text: 'siap?' },
                      { text: '', isBreak: true },
                      { text: 'Kita', className: 'text-blue-400' },
                      { text: 'lanjut', className: 'text-blue-400' },
                      { text: 'cetak', className: 'text-blue-400' },
                      { text: 'sempurna.', className: 'text-blue-400' },
                    ]}
                  />
                  <p className="mt-4 text-xs sm:text-sm leading-relaxed text-slate-300">
                    Kualitas cetakan spanduk Anda sangat dipengaruhi oleh kesiapan berkas desain. Pastikan 4 aspek teknis di samping terpenuhi agar hasil cetak tajam, warna akurat, dan tidak terpotong.
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <Link
                      href="/studio"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-500 transition"
                    >
                      Buka Studio Desain
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                    <a
                      href={`${BANNERIN_WHATSAPP.baseUrl}?text=Halo%20BannerIN%2C%20saya%20ingin%20konsultasi%20berkas%20desain%20cetak.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-5 py-3 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition"
                    >
                      <svg className="size-4 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                      </svg>
                      Konsultasi Gratis
                    </a>
                  </div>
                  <p className="mt-3 text-[11px] text-slate-400">
                    Belum punya desain siap cetak? Tim kami siap membantu layout dan penataan materi Anda.
                  </p>
                </div>
              </div>

              {/* Kolom Kanan: 4 Kartu Spesifikasi Teknis Responsif */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Format Berkas */}
                <motion.div
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.5, delay: 0.05 }}
                  whileHover={{ y: -6, borderColor: 'rgba(59, 130, 246, 0.6)', transition: { duration: 0.2 } }}
                  className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur-xs transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid size-9 place-items-center rounded-xl bg-blue-500/20 text-blue-400">
                      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </span>
                    <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-400 border border-blue-400/20">
                      Format Utama
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-white">Format Berkas</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                    Disarankan <strong className="text-white">PDF</strong>, <strong className="text-white">TIFF</strong>, atau <strong className="text-white">JPG</strong> kualitas tinggi. Pastikan font sudah di-<em>convert to curves/outlines</em>.
                  </p>
                </motion.div>

                {/* 2. Resolusi & Skala */}
                <motion.div
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.5, delay: 0.12 }}
                  whileHover={{ y: -6, borderColor: 'rgba(245, 158, 11, 0.6)', transition: { duration: 0.2 } }}
                  className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur-xs transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid size-9 place-items-center rounded-xl bg-amber-500/20 text-amber-400">
                      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
                      </svg>
                    </span>
                    <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400 border border-amber-400/20">
                      150 - 300 DPI
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-white">Resolusi & Skala</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                    Gunakan skala 1:1 dengan resolusi <strong className="text-white">150–300 DPI</strong>. Untuk spanduk sangat besar (&gt;5m), dapat menggunakan skala 1:10 pada 300 DPI.
                  </p>
                </motion.div>

                {/* 3. Mode Warna */}
                <motion.div
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.5, delay: 0.19 }}
                  whileHover={{ y: -6, borderColor: 'rgba(16, 185, 129, 0.6)', transition: { duration: 0.2 } }}
                  className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur-xs transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400">
                      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072" />
                      </svg>
                    </span>
                    <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 border border-emerald-400/20">
                      Mode CMYK
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-white">Profil Warna CMYK</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                    Gunakan color mode <strong className="text-white">CMYK</strong>. Warna RGB layar HP/monitor dapat mengalami pergeseran tone saat dikonversi ke tinta cetak fisik.
                  </p>
                </motion.div>

                {/* 4. Area Aman & Bleed */}
                <motion.div
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.5, delay: 0.26 }}
                  whileHover={{ y: -6, borderColor: 'rgba(168, 85, 247, 0.6)', transition: { duration: 0.2 } }}
                  className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur-xs transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid size-9 place-items-center rounded-xl bg-purple-500/20 text-purple-400">
                      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                      </svg>
                    </span>
                    <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-purple-400 border border-purple-400/20">
                      Margin 3-5 cm
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-white">Area Aman & Bleed</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                    Beri jarak aman minimal <strong className="text-white">3–5 cm</strong> dari tepi kanvas untuk teks dan logo penting agar tidak terpotong atau tertusuk ring mata ayam.
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FAQ Section */}
      <section id="faq" className="scroll-mt-24 border-t border-slate-200/80 bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-4xl px-5 lg:px-8">
          <div className="text-center">
            <div className="mb-2.5">
              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-blue-600">
                BANTUAN & PERTANYAAN
              </span>
            </div>
            <WordRevealHeading
              as="h2"
              className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl"
              text="Pertanyaan yang sering ditanyakan."
            />
          </div>

          <div className="mt-10 space-y-3">
            {faqs.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                whileHover={{ borderColor: '#93c5fd', transition: { duration: 0.2 } }}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors"
              >
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-slate-900 transition hover:bg-slate-50"
                >
                  <span>{faq.q}</span>
                  <span className="text-blue-600 text-lg font-mono">
                    {openFaq === idx ? '−' : '+'}
                  </span>
                </button>
                {openFaq === idx && (
                  <div className="border-t border-slate-100 p-5 pt-3 text-xs leading-relaxed text-slate-600">
                    {faq.a}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10 sm:py-12 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-5 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 text-center sm:text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-950">BannerIN</span>
              <span>·</span>
              <span>Percetakan Banner Custom Online</span>
            </div>
            <span className="hidden sm:inline text-slate-300">·</span>
            <span suppressHydrationWarning className="text-slate-400">
              &copy; {new Date().getFullYear()} Arya Raka Permana All rights reserved.
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link href="/materials" className="hover:text-blue-600">
              Katalog Bahan
            </Link>
            <Link href="/studio" className="hover:text-blue-600">
              Studio Pemesanan
            </Link>
            <a href="#panduan-berkas" className="hover:text-blue-600">
              Panduan Cetak
            </a>
            <Link href="/login" className="hover:text-blue-600">
              Admin Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  </SmoothScrollProvider>
)
}

