# Dokumen Analisis & Perancangan Sistem Informasi (APSI)
## Proyek: Sistem Informasi Pemesanan Banner Online (BannerIN)
### Arsitektur Sistem: Hybrid Guest Checkout, Fabric.js Canvas Studio, & Server-Authoritative

---

### 1. Gambaran Umum & Deskripsi Sistem
**BannerIN** adalah sistem informasi berbasis web yang dirancang untuk mengotomatisasi seluruh alur bisnis percetakan banner digital printing, mulai dari katalog bahan, kalkulasi luas dan harga interaktif, kustomisasi kanvas desain secara real-time, transaksi pembayaran QRIS statis, hingga pelacakan status produksi dan manajemen pesanan back-office oleh administrator.

#### 1.1 Masalah pada Sistem Konvensional
1. **Komunikasi Berulang:** Konsumen dan staf percetakan sering terjebak dalam chat manual mengenai estimasi harga berdasarkan ukuran custom ($P \times L$) dan jenis bahan.
2. **Kesesuaian Rasio & Margin Cetak:** Konsumen sering mengirimkan desain tanpa memahami rasio banner sesungguhnya, risiko terpotong pada garis lipat (*margin finishing*), atau posisi mata ayam (*grommet*).
3. **Friksi Pendaftaran Akun (Cart Abandonment):** Pada percetakan kilat, mewajibkan pelanggan mendaftar dan verifikasi email sebelum memesan menyebabkan *drop-off* calon pelanggan hingga 40%.
4. **Pencatatan Manual:** Antrean pesanan rentan hilang atau tertukar tanpa sistem invoice unik dan pencatatan status produksi terpusat.

#### 1.2 Solusi BannerIN
- **Automated Price Calculator:** Menghitung luas $\text{m}^2 = \frac{\text{lebar}}{100} \times \frac{\text{tinggi}}{100}$ dan total harga secara presisi berbasis tarif bahan real-time dari database.
- **Interactive Fabric.js Canvas Studio:** Memproyeksikan kanvas kerja sesuai rasio nyata ($P:L$), dilengkapi garis potong aman (*safe zone*) dan preview mata ayam.
- **Model Hybrid Guest Checkout:** Pengunjung dapat langsung mendesain dan memesan tanpa login (*guest checkout*) dengan pelacakan instan via *secure tracking token*, sementara pelanggan terdaftar tetap dapat login untuk mengelola riwayat pesanan terpusat di dashboard.
- **Role-Based Access Control (RBAC):** Pemisahan hak akses antara Konsumen (katalog, studio, checkout, invoice, pelacakan) dan Admin (full CRUD pesanan, konfirmasi pembayaran, download berkas resolusi asli, manajemen bahan).

---

### 2. Aktor Sistem
1. **Pengunjung / Konsumen Tamu (Guest Customer):**
   Pengguna publik tanpa akun yang dapat mengeksplorasi katalog bahan, menghitung tarif, mendesain spanduk di Studio Fabric.js, melakukan checkout cepat dengan menginput nama & WhatsApp, mengunggah bukti bayar QRIS, dan menerima tautan pelacakan instan (*tracking token*) untuk memantau status pengerjaan pesanan tanpa harus login.
2. **Konsumen Terdaftar (Registered Customer):**
   Pengguna yang memiliki akun terverifikasi. Seluruh pesanan otomatis terhubung ke `customer_id` mereka dan tersimpan permanen di *Customer Dashboard* (`/customer/dashboard`) untuk pemesanan berulang, cetak ulang invoice, dan riwayat transaksi multi-pesanan.
3. **Administrator:**
   Pengelola percetakan yang memiliki hak akses penuh ke Admin Portal (`/dashboard`). Bertugas memverifikasi bukti pembayaran (baik dari tamu maupun konsumen terdaftar), memperbarui status pengerjaan pesanan (*pending* $\to$ *confirmed* $\to$ *processing* $\to$ *completed*), mengunduh file desain asli resolusi tinggi untuk dicetak ke mesin, serta mengelola katalog bahan dan tarif per $\text{m}^2$.

---

### 3. Use Case Diagram

