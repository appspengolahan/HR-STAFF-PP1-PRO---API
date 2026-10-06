import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Laptop,
  X,
  CheckCircle2,
  Share2,
  PlusSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'nav' | 'mobile-banner' | 'sidebar' | 'pill';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'nav' }) => {
  const { isInstallable, isInstalled, isIOS, isMobile, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(() => {
    return sessionStorage.getItem('bk_pwa_banner_dismissed') === 'true';
  });

  // If running in standalone installed app, do not show install buttons
  if (isInstalled) {
    return null;
  }

  const handleAction = async () => {
    if (isInstallable) {
      const res = await install();
      if (res === 'unavailable') {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  const handleDismissBanner = () => {
    setIsBannerDismissed(true);
    sessionStorage.setItem('bk_pwa_banner_dismissed', 'true');
  };

  const renderContent = () => {
    if (variant === 'mobile-banner') {
      if (isBannerDismissed) return null;

      return (
        <div className="mx-2 sm:mx-3 my-2 p-3 bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 text-white rounded-2xl shadow-lg flex items-center justify-between gap-3 border border-blue-400/30 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-xs">
              <Smartphone className="w-5 h-5 text-cyan-200" />
            </div>
            <div className="text-left min-w-0">
              <div className="text-xs font-bold leading-tight flex items-center gap-1.5 truncate">
                <span>Pasang Aplikasi HR PP1</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-cyan-400 text-blue-950">
                  1-Klik
                </span>
              </div>
              <div className="text-[10px] text-blue-100/90 leading-tight truncate">
                Akses instan di layar utama HP &amp; mode offline
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleAction}
              className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-900 rounded-xl text-xs font-black shadow-sm active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-700" />
              <span>Pasang</span>
            </button>
            <button
              onClick={handleDismissBanner}
              className="p-1 rounded-lg hover:bg-white/10 text-blue-200 hover:text-white transition-colors cursor-pointer"
              title="Tutup banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );
    }

    if (variant === 'sidebar') {
      return (
        <button
          onClick={handleAction}
          className="w-full my-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer group"
          title="Pasang aplikasi di PC atau HP"
        >
          <Download className="w-4 h-4 text-cyan-200 group-hover:scale-110 transition-transform" />
          <span>Install Aplikasi (PWA)</span>
        </button>
      );
    }

    // Default 'nav' or 'pill'
    return (
      <button
        onClick={handleAction}
        className="px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
        title="Pasang aplikasi di PC, Laptop, atau HP"
      >
        <Download className="w-3.5 h-3.5 text-cyan-200" />
        <span className="hidden sm:inline">Install App</span>
        <span className="sm:hidden">Install</span>
      </button>
    );
  };

  return (
    <>
      {renderContent()}

      {/* Interactive Modal Panduan Pasang Instan (Tanpa Ribet) */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl text-slate-800 dark:text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-black text-xs shadow-md">
                  PP1
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    Pasang Aplikasi HR PP1
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    PT Batu Karang — Divisi Produksi I
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-4 space-y-3 text-xs">
              {isInstallable ? (
                /* Native 1-Tap Trigger Available */
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900/60 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto shadow-sm">
                    <Sparkles className="w-5 h-5 text-cyan-200" />
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs">
                    Perangkat Anda Siap Pasang 1-Klik!
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Klik tombol di bawah untuk langsung memunculkan dialog resmi instalasi:
                  </p>
                  <button
                    onClick={async () => {
                      setShowGuide(false);
                      await install();
                    }}
                    className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    Pasang Sekarang di Perangkat
                  </button>
                </div>
              ) : isIOS ? (
                /* iOS Safari Instructions */
                <div className="space-y-2.5">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-start gap-2.5 border border-slate-100 dark:border-slate-800">
                    <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">
                      1
                    </div>
                    <div>
                      Buka situs ini di browser <strong>Safari</strong> iPhone / iPad Anda.
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-start gap-2.5 border border-slate-100 dark:border-slate-800">
                    <Share2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      Ketuk tombol <strong>Bagikan (Share)</strong> di bilah bawah Safari.
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-start gap-2.5 border border-slate-100 dark:border-slate-800">
                    <PlusSquare className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      Pilih <strong>Tambah ke Layar Utama (Add to Home Screen)</strong> lalu ketuk <strong>Tambah</strong>.
                    </div>
                  </div>
                </div>
              ) : isMobile ? (
                /* Android Chrome Direct Instructions */
                <div className="space-y-2.5">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed">
                      Service Worker &amp; Ikon PWA kini telah diperbarui. Jika dialog pasang belum otomatis keluar:
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-start gap-2.5 border border-slate-100 dark:border-slate-800">
                    <Smartphone className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      Pada jendela <em>"Instal dan buat pintasan"</em> di Chrome, pilih <strong>Instal</strong> atau <strong>Tambahkan ke Layar Utama</strong>.
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-start gap-2.5 border border-slate-100 dark:border-slate-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      Aplikasi akan terpasang sebagai aplikasi mandiri (*Standalone App*) dengan logo resmi <strong>PP1</strong> di layar HP Anda.
                    </div>
                  </div>
                </div>
              ) : (
                /* Desktop PC / Laptop Instructions */
                <div className="space-y-2.5">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-start gap-2.5 border border-slate-100 dark:border-slate-800">
                    <Laptop className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Di Komputer / Laptop (Chrome / Edge)</strong>:<br />
                      Perhatikan <strong>ujung kanan bilah URL (Address Bar)</strong> browser Anda, klik ikon <strong>Install / Pasang Aplikasi</strong> 💻.
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-start gap-2.5 border border-slate-100 dark:border-slate-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      Setelah dipasang, aplikasi berjalan di jendela tersendiri tanpa bilah browser layaknya software desktop profesional!
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-5">
              <button
                onClick={() => setShowGuide(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
