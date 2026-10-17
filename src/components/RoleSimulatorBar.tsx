import React, { useState } from 'react';
import { UserRole, AuthUser } from '../types';
import { ShieldCheck, UserCheck, X, ChevronUp, ChevronDown } from 'lucide-react';

interface RoleSimulatorBarProps {
  currentUser: AuthUser | null;
  onSwitchRole: (role: UserRole) => void;
  onClose: () => void;
  isVisible: boolean;
}

export const ROLES: { role: UserRole; label: string; desc: string; color: string }[] = [
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
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isVisible || !currentUser) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-[calc(100vw-2rem)] no-print print:hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-950/95 text-white border border-indigo-500/50 shadow-2xl backdrop-blur-md hover:bg-slate-900 transition-all text-xs font-semibold group cursor-pointer"
          title="Buka panel simulasi peran"
        >
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Simulasi Peran: <strong className="text-indigo-300">{currentUser.role}</strong></span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
        </button>
      ) : (
        <div className="bg-slate-950/95 text-white border border-indigo-500/40 p-3 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col gap-2.5 max-w-xl">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex items-center gap-1 font-mono uppercase text-[10px] tracking-wider px-2 py-0.5 rounded bg-indigo-900/60 border border-indigo-400/40 text-indigo-300 font-bold shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Dev Simulator
              </span>
              <span className="text-[11px] text-slate-300 truncate">
                Peran: <strong className="text-white underline decoration-indigo-400 underline-offset-2">{currentUser.role}</strong> ({currentUser.nama})
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setIsMinimized(true)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Ciutkan ke tombol kecil"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Tutup & sembunyikan bilah simulasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
            {ROLES.map((r) => {
              const isActive = currentUser.role === r.role;
              return (
                <button
                  key={r.role}
                  onClick={() => onSwitchRole(r.role)}
                  title={r.desc}
                  className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
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
        </div>
      )}
    </div>
  );
};
