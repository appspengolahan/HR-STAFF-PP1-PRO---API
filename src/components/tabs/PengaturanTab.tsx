import React from 'react';
import {
  SlidersHorizontal,
  DollarSign,
  Award,
  CheckCircle2,
  ShieldCheck,
  Eye,
  EyeOff,
  RotateCcw,
  ArrowRight,
  Database,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';
import { StaffData } from '../../types';
import { ColumnVisibilitySettings, storageService } from '../../services/storageService';
import { formatRupiah } from '../../services/payrollEngine';

interface PengaturanTabProps {
  columnSettings: ColumnVisibilitySettings;
  onUpdateColumnSettings: (newSettings: ColumnVisibilitySettings) => void;
  onNavigateTab: (tabId: string) => void;
  staffList?: StaffData[];
}

export const PengaturanTab: React.FC<PengaturanTabProps> = ({
  columnSettings,
  onUpdateColumnSettings,
  onNavigateTab,
  staffList = [],
}) => {
  const handleToggle = (key: keyof ColumnVisibilitySettings) => {
    const updated = {
      ...columnSettings,
      [key]: !columnSettings[key],
    };
    onUpdateColumnSettings(updated);
    storageService.saveColumnSettings(updated);
  };

  const handleSetAll = (val: boolean) => {
    const updated: ColumnVisibilitySettings = {
      showGajiPokok: val,
      showTunjanganJabatan: val,
    };
    onUpdateColumnSettings(updated);
    storageService.saveColumnSettings(updated);
  };

  const handleResetDefault = () => {
    const defaultSettings: ColumnVisibilitySettings = {
      showGajiPokok: true,
      showTunjanganJabatan: true,
    };
    onUpdateColumnSettings(defaultSettings);
    storageService.saveColumnSettings(defaultSettings);
  };

  // Sample data for preview
  const sampleStaffList = staffList.length > 0
    ? staffList.slice(0, 3)
    : [
        {
          id: 1,
          nip: 'BK-PP1-001',
          nama: 'Lalu Mahendra Ali Akbar',
          jabatan: 'Project Manager',
          level: 'Manajer',
          status: 'TETAP' as const,
          sekup: 'Administrasi' as const,
          gajiPokok: 6500000,
          tunjanganJabatan: 2500000,
        },
        {
          id: 2,
          nip: 'BK-PP1-002',
          nama: 'Dino Pratama',
          jabatan: 'Koordinator Produksi PP1',
          level: 'Koordinator',
          status: 'PKWT 2' as const,
          sekup: 'Operasional' as const,
          gajiPokok: 4200000,
          tunjanganJabatan: 800000,
        },
      ];

  const activeCount = (columnSettings.showGajiPokok ? 1 : 0) + (columnSettings.showTunjanganJabatan ? 1 : 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Menu Pengaturan Sistem
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola checklist kolom tampilan, preferensi privasi, dan visualisasi data HR Divisi Produksi I.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('database')}
          className="self-start sm:self-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all group shrink-0 cursor-pointer"
        >
          <Database className="w-4 h-4" />
          <span>Buka Database Staff</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Safety & Isolation Guarantee Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/30 dark:border-emerald-500/20 text-slate-800 dark:text-slate-200">
        <div className="flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-emerald-700 dark:text-emerald-400">
                Jaminan Keamanan Struktur Spreadsheet Live
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                100% Aman
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Pengaturan checklist ini <strong>murni memfilter visibilitas tampilan layar browser pengguna (Client-side UI)</strong>. 
              Sistem <strong>tidak mengubah, menyisipkan, atau menggeser struktur kolom live di Google Spreadsheet</strong> (MASTER_STAFF &amp; LOG_PRESENSI). 
              Semua rumus, integrasi REST GAS, dan sinkronisasi data tetap berjalan normal tanpa risiko rusak.
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Checklist Kolom Tampilan — Database Staff
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                {activeCount} dari 2 Kolom Aktif
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Pilih kolom finansial mana saja yang ingin ditampilkan atau disembunyikan pada tabel Database Staff.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleSetAll(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-blue-200/60 dark:border-blue-800/60"
            >
              <Eye className="w-3.5 h-3.5" />
              Tampilkan Semua
            </button>
            <button
              onClick={() => handleSetAll(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <EyeOff className="w-3.5 h-3.5" />
              Sembunyikan Semua
            </button>
            <button
              onClick={handleResetDefault}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Kembalikan ke pengaturan default (keduanya tampil)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Default
            </button>
          </div>
        </div>

        {/* Options Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Gaji Pokok */}
          <div
            onClick={() => handleToggle('showGajiPokok')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer select-none relative overflow-hidden group ${
              columnSettings.showGajiPokok
                ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-500 dark:border-blue-500 shadow-sm'
                : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 opacity-80'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${
                    columnSettings.showGajiPokok
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                    Kolom Gaji Pokok
                    {columnSettings.showGajiPokok ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                        Aktif / Tampil
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Disembunyikan
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Nominal dasar gaji bulanan sesuai jenjang &amp; grade staf
                  </p>
                </div>
              </div>

              {/* Custom Switch / Checkbox Toggle */}
              <div className="pt-1">
                <div
                  className={`w-12 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer ${
                    columnSettings.showGajiPokok ? 'bg-blue-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Kolom Tabel Database: <strong>Gaji Pokok</strong></span>
              <span className="font-mono text-blue-600 dark:text-blue-400">
                {columnSettings.showGajiPokok ? 'Status: Ditampilkan' : 'Status: Hidden'}
              </span>
            </div>
          </div>

          {/* Card 2: Tunjangan Jabatan */}
          <div
            onClick={() => handleToggle('showTunjanganJabatan')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer select-none relative overflow-hidden group ${
              columnSettings.showTunjanganJabatan
                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500 dark:border-emerald-500 shadow-sm'
                : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 opacity-80'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${
                    columnSettings.showTunjanganJabatan
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                    Kolom Tunjangan Jabatan
                    {columnSettings.showTunjanganJabatan ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                        Aktif / Tampil
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Disembunyikan
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Nominal tunjangan struktural &amp; operasional jabatan staf
                  </p>
                </div>
              </div>

              {/* Custom Switch / Checkbox Toggle */}
              <div className="pt-1">
                <div
                  className={`w-12 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer ${
                    columnSettings.showTunjanganJabatan ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Kolom Tabel Database: <strong>Tunjangan Jabatan</strong></span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                {columnSettings.showTunjanganJabatan ? 'Status: Ditampilkan' : 'Status: Hidden'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Interactive Table Preview */}
        <div className="space-y-3 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Live Preview Tampilan Tabel (Seketika Mengikuti Checklist di Atas)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 italic">
              Simulasi 2 baris data staf
            </span>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3 font-mono">NIP</th>
                    <th className="py-2.5 px-3">Nama Karyawan</th>
                    <th className="py-2.5 px-3">Jabatan &amp; Level</th>
                    <th className="py-2.5 px-3">Unit</th>
                    {columnSettings.showGajiPokok && (
                      <th className="py-2.5 px-3 text-right bg-blue-100/50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                        Gaji Pokok
                      </th>
                    )}
                    {columnSettings.showTunjanganJabatan && (
                      <th className="py-2.5 px-3 text-right bg-emerald-100/50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                        Tunjangan Jabatan
                      </th>
                    )}
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {sampleStaffList.map((st) => (
                    <tr key={st.nip} className="hover:bg-white dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {st.nip}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                        {st.nama}
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                        {st.jabatan} ({st.level})
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                        {st.sekup}
                      </td>
                      {columnSettings.showGajiPokok && (
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200 bg-blue-50/30 dark:bg-blue-950/20">
                          {formatRupiah(st.gajiPokok || 0)}
                        </td>
                      )}
                      {columnSettings.showTunjanganJabatan && (
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20">
                          {formatRupiah(st.tunjanganJabatan || 0)}
                        </td>
                      )}
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {st.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notification under preview */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Pengaturan tersimpan otomatis di perangkat Anda (LocalStorage) secara permanen.
              </span>
              <button
                onClick={() => onNavigateTab('database')}
                className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
              >
                Terapkan &amp; Lihat ke Database Staff &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Information Notes */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-4">
        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/50 dark:border-blue-900/50">
          <Info className="w-5 h-5" />
        </div>
        <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 space-y-1">
          <p className="font-bold text-slate-900 dark:text-white">
            Kapan fitur ini berguna?
          </p>
          <p>
            1. <strong>Privasi Layar saat Presentasi/Input:</strong> Jika Anda sedang membuka database karyawan di hadapan staf atau proyektor, Anda dapat dengan mudah menyembunyikan nominal Gaji Pokok dan Tunjangan Jabatan hanya dengan satu klik.
          </p>
          <p>
            2. <strong>Fleksibilitas Rekapitulasi:</strong> Jika HR hanya membutuhkan data administratif (kontak, jenjang pendidikan, masa PKWT), kolom finansial dapat disembunyikan agar tabel lebih ringkas.
          </p>
        </div>
      </div>
    </div>
  );
};
