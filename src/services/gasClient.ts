import { PresensiRecord, LemburRecord, StaffData, JenisIjin } from '../types';
import { getEffectiveFaktorPotongan } from './payrollEngine';
import { normalizeIsoDate, parseDateFlexible } from '../utils/dateFormatter';
import { DEFAULT_GAS_API_URL } from './storageService';

export interface GasResponse<T = unknown> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  count?: number;
  rowNum?: number;
  noUrut?: number;
  timestamp?: string;
}

const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
let isStaticHostingMode = false;

export function cleanGasTime(val: unknown, fallback: string = '08:00'): string {
  if (!val) return fallback;
  const s = String(val).trim();
  if (s.includes(':') && s.length <= 8 && !s.includes('T')) {
    return s.substring(0, 5);
  }
  if (s.includes('T')) {
    const dt = new Date(s);
    if (!isNaN(dt.getTime())) {
      const wib = new Date(dt.getTime() + WIB_OFFSET_MS);
      const hh = String(wib.getUTCHours()).padStart(2, '0');
      const mm = String(wib.getUTCMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    }
  }
  return s.length > 5 ? s.substring(0, 5) : s || fallback;
}

/**
 * Helper to fetch GAS API with intelligent fallback:
 * If an internal route (like /api or /api/gas) returns HTML (which Cloudflare SPA mode serves as index.html),
 * or if the endpoint fails, it caches static hosting mode and automatically falls back to direct fetch to DEFAULT_GAS_API_URL with CORS.
 */
async function safeGasFetch(
  apiUrl: string,
  options?: {
    queryParams?: Record<string, string>;
    method?: 'GET' | 'POST';
    body?: string;
    headers?: Record<string, string>;
    mode?: RequestMode;
  }
): Promise<{ ok: boolean; status: number; text: string; json: any; isHtml: boolean }> {
  const method = options?.method || 'GET';
  const queryStr = options?.queryParams ? new URLSearchParams(options.queryParams).toString() : '';

  // Clean apiUrl
  let targetUrl = (apiUrl || '').trim();
  const isInternalApiRoute = targetUrl.startsWith('/') || targetUrl.includes('/api');
  if (!targetUrl || (isInternalApiRoute && isStaticHostingMode)) {
    targetUrl = DEFAULT_GAS_API_URL;
  }

  const buildUrl = (baseUrl: string) => {
    if (!queryStr) return baseUrl;
    return baseUrl.includes('?') ? `${baseUrl}&${queryStr}` : `${baseUrl}?${queryStr}`;
  };

  const executeFetch = async (url: string, mode: RequestMode = 'cors') => {
    const fullUrl = buildUrl(url);
    const headers: Record<string, string> = {
      ...(options?.headers || {}),
    };
    if (method === 'GET' && !headers.Accept) {
      headers.Accept = 'application/json, text/plain, */*';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    let res: Response;
    try {
      res = await fetch(fullUrl, {
        method,
        headers,
        body: options?.body,
        mode,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    // If mode is 'no-cors', response is opaque (status 0, ok false, empty body)
    if (mode === 'no-cors') {
      return { ok: true, status: 200, text: '', json: { status: 'success' }, isHtml: false };
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const text = await res.text();
    const trimmedLower = text.trim().toLowerCase();
    const isHtml =
      contentType.includes('text/html') ||
      trimmedLower.startsWith('<!doctype html') ||
      trimmedLower.startsWith('<html') ||
      trimmedLower.startsWith('<') ||
      text.includes('<div id="root"');

    let json: any = null;
    if (!isHtml) {
      try {
        json = JSON.parse(text);
      } catch (_) {}
    }

    return { ok: res.ok, status: res.status, text, json, isHtml };
  };

  try {
    const result = await executeFetch(targetUrl, options?.mode || 'cors');

    // If response is HTML (Cloudflare SPA fallback because /api has no backend proxy) or 404/500 on relative path
    if (result.isHtml || (!result.ok && (targetUrl.startsWith('/') || targetUrl.includes('/api')))) {
      if (targetUrl.startsWith('/') || targetUrl.includes('/api')) {
        isStaticHostingMode = true;
      }
      if (targetUrl !== DEFAULT_GAS_API_URL) {
        console.warn(
          `[gasClient] Deteksi respons HTML / route internal pada "${targetUrl}". Mengaktifkan otomatis direct fetch ke endpoint Google Apps Script (${DEFAULT_GAS_API_URL}) dengan CORS.`
        );
        return await executeFetch(DEFAULT_GAS_API_URL, 'cors');
      }
    }
    return result;
  } catch (err) {
    // Network / CORS error on targetUrl: fallback to direct GAS endpoint
    if (targetUrl !== DEFAULT_GAS_API_URL) {
      if (targetUrl.startsWith('/') || targetUrl.includes('/api')) {
        isStaticHostingMode = true;
      }
      console.warn(
        `[gasClient] Fetch ke "${targetUrl}" gagal (${err}). Mengalihkan ke direct fetch Google Apps Script (${DEFAULT_GAS_API_URL})...`
      );
      try {
        return await executeFetch(DEFAULT_GAS_API_URL, 'cors');
      } catch (directErr) {
        // If POST failed on CORS, try mode: 'no-cors' so GAS still receives doPost
        if (method === 'POST') {
          console.warn('[gasClient] Mencoba fallback mode no-cors untuk Google Apps Script...');
          return await executeFetch(DEFAULT_GAS_API_URL, 'no-cors');
        }
        throw directErr;
      }
    }
    // If it's already DEFAULT_GAS_API_URL and POST fails on CORS, try no-cors
    if (method === 'POST') {
      try {
        return await executeFetch(DEFAULT_GAS_API_URL, 'no-cors');
      } catch (_) {}
    }
    throw err;
  }
}

export const gasClient = {
  async ping(apiUrl: string): Promise<GasResponse> {
    if (!apiUrl) throw new Error('URL API Google Apps Script belum dikonfigurasi');
    if (apiUrl.includes('AKfycbzGZsSs2ZviyLMM0csjmMDXZDMpC9ZhuvheEb97g9KM1AZW8mlhSUPBc8o8YJp_9zg')) {
      return {
        status: 'error',
        message: 'Peringatan: URL ini terhubung ke Spreadsheet HR Pekerja Pabrik (11NpDy...), BUKAN HR Staff (1KzEFolz...). Data pekerja tidak boleh tertukar dengan data staf.',
      };
    }
    const res = await safeGasFetch(apiUrl, {
      queryParams: { action: 'ping' },
    });
    if (res.json && res.json.status) {
      return res.json as GasResponse;
    }
    if (res.isHtml) {
      throw new Error('API mengembalikan halaman HTML (Cloudflare SPA). Endpoint GAS direct fallback telah dicoba.');
    }
    return { status: 'success', message: 'Koneksi ke endpoint Google Apps Script berhasil' };
  },

  async fetchStaff(apiUrl: string): Promise<GasResponse<StaffData[]>> {
    if (apiUrl.includes('AKfycbzGZsSs2ZviyLMM0csjmMDXZDMpC9ZhuvheEb97g9KM1AZW8mlhSUPBc8o8YJp_9zg')) {
      throw new Error('URL ini adalah endpoint HR Pekerja Pabrik, bukan HR Staff.');
    }
    const res = await safeGasFetch(apiUrl, {
      queryParams: { action: 'get_staff' },
    });
    if (res.json && res.json.status === 'success' && Array.isArray(res.json.data)) {
      return res.json as GasResponse<StaffData[]>;
    }
    throw new Error(res.json?.message || 'Gagal membaca data staf dari Google Apps Script');
  },

  async fetchPresensi(apiUrl: string, staffList?: StaffData[]): Promise<GasResponse<PresensiRecord[]>> {
    if (!apiUrl) throw new Error('URL API Google Apps Script belum dikonfigurasi');
    if (apiUrl.includes('AKfycbzGZsSs2ZviyLMM0csjmMDXZDMpC9ZhuvheEb97g9KM1AZW8mlhSUPBc8o8YJp_9zg')) {
      throw new Error(
        'Peringatan: URL ini terhubung ke Spreadsheet HR Pekerja Pabrik (11NpDy...). Aplikasi ini adalah portal HR Staff (1KzEFolz...). Mohon gunakan sinkronisasi spreadsheet staff langsung.'
      );
    }

    // 1. Coba endpoint action getPresensi (camelCase pada GAS produksi aktif)
    let rawJson: any = null;
    let fetchError: string | null = null;

    const res1 = await safeGasFetch(apiUrl, { queryParams: { action: 'getPresensi' } });
    if (res1.json && res1.json.status === 'success' && Array.isArray(res1.json.data)) {
      rawJson = res1.json;
    } else {
      fetchError = res1.json?.message || (res1.isHtml ? 'Respons berupa HTML' : `HTTP ${res1.status}`);
      // 2. Fallback jika getPresensi gagal atau tidak dikenali, coba get_presensi
      const res2 = await safeGasFetch(apiUrl, { queryParams: { action: 'get_presensi' } });
      if (res2.json && res2.json.status === 'success' && Array.isArray(res2.json.data)) {
        rawJson = res2.json;
      } else if (!fetchError) {
        fetchError = res2.json?.message || `HTTP ${res2.status}`;
      }
    }

    if (!rawJson || rawJson.status !== 'success' || !Array.isArray(rawJson.data)) {
      const msg = rawJson?.message || fetchError || 'Gagal menarik data presensi dari Google Apps Script';
      throw new Error(msg);
    }

    const rawList: any[] = rawJson.data || [];

    // Transformasi data mentah GAS ke format presisi PresensiRecord
    const records: PresensiRecord[] = rawList.map((r, idx) => {
      const rowNum = Number(r.rowNum) || idx + 1;
      const rawTgl = String(r.tanggalIso || r.tanggal || '').trim();
      const parsedDt = parseDateFlexible(rawTgl);
      const isoDate = normalizeIsoDate(rawTgl) || rawTgl;
      const bulan = parsedDt ? parsedDt.getMonth() + 1 : (Number(r.bulan) || 10);
      const tahun = parsedDt ? parsedDt.getFullYear() : (Number(r.tahun) || 2026);

      let hari = 'Hari';
      if (parsedDt && !isNaN(parsedDt.getTime())) {
        hari = INDO_DAYS[parsedDt.getDay()];
      }

      const nama = String(r.nama || '').trim();
      const st = staffList?.find((s) => s.nama.toLowerCase() === nama.toLowerCase());
      const nip = st?.nip || r.nip || `BK-PP1-${String((rowNum % 1000)).padStart(3, '0')}`;

      const jamAwal = cleanGasTime(r.jamAwal, '08:00');
      const jamAkhir = cleanGasTime(r.jamAkhir, '15:00');

      let durasiMenit = Math.round(Number(r.durasiMenit) || 0);
      // Jika durasi 0 tetapi jamAwal dan jamAkhir terisi dengan benar, hitung selisihnya
      if (durasiMenit <= 0 && jamAwal && jamAkhir && jamAwal !== jamAkhir) {
        const [h1, m1] = jamAwal.split(':').map(Number);
        const [h2, m2] = jamAkhir.split(':').map(Number);
        if (!isNaN(h1) && !isNaN(m1) && !isNaN(h2) && !isNaN(m2)) {
          const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
          if (diff > 0) durasiMenit = diff;
        }
      }

      const jenisIjin = (r.jenisIjin || 'Hadir') as JenisIjin;
      const rawLampiran = String(r.lampiranSurat || r.lampiran || 'Tidak').trim();
      const lampiranSurat = rawLampiran.toLowerCase().includes('form')
        ? 'Form Izin Perusahaan'
        : rawLampiran.toLowerCase() === 'ya'
        ? 'Ya'
        : 'Tidak';

      const parsedFaktor = Number(r.faktorPotongan);
      const faktorPotongan = getEffectiveFaktorPotongan({
        jenisIjin,
        durasiMenit,
        lampiranSurat,
        catatan: String(r.catatan || ''),
        faktorPotongan: isNaN(parsedFaktor) ? undefined : parsedFaktor,
      });

      return {
        id: `pr-gas-${rowNum}`,
        rowNum,
        tanggal: isoDate,
        hari,
        nip,
        nama,
        jamAwal,
        jamAkhir,
        durasiMenit,
        jenisIjin,
        faktorPotongan,
        keperluan: String(r.keperluan || '').trim(),
        lampiranSurat,
        catatan: String(r.catatan || '').trim(),
        bulan,
        tahun,
        shift: 'Shift 1',
        geofenceValid: true,
      };
    });

    // Urutkan tanggal menurun (paling baru seperti Oktober 2026 di atas)
    records.sort((a, b) => {
      const tA = new Date(a.tanggal).getTime();
      const tB = new Date(b.tanggal).getTime();
      if (tB !== tA) return tB - tA;
      return (b.rowNum || 0) - (a.rowNum || 0);
    });

    return {
      status: 'success',
      data: records,
      count: records.length,
      timestamp: rawJson.timestamp || new Date().toISOString(),
    };
  },

  async pushPresensi(apiUrl: string, record: PresensiRecord): Promise<GasResponse> {
    const body = JSON.stringify({ action: 'save_presensi', record });
    const res = await safeGasFetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
    });
    if (res.json && res.json.status) {
      return res.json as GasResponse;
    }
    return { status: 'success', message: 'Tersimpan ke Google Spreadsheet' };
  },

  async updatePresensi(apiUrl: string, record: Partial<PresensiRecord>, rowNum?: number): Promise<GasResponse> {
    const body = JSON.stringify({ action: 'update_presensi', record, rowNum });
    const res = await safeGasFetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
    });
    if (res.json && res.json.status) {
      return res.json as GasResponse;
    }
    return { status: 'success', message: 'Update tersimpan ke Google Spreadsheet' };
  },

  async deletePresensi(apiUrl: string, record: { id?: string; rowNum?: number; nama?: string; tanggal?: string }): Promise<GasResponse> {
    const body = JSON.stringify({ action: 'delete_presensi', record, rowNum: record.rowNum });
    const res = await safeGasFetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
    });
    if (res.json && res.json.status) {
      return res.json as GasResponse;
    }
    return { status: 'success', message: 'Hapus tersimpan ke Google Spreadsheet' };
  },

  async deleteStaff(apiUrl: string, staff: { nip: string; nama?: string }): Promise<GasResponse> {
    const body = JSON.stringify({ action: 'delete_staff', nip: staff.nip, nama: staff.nama });
    const res = await safeGasFetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
    });
    if (res.json && res.json.status) {
      return res.json as GasResponse;
    }
    return { status: 'success', message: 'Staf berhasil dihapus dari Spreadsheet' };
  },

  async pushLembur(apiUrl: string, record: LemburRecord): Promise<GasResponse> {
    const body = JSON.stringify({ action: 'save_lembur', record });
    const res = await safeGasFetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
    });
    if (res.json && res.json.status) {
      return res.json as GasResponse;
    }
    return { status: 'success', message: 'Lembur berhasil disimpan ke Spreadsheet' };
  },
};
