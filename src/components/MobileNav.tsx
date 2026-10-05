import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck2,
  Clock,
  FileSpreadsheet,
  Users,
  UserCircle,
  Menu,
} from 'lucide-react';
import { AuthUser } from '../types';

interface MobileNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: AuthUser | null;
  onOpenMoreMenu: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onOpenMoreMenu,
}) => {
  const isStaff = currentUser?.portalType === 'staff';

  const items = isStaff
    ? [
        { id: 'slip', label: 'Slip Gaji', icon: FileSpreadsheet },
        { id: 'presensi', label: 'Presensi', icon: CalendarCheck2 },
        { id: 'profil', label: 'Profil Saya', icon: UserCircle },
      ]
    : [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'presensi', label: 'Presensi', icon: CalendarCheck2 },
        { id: 'lembur', label: 'Lembur', icon: Clock },
        { id: 'slip', label: 'Slip Gaji', icon: FileSpreadsheet },
        { id: 'database', label: 'Staff', icon: Users },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-30 flex items-center justify-around px-2 lg:hidden shadow-2xl no-print">
      {items.map((it) => {
        const Icon = it.icon;
        const isActive = activeTab === it.id;
        return (
          <button
            key={it.id}
            onClick={() => onSelectTab(it.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              isActive ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] truncate max-w-[64px]">{it.label}</span>
          </button>
        );
      })}

      {!isStaff && (
        <button
          onClick={onOpenMoreMenu}
          className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Lainnya</span>
        </button>
      )}
    </nav>
  );
};
