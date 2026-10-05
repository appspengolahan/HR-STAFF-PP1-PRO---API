import { SlipGajiRecord, StaffData } from '../types';

/**
 * PPh21 PMK 168/2023 — TABEL RESMI TARIF EFEKTIF RATA-RATA (TER)
 * Dikutip dari Lampiran PMK 168/2023 (Kemenkeu RI).
 * Kategori A: TK/0, TK/1, K/0
 * Kategori B: TK/2, TK/3, K/1, K/2
 * Kategori C: K/3
 */

interface TerBracket {
  min: number;
  rate: number;
}

export const TER_A_BRACKETS: TerBracket[] = [
  { min: 0, rate: 0.0 },
  { min: 5400001, rate: 0.0025 },
  { min: 5650001, rate: 0.005 },
  { min: 5950001, rate: 0.0075 },
  { min: 6300001, rate: 0.01 },
  { min: 6750001, rate: 0.0125 },
  { min: 7500001, rate: 0.015 },
  { min: 8550001, rate: 0.0175 },
  { min: 9650001, rate: 0.02 },
  { min: 10050001, rate: 0.0225 },
  { min: 10350001, rate: 0.025 },
  { min: 10700001, rate: 0.03 },
  { min: 11050001, rate: 0.035 },
  { min: 11600001, rate: 0.04 },
  { min: 12500001, rate: 0.05 },
  { min: 13750001, rate: 0.06 },
  { min: 15100001, rate: 0.07 },
  { min: 16950001, rate: 0.08 },
  { min: 19750001, rate: 0.09 },
  { min: 24150001, rate: 0.1 },
  { min: 26450001, rate: 0.11 },
  { min: 28000001, rate: 0.12 },
  { min: 30050001, rate: 0.13 },
  { min: 32400001, rate: 0.14 },
  { min: 35400001, rate: 0.15 },
  { min: 39100001, rate: 0.16 },
  { min: 43850001, rate: 0.17 },
  { min: 47800001, rate: 0.18 },
  { min: 51400001, rate: 0.19 },
  { min: 56300001, rate: 0.2 },
  { min: 62200001, rate: 0.21 },
  { min: 68600001, rate: 0.22 },
  { min: 77500001, rate: 0.23 },
  { min: 89000001, rate: 0.24 },
  { min: 103000001, rate: 0.25 },
  { min: 125000001, rate: 0.26 },
  { min: 157000001, rate: 0.27 },
  { min: 206000001, rate: 0.28 },
  { min: 337000001, rate: 0.29 },
  { min: 454000001, rate: 0.3 },
  { min: 550000001, rate: 0.31 },
  { min: 695000001, rate: 0.32 },
  { min: 910000001, rate: 0.33 },
  { min: 1400000001, rate: 0.34 },
];

export const TER_B_BRACKETS: TerBracket[] = [
  { min: 0, rate: 0.0 },
  { min: 6200001, rate: 0.0025 },
  { min: 6500001, rate: 0.005 },
  { min: 6850001, rate: 0.0075 },
  { min: 7300001, rate: 0.01 },
  { min: 9200001, rate: 0.015 },
  { min: 10750001, rate: 0.02 },
  { min: 11250001, rate: 0.025 },
  { min: 11600001, rate: 0.03 },
  { min: 12600001, rate: 0.04 },
  { min: 13600001, rate: 0.05 },
  { min: 14950001, rate: 0.06 },
  { min: 16400001, rate: 0.07 },
  { min: 18450001, rate: 0.08 },
  { min: 21850001, rate: 0.09 },
  { min: 26000001, rate: 0.1 },
  { min: 27700001, rate: 0.11 },
  { min: 29350001, rate: 0.12 },
  { min: 31450001, rate: 0.13 },
  { min: 33950001, rate: 0.14 },
  { min: 37100001, rate: 0.15 },
  { min: 41100001, rate: 0.16 },
  { min: 45800001, rate: 0.17 },
  { min: 49500001, rate: 0.18 },
  { min: 53800001, rate: 0.19 },
  { min: 58500001, rate: 0.2 },
  { min: 64000001, rate: 0.21 },
  { min: 71000001, rate: 0.22 },
  { min: 80000001, rate: 0.23 },
  { min: 93000001, rate: 0.24 },
  { min: 109000001, rate: 0.25 },
  { min: 129000001, rate: 0.26 },
  { min: 163000001, rate: 0.27 },
  { min: 211000001, rate: 0.28 },
  { min: 374000001, rate: 0.29 },
  { min: 459000001, rate: 0.3 },
  { min: 555000001, rate: 0.31 },
  { min: 704000001, rate: 0.32 },
  { min: 957000001, rate: 0.33 },
  { min: 1405000001, rate: 0.34 },
];

