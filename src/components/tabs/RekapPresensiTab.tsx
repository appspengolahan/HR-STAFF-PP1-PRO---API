import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Printer,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  Users,
  Flame,
  Medal,
  Clock,
  Percent,
} from 'lucide-react';
import { PresensiRecord, StaffData } from '../../types';
import { NAMA_BULAN_INDO } from '../../services/payrollEngine';
import { formatTanggalIndo } from '../../utils/dateFormatter';

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
  const [rankingViewMode, setRankingViewMode] = useState<'terbaik' | 'pembinaan'>('terbaik');

  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  // 1. Calculate annual summary per staff
  const staffRekapList = useMemo(() => {
    const list = isStaffPortal
      ? staffList.filter((s) => s.nip === currentUserNip)
      : filterStaffNip ? staffList.filter((s) => s.nip === filterStaffNip) : staffList;

    return list.map((st) => {
      const staffPresensi = presensiList.filter((p) => p.nip === st.nip && p.tahun === filterTahun);

      // Monthly ijin minutes (Jan - Des)
      const bulananMenit: number[] = Array(12).fill(0);
      const bulananCount: number[] = Array(12).fill(0);
      staffPresensi.forEach((p) => {
        const mIdx = p.bulan - 1;
        if (mIdx >= 0 && mIdx < 12) {
          bulananMenit[mIdx] += p.durasiMenit || 0;
          bulananCount[mIdx] += 1;
        }
      });

      // Total ijin minutes in the selected range
      let totalIjinPeriode = 0;
      let totalKejadianPeriode = 0;
      for (let i = bulanAwal - 1; i <= bulanAkhir - 1; i++) {
        totalIjinPeriode += bulananMenit[i];
        totalKejadianPeriode += bulananCount[i];
      }

      const jumlahBulan = Math.max(1, bulanAkhir - bulanAwal + 1);
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
        totalKejadianPeriode,
        pctKehadiran,
      };
    });
  }, [staffList, presensiList, filterTahun, bulanAwal, bulanAkhir, filterStaffNip, isStaffPortal, currentUserNip]);

  // 2. Calculate Monthly Trend (Jan - Des) across all active staff
  const monthlyTrendData = useMemo(() => {
    const activeStaffCount = staffList.filter((s) => s.statusAktif === 'Aktif').length || staffList.length || 1;
    const stdPerMonth = activeStaffCount * MENIT_PER_BULAN_STANDAR;

    return monthsShort.map((namaPendek, idx) => {
      const bulanNum = idx + 1;
      const records = presensiList.filter((p) => p.tahun === filterTahun && p.bulan === bulanNum);
      const totalIjinMenit = records.reduce((acc, p) => acc + (p.durasiMenit || 0), 0);
      const countIjin = records.length;
      const pctKehadiran = Math.max(
        0,
        Math.min(100, ((stdPerMonth - totalIjinMenit) / stdPerMonth) * 100)
      );

      return {
        bulanNum,
        nama: NAMA_BULAN_INDO[idx],
        namaPendek,
        totalIjinMenit,
        countIjin,
        pctKehadiran,
      };
    });
  }, [presensiList, staffList, filterTahun]);

  // 3. Rankings
  const ranked = useMemo(() => {
    return [...staffRekapList].sort((a, b) => b.pctKehadiran - a.pctKehadiran);
  }, [staffRekapList]);

  const top10Terbaik = useMemo(() => ranked.slice(0, 10), [ranked]);
  const bottom10Pembinaan = useMemo(() => {
    return [...staffRekapList]
      .filter((s) => s.totalIjinPeriode > 0)
      .sort((a, b) => a.pctKehadiran - b.pctKehadiran)
      .slice(0, 10);
  }, [staffRekapList]);

  // 4. Overall KPI Summary
  const kpiSummary = useMemo(() => {
    if (staffRekapList.length === 0) return { avgPct: 100, perfectCount: 0, totalIjinJam: 0, highestMonth: 'Oktober' };

    const sumPct = staffRekapList.reduce((acc, s) => acc + s.pctKehadiran, 0);
    const avgPct = sumPct / staffRekapList.length;
    const perfectCount = staffRekapList.filter((s) => s.pctKehadiran >= 99.99).length;
    const totalIjinMenitAll = staffRekapList.reduce((acc, s) => acc + s.totalIjinPeriode, 0);
    const totalIjinJam = Math.round((totalIjinMenitAll / 60) * 10) / 10;

    // Find month with highest percentage
    let bestM = monthlyTrendData[0];
    monthlyTrendData.forEach((m) => {
      if (m.totalIjinMenit > 0 && m.pctKehadiran > (bestM.pctKehadiran || 0)) {
        bestM = m;
      }
    });

    return {
      avgPct,
      perfectCount,
      totalIjinJam,
      highestMonth: bestM?.nama || 'Oktober',
    };
  }, [staffRekapList, monthlyTrendData]);

  const handleExportPdf = () => {
    const originalTitle = document.title;
    document.title = `Rekapitulasi_Presensi_${filterTahun}_PT_BATU_KARANG`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ============================================================== */}
      {/* FILTER CONTROLS & PRINT ACTION (NO PRINT)                      */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs no-print">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                Tahun Rekap
              </label>
              <select
                value={filterTahun}
                onChange={(e) => setFilterTahun(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                Rentang Bulan Awal
              </label>
              <select
                value={bulanAwal}
                onChange={(e) => setBulanAwal(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
              >
                {NAMA_BULAN_INDO.map((bln, i) => (
                  <option key={bln} value={i + 1}>
                    {bln}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                s/d Bulan Akhir
              </label>
              <select
                value={bulanAkhir}
                onChange={(e) => setBulanAkhir(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
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
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Filter Staf Khusus
                </label>
                <select
                  value={filterStaffNip}
                  onChange={(e) => setFilterStaffNip(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white max-w-[200px]"
                >
                  <option value="">-- Semua 32 Staf --</option>
                  {staffList.map((s) => (
                    <option key={s.nip} value={s.nip}>
                      {s.nama}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Export Rekap PDF (A4)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* HEADER DOKUMEN CETAK RESMI (HANYA MUNCUL DI PRINT / PDF)       */}
      {/* ============================================================== */}
      <div className="hidden print:block p-4 border-b-2 border-black text-center mb-4">
        <h1 className="text-base font-bold uppercase tracking-wider">
          LAPORAN REKAPITULASI PRESENSI &amp; EVALUASI DISIPLIN STAF
        </h1>
        <div className="text-xs font-bold mt-0.5">
          PT BATU KARANG — DIVISI PRODUKSI I (PP1)
        </div>
        <div className="text-[11px] text-slate-600 mt-1">
          Tahun Anggaran: {filterTahun} (Periode {NAMA_BULAN_INDO[bulanAwal - 1]} s/d {NAMA_BULAN_INDO[bulanAkhir - 1]}) | Dicetak: {formatTanggalIndo(new Date(), true)}
        </div>
      </div>

      {/* ============================================================== */}
      {/* RINGKASAN KPI EKSEKUTIF                                        */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>Rata-rata Kehadiran Divisi</span>
            <Percent className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {kpiSummary.avgPct.toFixed(2)}%
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Target Minimum Baku: &ge; 95.0%</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>Kehadiran 100% Sempurna</span>
            <Medal className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
            {kpiSummary.perfectCount} <span className="text-xs font-sans text-slate-400">Staf</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Nol menit izin / potong upah</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>Total Ijin / Jam Hilang</span>
            <Clock className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black font-mono text-red-600 dark:text-red-400">
            {kpiSummary.totalIjinJam} <span className="text-xs font-sans text-slate-400">Jam</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Akumulasi seluruh izin periode</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>Disiplin Tertinggi</span>
            <Flame className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {kpiSummary.highestMonth}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Volume izin terendah tahun ini</div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* GRAFIS 1: TREND KEHADIRAN BULANAN (MONTHLY ATTENDANCE TREND)    */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Grafik Tren Tingkat Kehadiran Bulanan (Jan – Des {filterTahun})
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Persentase jam kerja efektif operasional dan volume menit izin staf per bulan
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold no-print">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              &ge; 97% (Sangat Baik)
            </span>
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
              95 - 96.9% (Normal)
            </span>
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              &lt; 95% (Evaluasi)
            </span>
          </div>
        </div>

        {/* Visual Bar Graph */}
        <div className="pt-2">
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 sm:gap-3 items-end min-h-[190px]">
            {monthlyTrendData.map((item) => {
              // Scale height relative to min 90% and max 100%
              const minDisplay = 92;
              const normalized = Math.max(0, Math.min(100, ((item.pctKehadiran - minDisplay) / (100 - minDisplay)) * 100));
              const barHeightPct = Math.max(18, normalized);

              let barColor = 'from-emerald-500 to-emerald-600 text-emerald-600';
              if (item.pctKehadiran < 95) {
                barColor = 'from-amber-500 to-amber-600 text-amber-600';
              } else if (item.pctKehadiran < 97) {
                barColor = 'from-blue-500 to-blue-600 text-blue-600';
              }

              const isCurrentRange = item.bulanNum >= bulanAwal && item.bulanNum <= bulanAkhir;

              return (
                <div
                  key={item.bulanNum}
                  className={`flex flex-col items-center justify-end h-full group transition-all ${
                    isCurrentRange ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  {/* Tooltip & Value Label */}
                  <div className="text-[10px] font-mono font-black mb-1.5 text-slate-700 dark:text-slate-300 text-center">
                    {item.totalIjinMenit > 0 ? `${item.pctKehadiran.toFixed(1)}%` : '100%'}
                  </div>

                  {/* Bar Body */}
                  <div className="w-full max-w-[38px] bg-slate-100 dark:bg-slate-800 rounded-xl p-1 flex flex-col justify-end h-[120px]">
                    <div
                      style={{ height: `${barHeightPct}%` }}
                      className={`w-full rounded-lg bg-gradient-to-t ${barColor} shadow-xs transition-all duration-500 relative`}
                    ></div>
                  </div>

                  {/* Month Label */}
                  <div className="mt-2 text-center">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">
                      {item.namaPendek}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 block leading-none">
                      {item.totalIjinMenit > 0 ? `${Math.round(item.totalIjinMenit / 60)}j` : '0j'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footnote Analisis Tren */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Analisis Disiplin Divisi:</strong> Tingkat kehadiran staf stabil rata-rata <strong>{kpiSummary.avgPct.toFixed(2)}%</strong> (di atas batas toleransi 95%). Puncak disiplin tertinggi terjadi pada bulan <strong>{kpiSummary.highestMonth}</strong>, sementara kenaikan frekuensi izin terjadi di bulan Juli–September seiring agenda sosial dan tradisi keluarga staf.
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* GRAFIS 2: RANKING KEHADIRAN STAFF (LEADERBOARD & PEMBINAAN)    */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Ranking &amp; Peringkat Kehadiran Staf (Evaluasi Tahunan)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Peringkat staf terbaik (&ge; 95%) dan pemetaan staf yang memerlukan bimbingan kehadiran
              </p>
            </div>
          </div>

          {/* TOGGLE PILIHAN (DIBERI CLASS no-print AGAR TIDAK MUNCUL DI PDF) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl no-print">
            <button
              onClick={() => setRankingViewMode('terbaik')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                rankingViewMode === 'terbaik'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              🏆 Top 10 Terbaik
            </button>
            <button
              onClick={() => setRankingViewMode('pembinaan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                rankingViewMode === 'pembinaan'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              ⚠️ Perlu Pembinaan
            </button>
          </div>
        </div>

        {/* ON-SCREEN VIEW (BERDASARKAN TOGGLE) */}
        <div className="no-print space-y-2.5">
          {rankingViewMode === 'terbaik' ? (
            <div className="space-y-2">
              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mb-1">
                <span>10 Staf dengan Kehadiran Paling Sempurna &amp; Disiplin Tinggi</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {top10Terbaik.map((st, i) => {
                  const badgeIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
                  return (
                    <div
                      key={st.nip}
                      className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-extrabold flex items-center justify-center text-xs shrink-0">
                          {badgeIcon}
                        </span>
                        <div className="truncate">
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {st.nama}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {st.nip} • {st.jabatan}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          {st.pctKehadiran.toFixed(2)}%
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Ijin: {st.totalIjinPeriode} m
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 mb-1">
                <span>Staf dengan Akumulasi Jam Izin Terbanyak (Rekomendasi Konseling HR)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bottom10Pembinaan.map((st, i) => (
                  <div
                    key={st.nip}
                    className="p-3 rounded-xl bg-red-50/40 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 font-extrabold flex items-center justify-center text-xs shrink-0">
                        #{i + 1}
                      </span>
                      <div className="truncate">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {st.nama}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {st.nip} • {st.jabatan}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-black text-red-600 dark:text-red-400 text-sm">
                        {st.pctKehadiran.toFixed(2)}%
                      </div>
                      <div className="text-[10px] text-red-500/80 font-mono font-semibold">
                        Ijin: {Math.round(st.totalIjinPeriode / 60)} Jam ({st.totalIjinPeriode}m)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* PRINT / PDF VIEW (MUNCUL DUA-DUANYA SECARA RAPI DI CETAK PDF TANPA TOGGLE) */}
        <div className="hidden print:grid grid-cols-2 gap-4 text-[10px]">
          <div>
            <div className="font-bold text-black border-b border-black pb-1 mb-2">
              🏆 10 STAF KEHADIRAN TERBAIK (DI ATAS TARGET 95%)
            </div>
            <div className="space-y-1">
              {top10Terbaik.map((st, idx) => (
                <div key={st.nip} className="flex justify-between border-b border-dotted border-slate-300 pb-0.5">
                  <span>{idx + 1}. {st.nama} ({st.nip})</span>
                  <span className="font-mono font-bold">{st.pctKehadiran.toFixed(2)}% ({st.totalIjinPeriode}m)</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="font-bold text-black border-b border-black pb-1 mb-2">
              ⚠️ STAF PERLU PEMBINAAN &amp; MONITORING KHUSUS
            </div>
            <div className="space-y-1">
              {bottom10Pembinaan.map((st, idx) => (
                <div key={st.nip} className="flex justify-between border-b border-dotted border-slate-300 pb-0.5">
                  <span>{idx + 1}. {st.nama} ({st.nip})</span>
                  <span className="font-mono font-bold text-red-600">{st.pctKehadiran.toFixed(2)}% ({Math.round(st.totalIjinPeriode / 60)}j)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TABEL MASTER DETAIL 12 BULAN (MATRIX REKAP LENGKAP)            */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Tabel Matriks Rekapitulasi Izin Staf (Jan – Des {filterTahun})
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Rincian menit izin yang terakumulasi setiap bulan per individu staf
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 no-print">
            {staffRekapList.length} Staf Terdata
          </span>
        </div>

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
          Divisi Produksi I — PT Batu Karang | Dokumen Evaluasi Resmi
        </div>
      </div>
    </div>
  );
};
