import React, { useState, useEffect } from 'react';
import {
  Maximize,
  Minimize,
  Moon,
  Sun,
  HelpCircle,
  RefreshCw,
  Layers,
  Zap,
  LogOut,
  User,
  Shield,
} from 'lucide-react';
import { AuthUser } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  currentUser: AuthUser | null;
  onLogout: () => void;
  onOpenHelp: () => void;
  onOpenSwitchBoard: () => void;
  onOpenGasCenter: () => void;
  selectedDept: 'Semua' | 'Operasional' | 'Administrasi';
  onChangeDept: (dept: 'Semua' | 'Operasional' | 'Administrasi') => void;
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
  onTriggerSecretDoor: () => void;
  sidebarCollapsed: boolean;
  isDevSupervisorVisible?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onOpenHelp,
  onOpenSwitchBoard,
  onOpenGasCenter,
  selectedDept,
  onChangeDept,
  themeMode,
  onToggleTheme,
  onTriggerSecretDoor,
  sidebarCollapsed,
  isDevSupervisorVisible = false,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

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
    // reset if idle for 3 seconds
    setTimeout(() => setLogoClickCount(0), 3000);
  };

  return (
    <header
      className={`fixed ${isDevSupervisorVisible ? 'top-8' : 'top-0'} right-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-20 transition-all duration-300 flex items-center justify-between px-3 sm:px-6 shadow-xs ${
        sidebarCollapsed ? 'lg:left-[68px] left-0' : 'lg:left-64 left-0'
      }`}
    >
      {/* Left: Brand / Title */}
      <div className="flex items-center gap-3">
        <div
          onClick={handleLogoClick}
          className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black shadow-md shadow-blue-900/20 cursor-pointer select-none active:scale-95 transition-transform"
          title="Klik 5x untuk membuka Secret Developer Door"
        >
          PP1
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-sm sm:text-base tracking-wide text-slate-900 dark:text-white">
              HR Staff &amp; Karyawan
            </h1>
            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Pabrik Aktif
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px] sm:max-w-none">
            PT Batu Karang — Divisi Produksi I
          </p>
        </div>
      </div>

      {/* Middle: Department Filter */}
      <div className="hidden xl:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
        {(['Semua', 'Operasional', 'Administrasi'] as const).map((dept) => (
          <button
            key={dept}
            onClick={() => onChangeDept(dept)}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              selectedDept === dept
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* PWA Install Button */}
        <PWAInstallButton variant="nav" />

        {/* Switch Board */}
        <button
          onClick={onOpenSwitchBoard}
          title="Master Switch Board PP1 (8 Modul)"
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-colors hidden sm:flex items-center gap-1.5 text-xs font-semibold"
        >
          <Layers className="w-4 h-4 text-blue-500" />
          <span className="hidden lg:inline">Switch Board</span>
        </button>

        {/* Headless GAS Center */}
        <button
          onClick={onOpenGasCenter}
          title="Headless GAS Center (REST API V2)"
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          <Zap className="w-4 h-4 text-emerald-500" />
          <span className="hidden lg:inline">GAS Center</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          title={themeMode === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
        >
          {themeMode === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Fullscreen */}
        <button
          onClick={handleToggleFullscreen}
          title={isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh (Fullscreen)'}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors hidden sm:flex"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>

        {/* Help */}
        <button
          onClick={onOpenHelp}
          title="Bantuan & Ketentuan Jam Kerja"
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
        >
          <HelpCircle className="w-4 h-4 text-blue-500" />
        </button>

        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

        {/* User Chip */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-1">
            <div className="hidden md:block text-right leading-tight">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                {currentUser.nama}
              </div>
              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold truncate max-w-[120px]">
                {currentUser.role}
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Keluar (Logout)"
              className="p-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 transition-colors flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-bold hidden sm:inline">Keluar</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
