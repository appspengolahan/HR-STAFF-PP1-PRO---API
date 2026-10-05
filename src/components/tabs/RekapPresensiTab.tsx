import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Printer,
  Search,
  Filter,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { PresensiRecord, StaffData } from '../../types';
import { NAMA_BULAN_INDO } from '../../services/payrollEngine';

interface RekapPresensiTabProps {
  presensiList: PresensiRecord[];
  staffList: StaffData[];
  currentUserNip?: string;
  isStaffPortal?: boolean;
}

const MENIT_PER_BULAN_STANDAR = 10440; // 26 hari kerja baku (22 x 420m + 4 x 300m)

export const RekapPresensiTab: React.FC<RekapPresensiTabProps> = ({
  presensiList,
  staffList,
  currentUserNip,
  isStaffPortal = false,
}) => {
  const now = new Date();
  const [filterTahun, setFilterTahun] = useState<number>(now.getFullYear());
  const [bulanAwal, setBulanAwal] = useState<number>(1);
  const [bulanAkhir, setBulanAkhir] = useState<number>(12);
  const [filterStaffNip, setFilterStaffNip] = useState<string>(
    isStaffPortal && currentUserNip ? currentUserNip : ''
  );

  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  // Calculate annual summary per staff
  const staffRekapList = useMemo(() => {
    const list = isStaffPortal
      ? staffList.filter((s) => s.nip === currentUserNip)
      : filterStaffNip ? staffList.filter((s) => s.nip === filterStaffNip) : staffList;

    return list.map((st) => {
      const staffPresensi = presensiList.filter((p) => p.nip === st.nip && p.tahun === filterTahun);

      // Monthly ijin minutes (Jan - Des)
      const bulananMenit: number[] = Array(12).fill(0);
      staffPresensi.forEach((p) => {
        const mIdx = p.bulan - 1;
        if (mIdx >= 0 && mIdx < 12) {
          bulananMenit[mIdx] += p.durasiMenit || 0;
        }
      });

      // Total ijin minutes in the selected range
      let totalIjinPeriode = 0;
      for (let i = bulanAwal - 1; i <= bulanAkhir - 1; i++) {
        totalIjinPeriode += bulananMenit[i];
      }

      const jumlahBulan = bulanAkhir - bulanAwal + 1;
      const totalMenitTersedia = MENIT_PER_BULAN_STANDAR * jumlahBulan;
      const pctKehadiran = Math.max(
        0,
        Math.min(100, ((totalMenitTersedia - totalIjinPeriode) / totalMenitTersedia) * 100)
      );

      return {
        nip: st.nip,
        nama: st.nama,
        jabatan: st.jabatan,
        sekup: st.sekup,
        bulananMenit,
        totalIjinPeriode,
        pctKehadiran,
      };
    });
  }, [staffList, presensiList, filterTahun, bulanAwal, bulanAkhir, filterStaffNip, isStaffPortal, currentUserNip]);

  // Ranking calculation
  const ranked = useMemo(() => {
    return [...staffRekapList].sort((a, b) => b.pctKehadiran - a.pctKehadiran);
  }, [staffRekapList]);

  const terbaik = ranked.slice(0, 5);
  const perluPerhatian = [...staffRekapList].sort((a, b) => a.pctKehadiran - b.pctKehadiran).slice(0, 5);

  const handleExportPdf = () => {
    const originalTitle = document.title;
    document.title = `HR Karyawan - Divisi Produksi I - Rekap Presensi Tahunan ${filterTahun}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Filter Controls (No Print) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 no-print bg-slate-50/50 dark:bg-slate-950/30">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tahun Rekap</label>
              <select
                value={filterTahun}
                onChange={(e) => setFilterTahun(Number(e.target.value))}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-white"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Rentang Bulan Awal</label>
              <select
                value={bulanAwal}
                onChange={(e) => setBulanAwal(Number(e.target.value))}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-white"
              >
                {NAMA_BULAN_INDO.map((bln, i) => (
                  <option key={bln} value={i + 1}>
                    {bln}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">s/d Bulan Akhir</label>
              <select
                value={bulanAkhir}
                onChange={(e) => setBulanAkhir(Number(e.target.value))}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-white"
              >
                {NAMA_BULAN_INDO.map((bln, i) => (
                  <option key={bln} value={i + 1}>
                    {bln}
                  </option>
                ))}
              </select>
            </div>

            {!isStaffPortal && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Filter Karyawan</label>
                <select
                  value={filterStaffNip}
                  onChange={(e) => setFilterStaffNip(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white max-w-[180px]"
                >
                  <option value="">-- Semua Staf --</option>
                  {staffList.map((s) => (
                    <option key={s.nip} value={s.nip}>
                      {s.nama}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button
            onClick={handleExportPdf}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            Export Rekap PDF
          </button>
        </div>

        {/* Print Header */}
        <div className="hidden print:block p-4 border-b border-black">
          <div className="text-base font-bold text-center">
            REKAPITULASI PRESENSI &amp; TINGKAT KEHADIRAN STAF TAHUNAN
          </div>
          <div className="text-xs text-center text-slate-600">
            Divisi Produksi I — Tahun {filterTahun} (Periode {NAMA_BULAN_INDO[bulanAwal - 1]} s/d {NAMA_BULAN_INDO[bulanAkhir - 1]})
          </div>
        </div>

        {/* 12-Month Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3">Nama Karyawan</th>
                <th className="py-3 px-2 text-slate-500 font-mono">NIP</th>
                {monthsShort.map((m) => (
                  <th key={m} className="py-3 px-2 text-center font-mono">
                    {m}
                  </th>
                ))}
                <th className="py-3 px-3 text-right">Tot. Ijin (m)</th>
                <th className="py-3 px-3 text-right">% Kehadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
              {staffRekapList.map((st) => {
                const isExcellent = st.pctKehadiran >= 95;
                const isWarning = st.pctKehadiran < 90;

                return (
                  <tr key={st.nip} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-900 dark:text-white truncate max-w-[160px]">
                      {st.nama}
                    </td>
                    <td className="py-2.5 px-2 text-slate-400">{st.nip}</td>
                    {st.bulananMenit.map((menit, idx) => (
                      <td
                        key={idx}
                        className={`py-2.5 px-2 text-center ${
                          menit > 0
                            ? 'text-red-600 dark:text-red-400 font-bold bg-red-50/50 dark:bg-red-950/20'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      >
                        {menit || '0'}
                      </td>
                    ))}
                    <td className="py-2.5 px-3 text-right font-bold text-slate-700 dark:text-slate-300">
                      {st.totalIjinPeriode} m
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`font-sans font-extrabold px-2 py-0.5 rounded ${
                          isExcellent
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : isWarning
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {st.pctKehadiran.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Print Footer */}
        <div className="hidden print:block p-4 border-t border-black text-right text-xs font-semibold">
          Divisi Produksi I - All Rights Reserved
        </div>
      </div>

      {/* Ranking Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top 5 Attendance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <Award className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              🏆 5 Staf dengan Kehadiran Terbaik (&ge; 95%)
            </h3>
          </div>

          <div className="space-y-2">
            {terbaik.map((st, i) => (
              <div
                key={st.nip}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-[11px]">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{st.nama}</div>
                    <div className="text-[10px] text-slate-400">{st.jabatan}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                    {st.pctKehadiran.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Needs Attention */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              ⚠️ Perlu Perhatian &amp; Pembinaan Kehadiran
            </h3>
          </div>

          <div className="space-y-2">
            {perluPerhatian.map((st, i) => (
              <div
                key={st.nip}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-[11px]">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{st.nama}</div>
                    <div className="text-[10px] text-slate-400">{st.jabatan}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`font-mono text-sm font-bold ${
                      st.pctKehadiran < 90 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {st.pctKehadiran.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
