import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Globe,
  Search,
  ChevronDown,
  X,
  AlertOctagon,
  UserCheck,
  Mail,
  Key,
} from 'lucide-react';
import { AuthUser, StaffData, UserRole } from '../types';
import { storageService, DEFAULT_STAFF_PIN } from '../services/storageService';

interface LoginGateModalProps {
  isOpen: boolean;
  onLoginSuccess: (user: AuthUser) => void;
  staffList: StaffData[];
  secretDoorTriggered: boolean;
  onCloseSecretDoorTrigger: () => void;
  onUnlockDeveloperMode: () => void;
  onOpenPublicPortal?: () => void;
  initialGate?: 'management' | 'staff';
}

export const LoginGateModal: React.FC<LoginGateModalProps> = ({
  isOpen,
  onLoginSuccess,
  staffList,
  secretDoorTriggered,
  onCloseSecretDoorTrigger,
  onUnlockDeveloperMode,
  onOpenPublicPortal,
  initialGate = 'management',
}) => {
  const [activeGate, setActiveGate] = useState<'management' | 'staff'>(initialGate);

  // Sync activeGate when initialGate prop changes or modal opens
  useEffect(() => {
    if (initialGate) {
      setActiveGate(initialGate);
    }
  }, [initialGate, isOpen]);

  // Gate 1: Management
  const [mgmtEmail, setMgmtEmail] = useState('');
  const [mgmtPassword, setMgmtPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mgmtError, setMgmtError] = useState<string | null>(null);

  // Gate 2: Staff Portal (3-Factor Authentication: Nama/NIP, Email Terdaftar, PIN)
  const [staffSearchInput, setStaffSearchInput] = useState('');
  const [staffEmailInput, setStaffEmailInput] = useState('');
  const [staffPinInput, setStaffPinInput] = useState('');
  const [showStaffPin, setShowStaffPin] = useState(false);
  const [selectedStaffObj, setSelectedStaffObj] = useState<StaffData | null>(null);
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
  const [highlightedStaffIdx, setHighlightedStaffIdx] = useState(0);
  const [staffError, setStaffError] = useState<string | null>(null);
  const staffInputRef = useRef<HTMLInputElement>(null);
  const staffDropdownRef = useRef<HTMLDivElement>(null);

  // Helper mask email for security hint (e.g. "c***y@gmail.com")
  const maskEmailHint = (email?: string): string => {
    if (!email || !email.includes('@')) return 'email-terdaftar@...';
    const [name, domain] = email.split('@');
    if (name.length <= 2) {
      return `${name[0]}*@${domain}`;
    }
    const start = name.slice(0, 2);
    const end = name.slice(-1);
    const stars = '*'.repeat(Math.max(2, name.length - 3));
    return `${start}${stars}${end}@${domain}`;
  };

  // Filter staff suggestions from database
  const staffSuggestions = useMemo(() => {
    const q = staffSearchInput.trim().toLowerCase();
    if (!q) return staffList;
    return staffList.filter(
      (s) =>
        s.nama.toLowerCase().includes(q) ||
        s.nip.toLowerCase().includes(q) ||
        (s.jabatan && s.jabatan.toLowerCase().includes(q))
    );
  }, [staffList, staffSearchInput]);

  // Click outside listener for staff dropdown
  useEffect(() => {
    const handleClickOutside = (e: PointerEvent) => {
      if (staffDropdownRef.current && !staffDropdownRef.current.contains(e.target as Node)) {
        setIsStaffDropdownOpen(false);
      }
    };
    if (isStaffDropdownOpen) {
      document.addEventListener('pointerdown', handleClickOutside);
    }
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isStaffDropdownOpen]);

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

  // Handle Gate 2: Staff Portal Login (3-Factor Authentication)
  const handleSelectStaffSuggestion = (s: StaffData) => {
    setStaffSearchInput(s.nama);
    setSelectedStaffObj(s);
    setIsStaffDropdownOpen(false);
    setStaffError(null);
  };

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError(null);

    const query = staffSearchInput.trim().toLowerCase();
    if (!query) {
      setStaffError('Silakan pilih nama lengkap atau masukkan NIP Anda.');
      return;
    }

    // 1. Verifikasi Faktor 1: Staf Terdaftar di Database
    const matched = staffList.find(
      (s) =>
        s.nama.trim().toLowerCase() === query ||
        s.nip.trim().toLowerCase() === query ||
        (query.length >= 3 && s.nama.trim().toLowerCase().includes(query))
    );

    if (!matched) {
      setStaffError(
        `AKSES DITOLAK: Nama atau NIP "${staffSearchInput}" TIDAK TERCANTUM pada database staf resmi PT Batu Karang. Akses hanya diizinkan untuk staf terdaftar.`
      );
      return;
    }

    // 2. Verifikasi Faktor 2: Email Resmi Terdaftar
    const inputEmail = staffEmailInput.trim().toLowerCase();
    const registeredEmail = (matched.email || `${matched.nip.toLowerCase()}@batukarang.co.id`).trim().toLowerCase();

    if (!inputEmail) {
      setStaffError('Silakan masukkan email resmi yang terdaftar di database HRD PT Batu Karang.');
      return;
    }

    if (inputEmail !== registeredEmail) {
      setStaffError(
        `AKSES DITOLAK: Email yang dimasukkan tidak sesuai dengan email resmi staf ${matched.nama} di database HRD. Petunjuk: ${maskEmailHint(matched.email)}`
      );
      return;
    }

    // 3. Verifikasi Faktor 3: PIN Keamanan (Default: 123456 atau PIN kustom)
    const inputPin = staffPinInput.trim();
    if (!inputPin) {
      setStaffError('Silakan masukkan PIN Keamanan Anda (PIN standar awal: 123456).');
      return;
    }

    const correctPin = storageService.getStaffPin(matched.nip).trim();
    if (inputPin !== correctPin) {
      setStaffError(
        'AKSES DITOLAK: PIN Keamanan salah! Gunakan PIN standar (123456) jika belum pernah diubah, atau masukkan PIN baru yang telah Anda atur.'
      );
      return;
    }

    // Seluruh 3 faktor terverifikasi sukses
    const user: AuthUser = {
      id: `usr-stf-${matched.id || matched.nip}`,
      nip: matched.nip,
      nama: matched.nama,
      email: matched.email || `${matched.nip.toLowerCase()}@batukarang.co.id`,
      role: 'Staf',
      portalType: 'staff',
      allowedTabs: ['presensi', 'slip', 'cuti', 'profil'],
      department: matched.sekup,
    };
    onLoginSuccess(user);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md max-h-[90dvh] overflow-y-auto">
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
                <form onSubmit={handleStaffLogin} className="space-y-3.5">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-850 dark:text-emerald-300 text-xs leading-relaxed">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Autentikasi 3-Faktor Keamanan Staf:</span>
                    </div>
                    Untuk mencegah penyalahgunaan akun, login staf wajib memverifikasi <strong>Nama Resmi</strong>, <strong>Email HR Terdaftar</strong>, dan <strong>PIN Keamanan</strong>.
                  </div>

                  {/* FAKTOR 1: Nama Lengkap / NIP */}
                  <div className="space-y-1" ref={staffDropdownRef}>
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center text-[9px] font-black">1</span>
                        Nama Lengkap atau NIP <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                        {staffList.length} Staf Terdaftar
                      </span>
                    </div>

                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        ref={staffInputRef}
                        type="text"
                        required
                        value={staffSearchInput}
                        onChange={(e) => {
                          setStaffSearchInput(e.target.value);
                          setStaffError(null);
                          // Auto match object if exact match
                          const exact = staffList.find(
                            (s) =>
                              s.nama.toLowerCase() === e.target.value.trim().toLowerCase() ||
                              s.nip.toLowerCase() === e.target.value.trim().toLowerCase()
                          );
                          setSelectedStaffObj(exact || null);
                          if (!isStaffDropdownOpen) setIsStaffDropdownOpen(true);
                        }}
                        onFocus={() => setIsStaffDropdownOpen(true)}
                        placeholder="Ketik nama staf atau NIP..."
                        className="w-full pl-9 pr-16 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      />

                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {staffSearchInput && (
                          <button
                            type="button"
                            onClick={() => {
                              setStaffSearchInput('');
                              setSelectedStaffObj(null);
                              setStaffError(null);
                              setIsStaffDropdownOpen(true);
                              staffInputRef.current?.focus();
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsStaffDropdownOpen(!isStaffDropdownOpen)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md cursor-pointer"
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              isStaffDropdownOpen ? 'rotate-180 text-emerald-600' : ''
                            }`}
                          />
                        </button>
                      </div>

                      {/* Dropdown saran staf terdaftar dari database */}
                      {isStaffDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-1 duration-150">
                          <div className="px-3 py-1 bg-slate-50 dark:bg-slate-950/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 flex items-center justify-between">
                            <span>Database Staf Resmi PP1</span>
                            <span>{staffSuggestions.length} Staf</span>
                          </div>
                          {staffSuggestions.length === 0 ? (
                            <div className="p-3 text-center text-xs text-rose-500">
                              Tidak ada staf dengan nama "{staffSearchInput}" di database.
                            </div>
                          ) : (
                            staffSuggestions.map((st) => (
                              <button
                                key={st.nip}
                                type="button"
                                onClick={() => handleSelectStaffSuggestion(st)}
                                className="w-full px-3 py-2 text-left flex items-center justify-between gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer text-xs group"
                              >
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                                    {st.nama}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate">
                                    {st.jabatan} • {st.sekup}
                                  </div>
                                </div>
                                <span className="font-mono text-[10px] text-slate-400 shrink-0">
                                  {st.nip}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* FAKTOR 2: Email Resmi Terdaftar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center text-[9px] font-black">2</span>
                        Email Resmi Terdaftar di HR <span className="text-red-500">*</span>
                      </label>
                      {selectedStaffObj && (
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                          Petunjuk: {maskEmailHint(selectedStaffObj.email)}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={staffEmailInput}
                        onChange={(e) => {
                          setStaffEmailInput(e.target.value);
                          setStaffError(null);
                        }}
                        placeholder="Masukkan alamat email resmi Anda..."
                        className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* FAKTOR 3: PIN Keamanan */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center text-[9px] font-black">3</span>
                        PIN Keamanan Staf <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400">
                        Default: <code>123456</code>
                      </span>
                    </div>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showStaffPin ? 'text' : 'password'}
                        required
                        maxLength={12}
                        value={staffPinInput}
                        onChange={(e) => {
                          setStaffPinInput(e.target.value);
                          setStaffError(null);
                        }}
                        placeholder="•••••• (Masukkan PIN Anda)"
                        className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStaffPin(!showStaffPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showStaffPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      PIN awal adalah <strong>123456</strong>. Anda dapat mengganti PIN secara mandiri kapan saja setelah masuk ke portal.
                    </p>
                  </div>

                  {staffError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-start gap-2.5 animate-in shake duration-200">
                      <AlertOctagon className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                      <div className="leading-relaxed text-[11px]">
                        <strong className="block font-bold">AKSES VERIFIKASI DITOLAK</strong>
                        <span>{staffError}</span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-900/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                  >
                    Verifikasi 3-Faktor &amp; Masuk Portal <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 text-center">
                    Aman &amp; Terisolasi: Data pribadi staf lain tidak dapat diakses tanpa kredensial valid.
                  </div>
                </form>
              )}
            </div>

            {/* Tombol Akses Tamu / Linktree Publik */}
            {onOpenPublicPortal && (
              <div className="px-6 pb-4">
                <button
                  type="button"
                  onClick={onOpenPublicPortal}
                  className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all group cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>🌐 Buka Portal Informasi Publik (Linktree / Tamu) ↗</span>
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center text-[10px] text-slate-500">
              Divisi Produksi I - All Rights Reserved . Developed by Lalu Mahendra
            </div>
          </div>
        </div>
      )}

      {/* Secret Developer Door Modal */}
      {showDevDoorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-lg animate-in fade-in duration-300">
          <div className="bg-slate-900 text-slate-100 rounded-3xl shadow-2xl border border-indigo-500/40 w-full max-w-md max-h-[90dvh] overflow-y-auto">
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
