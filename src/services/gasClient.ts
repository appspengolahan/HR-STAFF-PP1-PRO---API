import { PresensiRecord, LemburRecord, StaffData, JenisIjin } from '../types';

export interface GasResponse<T = unknown> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  count?: number;
  timestamp?: string;
}

const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const gasClient = {
  async ping(apiUrl: string): Promise<GasResponse> {
    if (!apiUrl) throw new Error('URL API Google Apps Script belum dikonfigurasi');
    const endpoint = `${apiUrl}?action=ping`;
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
    return (await res.json()) as GasResponse;
  },

  async fetchStaff(apiUrl: string): Promise<GasResponse<StaffData[]>> {
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
      let isoDate = rawTgl;
      let bulan = 10;
      let tahun = 2026;

      if (rawTgl.includes('-')) {
        const p = rawTgl.split('-');
        if (p.length === 3) {
          tahun = parseInt(p[0], 10);
          bulan = parseInt(p[1], 10);
          isoDate = rawTgl;
        }
      } else if (rawTgl.includes('/')) {
        const p = rawTgl.split('/');
        if (p.length === 3) {
          isoDate = `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
          bulan = parseInt(p[1], 10);
          tahun = parseInt(p[2], 10);
        }
      }

      let hari = 'Hari';
      try {
        const dt = new Date(isoDate);
        if (!isNaN(dt.getTime())) {
          hari = INDO_DAYS[dt.getDay()];
        }
      } catch (_) {}

      const nama = String(r.nama || '').trim();
      const st = staffList?.find((s) => s.nama.toLowerCase() === nama.toLowerCase());
      const nip = st?.nip || r.nip || `BK-PP1-${String((rowNum % 1000)).padStart(3, '0')}`;

      const durasiMenit = Number(r.durasiMenit) || 0;
      const jenisIjin = (r.jenisIjin || 'Hadir') as JenisIjin;

      let faktorPotongan = Number(r.faktorPotongan);
      if (isNaN(faktorPotongan)) {
        if (['Sakit (S Tangan)', 'Ijin (S Tangan)', 'Alpha'].includes(jenisIjin)) {
          faktorPotongan = 1;
        } else if (['Ijin Terlambat', 'Ijin Keluar Sementara', 'Ijin Pulang Awal'].includes(jenisIjin)) {
          faktorPotongan = durasiMenit <= 120 ? 0 : durasiMenit < 240 ? 0.5 : 1;
        } else {
          faktorPotongan = 0;
        }
      }

      const lampiranSurat =
        (r.lampiranSurat || r.lampiran || 'Tidak') === 'Ya' ? 'Ya' : 'Tidak';

      return {
        id: `pr-gas-${rowNum}`,
        rowNum,
        tanggal: isoDate,
        hari,
        nip,
        nama,
        jamAwal: String(r.jamAwal || '08:00').trim(),
        jamAkhir: String(r.jamAkhir || '15:00').trim(),
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
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'save_presensi', record }),
    });
    if (!res.ok) throw new Error(`Gagal menyimpan presensi: ${res.statusText}`);
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

