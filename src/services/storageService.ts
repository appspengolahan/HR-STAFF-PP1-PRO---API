import {
  AuthUser,
  CalonKaryawan,
  CutiRecord,
  GasConfig,
  KpiRecord,
  LemburRecord,
  LinkArsip,
  MutasiRecord,
  PresensiRecord,
  StaffData,
  DeletedArchiveRecord,
  UserRole,
  RolePermission,
  AppBrandingSettings,
} from '../types';
import {
  INITIAL_CALON_LIST,
  INITIAL_CUTI_LIST,
  INITIAL_KPI_LIST,
  INITIAL_LEMBUR_LIST,
  INITIAL_LINKS,
  INITIAL_MUTASI_LIST,
  INITIAL_PRESENSI_LIST,
  INITIAL_STAFF_LIST,
} from '../data/initialData';
import { getEffectiveFaktorPotongan } from './payrollEngine';
import { formatWaktuWib, normalizeIsoDate } from '../utils/dateFormatter';

export interface ColumnVisibilitySettings {
  showGajiPokok: boolean;
  showTunjanganJabatan: boolean;
}

export const DEFAULT_BRANDING: AppBrandingSettings = {
  appName: 'HR STAFF - PRODUKSI I',
  appShortName: 'HR STAFF I',
  appSubtitle: 'PT Batu Karang — Divisi Produksi I (PP1)',
  companyName: 'PT BATU KARANG',
  badgeText: 'PP1',
  updatedAt: '2026-10-14T00:00:00.000Z',
};

const KEYS = {
  STAFF: 'bk_hr_staff_list_v3',
  PRESENSI: 'bk_hr_presensi_list_v3',
  PRESENSI_MANUAL: 'bk_hr_presensi_manual_v3',
  LEMBUR: 'bk_hr_lembur_list_v3',
  CUTI: 'bk_hr_cuti_list_v3',
  MUTASI: 'bk_hr_mutasi_list_v3',
  CALON: 'bk_hr_calon_list_v3',
  LINKS: 'bk_hr_links_list_v3',
  KPI: 'bk_hr_kpi_list_v3',
  ARCHIVE: 'bk_hr_deleted_archive_v3',
  AUTH_USER: 'bk_hr_auth_user_v3',
  GAS_CONFIG: 'bk_hr_gas_config_v3',
  THEME_MODE: 'bk_hr_theme_mode_v3',
  SIDEBAR_COLLAPSED: 'bk_hr_sidebar_collapsed_v3',
  COLUMN_SETTINGS: 'bk_hr_column_settings_v4',
  BRANDING: 'bk_hr_app_branding_v3',
  STAFF_PINS: 'bk_hr_staff_pins_v3',
  STAFF_PINS_BACKUP: 'bk_hr_staff_pins_permanent_backup',
  ROLES: 'bk_hr_custom_roles_v3',
};

export const DEFAULT_STAFF_PIN = '123456';

export const DEFAULT_ROLE_PERMISSIONS: RolePermission[] = [
  {
    id: 'role-dev',
    role: 'Lead Developer',
    desc: 'Super User: Konfigurasi sistem, debugging REST GAS, & override data',
    defaultTabs: ['dashboard', 'presensi', 'lembur', 'rekap', 'slip', 'cuti', 'kpi', 'database', 'mutasi', 'pelatihan', 'profil', 'hakakses', 'pengaturan'],
    userCount: 1,
    isSystem: true,
  },
  {
    id: 'role-pm',
    role: 'Project Manager',
    desc: 'Lalu Mahendra Ali Akbar: Kontrol operasional PP1 penuh & approval',
    defaultTabs: ['dashboard', 'presensi', 'lembur', 'rekap', 'slip', 'cuti', 'kpi', 'database', 'mutasi', 'pelatihan', 'profil', 'hakakses', 'pengaturan'],
    userCount: 1,
    isSystem: true,
  },
  {
    id: 'role-site',
    role: 'Site Engineer',
    desc: 'Andhik Dharmabakti: Monitoring OEE mesin, presensi shift, & lembur',
    defaultTabs: ['dashboard', 'presensi', 'lembur', 'kpi', 'database', 'profil', 'pengaturan'],
    userCount: 2,
    isSystem: true,
  },
  {
    id: 'role-hr',
    role: 'Admin HR',
    desc: 'Personalia: Presensi harian, berkas izin, PKWT & database staf',
    defaultTabs: ['dashboard', 'presensi', 'lembur', 'rekap', 'cuti', 'database', 'mutasi', 'pelatihan', 'profil', 'pengaturan'],
    userCount: 2,
    isSystem: true,
  },
  {
    id: 'role-finance',
    role: 'Finance',
    desc: 'Keuangan & Pajak: Slip gaji, perhitungan PPh21 TER, & BPJS',
    defaultTabs: ['dashboard', 'slip', 'rekap', 'database', 'profil', 'pengaturan'],
    userCount: 2,
    isSystem: true,
  },
  {
    id: 'role-dept',
    role: 'Kepala Dept',
    desc: 'Supervisi Departemen: Approval cuti & matriks KPI bulanan',
    defaultTabs: ['dashboard', 'presensi', 'lembur', 'cuti', 'kpi', 'profil'],
    userCount: 4,
    isSystem: true,
  },
  {
    id: 'role-staff',
    role: 'Staf',
    desc: 'Portal Mandiri Karyawan: Akses terisolasi slip gaji & profil pribadi',
    defaultTabs: ['slip', 'presensi', 'cuti', 'profil'],
    userCount: 24,
    isSystem: true,
  },
];

