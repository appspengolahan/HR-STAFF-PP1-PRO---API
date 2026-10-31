/**
 * STANDARISASI JAM KERJA RESMI & PEMOTONGAN JAM ISTIRAHAT OTOMATIS
 * PT Batu Karang — HR Staff & Karyawan (Divisi Produksi I)
 *
 * Mengatur:
 * 1. Jadwal Jam Kerja & Istirahat Resmi:
 *    - Senin - Kamis: 08:00 - 16:00 (Bruto 480m, Istirahat 11:30 - 12:30 [60m], Efektif 420m / 7 jam)
 *    - Jumat: 08:00 - 16:30 (Bruto 510m, Istirahat 11:00 - 12:30 [90m Sholat Jumat & Makan], Efektif 420m / 7 jam)
 *    - Sabtu: 08:00 - 13:00 (Bruto 300m, Tanpa Istirahat, Efektif 300m / 5 jam)
 *    - Minggu: Off (0m)
 * 2. Logika Pemotongan Jam Istirahat Otomatis pada Ijin Parsial
 * 3. Normalisasi Data Historis (Pencegahan Bias Rekap Presensi)
 */

import { PresensiRecord } from '../types';
import { parseDateFlexible } from './dateFormatter';

export interface WorkScheduleConfig {
  dayOfWeek: number; // 0: Sun, 1: Mon, ..., 6: Sat
  dayName: string;
  isWorkDay: boolean;
  workStart: string;
  workEnd: string;
  breakStart: string | null;
  breakEnd: string | null;
  breakDurationMinutes: number;
  effectiveWorkMinutes: number;
}

export interface CalculationResult {
  durasiMenit: number;
  jamAwal: string;
  jamAkhir: string;
  durasiBruto: number;
  potonganIstirahatMenit: number;
  faktorPotongan: number;
  isWorkDay: boolean;
  dayName: string;
}

/**
 * Konversi format waktu HH:mm menjadi total menit sejak 00:00
 */
export function parseTimeToMinutes(timeStr?: string | null): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return 0;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
}

/**
 * Konversi total menit sejak 00:00 menjadi format string HH:mm
 */
