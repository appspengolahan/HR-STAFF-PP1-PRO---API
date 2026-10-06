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

const KEYS = {
  STAFF: 'bk_hr_staff_list_v3',
  PRESENSI: 'bk_hr_presensi_list_v3',
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
};

// Cleanup old obsolete v1 and v2 keys
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith('bk_hr_') && (k.endsWith('_v1') || k.endsWith('_v2') || k.endsWith('_mock'))) {
        localStorage.removeItem(k);
      }
    }
  } catch (e) {
    // Ignore storage cleanup error
  }
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    if (!val) return fallback;
    return JSON.parse(val) as T;
  } catch (e) {
    console.warn(`Error reading key ${key} from localStorage:`, e);
    return fallback;
  }
}

function writeStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving key ${key} to localStorage:`, e);
  }
}

export const storageService = {
  // Staff Master
  getStaffList(): StaffData[] {
    const list = readStorage<StaffData[]>(KEYS.STAFF, INITIAL_STAFF_LIST);
    // Auto-migrate if previously stored list was the 24-staff mock
    if (!list || list.length < 32) {
      writeStorage(KEYS.STAFF, INITIAL_STAFF_LIST);
      return INITIAL_STAFF_LIST;
    }
    return list;
  },
  saveStaffList(list: StaffData[]): void {
    writeStorage(KEYS.STAFF, list);
  },
  addStaff(staff: StaffData): void {
    const list = this.getStaffList();
    list.unshift(staff);
    this.saveStaffList(list);
  },
  updateStaff(nip: string, patch: Partial<StaffData>): void {
    const list = this.getStaffList();
    const idx = list.findIndex((s) => s.nip === nip);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...patch };
      // Recalculate static total gaji
      list[idx].totalGaji = (list[idx].gajiPokok || 0) + (list[idx].tunjanganJabatan || 0);
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
  getPresensiList(): PresensiRecord[] {
    const list = readStorage<PresensiRecord[]>(KEYS.PRESENSI, INITIAL_PRESENSI_LIST);
    const agustinOct = list && list.find((p) => p.nip === 'BK-PP1-003' && p.bulan === 10 && p.tahun === 2026);
    const isUpToDate = agustinOct && agustinOct.faktorPotongan === 0.5;
    if (!list || list.length < 340 || !isUpToDate) {
      writeStorage(KEYS.PRESENSI, INITIAL_PRESENSI_LIST);
      return INITIAL_PRESENSI_LIST;
    }
    return list;
  },
  savePresensiList(list: PresensiRecord[]): void {
    writeStorage(KEYS.PRESENSI, list);
  },
  addPresensi(rec: PresensiRecord): void {
    const list = this.getPresensiList();
    list.unshift(rec);
    this.savePresensiList(list);
  },
  addPresensiBatch(records: PresensiRecord[]): void {
    const list = this.getPresensiList();
    this.savePresensiList([...records, ...list]);
  },
  updatePresensi(id: string, updatedRec: Partial<PresensiRecord>): void {
    const list = this.getPresensiList();
    const idx = list.findIndex((p) => p.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updatedRec };
      this.savePresensiList(list);
    }
  },
  deletePresensi(id: string, deletedBy: string): void {
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
      this.savePresensiList(list.filter((p) => p.id !== id));
    }
  },

  // Lembur
  getLemburList(): LemburRecord[] {
    return readStorage<LemburRecord[]>(KEYS.LEMBUR, INITIAL_LEMBUR_LIST);
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
    const list = this.getCutiList();
    list.unshift(rec);
    this.saveCutiList(list);
  },
  updateCutiStatus(id: string, status: 'Disetujui' | 'Ditolak', approvedBy: string): void {
    const list = this.getCutiList();
    const idx = list.findIndex((c) => c.id === id);
    if (idx !== -1) {
      list[idx].status = status;
      list[idx].disetujuiOleh = approvedBy;
      this.saveCutiList(list);
    }
  },

  // Mutasi
  getMutasiList(): MutasiRecord[] {
    return readStorage<MutasiRecord[]>(KEYS.MUTASI, INITIAL_MUTASI_LIST);
  },
  saveMutasiList(list: MutasiRecord[]): void {
    writeStorage(KEYS.MUTASI, list);
  },
  addMutasi(rec: MutasiRecord): void {
    const list = this.getMutasiList();
    list.unshift(rec);
    this.saveMutasiList(list);
  },
  updateMutasiStatus(id: string, status: 'Diterapkan' | 'Dibatalkan'): void {
    const list = this.getMutasiList();
    const idx = list.findIndex((m) => m.id === id);
    if (idx !== -1) {
      list[idx].status = status;
      this.saveMutasiList(list);
    }
  },

  // Calon Karyawan
  getCalonList(): CalonKaryawan[] {
    return readStorage<CalonKaryawan[]>(KEYS.CALON, INITIAL_CALON_LIST);
  },
  saveCalonList(list: CalonKaryawan[]): void {
    writeStorage(KEYS.CALON, list);
  },
  addCalon(c: CalonKaryawan): void {
    const list = this.getCalonList();
    list.unshift(c);
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
    const list = this.getLinksList();
    list.unshift(lnk);
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
    const list = this.getKpiList();
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
    const list = this.getDeletedArchives();
    list.unshift(rec);
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
      ],
      department: 'Administrasi & Teknologi Industri',
    };
    return readStorage<AuthUser | null>(KEYS.AUTH_USER, fallback);
  },
  saveAuthUser(user: AuthUser | null): void {
    writeStorage(KEYS.AUTH_USER, user);
  },

  // GAS Config
  getGasConfig(): GasConfig {
    const fallback: GasConfig = {
      apiUrl:
        'https://script.google.com/macros/s/AKfycbzGZsSs2ZviyLMM0csjmMDXZDMpC9ZhuvheEb97g9KM1AZW8mlhSUPBc8o8YJp_9zg/exec',
      isAutoSync: false,
      status: 'idle',
      lastSyncTimestamp: new Date().toLocaleTimeString('id-ID'),
    };
    return readStorage<GasConfig>(KEYS.GAS_CONFIG, fallback);
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

  // Reset to initial demo data
  resetAllData(): void {
    localStorage.removeItem(KEYS.STAFF);
    localStorage.removeItem(KEYS.PRESENSI);
    localStorage.removeItem(KEYS.LEMBUR);
    localStorage.removeItem(KEYS.CUTI);
    localStorage.removeItem(KEYS.MUTASI);
    localStorage.removeItem(KEYS.CALON);
    localStorage.removeItem(KEYS.LINKS);
    localStorage.removeItem(KEYS.KPI);
    localStorage.removeItem(KEYS.ARCHIVE);
    window.location.reload();
  },
};
