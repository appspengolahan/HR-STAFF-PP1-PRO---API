import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck2,
  Clock,
  BarChart3,
  FileSpreadsheet,
  CalendarDays,
  Award,
  Users,
  GitPullRequest,
  GraduationCap,
  UserCircle,
  ShieldCheck,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { AuthUser } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  currentUser: AuthUser | null;
  onOpenSwitchBoard: () => void;
  isDevSupervisorVisible?: boolean;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'presensi', label: 'Presensi & Ijin', icon: CalendarCheck2, badge: 'Geofence', badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { id: 'lembur', label: 'Lembur SPKL', icon: Clock, badge: 'Flat 2×', badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { id: 'rekap', label: 'Rekap Presensi', icon: BarChart3, badge: '12 Bln', badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { id: 'slip', label: 'Slip Gaji Bulanan', icon: FileSpreadsheet, badge: 'TER 2026', badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { id: 'cuti', label: 'Pengajuan Cuti', icon: CalendarDays, badge: 'Approval', badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  { id: 'kpi', label: 'Matriks Scoring KPI', icon: Award, badge: 'Bobot', badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { id: 'database', label: 'Database Karyawan', icon: Users, badge: '32 Staf', badgeColor: 'bg-slate-700 text-slate-300 border-slate-600' },
  { id: 'mutasi', label: 'Jadwal Mutasi', icon: GitPullRequest, badge: 'Terjadwal', badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { id: 'pelatihan', label: 'Calon Karyawan', icon: GraduationCap, badge: 'Seleksi', badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { id: 'profil', label: 'Profil Karyawan', icon: UserCircle },
  { id: 'hakakses', label: 'Hak Akses & Akun', icon: ShieldCheck, badge: 'RBAC', badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { id: 'pengaturan', label: 'Pengaturan', icon: SlidersHorizontal, badge: 'Kolom', badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  currentUser,
  onOpenSwitchBoard,
  isDevSupervisorVisible = false,
}) => {
  const allowed = currentUser?.allowedTabs || [];
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!currentUser) return false;
    // Staf role only has limited tabs
    if (currentUser.portalType === 'staff') {
      return item.id === 'slip' || item.id === 'profil' || item.id === 'presensi' || item.id === 'cuti';
    }
    return allowed.includes(item.id) || item.id === 'pengaturan';
  });

  return (
    <aside
      className={`fixed ${
        isDevSupervisorVisible ? 'top-8 h-[calc(100vh-32px)]' : 'top-0 h-screen'
      } left-0 z-30 hidden lg:flex flex-col bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 select-none ${
        collapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      {/* Top Brand Banner */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-slate-800 bg-slate-950/60">
        <div
          onClick={onOpenSwitchBoard}
          className="flex items-center gap-3 overflow-hidden cursor-pointer group"
          title="Buka Master Switch Board PP1"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black shadow-md shadow-blue-900/30 group-hover:scale-105 transition-transform shrink-0">
            BK
          </div>
          {!collapsed && (
            <div className="leading-tight truncate">
              <span className="font-extrabold text-sm tracking-wide text-white flex items-center gap-1.5">
                PT BATU KARANG
              </span>
              <span className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase">
                Divisi Produksi I (PP1)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 overflow-y-auto px-2 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              } ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-transform ${
                  isActive ? 'scale-110 text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                        isActive
                          ? 'bg-white/20 text-white border-white/30'
                          : item.badgeColor || 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Collapse Toggle & Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex flex-col gap-2">
        {!collapsed && <PWAInstallButton variant="sidebar" />}

        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors text-xs font-semibold"
          title={collapsed ? 'Perluas Sidebar' : 'Kecilkan Sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Mini Sidebar Mode</span>
            </>
          )}
        </button>

        {!collapsed && (
          <div className="text-[10px] text-slate-500 text-center leading-tight pt-1">
            HR Staff All Rights Reserved
            <div className="text-[9px] text-slate-600">Developed by Lalu Mahendra</div>
          </div>
        )}
      </div>
    </aside>
  );
};
