# Dokumen Analisis & Perancangan Sistem Informasi (APSI)
## Proyek: Sistem Informasi Pemesanan Banner Online (BannerIN)

---

### 1. Gambaran Umum & Deskripsi Sistem
**BannerIN** adalah sistem informasi berbasis web yang dirancang untuk mengotomatisasi seluruh alur bisnis percetakan banner digital printing, mulai dari katalog bahan, kalkulasi luas dan harga interaktif, kustomisasi kanvas desain secara real-time, transaksi pembayaran QRIS statis, hingga pelacakan status produksi dan manajemen pesanan back-office oleh administrator.

#### 1.1 Masalah pada Sistem Konvensional
1. **Komunikasi Berulang:** Konsumen dan staf percetakan sering terjebak dalam chat manual mengenai estimasi harga berdasarkan ukuran custom ($P \times L$) dan jenis bahan.
2. **Kesesuaian Rasio & Margin Cetak:** Konsumen sering mengirimkan desain tanpa memahami rasio banner sesungguhnya, risiko terpotong pada garis lipat (*margin finishing*), atau posisi mata ayam (*grommet*).
3. **Pencatatan Manual:** Antrean pesanan rentan hilang atau tertukar tanpa sistem invoice unik dan pencatatan status produksi terpusat.

#### 1.2 Solusi BannerIN
- **Automated Price Calculator:** Menghitung luas $\text{m}^2 = \frac{\text{lebar}}{100} \times \frac{\text{tinggi}}{100}$ dan total harga secara presisi berbasis tarif bahan real-time dari database.
- **Interactive Fabric.js Canvas Studio:** Memproyeksikan kanvas kerja sesuai rasio nyata ($P:L$), dilengkapi garis potong aman (*safe zone*) dan preview mata ayam.
- **Role-Based Access Control (RBAC):** Pemisahan hak akses antara Konsumen (katalog, studio, checkout, invoice, pelacakan) dan Admin (full CRUD pesanan, konfirmasi pembayaran, download berkas resolusi asli, manajemen bahan).

---

### 2. Aktor Sistem
1. **Konsumen (Customer):** Pengguna terdaftar yang memesan banner, mengunggah dan mengatur posisi desain pada editor studio, melakukan checkout dengan bukti bayar QRIS, serta melacak status produksi pesanan.
2. **Administrator:** Pengelola percetakan yang memverifikasi bukti pembayaran, memperbarui status pengerjaan pesanan (*pending* $\to$ *confirmed* $\to$ *processing* $\to$ *completed*), mengunduh file desain asli resolusi tinggi untuk dicetak ke mesin, serta mengelola katalog bahan dan tarif per $\text{m}^2$.

---

### 3. Use Case Diagram

```mermaid
flowchart LR
    Customer((Konsumen))
    Admin((Administrator))

    subgraph "Sistem Informasi BannerIN"
        UC1["1. Registrasi & Aktivasi Akun"]
        UC2["2. Autentikasi / Login"]
        UC3["3. Eksplorasi Katalog Bahan & Estimasi Harga"]
        UC4["4. Unggah & Kustomisasi Desain (Studio Fabric.js)"]
        UC5["5. Checkout & Unggah Bukti Bayar (QRIS)"]
        UC6["6. Pelacakan Pesanan & Cetak Invoice (#BK)"]
        UC7["7. Kelola Profil Pengguna"]

        UC8["8. Verifikasi Bukti Pembayaran"]
        UC9["9. Perbarui Status Produksi Pesanan"]
        UC10["10. Unduh File Desain Resolusi Asli"]
        UC11["11. Manajemen Data Pesanan (CRUD)"]
        UC12["12. Manajemen Katalog Bahan (CRUD Tarif)"]
    end

    Customer --> UC1
    Customer --> UC2
    Customer --> UC3
    Customer --> UC4
    Customer --> UC5
    Customer --> UC6
    Customer --> UC7

    Admin --> UC2
    Admin --> UC8
    Admin --> UC9
    Admin --> UC10
    Admin --> UC11
    Admin --> UC12
```

#### Deskripsi Spesifikasi Use Case Utama:
* **UC-04 (Kustomisasi Desain):** Konsumen mengunggah file JPG/PNG (maks 20 MB). Sistem memvalidasi *magic bytes* biner file, menyimpannya di Supabase Storage privat, lalu merender kanvas Fabric.js sesuai rasio dimensi banner.
* **UC-05 (Checkout Pesanan):** Sistem memvalidasi dimensi di server (*server-authoritative*), menghitung total harga dari database (anti-manipulasi browser), menerima bukti transfer QRIS (maks 10 MB), dan menerbitkan nomor invoice unik `#BK-[TIMESTAMP]-[HASH]`.
* **UC-09 & UC-10 (Operasional Produksi):** Admin meninjau preview bukti bayar via modal verifikasi, mengunduh file desain resolusi asli melalui *Signed URL* privat berbatas waktu 1 jam, lalu memajukan status pesanan hingga *completed*.

