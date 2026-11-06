# Pembaruan Portal Publik: Rekapitulasi Presensi & Grafik Balok Kehadiran

Rencana pembaruan komprehensif pada Portal Publik Divisi Produksi I (PT Batu Karang) untuk menyempurnakan visualisasi data disiplin staf melalui grafik balok kehadiran bulanan & tahun berjalan tanpa slider, kontrol toggle mandiri, serta penambahan tab evaluasi 10 Kehadiran Terendah.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Seluruh preferensi telah dikonfirmasi oleh pengguna melalui sesi klarifikasi:
> - **Kontrol Toggle Grafik**: Disediakan tombol toggle mandiri (*independent*) pada masing-masing kartu grafik (Grafik Bulanan dan Grafik Tahunan dapat dibuka/ditutup secara terpisah, dengan posisi bawaan *default*: **Tidak Ditampilkan**).
> - **Urutan Bawaan Staf**: Urutan balok menempatkan **staf dengan kehadiran terendah di bagian paling atas** (disertai indikator warna merah/perhatian) untuk memudahkan evaluasi pembinaan kedisiplinan kerja staf, dilengkapi tombol pengubah urutan (*sort toggle*).
> - **Tab Tambahan**: Mengaktifkan tab baru **"10 Kehadiran Terendah"** pada navigasi utama Portal Publik sebagai ringkasan instan bagi pimpinan/publik.

---

### 1. Overview & Core Concept

- **Tujuan Pembaruan**: Menghadirkan portal transparansi presensi publik yang lebih informatif, fleksibel, dan siap cetak/ekspor PDF tanpa terpotong slider internal.
- **Sasaran Pengguna**: Manajemen operasional, staf internal, serta pemangku kepentingan publik yang mengakses ringkasan kehadiran melalui tautan resmi (Linktree/web).
- **Nilai Tambah**: Memungkinkan pimpinan melihat ringkasan cepat pada kartu KPI yang ada saat ini, lalu membuka grafik balok interaktif secara *on-demand* untuk analisis mendalam tanpa membebani tampilan awal halaman.

---

### 2. User Experience & Visual Design

#### A. Struktur Tab Navigasi Portal Publik
1. **Status Kehadiran & Izin Harian**: Pemantauan harian berbasis tanggal (hadir, sakit, izin, cuti, libur).
2. **Rekapitulasi Presensi** *(Diperbarui dari "Rekapitulasi Bulanan")*:
   - Header pemilih bulan (*month selector*).
   - **3 Kartu Ringkasan KPI yang Dipertahankan**:
     1. *Tingkat Disiplin Kehadiran* (persentase).
     2. *Log Hadir Efektif* (total log hadir).
     3. *Total Izin, Sakit & Cuti* (rincian jumlah hari).
   - **Grafik Balok 1: Rekapitulasi Bulan Berjalan (Semua 32 Staf)**:
     - Menghitung persentase jam kerja efektif individu untuk bulan yang dipilih berdasarkan data presensi resmi.
     - Header dilengkapi tombol aksi: `[👁️ Tampilkan Grafik]` / `[🙈 Sembunyikan Grafik]` (bawaan: tertutup) dan tombol pembalik urutan.
   - **Grafik Balok 2: Rekapitulasi Tahun Berjalan (Januari s/d Bulan Berjalan)**:
     - Mengakumulasi total jam kerja efektif & izin dari bulan 1 (Januari) hingga bulan aktif tahun anggaran.
     - Header dilengkapi tombol aksi mandiri: `[👁️ Tampilkan Grafik]` / `[🙈 Sembunyikan Grafik]` (bawaan: tertutup).
3. **Kapasitas Tim Bagian**: Distribusi alokasi staf operasional vs administrasi per lini kerja.
4. **10 Kehadiran Terendah** *(Tab Baru)*:
   - Menampilkan 10 staf dengan persentase kehadiran paling memerlukan pembinaan/perhatian khusus, lengkap dengan total durasi izin (jam & menit) dan riwayat jenis izin.

