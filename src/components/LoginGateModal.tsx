import React, { useState, useEffect } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { AuthUser, StaffData, UserRole } from '../types';

interface LoginGateModalProps {
  isOpen: boolean;
  onLoginSuccess: (user: AuthUser) => void;
  staffList: StaffData[];
  secretDoorTriggered: boolean;
  onCloseSecretDoorTrigger: () => void;
  onUnlockDeveloperMode: () => void;
}

export const LoginGateModal: React.FC<LoginGateModalProps> = ({
  isOpen,
  onLoginSuccess,
  staffList,
  secretDoorTriggered,
  onCloseSecretDoorTrigger,
  onUnlockDeveloperMode,
}) => {
  const [activeGate, setActiveGate] = useState<'management' | 'staff'>('management');

  // Gate 1: Management
  const [mgmtEmail, setMgmtEmail] = useState('');
  const [mgmtPassword, setMgmtPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mgmtError, setMgmtError] = useState<string | null>(null);

  // Gate 2: Staff Portal
  const [staffNip, setStaffNip] = useState('');
  const [staffNama, setStaffNama] = useState('');
  const [staffError, setStaffError] = useState<string | null>(null);

  // Secret Door State
  const [showDevDoorModal, setShowDevDoorModal] = useState(false);
  const [masterPin, setMasterPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isDevUnlocked, setIsDevUnlocked] = useState(false);

  // Hotkey Ctrl + Shift + D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setShowDevDoorModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // React to prop trigger from 5x clicks on logo
  useEffect(() => {
    if (secretDoorTriggered) {
      setShowDevDoorModal(true);
      onCloseSecretDoorTrigger();
    }
  }, [secretDoorTriggered, onCloseSecretDoorTrigger]);

  if (!isOpen && !showDevDoorModal) return null;

  // Handle Gate 1
  const handleManagementLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setMgmtError(null);

    const email = mgmtEmail.trim().toLowerCase();
    const pass = mgmtPassword.trim();

    // Default management credentials
    if (
      (email === 'admin@batukarang.co.id' ||
        email === 'hrd@batukarang.co.id' ||
        email === 'appspengolahan@gmail.com' ||
        email === 'lalu.mahendra@batukarang.co.id') &&
      (pass === 'admin123' || pass === 'batukarang2026' || pass === 'admin')
    ) {
      const user: AuthUser = {
        id: 'usr-mgmt-1',
        email: email,
        nip: 'BK-PP1-001',
        nama: email.includes('lalu') ? 'Lalu Mahendra Ali Akbar' : 'Administrator HRD',
        role: email.includes('lalu') ? 'Project Manager' : 'Admin HR',
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
      };
      onLoginSuccess(user);
    } else {
      setMgmtError('Email atau kata sandi tidak valid. Cek kembali kredensial Anda.');
    }
  };

  // Handle Gate 2
  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError(null);

    const nipInput = staffNip.trim().toUpperCase();
    const namaInput = staffNama.trim().toLowerCase();

    const matched = staffList.find(
      (s) =>
        s.nip.toUpperCase() === nipInput &&
        s.nama.toLowerCase().includes(namaInput)
    );

    if (matched) {
      const user: AuthUser = {
        id: `usr-stf-${matched.id}`,
        nip: matched.nip,
        nama: matched.nama,
        email: matched.email,
        role: 'Staf',
        portalType: 'staff',
        allowedTabs: ['slip', 'presensi', 'cuti', 'profil'],
        department: matched.sekup,
      };
      onLoginSuccess(user);
    } else {
      setStaffError('Data staf tidak ditemukan. Pastikan NIP dan Nama lengkap sesuai data.');
    }
  };

  // Handle Secret PIN verification
  const handleVerifyMasterPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterPin.trim() === 'admin') {
      setIsDevUnlocked(true);
      setPinError(null);
      onUnlockDeveloperMode();
    } else {
      setPinError('Master PIN tidak cocok. Akses ditolak.');
    }
  };

  // Quick switch role from Developer Door
  const handleDevBypass = (role: UserRole) => {
    let nama = 'Lead Developer';
    let nip = 'BK-PP1-DEV-00';
    let email = 'developer@batukarang.co.id';
    let portalType: 'management' | 'staff' = 'management';
    let allowed = [
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
    ];

    if (role === 'Project Manager') {
      nama = 'Lalu Mahendra Ali Akbar';
      nip = 'BK-PP1-001';
      email = 'lalu.mahendra@batukarang.co.id';
    } else if (role === 'Site Engineer') {
      nama = 'Andhik Dharmabakti';
      nip = 'BK-PP1-002';
      email = 'andhik.d@batukarang.co.id';
      allowed = ['dashboard', 'presensi', 'lembur', 'kpi', 'database', 'profil'];
    } else if (role === 'Admin HR') {
      nama = 'Fitri Handayani';
      nip = 'BK-PP1-008';
      email = 'fitri.h@batukarang.co.id';
    } else if (role === 'Finance') {
      nama = 'Hendra Wijaya';
      nip = 'BK-PP1-010';
      email = 'hendra.w@batukarang.co.id';
      allowed = ['dashboard', 'slip', 'rekap', 'database', 'profil'];
    } else if (role === 'Kepala Dept') {
      nama = 'Bambang Sudarsono';
      nip = 'BK-PP1-003';
      email = 'bambang.s@batukarang.co.id';
      allowed = ['dashboard', 'presensi', 'lembur', 'cuti', 'kpi', 'profil'];
    } else if (role === 'Staf') {
      nama = 'Fajar Nugroho';
      nip = 'BK-PP1-006';
      email = 'fajar.n@batukarang.co.id';
      portalType = 'staff';
      allowed = ['slip', 'presensi', 'cuti', 'profil'];
    }

    const user: AuthUser = {
      id: `dev-${role.toLowerCase().replace(/\s+/g, '-')}`,
      nip,
      nama,
      email,
      role,
      portalType,
      allowedTabs: allowed,
    };

    setShowDevDoorModal(false);
    onLoginSuccess(user);
  };

  return (
    <>
      {/* Dual Gate Login Modal */}
      {isOpen && !showDevDoorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
            {/* Header with PP1 brand */}
            <div className="p-6 pb-4 text-center bg-gradient-to-b from-blue-50/50 dark:from-slate-800/40 to-transparent">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-500 mx-auto flex items-center justify-center text-white text-xl font-black shadow-xl shadow-blue-900/30 mb-3">
                PP1
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                PT BATU KARANG
              </h2>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold tracking-wider uppercase mt-0.5">
                Sistem HR Staff &amp; Karyawan — PP1
              </p>
            </div>

            {/* Gate Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/60 dark:bg-slate-950/40 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveGate('management')}
                className={`flex-1 py-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  activeGate === 'management'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                Tim Manajemen &amp; HR
              </button>
              <button
                type="button"
                onClick={() => setActiveGate('staff')}
                className={`flex-1 py-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  activeGate === 'staff'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Portal Mandiri Karyawan
              </button>
            </div>

            {/* Form Container */}
            <div className="p-6">
              {activeGate === 'management' ? (
                <form onSubmit={handleManagementLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Email Akun Manajemen / HRD
                    </label>
                    <input
                      type="email"
                      required
                      value={mgmtEmail}
                      onChange={(e) => setMgmtEmail(e.target.value)}
                      placeholder="admin@batukarang.co.id"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Kata Sandi Rahasia
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={mgmtPassword}
                        onChange={(e) => setMgmtPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 pr-10 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {mgmtError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{mgmtError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-900/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    Masuk Gerbang Manajemen <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 text-center">
                    Demo Cepat: <code>admin@batukarang.co.id</code> / <code>admin123</code>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleStaffLogin} className="space-y-4">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs">
                    Portal Mandiri terisolasi: Anda hanya dapat mengakses slip gaji dan data profil pribadi Anda sendiri.
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      NIP Karyawan (Format: BK-PP1-xxx)
                    </label>
                    <input
                      type="text"
                      required
                      value={staffNip}
                      onChange={(e) => setStaffNip(e.target.value)}
                      placeholder="BK-PP1-006"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white uppercase font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Nama Lengkap Karyawan
                    </label>
                    <input
                      type="text"
                      required
                      value={staffNama}
                      onChange={(e) => setStaffNama(e.target.value)}
                      placeholder="Fajar Nugroho"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {staffError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{staffError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-900/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    Buka Portal Karyawan <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 text-center">
                    Contoh: NIP <code>BK-PP1-006</code> / Nama: <code>Fajar Nugroho</code>
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center text-[10px] text-slate-500">
              Divisi Produksi I - All Rights Reserved . Developed by Lalu Mahendra
            </div>
          </div>
        </div>
      )}

      {/* Secret Developer Door Modal */}
      {showDevDoorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg animate-in fade-in duration-300">
          <div className="bg-slate-900 text-slate-100 rounded-3xl shadow-2xl border border-indigo-500/40 w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="p-6 text-center border-b border-slate-800 bg-slate-950">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 mx-auto flex items-center justify-center mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Secret Developer &amp; Supervisor Door
              </h3>
              <p className="text-xs text-indigo-300">
                Pintu Akses Khusus: Developer, PM, &amp; Site Engineer
              </p>
            </div>

            <div className="p-6 space-y-4">
              {!isDevUnlocked ? (
                <form onSubmit={handleVerifyMasterPin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Masukkan Master PIN Pengembang:
                    </label>
                    <input
                      type="password"
                      autoFocus
                      required
                      value={masterPin}
                      onChange={(e) => setMasterPin(e.target.value)}
                      placeholder="Ketik 'admin'"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {pinError && (
                    <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 rounded-xl text-xs flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>{pinError}</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDevDoorModal(false)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors"
                    >
                      Buka Pintu Rahasia
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-indigo-950/60 border border-indigo-500/40 rounded-xl text-indigo-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Master PIN Terverifikasi! Pilih profil peran simulasi:</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {[
                      { role: 'Lead Developer' as UserRole, desc: 'Akses Penuh Debugger & Konfigurasi' },
                      { role: 'Project Manager' as UserRole, desc: 'Lalu Mahendra Ali Akbar (PP1 Full Admin)' },
                      { role: 'Site Engineer' as UserRole, desc: 'Andhik Dharmabakti (Supervisor Operasional)' },
                      { role: 'Admin HR' as UserRole, desc: 'Fitri Handayani (Personalia & Presensi)' },
                      { role: 'Finance' as UserRole, desc: 'Hendra Wijaya (Payroll, PPh21 & BPJS)' },
                      { role: 'Kepala Dept' as UserRole, desc: 'Bambang Sudarsono (Approval & Mutasi)' },
                      { role: 'Staf' as UserRole, desc: 'Fajar Nugroho (Portal Mandiri Pekerja)' },
                    ].map((item) => (
                      <button
                        key={item.role}
                        onClick={() => handleDevBypass(item.role)}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700 hover:border-indigo-400/50 transition-all flex items-center justify-between group"
                      >
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-indigo-300">
                            {item.role}
                          </div>
                          <div className="text-[10px] text-slate-400">{item.desc}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" />
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowDevDoorModal(false)}
                    className="w-full mt-2 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Tutup Modal
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
