import { PresensiRecord, LemburRecord, StaffData } from '../types';

export interface GasResponse<T = unknown> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  count?: number;
  timestamp?: string;
}

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

  async fetchPresensi(apiUrl: string): Promise<GasResponse<PresensiRecord[]>> {
    const endpoint = `${apiUrl}?action=get_presensi`;
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Gagal membaca presensi: ${res.statusText}`);
    return (await res.json()) as GasResponse<PresensiRecord[]>;
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
