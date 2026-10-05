import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'nav' | 'mobile-banner' | 'sidebar' | 'pill';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'nav' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already running as installed standalone PWA, suppress
  if (isInstalled) {
    return null;
  }

  const handleAction = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  const renderContent = () => {
    if (variant === 'mobile-banner') {
      return (
        <div className="mx-3 my-2 p-3 bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 text-white rounded-xl shadow-md flex items-center justify-between gap-2 border border-blue-400/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold leading-tight">Install Aplikasi di HP</div>
              <div className="text-[10px] text-blue-100 leading-tight">Akses cepat, offline &amp; layar penuh</div>
            </div>
          </div>
          <button
            onClick={handleAction}
            className="px-3 py-1.5 bg-white text-blue-900 rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-transform"
          >
            Pasang
          </button>
        </div>
      );
    }

    if (variant === 'sidebar') {
      return (
        <button
          onClick={handleAction}
          className="w-full mx-auto my-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Install Aplikasi (PWA)</span>
        </button>
      );
    }

    // Default 'nav' or 'pill'
    return (
      <button
        onClick={handleAction}
        className="px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
        title="Pasang aplikasi di PC, Laptop, Tablet, atau HP"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install App</span>
        <span className="sm:hidden">Install</span>
      </button>
    );
  };

  return (
    <>
      {renderContent()}

      {/* Guide Modal for iOS Safari / Unsupported Browsers */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isIOS ? 'Pasang di iPhone / iPad' : 'Cara Pasang di Perangkat Anda'}
                </h3>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
              {isIOS ? (
                <>
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <Share2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>1. Buka di Safari</strong>, lalu ketuk ikon tombol <strong>Bagikan (Share)</strong> di bilah bawah.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <PlusSquare className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>2. Gulir ke bawah</strong> dan pilih opsi <strong>Tambah ke Layar Utama (Add to Home Screen)</strong>.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>3. Ketuk 'Tambah'</strong> di pojok kanan atas. Ikon aplikasi akan muncul di layar utama HP Anda!
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <Download className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Di Chrome / Edge (Laptop/PC)</strong>: Klik ikon <strong>Install</strong> di address bar browser Anda (pojok kanan atas).
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <Smartphone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Di HP Android</strong>: Ketuk menu titik tiga (⋮) di Chrome lalu pilih <strong>Pasang Aplikasi / Tambahkan ke Layar Utama</strong>.
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