export function formatMinutesToTime(totalMinutes: number): string {
  if (totalMinutes <= 0) return '00:00';
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Dapatkan konfigurasi jam kerja baku berdasarkan tanggal kalender
 */
export function getWorkScheduleForDate(dateInput: string | Date): WorkScheduleConfig {
  const d = parseDateFlexible(dateInput) || new Date(dateInput);
  const day = !isNaN(d.getTime()) ? d.getDay() : 1; // Default ke Senin jika tanggal tidak valid

  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayName = dayNames[day] || 'Senin';

  if (day === 0) {
    // Minggu: Off
    return {
      dayOfWeek: 0,
      dayName: 'Minggu',
      isWorkDay: false,
      workStart: '00:00',
      workEnd: '00:00',
      breakStart: null,
      breakEnd: null,
      breakDurationMinutes: 0,
      effectiveWorkMinutes: 0,
    };
  }

  if (day === 6) {
    // Sabtu: 08:00 - 13:00 tanpa istirahat resmi (300 menit)
    return {
      dayOfWeek: 6,
      dayName: 'Sabtu',
      isWorkDay: true,
      workStart: '08:00',
      workEnd: '13:00',
      breakStart: null,
      breakEnd: null,
      breakDurationMinutes: 0,
      effectiveWorkMinutes: 300,
    };
  }

  if (day === 5) {
    // Jumat: 08:00 - 16:30, istirahat 11:00 - 12:30 (90 menit sholat Jumat & makan), efektif 420 menit
    return {
      dayOfWeek: 5,
      dayName: 'Jumat',
      isWorkDay: true,
      workStart: '08:00',
      workEnd: '16:30',
      breakStart: '11:00',
      breakEnd: '12:30',
      breakDurationMinutes: 90,
      effectiveWorkMinutes: 420,
    };
  }

  // Senin - Kamis: 08:00 - 16:00, istirahat 11:30 - 12:30 (60 menit), efektif 420 menit
  return {
    dayOfWeek: day,
    dayName,
    isWorkDay: true,
    workStart: '08:00',
    workEnd: '16:00',
    breakStart: '11:30',
    breakEnd: '12:30',
    breakDurationMinutes: 60,
    effectiveWorkMinutes: 420,
  };
}

/**
 * Logika perhitungan durasi izin bersih (net permit minutes) dan faktor potongan
 */
export function calculateEffectivePermitMinutes(
  dateInput: string | Date,
  jamAwal: string,
  jamAkhir: string,
  isFullDay?: boolean,
  jenisIjin?: string,
  lampiranSurat?: string
): CalculationResult {
  const sched = getWorkScheduleForDate(dateInput);

  if (!sched.isWorkDay) {
    return {
      durasiMenit: 0,
      jamAwal: jamAwal || '00:00',
      jamAkhir: jamAkhir || '00:00',
      durasiBruto: 0,
      potonganIstirahatMenit: 0,
      faktorPotongan: 0,
      isWorkDay: false,
      dayName: sched.dayName,
    };
  }

  const cleanJenis = (jenisIjin || '').trim();
  const cleanLampiran = (lampiranSurat || '').trim().toLowerCase();

  // Evaluasi jenis ijin normatif & sakit berdokumen (bebas potongan upah)
  const isNormatif =
    cleanJenis === 'Ijin Normatif' ||
    cleanJenis === 'Sakit (S Dokter)' ||
    cleanJenis === 'Cuti' ||
    cleanJenis === 'Cuti Tahunan' ||
    cleanJenis === 'Hadir' ||
    cleanLampiran === 'ya';

  // Ijin yang secara regulasi otomatis berdurasi sehari penuh
  const autoFull =
    cleanJenis === 'Alpha' ||
    cleanJenis === 'Ijin Tidak Masuk' ||
    cleanJenis === 'Ijin Normatif' ||
    cleanJenis.startsWith('Sakit') ||
    cleanJenis.startsWith('Ijin (S Tangan)');

  // 1. KASUS IJIN SEHARI PENUH (FULL DAY)
  if (isFullDay || autoFull) {
    return {
      durasiMenit: sched.effectiveWorkMinutes,
      jamAwal: sched.workStart,
      jamAkhir: sched.workEnd,
      durasiBruto: sched.dayOfWeek === 5 ? 510 : sched.dayOfWeek === 6 ? 300 : 480,
      potonganIstirahatMenit: sched.breakDurationMinutes,
      faktorPotongan: isNormatif ? 0 : 1.0,
      isWorkDay: true,
      dayName: sched.dayName,
    };
  }

  // 2. KASUS IJIN PARSIAL (Terlambat, Keluar Sementara, Pulang Cepat)
  const uStart = parseTimeToMinutes(jamAwal);
  const uEnd = parseTimeToMinutes(jamAkhir);
  const wStart = parseTimeToMinutes(sched.workStart);
  const wEnd = parseTimeToMinutes(sched.workEnd);

  // Batasi (clamping) rentang izin hanya di dalam jam kerja resmi
  const effStart = Math.max(uStart, wStart);
  const effEnd = Math.min(uEnd, wEnd);

  if (effEnd <= effStart) {
    return {
      durasiMenit: 0,
      jamAwal,
      jamAkhir,
      durasiBruto: 0,
      potonganIstirahatMenit: 0,
      faktorPotongan: 0,
      isWorkDay: true,
      dayName: sched.dayName,
    };
  }

  const durasiBruto = effEnd - effStart;

  // Pemotongan jam istirahat otomatis jika beririsan (overlap)
  let breakDed = 0;
  if (sched.breakStart && sched.breakEnd) {
    const bStart = parseTimeToMinutes(sched.breakStart);
    const bEnd = parseTimeToMinutes(sched.breakEnd);

    const oStart = Math.max(effStart, bStart);
    const oEnd = Math.min(effEnd, bEnd);
    if (oEnd > oStart) {
      breakDed = oEnd - oStart;
    }
  }

  const netMinutes = Math.max(0, durasiBruto - breakDed);

  // Perhitungan faktor potongan proporsional
  let faktor = 0;
  if (!isNormatif && sched.effectiveWorkMinutes > 0) {
    faktor = Math.round((netMinutes / sched.effectiveWorkMinutes) * 100) / 100;
    // Jaga batas maksimal 1.0
    if (faktor > 1) faktor = 1.0;
  }

  return {
    durasiMenit: netMinutes,
    jamAwal,
    jamAkhir,
    durasiBruto,
    potonganIstirahatMenit: breakDed,
    faktorPotongan: faktor,
    isWorkDay: true,
    dayName: sched.dayName,
  };
}

/**
 * Normalisasi data historis presensi (Pencegahan Bias Rekap & Grafik)
 * Menyesuaikan rekaman lama agar adil dan konsisten:
 * - Sabtu tercatat 420 menit dinormalisasi ke 300 menit
 * - Ijin parsial yang memiliki jamAwal & jamAkhir dihitung ulang dengan pemotongan jam istirahat
 */
export function normalizePresensiRecord(record: PresensiRecord): PresensiRecord {
  if (!record) return record;

  const sched = getWorkScheduleForDate(record.tanggal);
  const cleanJenis = (record.jenisIjin || '').trim();

  const isFullDay =
    record.durasiMenit === 420 ||
    record.durasiMenit === 300 ||
    (record.jamAwal === '08:00' && (record.jamAkhir === '16:00' || record.jamAkhir === '16:30' || record.jamAkhir === '13:00')) ||
    cleanJenis === 'Alpha' ||
    cleanJenis === 'Ijin Tidak Masuk' ||
    cleanJenis === 'Ijin Normatif' ||
    cleanJenis.startsWith('Sakit') ||
    cleanJenis.startsWith('Ijin (S Tangan)');

  // 1. Tanggal di hari Sabtu
  if (sched.dayOfWeek === 6) {
    if (isFullDay) {
      const calc = calculateEffectivePermitMinutes(
        record.tanggal,
        '08:00',
        '13:00',
        true,
        record.jenisIjin,
        record.lampiranSurat
      );
      return {
        ...record,
        hari: 'Sabtu',
        durasiMenit: calc.durasiMenit, // 300 mnt
        jamAwal: record.jamAwal || '08:00',
        jamAkhir: record.jamAkhir || '13:00',
        faktorPotongan: record.faktorPotongan !== undefined ? record.faktorPotongan : calc.faktorPotongan,
      };
    }
  }

  // 2. Izin parsial dengan jam awal dan akhir
  if (!isFullDay && record.jamAwal && record.jamAkhir) {
    const calc = calculateEffectivePermitMinutes(
      record.tanggal,
      record.jamAwal,
      record.jamAkhir,
      false,
      record.jenisIjin,
      record.lampiranSurat
    );

    return {
      ...record,
      hari: sched.dayName,
      durasiMenit: calc.durasiMenit,
      faktorPotongan: record.faktorPotongan !== undefined ? record.faktorPotongan : calc.faktorPotongan,
    };
  }

  // 3. Ijin sehari penuh pada hari Senin-Jumat
  if (isFullDay && sched.dayOfWeek >= 1 && sched.dayOfWeek <= 5) {
    return {
      ...record,
      hari: sched.dayName,
      durasiMenit: 420,
    };
  }

  return record;
}
