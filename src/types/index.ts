export type UserRole =
  | 'Lead Developer'
  | 'Project Manager'
  | 'Site Engineer'
  | 'Admin HR'
  | 'Finance'
  | 'Kepala Dept'
  | 'Staf';

export type PortalType = 'management' | 'staff';

export interface AuthUser {
  id: string;
  email?: string;
  nip: string;
  nama: string;
  role: UserRole;
  portalType: PortalType;
  allowedTabs: string[];
  department?: string;
}

export interface StaffData {
  id: number;
  nip: string; // Format BK-PP1-xxx
  nama: string;
  status: 'MAGANG' | 'PKWT 1' | 'PKWT 2' | 'PKWT 3' | 'PKWT 4' | 'PKWT 5' | 'PKWT 6' | 'PKWT 7' | 'TETAP';
  jabatan: string;
  level: string; // Staff, Foreman, Koordinator, Supervisor, Manajer
  sekup: 'Operasional' | 'Administrasi';
  statusAktif: 'Aktif' | 'Non Aktif';
  jk: 'Laki-laki' | 'Perempuan';
  nik: string;
  kk?: string;
  npwp?: string;
  email: string;
  bank: string;
  rekening: string;
  telp: string;
  domisili: string;
  pendidikanTerakhir: 'SD' | 'SMP' | 'SMA/SMK' | 'D1' | 'D2' | 'D3' | 'D4' | 'S1' | 'S2' | 'S3';
  gajiPokok: number;
  tunjanganJabatan: number;
  totalGaji: number; // Statis GP + Tunjangan
  statusPTKP: string;
  proyeksiJabatan?: string;
  sanksi?: string;
  awalPKWT?: string;
  akhirPKWT?: string;
  limitPKWT?: string;
  plafonLevel?: string;
  deskripsiJabatan?: string;
  faskes?: string;
  bpjsKesehatanNominal: number; // Tetap per staff (bukan persentase)
  shiftDefault: 'Shift 1' | 'Shift 2' | 'Shift 3' | 'Non-Shift';
}

export type JenisIjin =
  | 'Hadir'
  | 'Sakit (S Dokter)'
  | 'Sakit (S Tangan)'
  | 'Ijin Normatif'
  | 'Ijin (S Tangan)'
  | 'Ijin Terlambat'
  | 'Ijin Keluar Sementara'
  | 'Ijin Pulang Awal'
  | 'Alpha';

export interface PresensiRecord {
  id: string;
  rowNum?: number;
  tanggal: string; // YYYY-MM-DD
  hari: string;
  nip: string;
  nama: string;
  jamAwal?: string; // HH:mm
  jamAkhir?: string; // HH:mm
  durasiMenit: number;
  jenisIjin: JenisIjin;
  faktorPotongan: number; // 0, 0.5, 1
  keperluan?: string;
  lampiranSurat: 'Ya' | 'Tidak';
  catatan?: string;
  bulan: number;
  tahun: number;
  shift?: 'Shift 1' | 'Shift 2' | 'Shift 3' | 'Non-Shift';
  geofenceValid?: boolean;
}

export interface LemburRecord {
  id: string;
  rowNum?: number;
  tanggal: string;
  nip: string;
  nama: string;
  sekup: 'Operasional' | 'Administrasi';
  kategori: 'Minggu' | 'Tanggal Merah/Libur Nasional' | 'Di Luar Jam Kerja (Weekday/Sabtu)';
  jamMulai?: string;
  jamSelesai?: string;
  nominal: number; // Flat 2x tarif harian ((GP + Tunjangan)/26)
  status: 'Disetujui' | 'Pending' | 'Ditolak';
  keterangan?: string;
  bulan: number;
  tahun: number;
}

export interface CutiRecord {
  id: string;
  nip: string;
  nama: string;
  jenisCuti: 'Cuti Tahunan' | 'Cuti Melahirkan' | 'Izin Dinas Luar Kota' | 'Izin Menikah/Khusus';
  tanggalMulai: string;
  tanggalAkhir: string;
  durasiHari: number;
  alasan: string;
  status: 'Pending' | 'Disetujui' | 'Ditolak';
  disetujuiOleh?: string;
  catatanAtasan?: string;
}

