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

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const MAX_DATE_CACHE_SIZE = 2000;
const parsedDateCache = new Map<string, number | null>();
const isoDateCache = new Map<string, string>();

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function toWibUtcDate(dt: Date): Date {
  return new Date(dt.getTime() + WIB_OFFSET_MS);
}

function setBoundedCache<K, V>(cache: Map<K, V>, key: K, value: V): void {
  if (cache.size >= MAX_DATE_CACHE_SIZE) {
    cache.clear();
  }
  cache.set(key, value);
}

/**
 * Parse any date string (ISO, YYYY-MM-DD, DD/MM/YYYY) into a valid Date object
 */
export function parseDateFlexible(val?: string | Date | null): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

  const s = String(val).trim();
  if (!s) return null;

  if (parsedDateCache.has(s)) {
    const cachedMs = parsedDateCache.get(s);
    return cachedMs === null || cachedMs === undefined ? null : new Date(cachedMs);
  }

  const lower = s.toLowerCase();
  if (lower.includes('tidak') || lower.includes('tetap')) {
    setBoundedCache(parsedDateCache, s, null);
    return null;
  }

  let result: Date | null = null;

  // DD/MM/YYYY
  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      const dt = new Date(y, m, d);
      result = isNaN(dt.getTime()) ? null : dt;
      setBoundedCache(parsedDateCache, s, result ? result.getTime() : null);
      return result;
    }
  }

  // YYYY-MM-DD or DD-MM-YYYY (without time part)
  if (s.includes('-') && !s.includes('T')) {
    const parts = s.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dt = new Date(y, m, d);
        result = isNaN(dt.getTime()) ? null : dt;
      } else {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        const dt = new Date(y, m, d);
        result = isNaN(dt.getTime()) ? null : dt;
      }
      setBoundedCache(parsedDateCache, s, result ? result.getTime() : null);
      return result;
    }
  }

  const dt = new Date(s);
  result = isNaN(dt.getTime()) ? null : dt;
  setBoundedCache(parsedDateCache, s, result ? result.getTime() : null);
  return result;
}

/**
 * Normalize any date representation to standard ISO string (YYYY-MM-DD) using permanent UTC+7 WIB for ISO timestamps
 * Handles "13/10/2026", "13-10-2026", "2026-10-13", Date instances, etc.
 */
export function normalizeIsoDate(val?: string | Date | null): string {
  if (!val) return '';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return '';
    const cached = isoDateCache.get(trimmed);
    if (cached !== undefined) return cached;

    const dt = parseDateFlexible(trimmed);
    let normalized = trimmed;
    if (dt) {
      if (trimmed.includes('T')) {
        const wib = toWibUtcDate(dt);
        normalized = `${wib.getUTCFullYear()}-${pad2(wib.getUTCMonth() + 1)}-${pad2(wib.getUTCDate())}`;
      } else {
        normalized = `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
      }
    }
    setBoundedCache(isoDateCache, trimmed, normalized);
    return normalized;
  }

  const dt = parseDateFlexible(val);
  if (!dt) return '';
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

/**
 * Format date in numeric Indonesian format: DD/MM/YYYY
 * Example: 06/10/2026
 */
export function formatTanggalDmy(val?: string | Date | null): string {
  const dt = parseDateFlexible(val);
  if (!dt) return typeof val === 'string' && val ? val : '-';

  const d = pad2(dt.getDate());
  const m = pad2(dt.getMonth() + 1);
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
 * Format time in WIB using permanent UTC+7 arithmetic: "14:30 WIB" or "14:30:45 WIB"
 */
export function formatWaktuWib(val?: string | Date | null, withSeconds: boolean = false): string {
  const dt = parseDateFlexible(val) || (val ? null : new Date());
  if (!dt) return typeof val === 'string' && val ? val : '-';

  const wib = toWibUtcDate(dt);
  const hh = pad2(wib.getUTCHours());
  const mm = pad2(wib.getUTCMinutes());
  if (withSeconds) {
    const ss = pad2(wib.getUTCSeconds());
    return `${hh}:${mm}:${ss} WIB`;
  }
  return `${hh}:${mm} WIB`;
}

/**
 * Format full datetime in Indonesian (WIB UTC+7): "Selasa, 6 Oktober 2026, 14:30 WIB"
 */
export function formatTanggalWaktuIndo(val?: string | Date | null): string {
  const dt = parseDateFlexible(val) || (val ? null : new Date());
  if (!dt) return '-';

  const wib = toWibUtcDate(dt);
  const hari = NAMA_HARI_INDO[wib.getUTCDay()];
  const tgl = wib.getUTCDate();
  const bln = NAMA_BULAN_INDO[wib.getUTCMonth()];
  const thn = wib.getUTCFullYear();
  const hh = pad2(wib.getUTCHours());
  const mm = pad2(wib.getUTCMinutes());

  return `${hari}, ${tgl} ${bln} ${thn}, ${hh}:${mm} WIB`;
}

/**
 * Current date string in YYYY-MM-DD (WIB UTC+7) for HTML input[type="date"]
 */
export function getTodayIsoDate(): string {
  const wib = toWibUtcDate(new Date());
  const y = wib.getUTCFullYear();
  const m = pad2(wib.getUTCMonth() + 1);
  const d = pad2(wib.getUTCDate());
  return `${y}-${m}-${d}`;
}
