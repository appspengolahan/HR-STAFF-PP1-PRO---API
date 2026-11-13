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
  Plus,
  Pencil,
  CheckSquare,
  Square,
  X,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { AuthUser, DeletedArchiveRecord, RolePermission } from '../../types';
import { storageService, DEFAULT_ROLE_PERMISSIONS } from '../../services/storageService';
import { formatTanggalWaktuIndo } from '../../utils/dateFormatter';
import { appConfirm } from '../../services/dialogService';

interface HakAksesTabProps {
  currentUser: AuthUser | null;
  deletedArchives: DeletedArchiveRecord[];
  onResetData: () => void;
}

export const AVAILABLE_MODULES: { id: string; label: string; desc: string; category: string }[] = [
  { id: 'dashboard', label: 'Dashboard', desc: 'Ringkasan operasional & statistik kinerja pabrik', category: 'Umum' },
  { id: 'presensi', label: 'Presensi & Ijin', desc: 'Pencatatan hadir & rekap izin harian staf', category: 'Presensi' },
  { id: 'lembur', label: 'Lembur SPKL', desc: 'Perintah lembur & perhitungan faktor 2×', category: 'Presensi' },
  { id: 'rekap', label: 'Rekap Presensi', desc: 'Matriks kehadiran 12 bulan & rincian izin', category: 'Presensi' },
  { id: 'slip', label: 'Slip Gaji Bulanan', desc: 'Rincian take home pay, PPh21 TER & BPJS', category: 'Payroll' },
  { id: 'cuti', label: 'Pengajuan Cuti', desc: 'Formulir permohonan & alur approval cuti', category: 'Karyawan' },
  { id: 'kpi', label: 'Matriks Scoring KPI', desc: 'Evaluasi kinerja & bobot nilai staf', category: 'Karyawan' },
  { id: 'database', label: 'Database Karyawan', desc: 'Master data 32 staf PP1 lengkap', category: 'Master' },
  { id: 'mutasi', label: 'Jadwal Mutasi', desc: 'Perencanaan mutasi & promosi staf', category: 'Master' },
  { id: 'pelatihan', label: 'Calon Karyawan', desc: 'Arsip seleksi pelamar & kandidat baru', category: 'Master' },
  { id: 'profil', label: 'Profil Karyawan', desc: 'Biodata, akun & keamanan PIN mandiri', category: 'Umum' },
  { id: 'hakakses', label: 'Hak Akses & Akun', desc: 'Manajemen peran RBAC & audit log arsip', category: 'Admin' },
  { id: 'pengaturan', label: 'Pengaturan', desc: 'Visibilitas kolom & preferensi sistem', category: 'Admin' },
];

