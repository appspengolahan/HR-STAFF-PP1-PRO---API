import React, { useState, useEffect, useRef } from 'react';
import {
  Maximize,
  Minimize,
  Moon,
  Sun,
  HelpCircle,
  Layers,
  Zap,
  LogOut,
  User,
  Shield,
  ChevronDown,
  Download,
  Smartphone,
  ExternalLink,
  Sliders,
  CheckCircle2,
  RefreshCw,
  FileSpreadsheet,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Globe,
  KeyRound,
  QrCode,
  Copy,
  Check,
  Lock,
} from 'lucide-react';
import { AuthUser, AppBrandingSettings, UserRole } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { ROLES } from './RoleSimulatorBar';

interface NavbarProps {
  currentUser: AuthUser | null;
  onLogout: () => void;
  onOpenHelp: () => void;
  onOpenSwitchBoard: () => void;
  onOpenGasCenter: () => void;
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
  onTriggerSecretDoor: () => void;
  sidebarCollapsed: boolean;
  onToggleSidebar?: () => void;
  isDevSupervisorVisible?: boolean;
  onToggleDevSupervisor?: () => void;
  onSwitchRole?: (role: UserRole) => void;
  isAutoRefreshActive?: boolean;
  onToggleAutoRefresh?: () => void;
  isDatasheetSourceActive?: boolean;
  onToggleDatasheetSource?: () => void;
  onManualSyncDatasheet?: () => void;
  isSyncing?: boolean;
  onOpenColumnSettings?: () => void;
  branding?: AppBrandingSettings;
  onOpenBrandCustomizer?: () => void;
  onOpenPublicShare?: () => void;
  onOpenChangePin?: () => void;
  onOpenQrLogin?: (target?: 'staff-login' | 'management-login' | 'public-portal') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onOpenHelp,
  onOpenSwitchBoard,
  onOpenGasCenter,
  themeMode,
  onToggleTheme,
  onTriggerSecretDoor,
  sidebarCollapsed,
  onToggleSidebar,
  isDevSupervisorVisible = false,
  onToggleDevSupervisor,
  onSwitchRole,
  isAutoRefreshActive = true,
  onToggleAutoRefresh,
  isDatasheetSourceActive = false,
  onToggleDatasheetSource,
  onManualSyncDatasheet,
  isSyncing = false,
  onOpenColumnSettings,
  branding,
  onOpenBrandCustomizer,
  onOpenPublicShare,
  onOpenChangePin,
  onOpenQrLogin,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAccessDropdownOpen, setIsAccessDropdownOpen] = useState(false);
  const [copiedLinkType, setCopiedLinkType] = useState<'staff' | 'public' | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const accessDropdownRef = useRef<HTMLDivElement>(null);
  const { isInstallable, isInstalled, install } = usePWAInstall();

  // Fullscreen event listener
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Outside pointer & Escape key listener to close dropdowns cleanly on touch and mouse
  useEffect(() => {
    const handleClickOutside = (e: PointerEvent) => {
      const target = e.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
      if (accessDropdownRef.current && !accessDropdownRef.current.contains(target)) {
        setIsAccessDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
        setIsAccessDropdownOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleCopyLink = async (type: 'staff' | 'public') => {
    if (typeof window === 'undefined') return;
    const origin = window.location.origin;
    const path = window.location.pathname;
    const url = type === 'staff'
      ? `${origin}${path}?view=login&gate=staff`
      : `${origin}${path}?view=public`;

    try {
      await navigator.clipboard.writeText(url);
      setCopiedLinkType(type);
      setTimeout(() => setCopiedLinkType(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.log(err));
    } else {
      document.exitFullscreen().catch((err) => console.log(err));
    }
  };

  const handleLogoClick = () => {
    const nextCount = logoClickCount + 1;
    setLogoClickCount(nextCount);
    if (nextCount >= 5) {
      setLogoClickCount(0);
      onTriggerSecretDoor();
    }
    setTimeout(() => setLogoClickCount(0), 3000);
  };

  // User initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return 'BK';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 w-full h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-30 transition-all duration-300 flex items-center justify-between px-3 sm:px-6 shadow-xs no-print print:hidden"
    >
      {/* SISI KIRI: Brand & Judul Aplikasi Sejajar Persis dengan Menu Sidebar */}
      <div className="flex items-center gap-3 min-w-0 pr-2 pl-0.5 sm:pl-1">
        <div
          onClick={handleLogoClick}
          className="relative group w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-xs shadow-md shadow-blue-900/20 cursor-pointer select-none active:scale-95 transition-transform shrink-0 border border-white/20 dark:border-slate-700"
          title={`${branding?.appName || 'HR STAFF - PRODUKSI I'} (Klik 5x untuk Developer Door)`}
        >
          {branding?.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={branding.appName || 'Logo Aplikasi'}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{branding?.badgeText || 'PP1'}</span>
          )}
        </div>

        <div className="leading-tight truncate min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-sm sm:text-base tracking-wide text-slate-900 dark:text-white truncate">
              {branding?.appName || 'HR STAFF - PRODUKSI I'}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/20 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Pabrik Aktif
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {branding?.appSubtitle || 'PT Batu Karang — Divisi Produksi I (PP1)'}
          </p>
        </div>
      </div>

      {/* SISI KANAN: Auto Refresh Toggle + Shortcut Tema + Satu Toggle Dropdown Terpadu */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Toggle Auto Refresh (Terus Berjalan & Berputar Terus Menerus) */}
        {onToggleAutoRefresh && (
          <button
            onClick={onToggleAutoRefresh}
            title={
              isAutoRefreshActive
                ? 'Auto Refresh Aktif (Icon terus berputar & data otomatis terupdate dari Spreadsheet). Klik untuk mematikan.'
                : 'Auto Refresh Nonaktif. Klik untuk mengaktifkan pembaruan data otomatis terus menerus.'
            }
            className={`min-h-[40px] sm:min-h-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer select-none text-xs font-semibold ${
              isAutoRefreshActive
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shadow-xs ring-1 ring-emerald-400/20'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isAutoRefreshActive
                  ? 'animate-spin text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400'
              }`}
            />
            <span className="hidden sm:inline-block">
              {isAutoRefreshActive ? 'Auto Refresh ON' : 'Auto Refresh'}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isAutoRefreshActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
          </button>
        )}

        {/* Toggle Alternatif: Tarik Dari Datasheet (Langsung Baca Google Sheets CSV) */}
        {onToggleDatasheetSource && (
          <button
            onClick={onToggleDatasheetSource}
            title={
              isDatasheetSourceActive
                ? 'Mode Datasheet AKTIF (Alternatif Langsung CSV): Penarikan data diprioritaskan langsung ke file Google Spreadsheet (MASTER_STAFF & LOG_PRESENSI). Klik untuk kembali ke REST API GAS.'
                : 'Mode REST API GAS Aktif. Klik untuk mengaktifkan alternatif "Tarik Dari Datasheet" (langsung baca CSV Google Spreadsheet).'
            }
            className={`min-h-[40px] sm:min-h-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer select-none text-xs font-semibold ${
              isDatasheetSourceActive
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 shadow-xs ring-1 ring-blue-400/20'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            <FileSpreadsheet
              className={`w-3.5 h-3.5 ${
                isDatasheetSourceActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
              }`}
            />
            <span className="hidden md:inline-block">
              {isDatasheetSourceActive ? 'Datasheet Live' : 'Tarik Datasheet'}
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                isDatasheetSourceActive
                  ? 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
              }`}
            >
              {isDatasheetSourceActive ? 'CSV ON' : 'OFF'}
            </span>
          </button>
        )}

        {/* Quick Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          title={themeMode === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          className="min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
        >
          {themeMode === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* GRUP AKSES PUBLIK & QR CODE LOGIN STAF */}
        <div className="relative hidden sm:flex items-center" ref={accessDropdownRef}>
          <div className="inline-flex rounded-xl p-0.5 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs">
            {/* Tombol QR Code Login Staf */}
            {onOpenQrLogin && (
              <button
                type="button"
                onClick={() => onOpenQrLogin('staff-login')}
                title="Buka QR Code Login Staf (Bisa di-expand ke layar penuh & di-download HD untuk scan staf)"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer select-none text-xs font-bold shadow-xs active:scale-95"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span className="hidden lg:inline-block">QR Login</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-white/20 text-white">
                  Scan
                </span>
              </button>
            )}

            {/* Tombol Portal Publik Linktree */}
            {onOpenPublicShare && (
              <button
                type="button"
                onClick={onOpenPublicShare}
                title="Buka &amp; Salin tautan Portal Informasi Publik (Linktree)"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-300 transition-all cursor-pointer select-none text-xs font-semibold"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden xl:inline-block">Portal Publik</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  Linktree
                </span>
              </button>
            )}

            {/* Tombol Chevron Dropdown Dinamis Terpadu */}
            <button
              type="button"
              onClick={() => setIsAccessDropdownOpen((prev) => !prev)}
              title="Pilihan Akses Cepat: QR Code Staf, Manajemen, &amp; Link Publik"
              className={`px-1.5 py-1.5 rounded-lg transition-colors cursor-pointer text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white ${
                isAccessDropdownOpen ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400' : 'hover:bg-slate-200/60 dark:hover:bg-slate-700'
              }`}
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isAccessDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          {/* POPOVER MENU DROPDOWN DINAMIS AKSES & QR */}
          {isAccessDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 text-xs text-slate-800 dark:text-slate-100 space-y-1">
              <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pusat Akses QR &amp; Portal
              </div>

              {/* Opsi 1: QR Login Staf */}
              {onOpenQrLogin && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAccessDropdownOpen(false);
                    onOpenQrLogin('staff-login');
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-800 dark:text-slate-100 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs">QR Code Login Staf</div>
                      <div className="text-[10px] text-slate-400">Expand &amp; Download HD Siap Cetak</div>
                    </div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-black bg-blue-600 text-white">
                    Scan
                  </span>
                </button>
              )}

              {/* Opsi 2: Portal Publik Linktree */}
              {onOpenPublicShare && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAccessDropdownOpen(false);
                    onOpenPublicShare();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-800 dark:text-slate-100 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs">Portal Publik (Linktree)</div>
                      <div className="text-[10px] text-slate-400">Tampilan Tamu Tanpa Password</div>
                    </div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    Buka
                  </span>
                </button>
              )}

              {/* Opsi 3: QR Login Manajemen / HR */}
              {onOpenQrLogin && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAccessDropdownOpen(false);
                    onOpenQrLogin('management-login');
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-800 dark:text-slate-100 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs">QR Login Manajemen</div>
                      <div className="text-[10px] text-slate-400">Akses Khusus Admin &amp; Pimpinan</div>
                    </div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    HR
                  </span>
                </button>
              )}

              {/* Fast Copy Actions */}
              <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopyLink('staff')}
                  className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedLinkType === 'staff' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Salin Link Staf</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyLink('public')}
                  className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedLinkType === 'public' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Salin Link Publik</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SATU TOGGLE DROPDOWN TERPADU: PUSAT KONTROL & PROFIL */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl border transition-all cursor-pointer select-none ${
              isDropdownOpen
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}
            title="Buka Pusat Kontrol, Alat Sistem & Profil"
          >
            {/* Avatar Initials Badge */}
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
              {currentUser ? getInitials(currentUser.nama) : 'BK'}
            </div>

            {/* Nama & Role Singkat */}
            {currentUser && (
              <div className="hidden sm:block text-left leading-tight max-w-[110px] md:max-w-[140px] truncate">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {currentUser.nama.split(' ')[0]}
                </div>
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold truncate">
                  {currentUser.role}
                </div>
              </div>
            )}

            {/* Chevron Icon with Rotation Animation */}
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
              }`}
            />
          </button>

          {/* ISI MENU DROPDOWN TERPADU (POPOVER CARD) */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-[min(calc(100vw-1.5rem),20rem)] max-h-[calc(100dvh-5rem)] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
              {/* Header Kartu Profil Pengguna */}
              {currentUser && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800/80 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white font-black text-sm flex items-center justify-center shadow-sm shrink-0">
                      {getInitials(currentUser.nama)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 dark:text-white truncate text-xs sm:text-sm">
                        {currentUser.nama}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {currentUser.nip}
                      </div>
                      <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                        <Shield className="w-3 h-3" />
                        {currentUser.role}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Seksi Simulasi Peran (Terintegrasi di Menu Profil) */}
              {onSwitchRole && (
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/80 mb-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                      Ganti / Simulasi Peran
                    </span>
                    {onToggleDevSupervisor && (
                      <button
                        onClick={onToggleDevSupervisor}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-semibold cursor-pointer transition-colors ${
                          isDevSupervisorVisible
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                        title="Tampilkan / sembunyikan widget melayang di pojok kiri bawah"
                      >
                        {isDevSupervisorVisible ? 'Widget Bawah: ON' : 'Widget Bawah: OFF'}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1 max-h-36 overflow-y-auto pr-0.5">
                    {ROLES.map((r) => {
                      const isActive = currentUser?.role === r.role;
                      return (
                        <button
                          key={r.role}
                          onClick={() => {
                            onSwitchRole(r.role);
                            setIsDropdownOpen(false);
                          }}
                          className={`px-2 py-1.5 rounded-lg text-left text-[10px] font-semibold transition-all flex items-center justify-between cursor-pointer ${
                            isActive
                              ? `${r.color} shadow-xs font-bold scale-[1.02]`
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60'
                          }`}
                        >
                          <span className="truncate">{r.label}</span>
                          {isActive && <UserCheck className="w-3 h-3 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Seksi 1: Alat Integrasi & Sistem */}
              <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Alat &amp; Integrasi Sistem
              </div>
              <div className="space-y-1 mb-2">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenSwitchBoard();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs">Master Switch Board PP1</div>
                      <div className="text-[10px] text-slate-400">8 Modul Navigasi &amp; Kontrol</div>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    Modul
                  </span>
                </button>

                {onToggleDatasheetSource && (
                  <button
                    onClick={() => {
                      onToggleDatasheetSource();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs">Alternatif: Tarik Dari Datasheet</div>
                        <div className="text-[10px] text-slate-400">
                          {isDatasheetSourceActive ? 'Aktif (Langsung CSV Spreadsheet)' : 'Nonaktif (Menggunakan REST GAS)'}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isDatasheetSourceActive
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {isDatasheetSourceActive ? 'CSV ON' : 'OFF'}
                    </span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenGasCenter();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs">Headless GAS Center</div>
                      <div className="text-[10px] text-slate-400">REST API &amp; Sinkronisasi Sheet</div>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    REST V2
                  </span>
                </button>

                {onOpenColumnSettings && (
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenColumnSettings();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Sliders className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs">Pengaturan Tampilan Kolom</div>
                        <div className="text-[10px] text-slate-400">Atur Kolom Gaji &amp; Tunjangan</div>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                      Kolom
                    </span>
                  </button>
                )}

                {!isInstalled && isInstallable && (
                  <button
                    onClick={async () => {
                      setIsDropdownOpen(false);
                      await install();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Download className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs">Install Web App (PWA)</div>
                        <div className="text-[10px] text-slate-400">Pasang di Desktop / HP</div>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                      PWA
                    </span>
                  </button>
                )}

                {onOpenBrandCustomizer && (
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenBrandCustomizer();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs">Ganti Logo &amp; Profil Apps</div>
                        <div className="text-[10px] text-slate-400">Kustomisasi Logo, Nama &amp; PWA</div>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300">
                      Logo
                    </span>
                  </button>
                )}

                {onOpenPublicShare && (
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenPublicShare();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs">Portal Publik (Linktree)</div>
                        <div className="text-[10px] text-slate-400">Bagikan Tautan Tamu Tanpa Login</div>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      Linktree
                    </span>
                  </button>
                )}

                {onOpenQrLogin && (
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenQrLogin('staff-login');
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs">QR Code Presisi Tinggi</div>
                        <div className="text-[10px] text-slate-400">Expand &amp; Unduh HD Scan Staf</div>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                      QR HD
                    </span>
                  </button>
                )}

                {onOpenChangePin && currentUser && (
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenChangePin();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs">Ganti PIN Portal Mandiri</div>
                        <div className="text-[10px] text-slate-400">Atur PIN 6-digit Keamanan Akun</div>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
                      PIN
                    </span>
                  </button>
                )}
              </div>

              {/* Seksi 2: Preferensi Layar & Bantuan */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-2 mb-2">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Preferensi &amp; Layar
                </div>
                <div className="grid grid-cols-2 gap-1.5 p-1">
                  <button
                    onClick={() => {
                      onToggleTheme();
                    }}
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer text-left"
                  >
                    {themeMode === 'dark' ? (
                      <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <Moon className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <span className="font-semibold text-[11px]">
                      {themeMode === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      handleToggleFullscreen();
                    }}
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer text-left"
                  >
                    {isFullscreen ? (
                      <Minimize className="w-4 h-4 text-blue-500 shrink-0" />
                    ) : (
                      <Maximize className="w-4 h-4 text-blue-500 shrink-0" />
                    )}
                    <span className="font-semibold text-[11px]">
                      {isFullscreen ? 'Exit Layar' : 'Layar Penuh'}
                    </span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenHelp();
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-left cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs">Pusat Bantuan &amp; Panduan</div>
                    <div className="text-[10px] text-slate-400">Aturan jam kerja, toleransi, &amp; SOP</div>
                  </div>
                </button>
              </div>

              {/* Seksi 3: Logout */}
              {currentUser && (
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-1.5">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 transition-colors text-left font-bold cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <LogOut className="w-4 h-4" />
                      <span>Keluar (Logout)</span>
                    </div>
                    <span className="text-[10px] font-normal text-rose-500">Selesai Sesi</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