export interface SlipGajiRecord {
  bulan: number;
  tahun: number;
  namaBulan: string;
  nip: string;
  nama: string;
  jabatan: string;
  sekup: string;
  statusKepegawaian: string;
  statusPTKP: string;
  gajiPokok: number;
  tunjanganJabatan: number;
  totalLembur: number;
  hariTidakDibayar: number;
  potonganIjinRp: number;
  totalGajiBruto: number; // GP + Tunjangan + Lembur - Potongan Ijin
  bpjsJht: number; // 2% dari (GP + Tunjangan)
  bpjsJp: number; // 1% dari MIN(GP + Tunjangan, 11086300)
  bpjsKesehatan: number; // Nominal tetap per staf
  kategoriTer: 'A' | 'B' | 'C';
  tarifTerPct: number;
  pph21Bulan: number; // Bruto * tarifTer
  gajiDiterima: number; // Bruto - JHT - JP - Kesehatan - PPh21
  terbilangGaji?: string;
}

export interface MutasiRecord {
  id: string;
  rowNum?: number;
  tanggalEfektif: string; // YYYY-MM-DD
  nip: string;
  nama: string;
  jenisMutasi:
    | 'Jabatan'
    | 'Level/Kategori'
    | 'Sekup'
    | 'Status Kepegawaian'
    | 'Status Aktif'
    | 'Gaji Pokok'
    | 'Tunjangan Jabatan'
    | 'Domisili'
    | 'Proyeksi Jabatan'
    | 'Sanksi'
    | 'Awal PKWT'
    | 'Akhir PKWT'
    | 'Limit PKWT'
    | 'Plafon Level/Kategori'
    | 'Deskripsi Jabatan'
    | 'Faskes'
    | 'Nominal BPJS Kesehatan';
  nilaiLama: string;
  nilaiBaru: string;
  keterangan: string;
  diinputOleh: string;
  status: 'Terjadwal' | 'Diterapkan' | 'Dibatalkan';
}

export interface CalonKaryawan {
  id: string;
  rowNum?: number;
  nama: string;
  proyeksiJabatan: string;
  sekup: 'Operasional' | 'Administrasi';
  tanggalMulai: string;
  tanggalAkhir: string;
  durasiHari: number;
  sisaHari: number;
  status?: 'Sedang Berjalan' | 'Lolos' | 'Diperpanjang' | 'Tidak Lolos';
  statusPelatihan?: 'Sedang Berjalan' | 'Lolos' | 'Diperpanjang' | 'Tidak Lolos';
  jumlahPerpanjangan: number;
  catatan?: string;
  diinputOleh?: string;
  alert: boolean;
}

export interface LinkArsip {
  id: string;
  nip: string;
  nama: string;
  label: string;
  url: string;
  tanggalDitambahkan: string;
}

export interface KpiRecord {
  id: string;
  nip: string;
  nama: string;
  bulan: number;
  tahun: number;
  disiplin: number; // 0-100 (bobot 30%)
  rendemen: number; // 0-100 (bobot 40%)
  k3: number; // 0-100 (bobot 20%)
  inisiatif: number; // 0-100 (bobot 10%)
  totalScore: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D';
  catatan?: string;
  penilai: string;
}

export interface DeletedArchiveRecord {
  id: string;
  kategori: 'STAFF' | 'PRESENSI' | 'LEMBUR' | 'MUTASI';
  waktuDihapus: string;
  dihapusOleh: string;
  nama: string;
  nip?: string;
  detailJson: string;
}

export interface GasConfig {
  apiUrl: string;
  lastSyncTimestamp?: string;
  isAutoSync: boolean;
  status: 'connected' | 'idle' | 'error' | 'syncing';
  errorMessage?: string;
}
