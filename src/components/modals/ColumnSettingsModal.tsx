import React from 'react';
import { X, Sliders, Eye, EyeOff, Check, DollarSign, Award, Shield } from 'lucide-react';
import { ColumnVisibilitySettings } from '../../services/storageService';

interface ColumnSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ColumnVisibilitySettings;
  onUpdateSettings: (newSettings: ColumnVisibilitySettings) => void;
}

export const ColumnSettingsModal: React.FC<ColumnSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const handleToggle = (key: keyof ColumnVisibilitySettings) => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const handleSetAll = (val: boolean) => {
    onUpdateSettings({
      showGajiPokok: val,
      showTunjanganJabatan: val,
    });
  };

  const activeCount = (settings.showGajiPokok ? 1 : 0) + (settings.showTunjanganJabatan ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/50 dark:border-blue-900/40">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Pengaturan Tampilan Kolom
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Menu Database Staff &bull; Divisi Produksi I
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Information Notice */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <span>
              Atur kolom nominal finansial mana saja yang diizinkan tampil di tabel Database Staff. Pengaturan ini murni mengatur tampilan layar peramban Anda (privasi) tanpa mengubah data di Spreadsheet.
            </span>
          </div>

          {/* Checklist Items */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Checklist Kolom Finansial
            </h3>

            {/* Item 1: Gaji Pokok */}
            <label
              onClick={() => handleToggle('showGajiPokok')}
              className={`flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                settings.showGajiPokok
                  ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 ring-1 ring-blue-400/20'
                  : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  checked={settings.showGajiPokok}
                  onChange={() => {}} // handled by parent onClick
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    Kolom Gaji Pokok
                  </span>
                  {settings.showGajiPokok ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                      Tampil
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                      Disembunyikan
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Menampilkan nominal Gaji Pokok bulanan staf (Kolom Q / 16 Spreadsheet MASTER_STAFF).
                </p>
              </div>
            </label>

            {/* Item 2: Tunjangan Jabatan */}
            <label
              onClick={() => handleToggle('showTunjanganJabatan')}
              className={`flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                settings.showTunjanganJabatan
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 ring-1 ring-emerald-400/20'
                  : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  checked={settings.showTunjanganJabatan}
                  onChange={() => {}} // handled by parent onClick
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    Kolom Tunjangan Jabatan
                  </span>
                  {settings.showTunjanganJabatan ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                      Tampil
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                      Disembunyikan
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Menampilkan nominal Tunjangan Jabatan struktural/operasional (Kolom R / 17 Spreadsheet MASTER_STAFF).
                </p>
              </div>
            </label>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px]">
              Status: <strong>{activeCount}</strong> dari 2 kolom finansial aktif
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSetAll(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
              >
                <EyeOff className="w-3.5 h-3.5" />
                Sembunyikan Semua
              </button>
              <button
                type="button"
                onClick={() => handleSetAll(true)}
                className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
              >
                <Eye className="w-3.5 h-3.5" />
                Tampilkan Semua
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Selesai &amp; Simpan
          </button>
        </div>
      </div>
    </div>
  );
};