```mermaid
flowchart LR
    Guest((Konsumen Tamu))
    Customer((Konsumen Terdaftar))
    Admin((Administrator))

    subgraph "Sistem Informasi BannerIN (Model Hybrid)"
        UC1["1. Registrasi & Aktivasi Akun"]
        UC2["2. Autentikasi / Login"]
        UC3["3. Eksplorasi Katalog & Kalkulasi Harga"]
        UC4["4. Unggah & Kustomisasi Desain (Studio Fabric.js)"]
        UC5["5. Checkout Cepat (Guest Checkout)"]
        UC6["6. Checkout Akun Terdaftar"]
        UC7["7. Pelacakan Pesanan via Token (#BK)"]
        UC8["8. Portal Riwayat Pesanan Konsumen"]
        UC9["9. Cetak Invoice Transaksi"]

        UC10["10. Verifikasi Bukti Pembayaran (Semua Pesanan)"]
        UC11["11. Perbarui Status Produksi Pesanan"]
        UC12["12. Unduh Berkas Desain Asli (Signed URL)"]
        UC13["13. Manajemen Pesanan Manual (Admin CRUD)"]
        UC14["14. Manajemen Katalog & Tarif Bahan (CRUD)"]
    end

    Guest --> UC3
    Guest --> UC4
    Guest --> UC5
    Guest --> UC7
    Guest --> UC9

    Customer --> UC1
    Customer --> UC2
    Customer --> UC3
    Customer --> UC4
    Customer --> UC6
    Customer --> UC7
    Customer --> UC8
    Customer --> UC9

    Admin --> UC2
    Admin --> UC10
    Admin --> UC11
    Admin --> UC12
    Admin --> UC13
    Admin --> UC14
```

#### Deskripsi Spesifikasi Use Case Utama:
* **UC-04 (Kustomisasi Desain):** Pengguna (tamu maupun terdaftar) mengunggah file JPG/PNG (maks 20 MB). Sistem memvalidasi *magic bytes* biner file, menyimpannya di Supabase Storage privat (folder `guest/` untuk tamu atau `{user_id}/` untuk akun terdaftar), lalu merender kanvas Fabric.js sesuai rasio dimensi banner.
* **UC-05 & UC-06 (Checkout Hybrid):**
  - **Tamu:** Mengisi nama dan WhatsApp, mentransfer ke QRIS toko, mengunggah bukti bayar, dan sistem menerbitkan pesanan dengan `customer_id: null` serta `tracking_token` ber-entropi tinggi.
  - **Terdaftar:** Data nama dan WhatsApp terisi otomatis dari profil, pesanan otomatis dikaitkan ke `customer_id` pengguna untuk tampil di riwayat akun.
* **UC-07 (Pelacakan via Token / Akun):** Pelacakan pesanan dapat diakses melalui `/customer/orders/[id]?token=[tracking_token]` bagi tamu tanpa login, atau secara langsung via dashboard bagi pengguna login.
* **UC-10 s/d UC-12 (Operasional Produksi):** Admin meninjau preview bukti bayar tamu dan terdaftar, mengunduh file desain resolusi asli melalui *Signed URL* privat berbatas waktu 1 jam, lalu memajukan status pesanan hingga *completed*.

---

### 4. Activity Diagram

#### 4.1 Activity Diagram: Alur Pemesanan Banner (Hybrid Guest & Member)
```mermaid
flowchart TD
    Start([Mulai]) --> A1[Pilih Jenis Bahan & Masukkan Dimensi P x L cm]
    A1 --> A2[Sistem Hitung Luas m2 & Total Biaya Real-time]
    A2 --> A3[Buka Studio Fabric.js & Unggah File Desain]
    A3 --> A4{Validasi Biner & Magic Bytes?}
    A4 -- Tidak Valid --> A5[Tampilkan Pesan Error Format/Ukuran File]
    A5 --> A3
    A4 -- Valid --> A6[Atur Posisi & Skala Desain di Kanvas Interaktif]
    A6 --> A7[Klik 'Lanjut ke Pembayaran']
    A7 --> A8{Punya Akun / Ingin Login?}
    
    A8 -- Ya (Member) --> A9[Login Akun & Prefill Data Profil]
    A8 -- Tidak (Guest) --> A10[Isi Nama Pemesan & Nomor WhatsApp]
    
    A9 --> A11[Tinjau Rincian Pesanan & Pindai QRIS Statis Toko]
    A10 --> A11
    
    A11 --> A12[Unggah Foto Bukti Transfer QRIS]
    A12 --> A13[Server Hitung Ulang Harga & Buat Nomor Pesanan #BK]
    
    A13 --> A14{Pesanan Tamu atau Member?}
    A14 -- Tamu (Guest) --> A15[Generate Tracking Token & Berikan Link Lacak Instan]
    A14 -- Member --> A16[Tautkan ke customer_id & Simpan ke Riwayat Dashboard]
    
    A15 --> A17[Tampilkan Halaman Sukses & Status Stepper 4 Tahap]
    A16 --> A17
    A17 --> End([Selesai])
```

