import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X,
  User,
  Mail,
  Shield,
  RotateCcw,
} from 'lucide-react';
import { AuthUser } from '../../types';
import { storageService, DEFAULT_STAFF_PIN } from '../../services/storageService';

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onSuccess?: (newPin: string) => void;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
}) => {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showOldPin, setShowOldPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [confirmResetMode, setConfirmResetMode] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
      setError(null);
      setSuccessMessage(null);
      setShowOldPin(false);
      setShowNewPin(false);
      setShowConfirmPin(false);
      setConfirmResetMode(false);
    }
  }, [isOpen]);

  if (!isOpen || !currentUser) return null;

  const staffNip = (currentUser.nip || '').trim().toUpperCase() || 'BK-PP1-001';
  const hasCustomPin = storageService.hasStaffCustomPin(staffNip);
  const currentSavedPin = storageService.getStaffPin(staffNip);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const trimmedOld = oldPin.trim();
    const trimmedNew = newPin.trim();
    const trimmedConfirm = confirmPin.trim();

    // 1. Validasi PIN lama
    if (trimmedOld !== currentSavedPin) {
      setError(
        'PIN saat ini tidak cocok! Masukkan PIN lama yang benar (atau 123456 jika belum pernah diganti).'
      );
      return;
    }

    // 2. Validasi panjang PIN baru
    if (trimmedNew.length < 4 || trimmedNew.length > 12) {
      setError('PIN baru harus terdiri dari minimal 4 digit hingga maksimal 12 digit/karakter.');
      return;
    }

    // 3. Validasi PIN baru tidak boleh sama persis dengan PIN default jika ingin ganti
    if (trimmedNew === trimmedOld) {
      setError('PIN baru tidak boleh sama dengan PIN saat ini. Silakan buat kombinasi baru.');
      return;
    }

    // 4. Validasi kecocokan konfirmasi PIN
    if (trimmedNew !== trimmedConfirm) {
      setError('Konfirmasi PIN baru tidak sesuai dengan PIN baru.');
      return;
    }

    // Simpan PIN baru ke storage dengan multi-layer persistence
    storageService.setStaffPin(staffNip, trimmedNew);
    setSuccessMessage('PIN Keamanan Akun Anda berhasil diperbarui dan tersimpan permanen!');

    if (onSuccess) {
      onSuccess(trimmedNew);
    }

    // Tutup setelah 1.5 detik
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleResetToDefault = () => {
    storageService.setStaffPin(staffNip, DEFAULT_STAFF_PIN);
    setSuccessMessage(`PIN berhasil di-reset kembali ke PIN Standar (${DEFAULT_STAFF_PIN})!`);
    setConfirmResetMode(false);
    if (onSuccess) {
      onSuccess(DEFAULT_STAFF_PIN);
    }
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 dark:from-slate-900 dark:to-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-900/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Ganti PIN Portal Mandiri
              </h3>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                Autentikasi Keamanan Staf Terisolasi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Staf Saat Ini */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850/60 border-b border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0 truncate">
              <div className="font-bold text-slate-900 dark:text-white truncate">
                {currentUser.nama}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {currentUser.nip} • {currentUser.email}
              </div>
            </div>
          </div>

          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
              hasCustomPin
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
            }`}
          >
            {hasCustomPin ? 'PIN Kustom Aktif' : 'PIN Default (123456)'}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* PIN Lama */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>PIN Saat Ini <span className="text-red-500">*</span></span>
              {!hasCustomPin && (
                <span className="text-[10px] text-slate-400">Default: <code>123456</code></span>
              )}
            </label>
            <div className="relative">
              <input
                type={showOldPin ? 'text' : 'password'}
                required
                maxLength={12}
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value)}
                placeholder="Masukkan PIN lama / default"
                className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowOldPin(!showOldPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showOldPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* PIN Baru */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              PIN Baru <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNewPin ? 'text' : 'password'}
                required
                maxLength={12}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Minimal 4 - 6 digit angka/karakter"
                className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowNewPin(!showNewPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Konfirmasi PIN Baru */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Ulangi PIN Baru <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPin ? 'text' : 'password'}
                required
                maxLength={12}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Ketik ulang PIN baru yang sama"
                className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPin(!showConfirmPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Feedback Error / Success */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {/* Security advice */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            <strong className="text-slate-700 dark:text-slate-300 block mb-0.5">Tips Keamanan:</strong>
            Jangan beritahukan PIN Anda kepada orang lain. PIN ini melindungi akses eksklusif ke rincian slip gaji, riwayat presensi, dan form permohonan ijin Anda.
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2">
            {hasCustomPin && !confirmResetMode && (
              <button
                type="button"
                onClick={() => setConfirmResetMode(true)}
                className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Reset kembali ke default 123456"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Default
              </button>
            )}

            {confirmResetMode && (
              <div className="flex items-center gap-1.5 p-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px]">
                <span className="text-amber-800 dark:text-amber-300 font-medium px-1">Reset 123456?</span>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[10px] cursor-pointer"
                >
                  Ya
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmResetMode(false)}
                  className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] cursor-pointer"
                >
                  Batal
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-900/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              Simpan PIN Baru
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
