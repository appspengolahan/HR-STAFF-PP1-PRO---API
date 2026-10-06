import React from 'react';
import { AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { StaffData } from '../types';

export interface PkwtExpiringItem {
  id: number;
  nip: string;
  nama: string;
  jabatan: string;
  sekup: string;
  akhirPKWT: string;
  sisaHari: number;
}

export function parsePkwtDate(str?: string): Date | null {
  if (!str) return null;
  const s = str.trim();
  if (s.toLowerCase().includes('tidak') || s.toLowerCase().includes('tetap')) return null;

  // DD/MM/YYYY
  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      const date = new Date(y, m, d);
      return isNaN(date.getTime()) ? null : date;
    }
  }

  // YYYY-MM-DD
  if (s.includes('-')) {
    const parts = s.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const date = new Date(y, m, d);
        return isNaN(date.getTime()) ? null : date;
      } else {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        const date = new Date(y, m, d);
        return isNaN(date.getTime()) ? null : date;
      }
    }
  }

  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function getPkwtExpiringStaff(staffList: StaffData[], maxDays: number = 26): PkwtExpiringItem[] {
  // Use today reference (ignoring hours)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const list: PkwtExpiringItem[] = [];

  staffList.forEach((st) => {
    // Only non-TETAP, active staff with akhirPKWT defined
    if (st.statusAktif === 'Aktif' && st.status !== 'TETAP' && st.akhirPKWT) {
      const date = parsePkwtDate(st.akhirPKWT);
      if (date) {
        date.setHours(0, 0, 0, 0);
        const diffMs = date.getTime() - today.getTime();
        const sisaHari = Math.round(diffMs / (1000 * 60 * 60 * 24));

        // Threshold <= maxDays (termasuk yang minus / sudah lewat jatuh tempo)
        if (sisaHari <= maxDays) {
          list.push({
            id: st.id,
            nip: st.nip,
            nama: st.nama,
            jabatan: st.jabatan,
            sekup: st.sekup,
            akhirPKWT: st.akhirPKWT,
            sisaHari,
          });
        }
      }
    }
  });

  // Urutkan dari yang sisa harinya terkecil/minus terlebih dahulu
  return list.sort((a, b) => a.sisaHari - b.sisaHari);
}

interface PkwtAlertCardProps {
  staffList: StaffData[];
  onActionClick?: (nip: string) => void;
  actionLabel?: string;
  className?: string;
}

export const PkwtAlertCard: React.FC<PkwtAlertCardProps> = ({
  staffList,
  onActionClick,
  actionLabel = 'Perpanjang / Mutasi',
  className = '',
}) => {
  const expiringStaff = getPkwtExpiringStaff(staffList, 26);

  if (expiringStaff.length === 0) {
    return null;
  }

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-all ${className}`}
    >
      {/* Header matching image design */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <span className="text-base" role="img" aria-label="warning">
            ⚠️
          </span>
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
            PKWT Segera Berakhir (&le;26 hari)
          </h3>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/40">
            {expiringStaff.length} Staf
          </span>
        </div>
      </div>

      {/* Table matching user image */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4 font-bold">Nama</th>
              <th className="py-3 px-4 font-bold">Jabatan</th>
              <th className="py-3 px-4 font-bold text-center">Akhir PKWT</th>
              <th className="py-3 px-4 font-bold text-center">Sisa Hari</th>
              {onActionClick && <th className="py-3 px-4 font-bold text-right no-print">Tindakan</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {expiringStaff.map((st) => {
              const isExpiredOrNegative = st.sisaHari < 0;
              const isUrgent = st.sisaHari <= 7;

              return (
                <tr
                  key={st.nip}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    {st.nama}
                    <span className="ml-1.5 font-mono text-[10px] text-slate-400 font-normal">
                      ({st.nip})
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                    {st.jabatan}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-center text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {st.akhirPKWT}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        isExpiredOrNegative
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : isUrgent
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {st.sisaHari} hari
                    </span>
                  </td>
                  {onActionClick && (
                    <td className="py-3.5 px-4 text-right no-print whitespace-nowrap">
                      <button
                        onClick={() => onActionClick(st.nip)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-xs transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>{actionLabel}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
