/**
 * STANDAR FORMAT TANGGAL & WAKTU BAHASA INDONESIA (LOCALE ID-ID)
 * PT BATU KARANG — HR STAFF & KARYAWAN
 */

export const NAMA_HARI_INDO = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
] as const;

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
] as const;

export const NAMA_BULAN_PENDEK_INDO = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agt',
  'Sep',
  'Okt',
  'Nov',
  'Des',
] as const;

/**
 * Parse any date string (ISO, YYYY-MM-DD, DD/MM/YYYY) into a valid Date object
 */
export function parseDateFlexible(val?: string | Date | null): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

  const s = String(val).trim();
  if (s.toLowerCase().includes('tidak') || s.toLowerCase().includes('tetap')) return null;

  // DD/MM/YYYY
  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      const dt = new Date(y, m, d);
      return isNaN(dt.getTime()) ? null : dt;
    }
  }

  // YYYY-MM-DD
  if (s.includes('-')) {
    const parts = s.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dt = new Date(y, m, d);
        return isNaN(dt.getTime()) ? null : dt;
      } else {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        const dt = new Date(y, m, d);
        return isNaN(dt.getTime()) ? null : dt;
      }
    }
  }

  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt;
}

/**
 * Format date in numeric Indonesian format: DD/MM/YYYY
 * Example: 06/10/2026
 */
export function formatTanggalDmy(val?: string | Date | null): string {
  const dt = parseDateFlexible(val);
  if (!dt) return typeof val === 'string' && val ? val : '-';

  const d = String(dt.getDate()).padStart(2, '0');
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const y = dt.getFullYear();
  return `${d}/${m}/${y}`;
}

/**
 * Format full date in Indonesian words: "6 Oktober 2026"
 * or with day: "Selasa, 6 Oktober 2026"
 */
export function formatTanggalIndo(
  val?: string | Date | null,
  withDay: boolean = false
): string {
  const dt = parseDateFlexible(val);
  if (!dt) return typeof val === 'string' && val ? val : '-';

  const d = dt.getDate();
  const m = NAMA_BULAN_INDO[dt.getMonth()];
  const y = dt.getFullYear();
  const base = `${d} ${m} ${y}`;

  if (withDay) {
    const hari = NAMA_HARI_INDO[dt.getDay()];
    return `${hari}, ${base}`;
  }
  return base;
}

/**
 * Get Indonesian day name for a given date
 */
export function getNamaHariIndo(val?: string | Date | null): string {
  const dt = parseDateFlexible(val);
  if (!dt) return 'Hari';
  return NAMA_HARI_INDO[dt.getDay()];
}

/**
 * Format time in WIB: "14:30 WIB" or "14:30:45 WIB"
 */
export function formatWaktuWib(val?: string | Date | null, withSeconds: boolean = false): string {
  const dt = parseDateFlexible(val) || (val ? null : new Date());
  if (!dt) return typeof val === 'string' && val ? val : '-';

  return (
    dt.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: withSeconds ? '2-digit' : undefined,
      hour12: false,
    }) + ' WIB'
  );
}

/**
 * Format full datetime in Indonesian: "Selasa, 6 Oktober 2026, 14:30 WIB"
 */
export function formatTanggalWaktuIndo(val?: string | Date | null): string {
  const dt = parseDateFlexible(val) || (val ? null : new Date());
  if (!dt) return '-';

  const tglStr = formatTanggalIndo(dt, true);
  const timeStr = dt.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${tglStr}, ${timeStr} WIB`;
}

/**
 * Current date string in YYYY-MM-DD for HTML input[type="date"]
 */
export function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
