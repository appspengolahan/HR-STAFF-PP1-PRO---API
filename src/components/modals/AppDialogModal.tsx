import React, { useEffect, useState, useRef } from 'react';
import { AlertTriangle, AlertCircle, Info, X, Check, Trash2 } from 'lucide-react';
import { dialogService, DialogOptions } from '../../services/dialogService';

interface ActiveDialogWithResolve extends DialogOptions {
  resolve: (value: boolean) => void;
}

export const AppDialogModal: React.FC = () => {
  const [dialog, setDialog] = useState<ActiveDialogWithResolve | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const unsubscribe = dialogService.subscribe((current) => {
      setDialog(current as ActiveDialogWithResolve | null);
    });
    return unsubscribe;
  }, []);

  // Keyboard navigation (Enter to confirm, Escape to cancel)
  useEffect(() => {
    if (!dialog) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        dialog.resolve(false);
      } else if (e.key === 'Enter' && dialog.type === 'alert') {
        e.preventDefault();
        dialog.resolve(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog]);

  // Focus primary button when dialog opens
  useEffect(() => {
    if (dialog && confirmBtnRef.current) {
      setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 50);
    }
  }, [dialog]);

  if (!dialog) return null;

  const isAlert = dialog.type === 'alert';
  const isDestructive = dialog.isDestructive || dialog.type === 'danger';
  const displayTitle = dialog.title || 'hr staff pp1 says';

  const handleConfirm = () => {
    dialog.resolve(true);
  };

  const handleCancel = () => {
    dialog.resolve(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-dialog-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 no-print print:hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCancel();
        }
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden transform animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                isDestructive
                  ? 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400'
                  : isAlert
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                  : 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
              }`}
            >
              {isDestructive ? (
                <Trash2 className="w-4 h-4" />
              ) : isAlert ? (
                <Info className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3
                id="app-dialog-title"
                className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight"
              >
                {displayTitle}
              </h3>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                PT Batu Karang Divisi Produksi I
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            title="Tutup (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          <div className="flex items-start gap-3.5">
            <div
              className={`mt-0.5 p-2 rounded-full shrink-0 ${
                isDestructive
                  ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                  : isAlert
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                  : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
              }`}
            >
              {isDestructive ? (
                <AlertCircle className="w-5 h-5" />
              ) : isAlert ? (
                <Check className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-700 dark:text-slate-200 font-medium whitespace-pre-line leading-relaxed">
                {dialog.message}
              </p>
              {isDestructive && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
                  Perhatian: Tindakan ini akan memodifikasi atau menghapus data terkait.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50/50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
          {!isAlert && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {dialog.cancelText || 'Batal'}
            </button>
          )}
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5 ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
            }`}
          >
            {isDestructive ? <Trash2 className="w-3.5 h-3.5" /> : null}
            <span>{dialog.confirmText || 'OK'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