export const TER_C_BRACKETS: TerBracket[] = [
  { min: 0, rate: 0.0 },
  { min: 6600001, rate: 0.0025 },
  { min: 6950001, rate: 0.005 },
  { min: 7350001, rate: 0.0075 },
  { min: 7800001, rate: 0.01 },
  { min: 8850001, rate: 0.0125 },
  { min: 9800001, rate: 0.015 },
  { min: 10950001, rate: 0.0175 },
  { min: 11200001, rate: 0.02 },
  { min: 12050001, rate: 0.03 },
  { min: 12950001, rate: 0.04 },
  { min: 14150001, rate: 0.05 },
  { min: 15550001, rate: 0.06 },
  { min: 17050001, rate: 0.07 },
  { min: 19500001, rate: 0.08 },
  { min: 22700001, rate: 0.09 },
  { min: 26600001, rate: 0.1 },
  { min: 28100001, rate: 0.11 },
  { min: 30100001, rate: 0.12 },
  { min: 32600001, rate: 0.13 },
  { min: 35400001, rate: 0.14 },
  { min: 38900001, rate: 0.15 },
  { min: 43000001, rate: 0.16 },
  { min: 47400001, rate: 0.17 },
  { min: 51200001, rate: 0.18 },
  { min: 55800001, rate: 0.19 },
  { min: 60400001, rate: 0.2 },
  { min: 66700001, rate: 0.21 },
  { min: 74500001, rate: 0.22 },
  { min: 83200001, rate: 0.23 },
  { min: 95600001, rate: 0.24 },
  { min: 110000001, rate: 0.25 },
  { min: 134000001, rate: 0.26 },
  { min: 169000001, rate: 0.27 },
  { min: 221000001, rate: 0.28 },
  { min: 390000001, rate: 0.29 },
  { min: 463000001, rate: 0.3 },
  { min: 561000001, rate: 0.31 },
  { min: 709000001, rate: 0.32 },
  { min: 965000001, rate: 0.33 },
  { min: 1419000001, rate: 0.34 },
];

export const PLAFON_BPJS_JP = 11086300; // Regulasi batas atas iuran JP per Maret 2026

export const NAMA_BULAN_INDO = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

/**
 * Petakan Status PTKP ke Kategori TER (A, B, atau C)
 */
export function getKategoriTer(statusPTKP: string): 'A' | 'B' | 'C' {
  if (!statusPTKP) return 'A';
  const clean = statusPTKP.trim().toUpperCase();
  if (clean.startsWith('TK/0') || clean.startsWith('TK/1') || clean.startsWith('K/0')) {
    return 'A';
  }
  if (
    clean.startsWith('TK/2') ||
    clean.startsWith('TK/3') ||
    clean.startsWith('K/1') ||
    clean.startsWith('K/2')
  ) {
    return 'B';
  }
  if (clean.startsWith('K/3')) {
    return 'C';
  }
  return 'A';
}

/**
 * Hitung persentase tarif TER berdasarkan kategori dan Bruto Bulanan (setelah potongan ijin)
 */
export function getTarifTer(kategori: 'A' | 'B' | 'C', brutoBulanan: number): number {
  const brackets =
    kategori === 'A' ? TER_A_BRACKETS : kategori === 'B' ? TER_B_BRACKETS : TER_C_BRACKETS;
  let matchingRate = 0;
  for (const b of brackets) {
    if (brutoBulanan >= b.min) {
      matchingRate = b.rate;
    } else {
      break;
    }
  }
  return matchingRate;
}

/**
 * Konversi angka ke terbilang Rupiah resmi
 */