#### 4.2 Activity Diagram: Alur Pemrosesan Pesanan oleh Administrator
```mermaid
flowchart TD
    StartAdmin([Mulai]) --> B1[Login Administrator]
    B1 --> B2[Akses Admin Dashboard /dashboard]
    B2 --> B3[Filter Pesanan 'Perlu Konfirmasi' (Tamu & Member)]
    B3 --> B4[Buka Modal Detail Pesanan & Tinjau Bukti Bayar]
    B4 --> B5{Bukti Transfer Valid?}
    B5 -- Tidak Sah / Ditolak --> B6[Ubah Status Menjadi 'cancelled']
    B5 -- Sah --> B7[Ubah Status Menjadi 'confirmed']
    B7 --> B8[Unduh File Desain Resolusi Asli via Signed URL]
    B8 --> B9[Kirim Berkas ke Mesin Cetak & Ubah Status ke 'processing']
    B9 --> B10[Banner Selesai Dicetak, Ubah Status ke 'completed']
    B6 --> EndAdmin([Selesai])
    B10 --> EndAdmin
```

---

### 5. Class Diagram (Arsitektur Perangkat Lunak)

Sistem menerapkan pemisahan tugas (*Separation of Concerns*) antara *Domain Entity*, *Domain Service*, dan *Presentation Layer*:

```mermaid
classDiagram
    class Banner {
        -number _widthCm
        -number _heightCm
        -number _quantity
        -number _pricePerSqm
        +widthCm number
        +heightCm number
        +quantity number
        +pricePerSqm number
        +calculateAreaSqm() number
        +calculateSubtotal() number
        +getAspectRatio() number
        +getOrientation() string
        +validate() void
    }

    class IPriceCalculator {
        <<interface>>
        +calculate(banner: Banner) PriceCalculationResult
        +calculateBreakdown(params) PriceBreakdown
    }

    class PriceCalculator {
        +calculate(banner: Banner) PriceCalculationResult
        +calculateBreakdown(params) PriceBreakdown
    }

    class Design {
        -string _id
        -string _customerId (nullable)
        -string _originalFilePath
        -string _fileType
        -object _editorConfig
        +customerId string
        +toInsertPayload() object
        +validate() void
    }

    class ImageFileValidator {
        +validateBuffer(file, bytes, policy) ValidationResult
        +detectImageFormatByMagicBytes(bytes) string
        +sanitizeFileBase(name, fallback) string
    }

    class Order {
        -string _id
        -string _customerId (nullable)
        -string _trackingToken (nullable)
        -string _customerName
        -string _whatsappNumber
        -number _totalPrice
        -string _status
        -string _paymentProofPath
        +isOwnedBy(userId: string) boolean
        +validatePaymentProofPath(customerId, path) string
        +getCustomerStatusMeta(status) StatusMeta
        +formatOrderNumber(id: string) string
        +toInsertPayload() OrderInsertPayload
    }

    class OrderService {
        +buildAuthoritativeQuote(material, w, h, qty) QuoteResult
        +prepareOrder(input: CreateAuthoritativeOrderInput) Order
        +buildPaymentProofStoragePath(customerId, fileName, mime) string
    }

    class DesignEditorService {
        +buildStoragePaths(customerId, fileName, mime) StoragePaths
        +computeCanvasDimensions(w, h) CanvasDimensionResult
        +normalizeEditorConfig(input) EditorConfig
    }

    IPriceCalculator <|.. PriceCalculator : implements
    PriceCalculator ..> Banner : uses
    OrderService ..> Order : instantiates
    OrderService ..> Banner : calculates
    OrderService ..> IPriceCalculator : calculates
    Order ..> Design : references
    Design ..> ImageFileValidator : validated by
    DesignEditorService ..> Design : configures
```

---

### 6. Arsitektur Sistem (Layered Architecture)
1. **Presentation Layer (Frontend):** Next.js 16 App Router, React 19, Tailwind CSS v4, Fabric.js v7 canvas rendering engine.
2. **Application / Action Layer (Server Actions & Route Handlers):** Menjalankan validasi input, autentikasi sesi via `@supabase/ssr`, pemanggilan *Domain Service*, dan proteksi rute di Next.js Middleware. Mendukung aliran otentikasi hybrid (Guest Token + Session Cookie).
3. **Domain Layer (Business Logic OOP):** Model entitas murni TypeScript (`Banner`, `Order`, `Design`, `PriceCalculator`, `DesignEditorService`, `OrderService`) tanpa dependensi langsung ke framework atau database.
4. **Data Persistence & Security Layer:** Supabase Cloud PostgreSQL, Row Level Security (RLS) Hybrid (`customer_id IS NULL OR customer_id = auth.uid()`), dan Supabase Storage buckets privat dengan proteksi enkripsi dan Signed URL.
5. **Quality Assurance:** Didukung **70 pengujian otomatis unit & integrasi (100% PASS)** yang memvalidasi seluruh skenario fungsional sistem.
