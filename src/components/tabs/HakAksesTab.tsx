import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  KeyRound,
  Trash2,
  Lock,
  Unlock,
  AlertTriangle,
  RotateCcw,
  Archive,
  Layers,
} from 'lucide-react';
import { AuthUser, DeletedArchiveRecord, UserRole } from '../../types';
import { storageService } from '../../services/storageService';
import { formatTanggalWaktuIndo } from '../../utils/dateFormatter';

interface HakAksesTabProps {
  currentUser: AuthUser | null;
  deletedArchives: DeletedArchiveRecord[];
  onResetData: () => void;
}

interface RolePermission {
  role: UserRole;
  desc: string;
  defaultTabs: string[];
  userCount: number;
}

const ROLE_PERMISSIONS: RolePermission[] = [
  {
    role: 'Lead Developer',
    desc: 'Super User: Konfigurasi sistem, debugging REST GAS, & override data',
    defaultTabs: ['dashboard', 'presensi', 'lembur', 'rekap', 'slip', 'cuti', 'kpi', 'database', 'mutasi', 'pelatihan', 'profil', 'hakakses', 'pengaturan'],
    userCount: 1,
  },
  {
    role: 'Project Manager',
    desc: 'Lalu Mahendra Ali Akbar: Kontrol operasional PP1 penuh & approval',
    defaultTabs: ['dashboard', 'presensi', 'lembur', 'rekap', 'slip', 'cuti', 'kpi', 'database', 'mutasi', 'pelatihan', 'profil', 'hakakses', 'pengaturan'],
    userCount: 1,
  },
  {
    role: 'Site Engineer',
    desc: 'Andhik Dharmabakti: Monitoring OEE mesin, presensi shift, & lembur',
    defaultTabs: ['dashboard', 'presensi', 'lembur', 'kpi', 'database', 'profil', 'pengaturan'],
    userCount: 2,
  },
  {
    role: 'Admin HR',
    desc: 'Personalia: Presensi harian, berkas izin, PKWT & database staf',
    defaultTabs: ['dashboard', 'presensi', 'lembur', 'rekap', 'cuti', 'database', 'mutasi', 'pelatihan', 'profil', 'pengaturan'],
    userCount: 2,
  },
  {
    role: 'Finance',
    desc: 'Keuangan & Pajak: Slip gaji, perhitungan PPh21 TER, & BPJS',
    defaultTabs: ['dashboard', 'slip', 'rekap', 'database', 'profil', 'pengaturan'],
    userCount: 2,
  },
  {
    role: 'Kepala Dept',
    desc: 'Supervisi Departemen: Approval cuti & matriks KPI bulanan',
    defaultTabs: ['dashboard', 'presensi', 'lembur', 'cuti', 'kpi', 'profil'],
    userCount: 4,
  },
  {
    role: 'Staf',
    desc: 'Portal Mandiri Karyawan: Akses terisolasi slip gaji & profil pribadi',
    defaultTabs: ['slip', 'presensi', 'cuti', 'profil'],
    userCount: 24,
  },
];

export const HakAksesTab: React.FC<HakAksesTabProps> = ({
  currentUser,
  deletedArchives,
  onResetData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'rbac' | 'archive'>('rbac');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 text-xs leading-relaxed no-print flex items-start gap-3 shadow-md">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-indigo-300">Manajemen Hak Akses Berbasis Peran (RBAC):</strong> Hak akses modul dipetakan ketat berdasarkan kewenangan jabatan. Peran Staf terisolasi secara kriptografis pada Portal Mandiri, sedangkan Tim Manajemen memiliki akses bertingkat sesuai departemen.
        </div>
      </div>

      {/* Main Tab Controls */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-xs font-bold no-print">
        <button
          onClick={() => setActiveSubTab('rbac')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'rbac'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          Matriks Izin Modul RBAC
        </button>

        <button
          onClick={() => setActiveSubTab('archive')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'archive'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Archive className="w-4 h-4" />
          Audit Trail Log Arsip Hapus ({deletedArchives.length})
        </button>
      </div>

      {activeSubTab === 'rbac' ? (
        <div className="space-y-6">
          {/* Role Grid */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Daftar Peran &amp; Hak Akses Aplikasi
                </h3>
                <p className="text-xs text-slate-500">
                  Total 7 tingkat otorisasi dengan segmentasi data independen
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {ROLE_PERMISSIONS.map((rp) => (
                <div key={rp.role} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1 md:max-w-xs">
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 dark:text-white text-sm font-bold">
                        {rp.role}
                      </strong>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {rp.userCount} Akun
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 leading-tight">
                      {rp.desc}
                    </p>
                  </div>

                  <div className="flex-1 flex flex-wrap gap-1.5 items-center">
                    {rp.defaultTabs.map((tab) => (
                      <span
                        key={tab}
                        className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40 text-[10px] font-semibold uppercase font-mono"
                      >
                        {tab}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reset Demo Data Danger Zone */}
          <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Reset Database ke Data Awal Pabrik
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Mengembalikan seluruh data staf, presensi, lembur, dan mutasi ke seed baseline 32 staf Divisi Produksi I.
              </p>
            </div>

            <button
              onClick={() => {
                if (confirm('YAKIN INGIN MERESET SELURUH DATA KE DEFAULT PABRIK? Tindakan ini tidak dapat dibatalkan.')) {
                  onResetData();
                }
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Database Lokal
            </button>
          </div>
        </div>
      ) : (
        /* Soft Delete Archive Log */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Log Riwayat Hapus (Soft-Delete Archive)
            </h3>
            <p className="text-xs text-slate-500">
              Setiap penghapusan data staf atau presensi tidak langsung hilang, melainkan dicatat permanen di log ini.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Waktu Dihapus</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Nama Subjek</th>
                  <th className="py-3 px-4">NIP</th>
                  <th className="py-3 px-4">Dihapus Oleh</th>
                  <th className="py-3 px-4">Detail JSON Backup</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {deletedArchives.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                      Belum ada data yang dihapus. Seluruh data utuh dan aman.
                    </td>
                  </tr>
                ) : (
                  deletedArchives.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-slate-500">
                        {formatTanggalWaktuIndo(rec.waktuDihapus)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                          {rec.kategori}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-white">
                        {rec.nama}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{rec.nip || '-'}</td>
                      <td className="py-3 px-4 font-sans text-slate-600 dark:text-slate-300">
                        {rec.dihapusOleh}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-400" title={rec.detailJson}>
                        {rec.detailJson}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
