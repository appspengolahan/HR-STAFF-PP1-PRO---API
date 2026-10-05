import React from 'react';
import { UserRole, AuthUser } from '../types';
import { ShieldCheck, UserCheck, X, RefreshCw } from 'lucide-react';

interface RoleSimulatorBarProps {
  currentUser: AuthUser | null;
  onSwitchRole: (role: UserRole) => void;
  onClose: () => void;
  isVisible: boolean;
}

const ROLES: { role: UserRole; label: string; desc: string; color: string }[] = [
  { role: 'Lead Developer', label: 'Lead Dev', desc: 'Akses Penuh + Debugger', color: 'bg-purple-600 text-white' },
  { role: 'Project Manager', label: 'Project Manager', desc: 'Lalu M. (Full Control PP1)', color: 'bg-blue-600 text-white' },
  { role: 'Site Engineer', label: 'Site Engineer', desc: 'Teknis Mesin & Operasional', color: 'bg-amber-600 text-white' },
  { role: 'Admin HR', label: 'Admin HR', desc: 'Personalia, Cuti, Presensi', color: 'bg-emerald-600 text-white' },
  { role: 'Finance', label: 'Finance', desc: 'Payroll, PPh21, BPJS', color: 'bg-cyan-600 text-white' },
  { role: 'Kepala Dept', label: 'Kepala Dept', desc: 'Approval Cuti & Mutasi', color: 'bg-indigo-600 text-white' },
  { role: 'Staf', label: 'Staf Lapangan', desc: 'Portal Mandiri Karyawan', color: 'bg-slate-700 text-slate-100' },
];

export const RoleSimulatorBar: React.FC<RoleSimulatorBarProps> = ({
  currentUser,
  onSwitchRole,
  onClose,
  isVisible,
}) => {
  if (!isVisible || !currentUser) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 text-white border-b border-indigo-500/40 px-3 py-1.5 backdrop-blur-md shadow-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 font-mono uppercase text-[10px] tracking-wider px-2 py-0.5 rounded bg-indigo-900/60 border border-indigo-400/40 text-indigo-300 font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          Dev Supervisor Bar
        </span>
        <span className="text-slate-300 hidden sm:inline">
          Peran Aktif: <strong className="text-white underline decoration-indigo-400 underline-offset-2">{currentUser.role}</strong> ({currentUser.nama})
        </span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
        <span className="text-slate-400 text-[11px] mr-1 hidden md:inline">Simulasi Peran:</span>
        {ROLES.map((r) => {
          const isActive = currentUser.role === r.role;
          return (
            <button
              key={r.role}
              onClick={() => onSwitchRole(r.role)}
              title={r.desc}
              className={`px-2 py-0.5 rounded-md font-medium text-[11px] transition-all whitespace-nowrap flex items-center gap-1 ${
                isActive
                  ? `${r.color} ring-2 ring-white/70 shadow-md font-bold scale-105`
                  : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {isActive && <UserCheck className="w-3 h-3" />}
              {r.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
          title="Tutup bilah simulasi"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