#### B. Desain Grafik Balok Tanpa Slider & Kompatibilitas Cetak (PDF Export)
- **Tanpa Slider/Scrollbar Internal**: Elemen grafik menggunakan aliran vertikal wajar (*natural document flow*) tanpa pembatas `max-h` atau `overflow-y-auto`.
- **Optimalisasi Cetak (`window.print()`)**:
  - Menerapkan `break-inside: avoid; page-break-inside: avoid;` pada tiap baris balok karyawan.
  - Trek latar balok dan gradien warna presensi (merah `< 95%`, biru `95–97.9%`, hijau `≥ 98%`) menggunakan `-webkit-print-color-adjust: exact`.
  - Kontrol navigasi pencarian dan tombol toggle otomatis disembunyikan saat cetak (`no-print`).

---

### 3. Key Product Decisions & Trade-Offs

- **Keputusan 1: Toggle Mandiri per Kartu Grafik**:
  - *Pendekatan*: Masing-masing kartu grafik (Bulan Berjalan vs Tahun Berjalan) memiliki tombol *show/hide* independen dengan state React masing-masing (`showMonthlyChart` dan `showYearlyChart`).
  - *Alasan*: Pengguna dapat memilih untuk hanya mencetak/menganalisis grafik bulanan saja, grafik tahunan saja, atau keduanya sekaligus sesuai kebutuhan pelaporan.
- **Keputusan 2: Urutan Evaluasi Pembinaan (*Ascending Rate*)**:
  - *Pendekatan*: Staf dengan tingkat disiplin terendah tampil di paling atas dengan lencana prioritas dan warna merah terang, disusul ke arah 100% di bawah. Disediakan tombol toggle untuk membalik urutan (Prestasi Tertinggi di atas).
  - *Alasan*: Selaras dengan kebutuhan manajerial pabrik PP1 untuk memprioritaskan tindakan pembinaan staf yang sering berhalangan hadir.
- **Keputusan 3: Formula Standar Jam Kerja Baku PT Batu Karang**:
  - Menggunakan basis 10.440 menit kerja baku/bulan per staf (22 hari kerja x 420 menit + 4 Sabtu x 300 menit).
  - Pengurangan menit izin telah disanitasi menggunakan aturan SOP: izin $\le 120$ menit = 0 potongan, $121-240$ menit = 0.5 hari, $> 240$ menit = 1.0 hari.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PublicInformationPortal.tsx                          │
│                                                                        │
│  [Status Harian]  [Rekapitulasi Presensi]  [Kapasitas]  [10 Terendah]  │
└───────────────────────────────┬────────────────────────────────────────┘
                                │
          ┌─────────────────────┴─────────────────────┐
          │  Tab "Rekapitulasi Presensi"               │
          │                                           │
          │  ├─ Month Selector (YYYY-MM)              │
          │  ├─ 3 Metric Cards (Disiplin, Log, Izin)  │
          │  │                                        │
          │  ├─ Kartu Grafik 1: Bulan Berjalan        │
          │  │    ├─ Header & Toggle [Tampilkan]      │
          │  │    └─ Horizontal Bar Rows (32 Staf)    │
          │  │                                        │
          │  └─ Kartu Grafik 2: Tahun Berjalan        │
          │       ├─ Header & Toggle [Tampilkan]      │
          │       └─ Cumulative Bar Rows (Jan - Now)  │
          └───────────────────────────────────────────┘
```

#### Komponen State & Mapping:
- `activeTab`: `'harian' | 'rekap' | 'kapasitas' | 'terendah'`
- `showMonthlyChart`: `boolean` (default: `false`)
- `showYearlyChart`: `boolean` (default: `false`)
- `sortOrderMonthly`: `'asc' | 'desc'` (default: `'asc'`)
- `sortOrderYearly`: `'asc' | 'desc'` (default: `'asc'`)
- `staffMonthlyStats`: Mengkalkulasi jam kerja efektif bulan berjalan untuk 32 staf.
- `staffYearlyStats`: Mengkalkulasi jam kerja efektif kumulatif dari Januari s/d bulan aktif untuk 32 staf.
- `bottom10Staff`: Mengambil 10 peringkat terbawah secara dinamis.