---

### 4. Activity Diagram

#### 4.1 Activity Diagram: Alur Pemesanan Banner oleh Konsumen
```mermaid
flowchart TD
    Start([Mulai]) --> A1[Pilih Jenis Bahan Cetak & Masukkan Ukuran P x L]
    A1 --> A2[Sistem Hitung Estimasi Luas m2 & Total Biaya]
    A2 --> A3[Unggah Berkas Desain JPG/PNG]
    A3 --> A4{Validasi Biner & Magic Bytes?}
    A4 -- Tidak Valid --> A5[Tampilkan Pesan Error Format/Ukuran File]
    A5 --> A3
    A4 -- Valid --> A6[Atur Posisi & Skala Desain di Kanvas Fabric.js]
    A6 --> A7[Klik Tombol 'Pesan Sekarang']
    A7 --> A8{Sudah Login?}
    A8 -- Belum --> A9[Arahkan ke Halaman Login/Register]
    A9 --> A8
    A8 -- Sudah --> A10[Tinjau Rincian Pesanan & Pindai QRIS Statis]
    A10 --> A11[Unggah Foto Bukti Transfer]
    A11 --> A12[Server Hitung Ulang Harga & Simpan Pesanan #BK]
    A12 --> A13[Tampilkan Halaman Sukses & Stepper Tracking]
    A13 --> End([Selesai])
```

#### 4.2 Activity Diagram: Alur Pemrosesan Pesanan oleh Administrator
```mermaid
flowchart TD
    StartAdmin([Mulai]) --> B1[Login sebagai Admin]
    B1 --> B2[Akses Admin Dashboard]
    B2 --> B3[Filter Pesanan 'Perlu Konfirmasi']
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

Sistem menerapkan arsitektur terpisah antara *Domain Entity*, *Domain Service*, dan *Data Access Layer* untuk menjamin prinsip *Clean Architecture* dan *Object-Oriented Programming (OOP)*:

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
        +calculateFromDimensions(w, h, price, qty) PriceCalculationResult
    }

    class PriceCalculator {
        +calculate(banner: Banner) PriceCalculationResult
        +calculateFromDimensions(w, h, price, qty) PriceCalculationResult
    }

    class Design {
        -string _id
        -string _customerId
        -string _originalFilePath
        -string _fileType
        -object _editorConfig
        +isOwnedBy(userId: string) boolean
        +toInsertPayload() object
    }

    class ImageFileValidator {
        +validateDesignFile(file: File) ValidationResult
        +validatePaymentProof(file: File) ValidationResult
        +verifyMagicBytes(buffer: ArrayBuffer) boolean
    }

    class Order {
        -string _id
        -string _customerId
        -string _materialId
        -number _totalPrice
        -string _status
        -string _paymentProofPath
        +isOwnedBy(userId: string) boolean
        +canBeCancelled() boolean
        +getCustomerStatusMeta() StatusMeta
        +formatOrderNumber() string
    }

    class OrderService {
        +buildAuthoritativeOrder(input, materialRecord) OrderPayload
        +normalizeWhatsApp(phone: string) string
        +generateOrderNumber(uuid: string) string
    }

    IPriceCalculator <|.. PriceCalculator : implements
    PriceCalculator ..> Banner : uses
    OrderService ..> Order : creates/validates
    OrderService ..> Banner : calculates
    Order ..> Design : references
    Design ..> ImageFileValidator : validated by
```

---

### 6. Arsitektur Sistem (Layered Architecture)
1. **Presentation Layer (Frontend):** Next.js 16 App Router, React 19, Tailwind CSS v4, Fabric.js v7 canvas rendering engine.
2. **Application / Action Layer (Server Actions & Route Handlers):** Menjalankan validasi input, autentikasi sesi via `@supabase/ssr`, pemanggilan *Domain Service*, dan proteksi rute di Next.js Middleware.
3. **Domain Layer (Business Logic OOP):** Model entitas murni TypeScript (`Banner`, `Order`, `Design`, `PriceCalculator`) tanpa dependensi langsung ke framework atau database.
4. **Data Persistence & Security Layer:** Supabase Cloud PostgreSQL, Row Level Security (RLS), dan Supabase Storage buckets dengan proteksi enkripsi dan Signed URL.

