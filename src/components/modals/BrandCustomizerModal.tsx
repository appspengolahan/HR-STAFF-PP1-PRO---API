import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  CheckCircle2,
  X,
  Smartphone,
  Laptop,
  AlertCircle,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import { AppBrandingSettings } from '../../types';
import { compressImageFile } from '../../utils/brandingHelper';
import { appAlert } from '../../services/dialogService';

interface BrandCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  branding: AppBrandingSettings;
  onSaveBranding: (newBranding: AppBrandingSettings) => void;
  onResetBranding: () => void;
}

export const BrandCustomizerModal: React.FC<BrandCustomizerModalProps> = ({
  isOpen,
  onClose,
  branding,
  onSaveBranding,
  onResetBranding,
}) => {
  const [appName, setAppName] = useState(branding.appName || 'HR STAFF - PRODUKSI I');
  const [appShortName, setAppShortName] = useState(branding.appShortName || 'HR STAFF I');
  const [appSubtitle, setAppSubtitle] = useState(branding.appSubtitle || 'PT Batu Karang — Divisi Produksi I (PP1)');
  const [companyName, setCompanyName] = useState(branding.companyName || 'PT BATU KARANG');
  const [badgeText, setBadgeText] = useState(branding.badgeText || 'PP1');
  const [logoUrl, setLogoUrl] = useState<string | undefined>(branding.logoUrl);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'mobile' | 'laptop'>('mobile');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      await appAlert('Harap pilih file gambar (PNG, JPG, SVG, atau WebP).');
      return;
    }

    try {
      setIsProcessingImage(true);
      const compressedDataUrl = await compressImageFile(file, 512);
      setLogoUrl(compressedDataUrl);
    } catch (err) {
      await appAlert(`Gagal memuat gambar: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl(undefined);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) {
      appAlert('Nama Web Apps tidak boleh kosong.');
      return;
    }
    if (!appShortName.trim()) {
      appAlert('Nama pendek untuk HP tidak boleh kosong.');
      return;
    }

    const updated: AppBrandingSettings = {
      appName: appName.trim(),
      appShortName: appShortName.trim(),
      appSubtitle: appSubtitle.trim(),
      companyName: companyName.trim(),
      badgeText: badgeText.trim().substring(0, 4).toUpperCase() || 'PP1',
      logoUrl,
      updatedAt: new Date().toISOString(),
    };

    onSaveBranding(updated);
    onClose();
  };

  const handleResetToDefault = () => {
    onResetBranding();
    setAppName('HR STAFF - PRODUKSI I');
    setAppShortName('HR STAFF I');
    setAppSubtitle('PT Batu Karang — Divisi Produksi I (PP1)');
    setCompanyName('PT BATU KARANG');
    setBadgeText('PP1');
    setLogoUrl(undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 no-print">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Kustomisasi Logo &amp; Identitas Web Apps
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ganti logo dan nama aplikasi langsung tanpa perlu ubah kode pemrograman.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Modal */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs">
          {/* Petunjuk Ringkas */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-2xl flex items-start gap-3">
            <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-blue-900 dark:text-blue-200 leading-relaxed">
              <strong>Otomatis Tersinkron:</strong> Logo yang Anda unggah di sini akan langsung diterapkan pada 
              <strong> Header Navbar</strong>, <strong>Kop Cetak PDF/Surat</strong>, <strong>Favicon Tab Browser</strong>, 
              serta <strong>Icon Thumbnail saat aplikasi diinstall di HP/Laptop</strong>.
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Bagian 1: Upload Logo */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-3">
              <label className="block font-bold text-slate-900 dark:text-white text-xs">
                Upload File Logo / Gambar Aplikasi
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Logo Preview Avatar */}
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-inner">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo Preview"
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-xl">
                        {badgeText || 'PP1'}
                      </div>
                    )}
                  </div>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      title="Hapus Logo Kustom"
                      className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md hover:bg-red-700 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Upload Buttons & Help */}
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingImage}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{isProcessingImage ? 'Memproses...' : logoUrl ? 'Ganti File Logo' : 'Unggah Logo Baru'}</span>
                    </button>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-colors cursor-pointer"
                      >
                        Pakai Badge Inisial
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Mendukung format PNG, JPG, SVG, atau WebP. Gambar kotak (1:1) minimal resolusi 200x200 px direkomendasikan.
                  </p>
                </div>
              </div>
            </div>

            {/* Bagian 2: Teks Nama & Subjudul */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Nama Web Apps (Lengkap) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Contoh: HR STAFF - PRODUKSI I"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Tampil pada header aplikasi, tab browser, &amp; dialog instalasi.
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Nama Pendek Icon di HP <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-[10px] font-mono ${appShortName.length > 12 ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>
                    {appShortName.length}/12 Karakter
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={14}
                  value={appShortName}
                  onChange={(e) => setAppShortName(e.target.value)}
                  placeholder="Contoh: HR STAFF I"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Nama teks tepat di bawah thumbnail HP (rekomendasi &le; 12 huruf agar tidak terpotong).
                </span>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Nama Perusahaan / Organisasi
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Contoh: PT BATU KARANG"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Subjudul / Unit Divisi
                </label>
                <input
                  type="text"
                  value={appSubtitle}
                  onChange={(e) => setAppSubtitle(e.target.value)}
                  placeholder="Contoh: PT Batu Karang — Divisi Produksi I (PP1)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Bagian 3: Live Preview Simulation */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-900 dark:text-white text-xs">
                  Simulasi Live Preview
                </span>
                <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab('mobile')}
                    className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                      activePreviewTab === 'mobile'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Layar Utama HP
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab('laptop')}
                    className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                      activePreviewTab === 'laptop'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    Header Laptop
                  </button>
                </div>
              </div>

              {activePreviewTab === 'mobile' ? (
                /* Mobile Home Screen Preview */
                <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-center flex flex-col items-center justify-center py-6 shadow-inner">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/80 mb-2 relative group flex items-center justify-center bg-slate-900">
                    {logoUrl ? (
                      <img src={logoUrl} alt="App Icon" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-xl">
                        {badgeText || 'PP1'}
                      </div>
                    )}
                  </div>
                  <div className="text-white font-bold text-xs tracking-wide">
                    {appShortName || 'HR STAFF I'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    (Thumbnail &amp; Teks yang akan terlihat di layar ponsel Anda)
                  </div>
                </div>
              ) : (
                /* Laptop Header Preview */
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shrink-0 flex items-center justify-center bg-slate-800 border border-slate-700">
                      {logoUrl ? (
                        <img src={logoUrl} alt="App Icon" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-xs">
                          {badgeText || 'PP1'}
                        </div>
                      )}
                    </div>
                    <div className="leading-tight truncate">
                      <div className="text-sm font-black text-white truncate">
                        {appName || 'HR STAFF - PRODUKSI I'}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {appSubtitle || 'PT Batu Karang — Divisi Produksi I (PP1)'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-[11px] font-semibold text-slate-500 hover:text-red-500 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset ke Logo Standar Pabrik
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Simpan &amp; Terapkan
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
