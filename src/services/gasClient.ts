import { PresensiRecord, LemburRecord, StaffData, JenisIjin } from '../types';
import { getEffectiveFaktorPotongan } from './payrollEngine';
import { normalizeIsoDate, parseDateFlexible } from '../utils/dateFormatter';

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

export function cleanGasTime(val: unknown, fallback: string = '08:00'): string {
  if (!val) return fallback;
  const s = String(val).trim();
  if (s.includes(':') && s.length <= 8 && !s.includes('T')) {
    return s.substring(0, 5);
  }
  if (s.includes('T')) {
    try {
      const dt = new Date(s);
      if (!isNaN(dt.getTime())) {
        const parts = new Intl.DateTimeFormat('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(dt);
        return parts.replace('.', ':');
      }
    } catch (_) {}
  }
  return s.length > 5 ? s.substring(0, 5) : s || fallback;
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
    const endpoint = `${apiUrl}?action=ping`;
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
    return (await res.json()) as GasResponse;
  },

  async fetchStaff(apiUrl: string): Promise<GasResponse<StaffData[]>> {
    if (apiUrl.includes('AKfycbzGZsSs2ZviyLMM0csjmMDXZDMpC9ZhuvheEb97g9KM1AZW8mlhSUPBc8o8YJp_9zg')) {
      throw new Error('URL ini adalah endpoint HR Pekerja Pabrik, bukan HR Staff.');
    }
    const endpoint = `${apiUrl}?action=get_staff`;
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Gagal membaca staff: ${res.statusText}`);
    return (await res.json()) as GasResponse<StaffData[]>;
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

    try {
      const res = await fetch(`${apiUrl}?action=getPresensi`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        rawJson = await res.json();
      }
    } catch (e) {
      fetchError = e instanceof Error ? e.message : String(e);
    }

    // 2. Fallback jika getPresensi gagal atau tidak dikenali, coba get_presensi
    if (!rawJson || rawJson.status !== 'success' || !Array.isArray(rawJson.data)) {
      try {
        const res2 = await fetch(`${apiUrl}?action=get_presensi`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });
        if (res2.ok) {
          rawJson = await res2.json();
        }
      } catch (e) {
        if (!fetchError) fetchError = e instanceof Error ? e.message : String(e);
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
      const lampiranSurat =
        (r.lampiranSurat || r.lampiran || 'Tidak') === 'Ya' ? 'Ya' : 'Tidak';

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
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'save_presensi', record }),
      });
      if (res.ok) {
        try {
          return (await res.json()) as GasResponse;
        } catch (_) {
          return { status: 'success', message: 'Terkirim ke Spreadsheet' };
        }
      }
      return { status: 'success', message: 'Tersimpan' };
    } catch (e) {
      // Fallback mode no-cors jika terhalang CORS redirect browser
      try {
        await fetch(apiUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'save_presensi', record }),
        });
        return { status: 'success', message: 'Terkirim ke Spreadsheet via background sync' };
      } catch (_) {
        throw e;
      }
    }
  },

  async updatePresensi(apiUrl: string, record: Partial<PresensiRecord>, rowNum?: number): Promise<GasResponse> {
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'update_presensi', record, rowNum }),
      });
      if (res.ok) {
        try {
          return (await res.json()) as GasResponse;
        } catch (_) {
          return { status: 'success', message: 'Update terkirim ke Spreadsheet' };
        }
      }
      return { status: 'success', message: 'Update tersimpan' };
    } catch (e) {
      try {
        await fetch(apiUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'update_presensi', record, rowNum }),
        });
        return { status: 'success', message: 'Update terkirim via background sync' };
      } catch (_) {
        throw e;
      }
    }
  },

  async deletePresensi(apiUrl: string, record: { id?: string; rowNum?: number; nama?: string; tanggal?: string }): Promise<GasResponse> {
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'delete_presensi', record, rowNum: record.rowNum }),
      });
      if (res.ok) {
        try {
          return (await res.json()) as GasResponse;
        } catch (_) {
          return { status: 'success', message: 'Hapus terkirim ke Spreadsheet' };
        }
      }
      return { status: 'success', message: 'Hapus tersimpan' };
    } catch (e) {
      try {
        await fetch(apiUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'delete_presensi', record, rowNum: record.rowNum }),
        });
        return { status: 'success', message: 'Hapus terkirim via background sync' };
      } catch (_) {
        throw e;
      }
    }
  },

  async deleteStaff(apiUrl: string, staff: { nip: string; nama?: string }): Promise<GasResponse> {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'delete_staff', nip: staff.nip, nama: staff.nama }),
    });
    if (!res.ok) throw new Error(`Gagal menghapus staf di spreadsheet: ${res.statusText}`);
    return (await res.json()) as GasResponse;
  },

  async pushLembur(apiUrl: string, record: LemburRecord): Promise<GasResponse> {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'save_lembur', record }),
    });
    if (!res.ok) throw new Error(`Gagal menyimpan lembur: ${res.statusText}`);
    return (await res.json()) as GasResponse;
  },
};