// Cleanup old obsolete v1 and v2 keys (PENTING: Jangan hapus staff_pins, branding, atau custom_roles)
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && (k.includes('staff_pins') || k.includes('branding') || k.includes('custom_roles'))) {
        continue; // Lindungi PIN staf, branding, dan custom roles agar tidak terhapus saat refresh
      }
      if (k && k.startsWith('bk_hr_') && (k.endsWith('_v1') || k.endsWith('_v2') || k.endsWith('_mock'))) {
        localStorage.removeItem(k);
      }
    }
  } catch (e) {
    // Ignore storage cleanup error
  }
}

const memoryCache = new Map<string, unknown>();
let cachedReconciledPresensi: {
  baseRef: PresensiRecord[];
  manualRef: PresensiRecord[];
  result: PresensiRecord[];
} | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key) {
      memoryCache.delete(e.key);
      if (e.key === KEYS.PRESENSI || e.key === KEYS.PRESENSI_MANUAL) {
        cachedReconciledPresensi = null;
      }
    } else {
      memoryCache.clear();
      cachedReconciledPresensi = null;
    }
  });
}

function readStorage<T>(key: string, fallback: T): T {
  if (memoryCache.has(key)) {
    return memoryCache.get(key) as T;
  }
  try {
    const val = localStorage.getItem(key);
    if (!val) {
      return fallback;
    }
    const parsed = JSON.parse(val) as T;
    memoryCache.set(key, parsed);
    return parsed;
  } catch (e) {
    console.warn(`Error reading key ${key} from localStorage:`, e);
    return fallback;
  }
}