export function terbilang(nominal: number): string {
  const bilangan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];
  const num = Math.floor(Math.abs(nominal));
  if (num < 12) return bilangan[num];
  if (num < 20) return terbilang(num - 10) + ' Belas';
  if (num < 100) return terbilang(Math.floor(num / 10)) + ' Puluh ' + terbilang(num % 10);
  if (num < 200) return 'Seratus ' + terbilang(num - 100);
  if (num < 1000) return terbilang(Math.floor(num / 100)) + ' Ratus ' + terbilang(num % 100);
  if (num < 2000) return 'Seribu ' + terbilang(num - 1000);
  if (num < 1000000) return terbilang(Math.floor(num / 1000)) + ' Ribu ' + terbilang(num % 1000);
  if (num < 1000000000)
    return terbilang(Math.floor(num / 1000000)) + ' Juta ' + terbilang(num % 1000000);
  if (num < 1000000000000)
    return terbilang(Math.floor(num / 1000000000)) + ' Miliar ' + terbilang(num % 1000000000);
  return String(num);
}

/**
 * Mesin kalkulasi slip gaji bulanan staf lengkap
 */
export function calculateSlipGaji(
  staff: StaffData,
  bulan: number,
  tahun: number,
  totalLembur: number = 0,
  hariTidakDibayar: number = 0
): SlipGajiRecord {
  const gp = staff.gajiPokok || 0;
  const tunjangan = staff.tunjanganJabatan || 0;
  const ketentuanPenuh = gp + tunjangan;

  // Rate harian baku 26 hari kerja per bulan
  const rateHarian = ketentuanPenuh / 26;
  const potonganIjinRp = Math.round(hariTidakDibayar * rateHarian);

  // Total Bruto (setelah dikurangi potongan ijin + ditambah lembur)
  const totalGajiBruto = Math.max(0, gp + tunjangan + totalLembur - potonganIjinRp);

  // BPJS JHT: 2% dari Ketentuan Penuh (GP + Tunjangan)
  const bpjsJht = Math.round(ketentuanPenuh * 0.02);

  // BPJS JP: 1% dari MIN(Ketentuan Penuh, Plafon Rp 11.086.300)
  const basisJp = Math.min(ketentuanPenuh, PLAFON_BPJS_JP);
  const bpjsJp = Math.round(basisJp * 0.01);

  // BPJS Kesehatan: nominal tetap per staf dari MASTER_STAFF
  const bpjsKesehatan = Math.round(staff.bpjsKesehatanNominal || 0);

  // PPh21 TER (PMK 168/2023)
  const kategoriTer = getKategoriTer(staff.statusPTKP);
  const tarifTerPct = getTarifTer(kategoriTer, totalGajiBruto);
  const pph21Bulan = Math.round(totalGajiBruto * tarifTerPct);

  // Gaji Diterima (Take Home Pay)
  const gajiDiterima = Math.max(
    0,
    totalGajiBruto - bpjsJht - bpjsJp - bpjsKesehatan - pph21Bulan
  );

  const terbilangStr = terbilang(gajiDiterima).trim() + ' Rupiah';

  return {
    bulan,
    tahun,
    namaBulan: NAMA_BULAN_INDO[bulan - 1] || `Bulan ${bulan}`,
    nip: staff.nip,
    nama: staff.nama,
    jabatan: staff.jabatan,
    sekup: staff.sekup,
    statusKepegawaian: staff.status,
    statusPTKP: staff.statusPTKP,
    gajiPokok: gp,
    tunjanganJabatan: tunjangan,
    totalLembur,
    hariTidakDibayar,
    potonganIjinRp,
    totalGajiBruto,
    bpjsJht,
    bpjsJp,
    bpjsKesehatan,
    kategoriTer,
    tarifTerPct,
    pph21Bulan,
    gajiDiterima,
    terbilangGaji: terbilangStr,
  };
}

export function formatRupiah(value: number): string {
  if (isNaN(value)) return 'Rp 0';
  return 'Rp ' + Math.round(value).toLocaleString('id-ID');
}

export function formatPersen(value: number): string {
  if (isNaN(value)) return '0,00%';
  return (value * 100).toFixed(2).replace('.', ',') + '%';
}