export const HakAksesTab: React.FC<HakAksesTabProps> = ({
  currentUser,
  deletedArchives,
  onResetData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'rbac' | 'archive'>('rbac');
  const [roles, setRoles] = useState<RolePermission[]>(() => storageService.getCustomRoles());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RolePermission | null>(null);

  // Form State
  const [formRoleName, setFormRoleName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formUserCount, setFormUserCount] = useState<number>(1);
  const [formTabs, setFormTabs] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAddModal = () => {
    setEditingRole(null);
    setFormRoleName('');
    setFormDesc('');
    setFormUserCount(1);
    setFormTabs(['dashboard', 'presensi', 'profil']);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (roleItem: RolePermission) => {
    setEditingRole(roleItem);
    setFormRoleName(roleItem.role);
    setFormDesc(roleItem.desc);
    setFormUserCount(roleItem.userCount || 1);
    setFormTabs([...roleItem.defaultTabs]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleTab = (tabId: string) => {
    if (formTabs.includes(tabId)) {
      setFormTabs(formTabs.filter((t) => t !== tabId));
    } else {
      setFormTabs([...formTabs, tabId]);
    }
  };

  const handleSelectAllTabs = () => {
    setFormTabs(AVAILABLE_MODULES.map((m) => m.id));
  };

  const handleClearAllTabs = () => {
    setFormTabs([]);
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formRoleName.trim();
    if (!trimmedName) {
      setFormError('Nama peran wajib diisi!');
      return;
    }
    if (formTabs.length === 0) {
      setFormError('Pilih minimal 1 modul hak akses untuk peran ini!');
      return;
    }

    if (editingRole) {
      // Mode Edit
      const updatedRoles = roles.map((r) => {
        if (r.id === editingRole.id || r.role === editingRole.role) {
          return {
            ...r,
            role: trimmedName,
            desc: formDesc.trim() || 'Peran operasional sistem',
            userCount: Number(formUserCount) || 1,
            defaultTabs: formTabs,
          };
        }
        return r;
      });
      setRoles(updatedRoles);
      storageService.saveCustomRoles(updatedRoles);
      showToast(`Peran "${trimmedName}" berhasil diperbarui!`);
    } else {
      // Mode Tambah Baru
      // Cek duplikasi nama
      const duplicate = roles.some((r) => r.role.toLowerCase() === trimmedName.toLowerCase());
      if (duplicate) {
        setFormError(`Peran dengan nama "${trimmedName}" sudah ada. Gunakan nama lain.`);
        return;
      }
      const newRole: RolePermission = {
        id: `role-${Date.now()}`,
        role: trimmedName,
        desc: formDesc.trim() || 'Peran kustom otorisasi PP1',
        userCount: Number(formUserCount) || 1,
        defaultTabs: formTabs,
        isSystem: false,
      };
      const updatedRoles = [...roles, newRole];
      setRoles(updatedRoles);
      storageService.saveCustomRoles(updatedRoles);
      showToast(`Peran baru "${trimmedName}" berhasil ditambahkan!`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteRole = async (roleItem: RolePermission) => {
    const isPrimaryAdmin = roleItem.role === 'Lead Developer' || roleItem.role === 'Project Manager';
    if (isPrimaryAdmin && roles.length <= 2) {
      alert('Peran administratif utama tidak dapat dihapus untuk mencegah terkunci dari sistem.');
      return;
    }

    const confirmed = await appConfirm(
      `Apakah Anda yakin ingin MENGHAPUS peran "${roleItem.role}"?\n\nTindakan ini akan menghapus konfigurasi hak akses modul peran ini dari sistem.`,
      {
        isDestructive: true,
        confirmText: 'Hapus Peran',
      }
    );

    if (confirmed) {
      const updated = roles.filter((r) => (r.id ? r.id !== roleItem.id : r.role !== roleItem.role));
      setRoles(updated);
      storageService.saveCustomRoles(updated);
      showToast(`Peran "${roleItem.role}" telah berhasil dihapus.`);
    }
  };

  const handleResetToDefaultRoles = async () => {
    const confirmed = await appConfirm(
      'Kembalikan seluruh daftar peran & matriks hak akses ke standar awal pabrik (7 peran default)?',
      {
        isDestructive: false,
        confirmText: 'Kembalikan Default',
      }
    );

    if (confirmed) {
      const resetList = storageService.resetCustomRoles();
      setRoles(resetList);
      showToast('Seluruh daftar peran & matriks RBAC dikembalikan ke default pabrik.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-3.5 bg-slate-900 text-white text-xs rounded-xl shadow-2xl border border-emerald-500/50 flex items-center gap-2.5 animate-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Banner */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 text-xs leading-relaxed no-print flex items-start gap-3 shadow-md">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-indigo-300">Manajemen Hak Akses Berbasis Peran (RBAC):</strong> Hak akses modul dipetakan ketat berdasarkan kewenangan jabatan. Anda dapat menambah peran baru, mengedit hak akses modul, atau menghapus peran sesuai struktur organisasi perusahaan.
        </div>
      </div>

      {/* Main Tab Controls */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-xs font-bold no-print">
        <button
          onClick={() => setActiveSubTab('rbac')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
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
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
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
            {/* Header dengan Tombol Tambah Peran & Reset Default */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Daftar Peran &amp; Hak Akses Aplikasi</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {roles.length} Peran Terdaftar
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kelola tingkatan otorisasi dan segmentasi hak akses modul aplikasi
                </p>
              </div>

              {/* Action Buttons: Tambah Peran & Reset */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetToDefaultRoles}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Kembalikan ke 7 peran standar pabrik"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Reset Standar</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-900/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Peran</span>
                </button>
              </div>
            </div>

            {/* List Peran */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {roles.map((rp) => (
                <div
                  key={rp.id || rp.role}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-colors group"
                >
                  {/* Kolom Informasi Peran */}
                  <div className="space-y-1.5 lg:w-72 shrink-0">
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 dark:text-white text-sm font-bold">
                        {rp.role}
                      </strong>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {rp.userCount} Akun
                      </span>
                      {rp.isSystem ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/40">
                          Sistem
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40">
                          Kustom
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                      {rp.desc}
                    </p>
                  </div>

                  {/* Kolom Badge Izin Modul */}
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

                  {/* Kolom Aksi: Tombol Edit & Hapus */}
                  <div className="flex items-center gap-1.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(rp)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950/40 dark:hover:border-blue-800 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      title={`Edit hak akses peran ${rp.role}`}
                    >
                      <Pencil className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteRole(rp)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-950/40 dark:hover:border-red-900 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      title={`Hapus peran ${rp.role}`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      <span>Hapus</span>
                    </button>
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
              onClick={async () => {
                const ok = await appConfirm(
                  'YAKIN INGIN MERESET SELURUH DATA KE DEFAULT PABRIK? Tindakan ini tidak dapat dibatalkan.',
                  {
                    isDestructive: true,
                    confirmText: 'Reset Pabrik',
                  }
                );
                if (ok) {
                  onResetData();
                }
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shrink-0 cursor-pointer"
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

      {/* Modal Tambah / Edit Peran RBAC */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-900/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {editingRole ? `Edit Hak Akses Peran: ${editingRole.role}` : 'Tambah Peran & Otorisasi Baru'}
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Konfigurasi nama jabatan, deskripsi tanggung jawab, dan izin modul aplikasi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveRole} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Grid 2 Kolom: Nama Peran & Jumlah Akun */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Nama Peran / Jabatan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formRoleName}
                    onChange={(e) => setFormRoleName(e.target.value)}
                    placeholder="Contoh: Supervisor Produksi, Koordinator QC, dll."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Perkiraan Akun
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={formUserCount}
                    onChange={(e) => setFormUserCount(Number(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Deskripsi Jabatan & Tanggung Jawab */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Deskripsi Tanggung Jawab &amp; Wewenang
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Ringkasan wewenang dan tanggung jawab pemegang peran ini..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Matriks Checklist Modul */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Hak Akses Modul Aplikasi</span>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                        {formTabs.length} dari {AVAILABLE_MODULES.length} Dipilih
                      </span>
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Tentukan modul mana saja yang dapat dibuka oleh akun dengan peran ini
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                    <button
                      type="button"
                      onClick={handleSelectAllTabs}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer"
                    >
                      Pilih Semua
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllTabs}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer"
                    >
                      Kosongkan
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {AVAILABLE_MODULES.map((mod) => {
                    const isSelected = formTabs.includes(mod.id);
                    return (
                      <button
                        type="button"
                        key={mod.id}
                        onClick={() => handleToggleTab(mod.id)}
                        className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-slate-900 dark:text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="pt-0.5 shrink-0 text-blue-600 dark:text-blue-400">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs truncate">
                              {mod.label}
                            </span>
                            <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                              {mod.category}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {mod.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-900/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{editingRole ? 'Simpan Perubahan' : 'Tambahkan Peran'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
