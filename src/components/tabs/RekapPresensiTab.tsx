import React, { useState, useMemo } from 'react';
import {
  Printer,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  Medal,
  Clock,
  Percent,
  Search,
  Filter,
  ArrowUpDown,
  Flame,
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

  // Search & Filter state for Ranking Balok
  const [searchStaff, setSearchStaff] = useState('');
  const [filterUnit, setFilterUnit] = useState<'Semua' | 'Operasional' | 'Administrasi'>('Semua');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc'); // asc = terendah / perlu perhatian (merah) di atas, sempurna di bawah

  // Toggle for Line Trend Chart Metric
  const [trendMetric, setTrendMetric] = useState<'kehadiran' | 'ijin'>('kehadiran');

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
      const pctIjin = Math.max(
        0,
        Math.min(100, (totalIjinMenit / stdPerMonth) * 100)
      );

      return {
        bulanNum,
        nama: NAMA_BULAN_INDO[idx],
        namaPendek,
        totalIjinMenit,
        countIjin,
        pctKehadiran,
        pctIjin,
      };
    });
  }, [presensiList, staffList, filterTahun]);

  // 3. Ranked staff list for all 32 staff
  const allStaffRanked = useMemo(() => {
    const sorted = [...staffRekapList].sort((a, b) => {
      if (sortDirection === 'desc') {
        return b.pctKehadiran - a.pctKehadiran;
      }
      return a.pctKehadiran - b.pctKehadiran;
    });

    return sorted.filter((s) => {
      const matchSearch =
        s.nama.toLowerCase().includes(searchStaff.toLowerCase()) ||
        s.nip.toLowerCase().includes(searchStaff.toLowerCase()) ||
        s.jabatan.toLowerCase().includes(searchStaff.toLowerCase());
      const matchUnit =
        filterUnit === 'Semua' ? true : s.sekup === filterUnit;
      return matchSearch && matchUnit;
    });
  }, [staffRekapList, sortDirection, searchStaff, filterUnit]);

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

  // Helper to format float to Indonesian comma representation: e.g. "97,43%"
  const formatPctIndo = (num: number): string => {
    return num.toFixed(2).replace('.', ',') + '%';
  };

  // =========================================================================
  // SVG AREA LINE CHART COORDINATES GENERATION (Gambar 1 Reference)
  // =========================================================================
  const svgWidth = 980;
  const svgHeight = 260;
  const padLeft = 65;
  const padRight = 45;
  const padTop = 50;
  const padBottom = 45;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  // Determine Y-scale
  const values = monthlyTrendData.map((m) =>
    trendMetric === 'kehadiran' ? m.pctKehadiran : m.pctIjin
  );

  let yMin = trendMetric === 'kehadiran' ? 92.0 : 0.0;
  let yMax = trendMetric === 'kehadiran' ? 100.5 : 5.5;

  if (trendMetric === 'kehadiran') {
    const minVal = Math.min(...values);
    yMin = Math.max(88, Math.floor(minVal - 1.5));
  } else {
    const maxVal = Math.max(...values);
    yMax = Math.max(3.5, Math.ceil(maxVal + 0.8));
  }

  const yRange = yMax - yMin || 1;

  // Points coordinates
  const points = monthlyTrendData.map((m, idx) => {
    const x = padLeft + (idx / (monthlyTrendData.length - 1)) * plotWidth;
    const val = trendMetric === 'kehadiran' ? m.pctKehadiran : m.pctIjin;
    const y = padTop + plotHeight - ((val - yMin) / yRange) * plotHeight;
    return { x, y, val, month: m };
  });

  // SVG Line path
  const linePathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  // SVG Area path (fading to bottom)
  const baselineY = padTop + plotHeight;
  const areaPathD = points.length > 0
    ? `${linePathD} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`
    : '';

  // Y-axis grid ticks (5 steps)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => {
    const val = yMin + pct * yRange;
    const y = padTop + plotHeight - pct * plotHeight;
    return { val, y };
  });

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
            {formatPctIndo(kpiSummary.avgPct)}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Target Minimum Baku: &ge; 95,0%</span>
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
      {/* 1. GRAFIS TREN TINGKAT KEHADIRAN BULANAN (GRAFIK GARIS GAMBAR 1) */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Grafik Tren Tingkat Kehadiran Bulanan (Jan – Des {filterTahun})
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Visualisasi kurva garis persentase jam kerja efektif operasional PT Batu Karang
              </p>
            </div>
          </div>

          {/* Metric Toggle (Hidden in print) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl no-print">
            <button
              onClick={() => setTrendMetric('kehadiran')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                trendMetric === 'kehadiran'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              📈 % Kehadiran Efektif
            </button>
            <button
              onClick={() => setTrendMetric('ijin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                trendMetric === 'ijin'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              📉 % Izin / Waktu Hilang
            </button>
          </div>
        </div>

        {/* The SVG Line Chart Component (Styled exactly like Gambar 1) */}
        <div className="overflow-x-auto py-2">
          <div className="min-w-[760px] relative">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto drop-shadow-xs"
              style={{ overflow: 'visible' }}
            >
              <defs>
                {/* Soft blue area gradient like Gambar 1 */}
                <linearGradient id="area-blue-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.22" />
                  <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>

                {/* Drop shadow for floating badges */}
                <filter id="badge-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.08" />
                </filter>
              </defs>

              {/* Horizontal Dashed Gridlines & Y-Axis Labels */}
              {yTicks.map((tick, i) => (
                <g key={i}>
                  <line
                    x1={padLeft - 5}
                    y1={tick.y}
                    x2={svgWidth - padRight}
                    y2={tick.y}
                    stroke="currentColor"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                    className="text-slate-200 dark:text-slate-800"
                  />
                  <text
                    x={padLeft - 12}
                    y={tick.y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fontFamily="monospace"
                    className="fill-slate-400 dark:fill-slate-500 font-semibold"
                  >
                    {formatPctIndo(tick.val)}
                  </text>
                </g>
              ))}

              {/* Shaded Area Fill */}
              {areaPathD && (
                <path d={areaPathD} fill="url(#area-blue-gradient)" />
              )}

              {/* Main Line Stroke (Thick Blue #2563eb) */}
              {linePathD && (
                <path
                  d={linePathD}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Circular Nodes at Each Point */}
              {points.map((p, idx) => (
                <g key={`point-${idx}`}>
                  {/* Outer circle */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="5.5"
                    fill="#ffffff"
                    stroke="#2563eb"
                    strokeWidth="3"
                  />
                </g>
              ))}

              {/* Floating Badges with Exact Style as Gambar 1 */}
              {points.map((p, idx) => {
                const labelText = formatPctIndo(p.val);
                // Stagger badge height slightly if adjacent points are close
                const badgeOffsetY = idx % 2 === 0 ? 30 : 34;

                return (
                  <g key={`badge-${idx}`} transform={`translate(${p.x}, ${p.y - badgeOffsetY})`} filter="url(#badge-shadow)">
                    {/* Badge container with blue border and rounded corners */}
                    <rect
                      x="-27"
                      y="-12"
                      width="54"
                      height="21"
                      rx="6"
                      ry="6"
                      fill="#ffffff"
                      stroke="#2563eb"
                      strokeWidth="1.5"
                      className="dark:fill-slate-900"
                    />
                    {/* Badge text */}
                    <text
                      x="0"
                      y="2.5"
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill="#1d4ed8"
                      fontFamily="Arial, sans-serif"
                      className="dark:fill-blue-400"
                    >
                      {labelText}
                    </text>
                  </g>
                );
              })}

              {/* X-Axis Month Labels */}
              {points.map((p, idx) => {
                const isSelected = p.month.bulanNum >= bulanAwal && p.month.bulanNum <= bulanAkhir;
                return (
                  <g key={`axis-${idx}`} transform={`translate(${p.x}, ${svgHeight - 15})`}>
                    <text
                      x="0"
                      y="0"
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      className={
                        isSelected
                          ? 'fill-slate-900 dark:fill-white font-bold'
                          : 'fill-slate-400 dark:fill-slate-500'
                      }
                    >
                      {p.month.namaPendek}
                    </text>
                    <text
                      x="0"
                      y="12"
                      textAnchor="middle"
                      fontSize="9"
                      fontFamily="monospace"
                      className="fill-slate-400 dark:fill-slate-500"
                    >
                      {p.month.totalIjinMenit > 0 ? `${Math.round(p.month.totalIjinMenit / 60)}j` : '0j'}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Footnote Analisis Tren */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Analisis Tren Kehadiran Garis:</strong> Tingkat kehadiran staf stabil rata-rata <strong>{formatPctIndo(kpiSummary.avgPct)}</strong> (di atas batas toleransi 95%). Puncak disiplin tertinggi terjadi pada bulan <strong>{kpiSummary.highestMonth}</strong>, sementara kenaikan frekuensi izin terjadi di bulan Juli–September seiring agenda sosial dan tradisi keluarga staf.
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. GRAFIK BALOK MENYAMPING RANKING KEHADIRAN SELURUH KARYAWAN  */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Grafik Balok Peringkat Kehadiran Staf (Evaluasi Tahunan Seluruh Karyawan)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {sortDirection === 'asc'
                  ? `Urutan Evaluasi Pembinaan: Karyawan paling perlu perhatian (warna merah) berada di atas, menuju tingkat kehadiran sempurna (hijau) di bawah (${staffRekapList.length} Staf)`
                  : `Urutan Prestasi Kehadiran: Karyawan dengan tingkat kehadiran tertinggi (warna hijau) berada di atas (${staffRekapList.length} Staf)`}
              </p>
            </div>
          </div>

          {/* Search, Filter Unit & Sort (no-print) */}
          <div className="flex flex-wrap items-center gap-2 no-print">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari staf / NIP..."
                value={searchStaff}
                onChange={(e) => setSearchStaff(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white w-44 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Filter Unit */}
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white cursor-pointer"
            >
              <option value="Semua">Semua Unit</option>
              <option value="Operasional">Operasional</option>
              <option value="Administrasi">Administrasi</option>
            </select>

            {/* Sort Toggle */}
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Ubah Urutan Balok Ranking"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>
                {sortDirection === 'asc'
                  ? 'Perlu Perhatian Teratas (Merah → Hijau)'
                  : 'Paling Sempurna Teratas (Hijau → Merah)'}
              </span>
            </button>
          </div>
        </div>

        {/* Legend Indicator */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold pt-1 border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            &lt; 95.0% (Perlu Pembinaan / Perhatian)
          </span>
          <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
            95.0% - 97.9% (Memenuhi Baku)
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            &ge; 98.0% (Sangat Baik / Sempurna)
          </span>
          <span className="ml-auto text-slate-400 text-[11px] font-mono no-print">
            Total {allStaffRanked.length} Staf Ditampilkan
          </span>
        </div>

        {/* The Horizontal Bar Chart Rows (Balok Menyamping Seluruh Karyawan) */}
        <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
          {allStaffRanked.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Tidak ada karyawan yang cocok dengan kriteria pencarian.
            </div>
          ) : (
            allStaffRanked.map((st, idx) => {
              // Calculate actual absolute rank (descending rank)
              const originalRank = staffRekapList
                .slice()
                .sort((a, b) => b.pctKehadiran - a.pctKehadiran)
                .findIndex((s) => s.nip === st.nip) + 1;

              // Color gradient & theme based on percentage
              let barGradient = 'from-emerald-500 to-teal-500';
              let badgeColor = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';
              let statusText = 'Sangat Baik';

              if (st.pctKehadiran >= 99.8) {
                statusText = 'Sempurna 100%';
                badgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700';
              } else if (st.pctKehadiran >= 98.0) {
                statusText = 'Sangat Baik';
              } else if (st.pctKehadiran >= 95.0) {
                barGradient = 'from-blue-500 to-indigo-500';
                badgeColor = 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300';
                statusText = 'Memenuhi Baku';
              } else {
                barGradient = 'from-rose-500 to-red-600';
                badgeColor = 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800';
                statusText = 'Perlu Pembinaan';
              }

              // Dynamic badge style and content based on sorting order
              let rankBadgeClass = 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
              let rankContent: React.ReactNode = `#${idx + 1}`;

              if (sortDirection === 'asc') {
                if (st.pctKehadiran < 95.0) {
                  rankBadgeClass = 'bg-rose-500 text-white font-black shadow-xs ring-1 ring-rose-400';
                  rankContent = `#${idx + 1}`;
                } else if (st.pctKehadiran >= 99.8) {
                  rankBadgeClass = 'bg-emerald-500 text-white font-black shadow-xs';
                  rankContent = '🥇';
                } else if (st.pctKehadiran >= 98.0) {
                  rankBadgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold';
                  rankContent = `#${idx + 1}`;
                } else {
                  rankBadgeClass = 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold';
                  rankContent = `#${idx + 1}`;
                }
              } else {
                if (originalRank === 1) {
                  rankBadgeClass = 'bg-amber-400 text-slate-900 shadow-xs font-black';
                  rankContent = '🥇';
                } else if (originalRank === 2) {
                  rankBadgeClass = 'bg-slate-300 text-slate-800 shadow-xs font-black';
                  rankContent = '🥈';
                } else if (originalRank === 3) {
                  rankBadgeClass = 'bg-amber-700 text-amber-100 shadow-xs font-black';
                  rankContent = '🥉';
                } else {
                  rankBadgeClass = 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
                  rankContent = `#${originalRank}`;
                }
              }

              // Visual bar scaling (scale from 85% to 100% so differences are pronounced and visible)
              const minDisplayPct = 85.0;
              const scaledBarWidth = Math.max(
                8,
                Math.min(100, ((st.pctKehadiran - minDisplayPct) / (100 - minDisplayPct)) * 100)
              );

              return (
                <div
                  key={st.nip}
                  className="p-2.5 sm:p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 transition-all flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-xs"
                >
                  {/* Rank & Identitas */}
                  <div className="flex items-center gap-2.5 w-full md:w-64 shrink-0 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${rankBadgeClass}`}
                      title={sortDirection === 'asc' ? `Urutan Prioritas #${idx + 1}` : `Peringkat #${originalRank}`}
                    >
                      {rankContent}
                    </span>
                    <div className="truncate min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {st.nama}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                        {st.nip} • {st.jabatan}
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Bar (Balok Menyamping) */}
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700/60 rounded-full h-4 overflow-hidden relative p-0.5">
                      <div
                        style={{ width: `${scaledBarWidth}%` }}
                        className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-700 relative`}
                      ></div>
                    </div>
                  </div>

                  {/* Nilai Persentase, Jam Izin & Status Badge */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 w-full md:w-56 text-right">
                    <div className="text-left md:text-right">
                      <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                        {formatPctIndo(st.pctKehadiran)}
                      </span>
                      <span className="block text-[10px] text-slate-500 font-mono">
                        {st.totalIjinPeriode > 0
                          ? `Ijin: ${Math.round(st.totalIjinPeriode / 60)}j (${st.totalIjinPeriode}m)`
                          : 'Ijin: 0 m'}
                      </span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 ${badgeColor}`}>
                      {statusText}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. TABEL MASTER DETAIL 12 BULAN (MATRIX REKAP LENGKAP)         */}
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
                const isExcellent = st.pctKehadiran >= 98;
                const isWarning = st.pctKehadiran < 95;

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
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}
                      >
                        {formatPctIndo(st.pctKehadiran)}
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