function writeStorage<T>(key: string, data: T): void {
  memoryCache.set(key, data);
  if (key === KEYS.PRESENSI || key === KEYS.PRESENSI_MANUAL) {
    cachedReconciledPresensi = null;
  }
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving key ${key} to localStorage:`, e);
  }
}

export const DEFAULT_GAS_API_URL =
  'https://script.google.com/macros/s/AKfycbwp2EY-9bCx_5ja5wx6EHdKulCcXNWg5t5j7SfH_-mnvlHBTlsfXAhWK3MkP8Vt269m/exec';

export const storageService = {
  // Staff Master
  getStaffList(): StaffData[] {
    const list = readStorage<StaffData[]>(KEYS.STAFF, INITIAL_STAFF_LIST);
    const hasSumiati = list && list.some((s) => s.nama.toUpperCase().includes('SUMIATI'));
    // Enforce 32 staff Divisi Produksi 1 (purge any incorrect worker mock/mismatched data)
    if (!list || list.length !== 32 || hasSumiati) {
      writeStorage(KEYS.STAFF, INITIAL_STAFF_LIST);
      return INITIAL_STAFF_LIST;
    }
    // Verify each staff has pendidikanTerakhir and sync with applied mutations
    let needsUpdate = false;
    const verified = list.map((st) => {
      if (!st.pendidikanTerakhir) {
        needsUpdate = true;
        const initial = INITIAL_STAFF_LIST.find((init) => init.nip === st.nip);
        return {
          ...st,
          pendidikanTerakhir: initial?.pendidikanTerakhir || (st.jabatan.includes('Manajer') ? 'S1' : 'SMA/SMK'),
        } as StaffData;
      }
      return st;
    });

    // Sinkronisasi data staf dengan mutasi yang berstatus 'Diterapkan' secara immutable
    const mutasiList = readStorage<MutasiRecord[]>(KEYS.MUTASI, INITIAL_MUTASI_LIST);
    if (mutasiList && mutasiList.length > 0) {
      mutasiList.forEach((m) => {
        if (m.status === 'Diterapkan') {
          const sIdx = verified.findIndex((s) => s.nip === m.nip);
          if (sIdx !== -1) {
            const st = { ...verified[sIdx] };
            let stChanged = false;
            if (m.jenisMutasi === 'Status Kepegawaian') {
              if (m.nilaiBaru === 'TETAP' && st.status !== 'TETAP') {
                st.status = 'TETAP';
                st.akhirPKWT = 'Tidak berlaku (TETAP)';
                stChanged = true;
              } else if (m.nilaiBaru.startsWith('PKWT')) {
                if (st.status !== m.nilaiBaru) {
                  st.status = m.nilaiBaru as any;
                  stChanged = true;
                }
                if (
                  st.akhirPKWT &&
                  (st.akhirPKWT === '30/10/2026' ||
                    st.akhirPKWT === '29/09/2026' ||
                    st.akhirPKWT.includes('2026-10') ||
                    st.akhirPKWT.includes('2026-09'))
                ) {
                  st.awalPKWT = '01/11/2026';
                  st.akhirPKWT = '31/10/2027';
                  stChanged = true;
                }
              } else if (m.nilaiBaru.match(/^\d{4}-\d{2}-\d{2}$/) || m.nilaiBaru.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                if (st.akhirPKWT !== m.nilaiBaru) {
                  st.akhirPKWT = m.nilaiBaru;
                  stChanged = true;
                }
              }
            } else if (m.jenisMutasi === 'Jabatan' && st.jabatan !== m.nilaiBaru) {
              st.jabatan = m.nilaiBaru;
              stChanged = true;
            }
            if (stChanged) {
              verified[sIdx] = st;
              needsUpdate = true;
            }
          }
        }
      });
    }

    if (needsUpdate) {
      writeStorage(KEYS.STAFF, verified);
      return verified;
    }
    return list;
  },
  saveStaffList(list: StaffData[]): void {
    writeStorage(KEYS.STAFF, list);
  },
  addStaff(staff: StaffData): void {
    const list = [staff, ...this.getStaffList()];
    this.saveStaffList(list);
  },
  updateStaff(nip: string, patch: Partial<StaffData>): void {
    const list = [...this.getStaffList()];
    const idx = list.findIndex((s) => s.nip === nip);
    if (idx !== -1) {
      const updated = { ...list[idx], ...patch };
      updated.totalGaji = (updated.gajiPokok || 0) + (updated.tunjanganJabatan || 0);
      list[idx] = updated;
      this.saveStaffList(list);
    }
  },
  deleteStaff(nip: string, deletedBy: string): boolean {
    const list = this.getStaffList();
    const target = list.find((s) => s.nip === nip);
    if (!target) return false;

    // Archive to soft delete
    this.addDeletedArchive({
      id: 'arch-' + Date.now(),
      kategori: 'STAFF',
      waktuDihapus: new Date().toISOString(),
      dihapusOleh: deletedBy,
      nama: target.nama,
      nip: target.nip,
      detailJson: JSON.stringify(target),
    });

    const filtered = list.filter((s) => s.nip !== nip);
    this.saveStaffList(filtered);
    return true;
  },

  // Presensi
  getManualPresensiList(): PresensiRecord[] {
    return readStorage<PresensiRecord[]>(KEYS.PRESENSI_MANUAL, []);
  },
  saveManualPresensiList(list: PresensiRecord[]): void {
    writeStorage(KEYS.PRESENSI_MANUAL, list);
  },
  getPresensiList(): PresensiRecord[] {
    const list = readStorage<PresensiRecord[]>(KEYS.PRESENSI, INITIAL_PRESENSI_LIST);
    const rawManualList = this.getManualPresensiList();

    if (
      cachedReconciledPresensi &&
      cachedReconciledPresensi.baseRef === list &&
      cachedReconciledPresensi.manualRef === rawManualList
    ) {
      return cachedReconciledPresensi.result;
    }

    let manualList = [...rawManualList];

    const hasMatsukriOct7 = list && list.some(
      (p) => (p.tanggal === '2026-10-07' || p.tanggal === '07/10/2026') && p.nama.toLowerCase().includes('matsukri')
    );
    const hasDedikOct9 =
      (manualList && manualList.some((p) => p.nip === 'BK-PP1-017' && (p.tanggal === '2026-10-09' || p.tanggal === '09/10/2026'))) ||
      (list && list.some((p) => p.nip === 'BK-PP1-017' && (p.tanggal === '2026-10-09' || p.tanggal === '09/10/2026')));
    const hasDedikOct12 =
      (manualList && manualList.some((p) => p.nip === 'BK-PP1-017' && (p.tanggal === '2026-10-12' || p.tanggal === '12/10/2026'))) ||
      (list && list.some((p) => p.nip === 'BK-PP1-017' && (p.tanggal === '2026-10-12' || p.tanggal === '12/10/2026')));
    const hasDedikOct13 =
      (manualList && manualList.some((p) => p.nip === 'BK-PP1-017' && (p.tanggal === '2026-10-13' || p.tanggal === '13/10/2026'))) ||
      (list && list.some((p) => p.nip === 'BK-PP1-017' && (p.tanggal === '2026-10-13' || p.tanggal === '13/10/2026')));

    const hasSumiati = list && list.some((p) => p.nama.toUpperCase().includes('SUMIATI'));
    let baseList = (!list || list.length < 358 || !hasMatsukriOct7 || hasSumiati)
      ? INITIAL_PRESENSI_LIST
      : list;

    let manualDirty = false;
    if (!hasDedikOct9) {
      const dedikRec = INITIAL_PRESENSI_LIST.find(
        (p) => p.nip === 'BK-PP1-017' && p.tanggal === '2026-10-09'
      );
      if (dedikRec && !manualList.some((m) => m.id === dedikRec.id)) {
        manualList.unshift(dedikRec);
        manualDirty = true;
      }
    }
    if (!hasDedikOct12) {
      const dedikRec12 = INITIAL_PRESENSI_LIST.find(
        (p) => p.nip === 'BK-PP1-017' && p.tanggal === '2026-10-12'
      );
      if (dedikRec12 && !manualList.some((m) => m.id === dedikRec12.id)) {
        manualList.unshift(dedikRec12);
        manualDirty = true;
      }
    }
    if (!hasDedikOct13) {
      const dedikRec13 = INITIAL_PRESENSI_LIST.find(
        (p) => p.nip === 'BK-PP1-017' && p.tanggal === '2026-10-13'
      );
      if (dedikRec13 && !manualList.some((m) => m.id === dedikRec13.id)) {
        manualList.unshift(dedikRec13);
        manualDirty = true;
      }
    } else {
      manualList.forEach((m, idx) => {
        if (
          m.nip === 'BK-PP1-017' &&
          (m.tanggal === '2026-10-09' || m.tanggal === '09/10/2026') &&
          (m.jamAwal === '08:00' || m.durasiMenit === 120 || m.faktorPotongan === 0)
        ) {
          manualList[idx] = {
            ...m,
            jamAwal: '14:00',
            jamAkhir: '16:30',
            durasiMenit: 150,
            jenisIjin: 'Ijin Pulang Awal',
            faktorPotongan: 0.5,
          };
          manualDirty = true;
        }
      });

      if (list && Array.isArray(list)) {
        let listChanged = false;
        const patchedList = list.map((p) => {
          if (
            p.nip === 'BK-PP1-017' &&
            (p.tanggal === '2026-10-09' || p.tanggal === '09/10/2026') &&
            (p.jamAwal === '08:00' || p.durasiMenit === 120 || p.faktorPotongan === 0)
          ) {
            listChanged = true;
            return {
              ...p,
              jamAwal: '14:00',
              jamAkhir: '16:30',
              durasiMenit: 150,
              jenisIjin: 'Ijin Pulang Awal' as const,
              faktorPotongan: 0.5,
            };
          }
          return p;
        });
        if (listChanged) {
          writeStorage(KEYS.PRESENSI, patchedList);
          if (baseList === list) baseList = patchedList;
        }
      }
    }

    // O(N + M) Indexed Reconciliation: jika draft manual lokal sudah masuk server, bersihkan duplikat
    const baseNipKeys = new Set<string>();
    const baseNameKeys = new Set<string>();
    for (let i = 0; i < baseList.length; i++) {
      const b = baseList[i];
      if (!b.rowNum) continue;
      const bDate = normalizeIsoDate(b.tanggal);
      if (b.nip) baseNipKeys.add(`${b.nip}|${bDate}|${b.jenisIjin}`);
      if (b.nama) baseNameKeys.add(`${b.nama.trim().toLowerCase()}|${bDate}|${b.jenisIjin}`);
    }

    const unsyncedManual = manualList.filter((m) => {
      const mDate = normalizeIsoDate(m.tanggal);
      const nipMatch = m.nip ? baseNipKeys.has(`${m.nip}|${mDate}|${m.jenisIjin}`) : false;
      const nameMatch = m.nama ? baseNameKeys.has(`${m.nama.trim().toLowerCase()}|${mDate}|${m.jenisIjin}`) : false;
      return !nipMatch && !nameMatch;
    });

    if (unsyncedManual.length !== manualList.length) {
      manualDirty = true;
    }

    // Normalisasi durasi menit & pastikan faktor potongan selalu selaras dengan aturan resmi
    const sanitizedManual = unsyncedManual.map((m) => {
      const durasiMenit = Math.round(Number(m.durasiMenit) || 0);
      const cleanM: PresensiRecord = { ...m, durasiMenit };
      const eff = getEffectiveFaktorPotongan(cleanM);
      if (cleanM.faktorPotongan !== eff) {
        manualDirty = true;
        return { ...cleanM, faktorPotongan: eff };
      }
      return cleanM;
    });

    if (manualDirty) {
      writeStorage(KEYS.PRESENSI_MANUAL, sanitizedManual);
    }

    const manualIdSet = new Set(sanitizedManual.map((m) => m.id));
    const finalCombined = [
      ...sanitizedManual,
      ...baseList.filter((b) => !manualIdSet.has(b.id)),
    ];

    const result = finalCombined.map((p) => {
      const durasiMenit = Math.round(Number(p.durasiMenit) || 0);
      const cleanP: PresensiRecord = {
        ...p,
        durasiMenit,
      };
      const eff = getEffectiveFaktorPotongan(cleanP);
      return cleanP.faktorPotongan === eff
        ? cleanP
        : {
            ...cleanP,
            faktorPotongan: eff,
          };
    });

    const latestBaseRef = readStorage<PresensiRecord[]>(KEYS.PRESENSI, INITIAL_PRESENSI_LIST);
    const latestManualRef = this.getManualPresensiList();
    cachedReconciledPresensi = {
      baseRef: latestBaseRef,
      manualRef: latestManualRef,
      result,
    };

    return result;
  },
  savePresensiList(list: PresensiRecord[]): void {
    const manualList = this.getManualPresensiList();
    const srvNipKeys = new Set<string>();
    const srvNameKeys = new Set<string>();
    for (let i = 0; i < list.length; i++) {
      const srv = list[i];
      if (!srv.rowNum) continue;
      const srvDate = normalizeIsoDate(srv.tanggal);
      if (srv.nip) srvNipKeys.add(`${srv.nip}|${srvDate}|${srv.jenisIjin}`);
      if (srv.nama) srvNameKeys.add(`${srv.nama.trim().toLowerCase()}|${srvDate}|${srv.jenisIjin}`);
    }

    const unsyncedManual = manualList.filter((m) => {
      const mDate = normalizeIsoDate(m.tanggal);
      const nipMatch = m.nip ? srvNipKeys.has(`${m.nip}|${mDate}|${m.jenisIjin}`) : false;
      const nameMatch = m.nama ? srvNameKeys.has(`${m.nama.trim().toLowerCase()}|${mDate}|${m.jenisIjin}`) : false;
      return !nipMatch && !nameMatch;
    });
    this.saveManualPresensiList(unsyncedManual);

    const unsyncedIdSet = new Set(unsyncedManual.map((m) => m.id));
    const sanitizedList = list.map((item) => ({
      ...item,
      durasiMenit: Math.round(Number(item.durasiMenit) || 0),
    }));
    const merged = [
      ...unsyncedManual,
      ...sanitizedList.filter((item) => !unsyncedIdSet.has(item.id)),
    ];
    writeStorage(KEYS.PRESENSI, merged);
  },
  addPresensi(rec: PresensiRecord): void {
    const cleanRec: PresensiRecord = {
      ...rec,
      durasiMenit: Math.round(Number(rec.durasiMenit) || 0),
    };
    const manual = this.getManualPresensiList();
    const updatedManual = [cleanRec, ...manual.filter((m) => m.id !== cleanRec.id)];
    this.saveManualPresensiList(updatedManual);

    const list = this.getPresensiList();
    const updatedList = [cleanRec, ...list.filter((l) => l.id !== cleanRec.id)];
    writeStorage(KEYS.PRESENSI, updatedList);
  },
  addPresensiBatch(records: PresensiRecord[]): void {
    const cleanRecords = records.map((r) => ({
      ...r,
      durasiMenit: Math.round(Number(r.durasiMenit) || 0),
    }));
    const manual = this.getManualPresensiList();
    const recordIds = new Set(cleanRecords.map((r) => r.id));
    const updatedManual = [...cleanRecords, ...manual.filter((m) => !recordIds.has(m.id))];
    this.saveManualPresensiList(updatedManual);

    const list = this.getPresensiList();
    const updatedList = [...cleanRecords, ...list.filter((l) => !recordIds.has(l.id))];
    writeStorage(KEYS.PRESENSI, updatedList);
  },
  updatePresensi(id: string, updatedRec: Partial<PresensiRecord>): void {
    const cleanUpdated: Partial<PresensiRecord> = {
      ...updatedRec,
      ...(updatedRec.durasiMenit !== undefined
        ? { durasiMenit: Math.round(Number(updatedRec.durasiMenit) || 0) }
        : {}),
    };
    const manual = this.getManualPresensiList();
    const mIdx = manual.findIndex((m) => m.id === id);
    if (mIdx !== -1) {
      manual[mIdx] = { ...manual[mIdx], ...cleanUpdated };
      this.saveManualPresensiList(manual);
    }

    const list = this.getPresensiList();
    const idx = list.findIndex((p) => p.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...cleanUpdated };
      writeStorage(KEYS.PRESENSI, list);
    }
  },
  deletePresensi(id: string, deletedBy: string): void {
    const manual = this.getManualPresensiList().filter((m) => m.id !== id);
    this.saveManualPresensiList(manual);

    const list = this.getPresensiList();
    const target = list.find((p) => p.id === id);
    if (target) {
      this.addDeletedArchive({
        id: 'arch-' + Date.now(),
        kategori: 'PRESENSI',
        waktuDihapus: new Date().toISOString(),
        dihapusOleh: deletedBy,
        nama: target.nama,
        nip: target.nip,
        detailJson: JSON.stringify(target),
      });
      writeStorage(KEYS.PRESENSI, list.filter((p) => p.id !== id));
    }
  },

  // Lembur
  getLemburList(): LemburRecord[] {
    const list = readStorage<LemburRecord[]>(KEYS.LEMBUR, INITIAL_LEMBUR_LIST);
    if (list && list.some((l) => l.id.startsWith('lmb-00'))) {
      const cleanList = list.filter((l) => !l.id.startsWith('lmb-00'));
      writeStorage(KEYS.LEMBUR, cleanList);
      return cleanList;
    }
    return list || [];
  },
  saveLemburList(list: LemburRecord[]): void {
    writeStorage(KEYS.LEMBUR, list);
  },
  addLemburBatch(records: LemburRecord[]): void {
    const list = this.getLemburList();
    this.saveLemburList([...records, ...list]);
  },

  // Cuti & Ijin
  getCutiList(): CutiRecord[] {
    return readStorage<CutiRecord[]>(KEYS.CUTI, INITIAL_CUTI_LIST);
  },
  saveCutiList(list: CutiRecord[]): void {
    writeStorage(KEYS.CUTI, list);
  },
  addCuti(rec: CutiRecord): void {
    const list = [rec, ...this.getCutiList()];
    this.saveCutiList(list);
  },
  updateCutiStatus(id: string, status: 'Disetujui' | 'Ditolak', approvedBy: string): void {
    const list = [...this.getCutiList()];
    const idx = list.findIndex((c) => c.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], status, disetujuiOleh: approvedBy };
      this.saveCutiList(list);
    }
  },

  // Mutasi
  getMutasiList(): MutasiRecord[] {
    const list = readStorage<MutasiRecord[]>(KEYS.MUTASI, INITIAL_MUTASI_LIST);
    if (list && list.length > 0) {
      let changed = false;
      const next = [...list];
      INITIAL_MUTASI_LIST.forEach((initM) => {
        const found = next.find(
          (m) =>
            m.id === initM.id ||
            (m.nip === initM.nip && m.tanggalEfektif === initM.tanggalEfektif && m.nilaiBaru === initM.nilaiBaru)
        );
        if (!found) {
          next.unshift(initM);
          changed = true;
        }
      });
      if (changed) {
        writeStorage(KEYS.MUTASI, next);
        return next;
      }
    }
    return list;
  },
  saveMutasiList(list: MutasiRecord[]): void {
    writeStorage(KEYS.MUTASI, list);
  },
  addMutasi(rec: MutasiRecord): void {
    const list = [rec, ...this.getMutasiList()];
    this.saveMutasiList(list);
  },
  updateMutasiStatus(id: string, status: 'Diterapkan' | 'Dibatalkan'): void {
    const list = [...this.getMutasiList()];
    const idx = list.findIndex((m) => m.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], status };
      this.saveMutasiList(list);
    }
  },

  // Calon Karyawan
  getCalonList(): CalonKaryawan[] {
    const list = readStorage<CalonKaryawan[]>(KEYS.CALON, INITIAL_CALON_LIST);
    const cleaned = list.filter((c) => c.nama !== 'Bayu Pratama' && c.id !== 'calon-001');
    if (cleaned.length !== list.length) {
      writeStorage(KEYS.CALON, cleaned);
    }
    return cleaned;
  },
  saveCalonList(list: CalonKaryawan[]): void {
    const cleaned = list.filter((c) => c.nama !== 'Bayu Pratama' && c.id !== 'calon-001');
    writeStorage(KEYS.CALON, cleaned);
  },
  addCalon(c: CalonKaryawan): void {
    const list = [c, ...this.getCalonList()];
    this.saveCalonList(list);
  },
  deleteCalon(calonId: string): void {
    const list = this.getCalonList().filter((c) => c.id !== calonId);
    this.saveCalonList(list);
  },

  // Link Arsip
  getLinksList(): LinkArsip[] {
    const list = readStorage<LinkArsip[]>(KEYS.LINKS, INITIAL_LINKS);
    if (!list || list.length < 30) {
      writeStorage(KEYS.LINKS, INITIAL_LINKS);
      return INITIAL_LINKS;
    }
    return list;
  },
  saveLinksList(list: LinkArsip[]): void {
    writeStorage(KEYS.LINKS, list);
  },
  addLink(lnk: LinkArsip): void {
    const list = [lnk, ...this.getLinksList()];
    this.saveLinksList(list);
  },
  deleteLink(id: string): void {
    const list = this.getLinksList();
    this.saveLinksList(list.filter((l) => l.id !== id));
  },

  // KPI
  getKpiList(): KpiRecord[] {
    return readStorage<KpiRecord[]>(KEYS.KPI, INITIAL_KPI_LIST);
  },
  saveKpiList(list: KpiRecord[]): void {
    writeStorage(KEYS.KPI, list);
  },
  addOrUpdateKpi(kpi: KpiRecord): void {
    const list = [...this.getKpiList()];
    const idx = list.findIndex((k) => k.nip === kpi.nip && k.bulan === kpi.bulan && k.tahun === kpi.tahun);
    if (idx !== -1) {
      list[idx] = kpi;
    } else {
      list.unshift(kpi);
    }
    this.saveKpiList(list);
  },

  // Deleted Archive
  getDeletedArchives(): DeletedArchiveRecord[] {
    return readStorage<DeletedArchiveRecord[]>(KEYS.ARCHIVE, []);
  },
  addDeletedArchive(rec: DeletedArchiveRecord): void {
    const list = [rec, ...this.getDeletedArchives()];
    writeStorage(KEYS.ARCHIVE, list);
  },

  // Auth User
  getAuthUser(): AuthUser | null {
    const fallback: AuthUser = {
      id: 'usr-default',
      email: 'lalu.mahendra@batukarang.co.id',
      nip: 'BK-PP1-001',
      nama: 'Lalu Mahendra Ali Akbar',
      role: 'Project Manager',
      portalType: 'management',
      allowedTabs: [
        'dashboard',
        'presensi',
        'lembur',
        'rekap',
        'slip',
        'cuti',
        'kpi',
        'database',
        'mutasi',
        'pelatihan',
        'profil',
        'hakakses',
        'pengaturan',
      ],
      department: 'Administrasi & Teknologi Industri',
    };
    const user = readStorage<AuthUser | null>(KEYS.AUTH_USER, fallback);
    if (user && user.portalType === 'management' && !user.allowedTabs.includes('pengaturan')) {
      return {
        ...user,
        allowedTabs: [...user.allowedTabs, 'pengaturan'],
      };
    }
    return user;
  },
  saveAuthUser(user: AuthUser | null): void {
    writeStorage(KEYS.AUTH_USER, user);
  },

  // GAS Config
  getGasConfig(): GasConfig {
    const fallback: GasConfig = {
      apiUrl: DEFAULT_GAS_API_URL,
      isAutoSync: true,
      status: 'connected',
      lastSyncTimestamp: formatWaktuWib(new Date(), true),
    };
    const stored = readStorage<GasConfig>(KEYS.GAS_CONFIG, fallback);
    // Jika apiUrl belum disetel, kosong, atau tersimpan URL lama HR Pekerja, otomatis tetapkan ke DEFAULT_GAS_API_URL
    if (
      !stored ||
      !stored.apiUrl ||
      stored.apiUrl.trim() === '' ||
      stored.apiUrl.includes('AKfycbzGZsSs2ZviyLMM0csjmMDXZDMpC9ZhuvheEb97g9KM1AZW8mlhSUPBc8o8YJp_9zg')
    ) {
      const updated: GasConfig = {
        ...fallback,
        ...(stored || {}),
        apiUrl: DEFAULT_GAS_API_URL,
        isAutoSync: true,
        status: 'connected',
        errorMessage: undefined,
      };
      writeStorage(KEYS.GAS_CONFIG, updated);
      return updated;
    }
    return stored;
  },
  saveGasConfig(cfg: GasConfig): void {
    writeStorage(KEYS.GAS_CONFIG, cfg);
  },

  // UI state
  getThemeMode(): 'light' | 'dark' {
    return readStorage<'light' | 'dark'>(KEYS.THEME_MODE, 'light');
  },
  saveThemeMode(mode: 'light' | 'dark'): void {
    writeStorage(KEYS.THEME_MODE, mode);
  },

  getSidebarCollapsed(): boolean {
    return readStorage<boolean>(KEYS.SIDEBAR_COLLAPSED, false);
  },
  saveSidebarCollapsed(collapsed: boolean): void {
    writeStorage(KEYS.SIDEBAR_COLLAPSED, collapsed);
  },

  // Column Display Settings (Checklist Kolom Tampilan)
  getColumnSettings(): ColumnVisibilitySettings {
    const fallback: ColumnVisibilitySettings = {
      showGajiPokok: false,
      showTunjanganJabatan: false,
    };
    return readStorage<ColumnVisibilitySettings>(KEYS.COLUMN_SETTINGS, fallback);
  },
  saveColumnSettings(settings: ColumnVisibilitySettings): void {
    writeStorage(KEYS.COLUMN_SETTINGS, settings);
  },

  // App Branding & Custom Logo (Penggantian Logo & Identitas Aplikasi Langsung di Web Apps)
  getAppBranding(): AppBrandingSettings {
    return readStorage<AppBrandingSettings>(KEYS.BRANDING, DEFAULT_BRANDING);
  },
  saveAppBranding(branding: AppBrandingSettings): void {
    const updated = {
      ...branding,
      updatedAt: new Date().toISOString(),
    };
    writeStorage(KEYS.BRANDING, updated);
  },
  resetAppBranding(): AppBrandingSettings {
    writeStorage(KEYS.BRANDING, DEFAULT_BRANDING);
    return DEFAULT_BRANDING;
  },

  // Staff PIN Authentication (Portal Mandiri Staf 3-Factor Login)
  getStaffPins(): Record<string, string> {
    let pins = readStorage<Record<string, string>>(KEYS.STAFF_PINS, {});
    // Fail-safe: jika primary key kosong, cek permanent backup & legacy keys
    if (Object.keys(pins).length === 0 && typeof window !== 'undefined' && window.localStorage) {
      try {
        const backupVal = localStorage.getItem(KEYS.STAFF_PINS_BACKUP);
        if (backupVal) {
          const parsed = JSON.parse(backupVal);
          if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
            pins = parsed;
            writeStorage(KEYS.STAFF_PINS, pins);
            return pins;
          }
        }
        // Fallback ke legacy keys jika ada
        const v2 = localStorage.getItem('bk_hr_staff_pins_v2');
        const v1 = localStorage.getItem('bk_hr_staff_pins_v1');
        const legacyVal = v2 || v1;
        if (legacyVal) {
          const parsed = JSON.parse(legacyVal);
          if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
            pins = parsed;
            writeStorage(KEYS.STAFF_PINS, pins);
            writeStorage(KEYS.STAFF_PINS_BACKUP, pins);
            return pins;
          }
        }
      } catch (e) {
        // Ignore fallback reading error
      }
    }
    return pins;
  },

  getStaffPin(nip: string): string {
    if (!nip) return DEFAULT_STAFF_PIN;
    const cleanNip = nip.trim();
    const upperNip = cleanNip.toUpperCase();
    const lowerNip = cleanNip.toLowerCase();
    const pins = this.getStaffPins();
    return pins[upperNip] || pins[cleanNip] || pins[lowerNip] || DEFAULT_STAFF_PIN;
  },

  setStaffPin(nip: string, newPin: string): void {
    if (!nip) return;
    const cleanNip = nip.trim();
    const upperNip = cleanNip.toUpperCase();
    const cleanPin = (newPin || '').trim();
    const pins = { ...this.getStaffPins() };

    // Simpan baik dengan NIP huruf kapital maupun format asli agar selalu cocok
    pins[upperNip] = cleanPin;
    pins[cleanNip] = cleanPin;

    // Simpan ganda ke primary key dan permanent backup key
    writeStorage(KEYS.STAFF_PINS, pins);
    writeStorage(KEYS.STAFF_PINS_BACKUP, pins);

    // Kirim event update agar semua tab/komponen langsung merefleksikan perubahan
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('bk_staff_pin_changed', {
          detail: { nip: upperNip, pin: cleanPin },
        })
      );
    }
  },

  hasStaffCustomPin(nip: string): boolean {
    if (!nip) return false;
    const savedPin = this.getStaffPin(nip);
    return Boolean(savedPin && savedPin !== DEFAULT_STAFF_PIN);
  },

  // Custom RBAC Role Permissions
  getCustomRoles(): RolePermission[] {
    const list = readStorage<RolePermission[]>(KEYS.ROLES, DEFAULT_ROLE_PERMISSIONS);
    if (!list || list.length === 0) {
      writeStorage(KEYS.ROLES, DEFAULT_ROLE_PERMISSIONS);
      return DEFAULT_ROLE_PERMISSIONS;
    }
    return list;
  },
  saveCustomRoles(roles: RolePermission[]): void {
    writeStorage(KEYS.ROLES, roles);
  },
  resetCustomRoles(): RolePermission[] {
    writeStorage(KEYS.ROLES, DEFAULT_ROLE_PERMISSIONS);
    return DEFAULT_ROLE_PERMISSIONS;
  },

  // Reset to initial demo data (PENTING: PIN staf dan branding tetap dilindungi/dipertahankan)
  resetAllData(): void {
    const resetKeys = [
      KEYS.STAFF,
      KEYS.PRESENSI,
      KEYS.LEMBUR,
      KEYS.CUTI,
      KEYS.MUTASI,
      KEYS.CALON,
      KEYS.LINKS,
      KEYS.KPI,
      KEYS.ARCHIVE,
    ];
    resetKeys.forEach((k) => {
      localStorage.removeItem(k);
      memoryCache.delete(k);
    });
    cachedReconciledPresensi = null;
    // CATATAN: KEYS.STAFF_PINS dan KEYS.STAFF_PINS_BACKUP TIDAK DIHAPUS
    // agar PIN hasil pergantian mandiri oleh staf tidak pernah hilang kembali ke 123456
    window.location.reload();
  },
};
