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
  Layers,
  FileText,
  PieChart,
  UserCheck,
  X,
  ChevronRight,
} from 'lucide-react';
import { PresensiRecord, StaffData } from '../../types';
import { NAMA_BULAN_INDO } from '../../services/payrollEngine';
import { formatTanggalIndo } from '../../utils/dateFormatter';
import { normalizePresensiRecord } from '../../utils/workHoursUtils';
import { TablePagination } from '../TablePagination';
import { usePrintMode } from '../../hooks/usePrintMode';

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
  const [tableShowAllMonths, setTableShowAllMonths] = useState<boolean>(false);
  const [matrixPage, setMatrixPage] = useState(1);
  const matrixPageSize = 25;
  const { isPrinting, triggerPrint } = usePrintMode();

  // Modal Rincian Spesifik Jenis Izin Staf
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
  const [modalStaffNip, setModalStaffNip] = useState<string>('');

  const monthsShort = useMemo(
    () => ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
    []
  );

  // Periode Label dinamik (contoh: "Jan – Des", "Jul – Okt", "Oktober")
  const periodeLabel = useMemo(() => {
    if (bulanAwal === bulanAkhir) {
      return NAMA_BULAN_INDO[bulanAwal - 1];
    }
    const minB = Math.min(bulanAwal, bulanAkhir);
    const maxB = Math.max(bulanAwal, bulanAkhir);
    return `${monthsShort[minB - 1]} – ${monthsShort[maxB - 1]}`;
  }, [bulanAwal, bulanAkhir, monthsShort]);

  // Safe Month Handlers to prevent invalid ranges
  const handleBulanAwalChange = (val: number) => {
    setBulanAwal(val);
    if (val > bulanAkhir) {
      setBulanAkhir(val);
    }
  };

  const handleBulanAkhirChange = (val: number) => {
    setBulanAkhir(val);
    if (val < bulanAwal) {
      setBulanAwal(val);
    }
  };

  const setPeriodePreset = (awal: number, akhir: number) => {
    setBulanAwal(awal);
    setBulanAkhir(akhir);
  };

  // 1. Normalisasi data presensi secara dinamis untuk mencegah bias data historis
  // (Sabtu lama 420m dikonversi ke 300m, ijin parsial lama dihitung dengan pemotongan jam istirahat resmi)
  const normalizedPresensiList = useMemo(() => {
    return presensiList.map(normalizePresensiRecord);
  }, [presensiList]);

  // 2. Calculate annual summary per staff
  const staffRekapList = useMemo(() => {
    const list = isStaffPortal
      ? staffList.filter((s) => s.nip === currentUserNip)
      : filterStaffNip ? staffList.filter((s) => s.nip === filterStaffNip) : staffList;

    return list.map((st) => {
      const staffPresensi = normalizedPresensiList.filter((p) => p.nip === st.nip && p.tahun === filterTahun);

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
  }, [staffList, normalizedPresensiList, filterTahun, bulanAwal, bulanAkhir, filterStaffNip, isStaffPortal, currentUserNip]);

  // Active staff selection identification
  const effectiveNip = isStaffPortal && currentUserNip ? currentUserNip : filterStaffNip;
  const selectedStaff = useMemo(() => {
    return effectiveNip ? staffList.find((s) => s.nip === effectiveNip) : null;
  }, [staffList, effectiveNip]);

  // Kalkulasi Spesifik Rincian Durasi Per Jenis Izin untuk Staf Tertentu
  const computeStaffLeaveBreakdown = (targetNip: string) => {
    if (!targetNip) return null;
    const targetStaff = staffList.find((s) => s.nip === targetNip);
    if (!targetStaff) return null;

    const minB = Math.min(bulanAwal, bulanAkhir);
    const maxB = Math.max(bulanAwal, bulanAkhir);

    const staffRecords = normalizedPresensiList.filter((p) => {
      const matchNip = p.nip === targetNip || (p.nama && p.nama.trim().toLowerCase() === targetStaff.nama.trim().toLowerCase());
      const matchYear = p.tahun === filterTahun;
      const matchMonth = p.bulan >= minB && p.bulan <= maxB;
      return matchNip && matchYear && matchMonth;
    });

    const breakdownMap = new Map<string, {
      jenisIjin: string;
      count: number;
      totalMenit: number;
      totalJam: number;
      potonganCount: number;
      records: PresensiRecord[];
    }>();

    staffRecords.forEach((rec) => {
      const jenis = (rec.jenisIjin || 'Izin Lainnya').trim();
      const curr = breakdownMap.get(jenis) || {
        jenisIjin: jenis,
        count: 0,
        totalMenit: 0,
        totalJam: 0,
        potonganCount: 0,
        records: [],
      };

      curr.count += 1;
      curr.totalMenit += (rec.durasiMenit || 0);
      if ((rec.faktorPotongan || 0) > 0) {
        curr.potonganCount += 1;
      }
      curr.records.push(rec);
      breakdownMap.set(jenis, curr);
    });

    const totalStaffMenit = staffRecords.reduce((acc, r) => acc + (r.durasiMenit || 0), 0);
    const totalStaffJam = Math.round((totalStaffMenit / 60) * 10) / 10;
    const totalPotonganHari = staffRecords.reduce((acc, r) => acc + (r.faktorPotongan || 0), 0);

    const items = Array.from(breakdownMap.values()).map((item) => {
      const jam = Math.floor(item.totalMenit / 60);
      const sisaMenit = item.totalMenit % 60;
      const pct = totalStaffMenit > 0
        ? Math.round((item.totalMenit / totalStaffMenit) * 1000) / 10
        : 0;
      const potonganHariTotal = item.records.reduce((acc, r) => acc + (r.faktorPotongan || 0), 0);
      return {
        ...item,
        totalJam: Math.round((item.totalMenit / 60) * 10) / 10,
        jam,
        sisaMenit,
        frekuensi: item.count,
        potonganHariTotal,
        percentageOfTotalLeave: pct,
      };
    }).sort((a, b) => b.totalMenit - a.totalMenit);

    return {
      staff: targetStaff,
      totalKejadian: staffRecords.length,
      totalMenit: totalStaffMenit,
      totalJam: totalStaffJam,
      totalPotonganHari,
      items,
      records: staffRecords.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()),
    };
  };

  const openBreakdownForStaff = (nip: string) => {
    setModalStaffNip(nip);
    setIsBreakdownModalOpen(true);
  };

  const selectedStaffBreakdown = useMemo(() => {
    return effectiveNip ? computeStaffLeaveBreakdown(effectiveNip) : null;
  }, [effectiveNip, normalizedPresensiList, filterTahun, bulanAwal, bulanAkhir, staffList]);

  const modalStaffBreakdown = useMemo(() => {
    return modalStaffNip ? computeStaffLeaveBreakdown(modalStaffNip) : null;
  }, [modalStaffNip, normalizedPresensiList, filterTahun, bulanAwal, bulanAkhir, staffList]);

  // 3. Calculate Monthly Trend (Jan - Des) across active staff or filtered individual staff
  const monthlyTrendData = useMemo(() => {
    if (effectiveNip) {
      // Individual Staff calculation: standard is 1 staff = 10,440 menit/bulan
      const stdPerMonth = MENIT_PER_BULAN_STANDAR;

      return monthsShort.map((namaPendek, idx) => {
        const bulanNum = idx + 1;
        const records = normalizedPresensiList.filter(
          (p) => p.nip === effectiveNip && p.tahun === filterTahun && p.bulan === bulanNum
        );
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
    }

    // Aggregate Divisi calculation across all active staff
    const activeStaffCount = staffList.filter((s) => s.statusAktif === 'Aktif').length || staffList.length || 1;
    const stdPerMonth = activeStaffCount * MENIT_PER_BULAN_STANDAR;

    return monthsShort.map((namaPendek, idx) => {
      const bulanNum = idx + 1;
      const records = normalizedPresensiList.filter((p) => p.tahun === filterTahun && p.bulan === bulanNum);
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
  }, [normalizedPresensiList, staffList, filterTahun, effectiveNip, monthsShort]);

  // 3. Active Trend Data Filtered by Selected Month Range (Menjawab filter rentang bulan)
  const activeTrendData = useMemo(() => {
    const minB = Math.min(bulanAwal, bulanAkhir);
    const maxB = Math.max(bulanAwal, bulanAkhir);
    return monthlyTrendData.filter((m) => m.bulanNum >= minB && m.bulanNum <= maxB);
  }, [monthlyTrendData, bulanAwal, bulanAkhir]);

  // Displayed Months for Master Matrix Table
  const displayedMonths = useMemo(() => {
    const minB = Math.min(bulanAwal, bulanAkhir);
    const maxB = Math.max(bulanAwal, bulanAkhir);
    if (tableShowAllMonths) {
      return monthsShort.map((namaPendek, idx) => ({
        idx,
        bulanNum: idx + 1,
        namaPendek,
        namaLengkap: NAMA_BULAN_INDO[idx],
        isActive: idx + 1 >= minB && idx + 1 <= maxB,
      }));
    }
    return monthsShort
      .map((namaPendek, idx) => ({
        idx,
        bulanNum: idx + 1,
        namaPendek,
        namaLengkap: NAMA_BULAN_INDO[idx],
        isActive: true,
      }))
      .filter((m) => m.bulanNum >= minB && m.bulanNum <= maxB);
  }, [monthsShort, tableShowAllMonths, bulanAwal, bulanAkhir]);

  // 4. Ranked staff list for all 32 staff
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

  // 5. Overall KPI Summary
  const kpiSummary = useMemo(() => {
    if (staffRekapList.length === 0) return { avgPct: 100, perfectCount: 0, totalIjinJam: 0, highestMonth: 'Oktober' };

    const sumPct = staffRekapList.reduce((acc, s) => acc + s.pctKehadiran, 0);
    const avgPct = sumPct / staffRekapList.length;
    const perfectCount = staffRekapList.filter((s) => s.pctKehadiran >= 99.99).length;
    const totalIjinMenitAll = staffRekapList.reduce((acc, s) => acc + s.totalIjinPeriode, 0);
    const totalIjinJam = Math.round((totalIjinMenitAll / 60) * 10) / 10;

    // Find month with highest percentage / lowest izin in active period
    const pool = activeTrendData.length > 0 ? activeTrendData : monthlyTrendData;
    let bestM = pool[0];
    pool.forEach((m) => {
      if (
        m.pctKehadiran > bestM.pctKehadiran ||
        (m.pctKehadiran === bestM.pctKehadiran && m.totalIjinMenit < bestM.totalIjinMenit)
      ) {
        bestM = m;
      }
    });

    const allZeroIjin = pool.every((m) => m.totalIjinMenit === 0);
    const highestMonth = allZeroIjin ? '100% Sepanjang Periode' : (bestM?.nama || 'Oktober');

    return {
      avgPct,
      perfectCount,
      totalIjinJam,
      highestMonth,
    };
  }, [staffRekapList, activeTrendData, monthlyTrendData]);

  const matrixTotalPages = Math.max(1, Math.ceil(staffRekapList.length / matrixPageSize));
  const safeMatrixPage = Math.min(Math.max(1, matrixPage), matrixTotalPages);
  const displayedMatrixStaff = useMemo(() => {
    if (isPrinting) return staffRekapList;
    const start = (safeMatrixPage - 1) * matrixPageSize;
    return staffRekapList.slice(start, start + matrixPageSize);
  }, [staffRekapList, isPrinting, safeMatrixPage]);

  const handleExportPdf = () => {
    triggerPrint(`Rekapitulasi_Presensi_${filterTahun}_PT_BATU_KARANG`);
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

  // Determine Y-scale based on activeTrendData (merespon rentang bulan)
  const chartDataSource = activeTrendData.length > 0 ? activeTrendData : monthlyTrendData;
  const values = chartDataSource.map((m) =>
    trendMetric === 'kehadiran' ? m.pctKehadiran : m.pctIjin
  );

  let yMin = trendMetric === 'kehadiran' ? 92.0 : 0.0;
  let yMax = trendMetric === 'kehadiran' ? 100.5 : 5.5;

  if (trendMetric === 'kehadiran') {
    const minVal = values.length > 0 ? Math.min(...values) : 100;
    if (minVal >= 99.9) {
      // Sempurna 100%: baseline 95% agar garis horizontal terlihat elegan di bagian atas
      yMin = 95.0;
      yMax = 100.5;
    } else {
      // Ada penurunan / izin: batas bawah dinamis dengan margin 1,5% agar kurva fluktuasi terlihat jelas
      yMin = Math.max(0, Math.floor(minVal - 1.5));
      yMax = 100.5;
    }
  } else {
    const maxVal = values.length > 0 ? Math.max(...values) : 0;
    if (maxVal <= 0.1) {
      yMin = 0.0;
      yMax = 5.0;
    } else {
      yMin = 0.0;
      yMax = Math.max(3.0, Math.ceil(maxVal + 0.8));
    }
  }

  const yRange = yMax - yMin || 1;

  // Points coordinates (responsif terhadap jumlah bulan yang dipilih)
  const points = chartDataSource.map((m, idx) => {
    const x =
      chartDataSource.length > 1
        ? padLeft + (idx / (chartDataSource.length - 1)) * plotWidth
        : padLeft + plotWidth / 2;
    const val = trendMetric === 'kehadiran' ? m.pctKehadiran : m.pctIjin;
    const y = padTop + plotHeight - ((val - yMin) / yRange) * plotHeight;
    return { x, y, val, month: m };
  });

  // SVG Line path (tangani kasus 1 bulan maupun banyak bulan)
  const linePathD =
    points.length === 1
      ? `M ${points[0].x - 60} ${points[0].y} L ${points[0].x + 60} ${points[0].y}`
      : points.reduce((acc, p, idx) => {
          return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
        }, '');

  // SVG Area path (fading to bottom)
  const baselineY = padTop + plotHeight;
  const areaPathD =
    points.length === 1
      ? `M ${points[0].x - 60} ${points[0].y} L ${points[0].x + 60} ${points[0].y} L ${points[0].x + 60} ${baselineY} L ${points[0].x - 60} ${baselineY} Z`
      : points.length > 1
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs no-print print:hidden">
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
                onChange={(e) => handleBulanAwalChange(Number(e.target.value))}
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
                onChange={(e) => handleBulanAkhirChange(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
              >
                {NAMA_BULAN_INDO.map((bln, i) => (
                  <option key={bln} value={i + 1}>
                    {bln}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-col">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                Preset Cepat
              </label>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setPeriodePreset(1, 12)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    bulanAwal === 1 && bulanAkhir === 12
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  1 Tahun (12 Bln)
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodePreset(1, 6)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    bulanAwal === 1 && bulanAkhir === 6
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Smt 1
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodePreset(7, 12)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    bulanAwal === 7 && bulanAkhir === 12
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Smt 2
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodePreset(10, 10)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    bulanAwal === 10 && bulanAkhir === 10
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Okt
                </button>
              </div>
            </div>

            {!isStaffPortal && (
              <div className="flex items-end gap-1.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Filter Staf Khusus
                  </label>
                  <select
                    value={filterStaffNip}
                    onChange={(e) => setFilterStaffNip(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white max-w-[200px]"
                  >
                    <option value="">-- Semua 32 Staf --</option>
                    {staffList.map((s) => (
                      <option key={s.nip} value={s.nip}>
                        {s.nama}
                      </option>
                    ))}
                  </select>
                </div>
                {filterStaffNip && (
                  <button
                    type="button"
                    onClick={() => setFilterStaffNip('')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    title="Kembali ke semua 32 staf"
                  >
                    Semua
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setModalStaffNip(filterStaffNip || staffList[0]?.nip || '');
                setIsBreakdownModalOpen(true);
              }}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Lihat rincian durasi tiap-tiap jenis izin staf"
            >
              <Layers className="w-4 h-4" />
              <span>Rincian Jenis Izin Staf</span>
            </button>

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
            <span>{selectedStaff ? 'Tingkat Kehadiran Staf' : 'Rata-rata Kehadiran Divisi'}</span>
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
            <span>{selectedStaff ? 'Status Disiplin Sempurna' : 'Kehadiran 100% Sempurna'}</span>
            <Medal className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
            {selectedStaff ? (
              kpiSummary.avgPct >= 99.99 ? '100% Sempurna' : 'Ada Izin'
            ) : (
              <>
                {kpiSummary.perfectCount} <span className="text-xs font-sans text-slate-400">Staf</span>
              </>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {selectedStaff
              ? (kpiSummary.avgPct >= 99.99 ? 'Nol menit izin dalam periode' : `${kpiSummary.totalIjinJam} jam izin tercatat`)
              : 'Nol menit izin / potong upah'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>{selectedStaff ? 'Total Izin Staf' : 'Total Ijin / Jam Hilang'}</span>
            <Clock className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black font-mono text-red-600 dark:text-red-400">
            {kpiSummary.totalIjinJam} <span className="text-xs font-sans text-slate-400">Jam</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {selectedStaff ? `Akumulasi izin ${selectedStaff.nama}` : 'Akumulasi seluruh izin periode'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>Disiplin Tertinggi</span>
            <Flame className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 truncate" title={kpiSummary.highestMonth}>
            {kpiSummary.highestMonth}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {selectedStaff ? 'Bulan paling tertib / minim izin' : 'Volume izin terendah tahun ini'}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* PANEL RINCIAN SPESIFIK DURASI PER JENIS IZIN STAF TERPILIH     */}
      {/* ============================================================== */}
      {selectedStaff && selectedStaffBreakdown && (
        <div className="bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-5 sm:p-6 shadow-md space-y-5 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Rincian Spesifik Durasi Izin — {selectedStaff.nama}
                  </h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                    {selectedStaff.nip} • {selectedStaff.sekup}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Distribusi durasi jam & menit per jenis izin pada tahun {filterTahun}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Total Izin: <span className="text-indigo-600 dark:text-indigo-400 font-black">{Math.round(selectedStaffBreakdown.totalMenit / 60)}j ({selectedStaffBreakdown.totalMenit}m)</span>
              </span>
              <button
                type="button"
                onClick={() => setFilterStaffNip('all')}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              >
                Reset ke Semua Staf
              </button>
            </div>
          </div>

          {/* KPI Mini Staf Izin */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Total Durasi Izin</span>
              <span className="text-lg font-black text-slate-900 dark:text-white">
                {Math.round(selectedStaffBreakdown.totalMenit / 60)}j <span className="text-xs font-semibold text-slate-500">({selectedStaffBreakdown.totalMenit} m)</span>
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Frekuensi Izin</span>
              <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                {selectedStaffBreakdown.totalKejadian} <span className="text-xs font-semibold text-slate-500">kejadian</span>
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Akumulasi Potongan</span>
              <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                {selectedStaffBreakdown.totalPotonganHari.toFixed(2)} <span className="text-xs font-semibold text-slate-500">hari</span>
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Variasi Jenis Izin</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {selectedStaffBreakdown.items.length} <span className="text-xs font-semibold text-slate-500">kategori</span>
              </span>
            </div>
          </div>

          {/* Rincian Per Jenis Izin (Cards Grid) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              Rincian Durasi Tiap Jenis Izin
            </h3>
            {selectedStaffBreakdown.items.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                Tidak ada catatan izin untuk {selectedStaff.nama} pada periode {filterTahun}. (Presensi 100% disiplin)
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedStaffBreakdown.items.map((it) => {
                  const pct = selectedStaffBreakdown.totalMenit > 0
                    ? Math.round((it.totalMenit / selectedStaffBreakdown.totalMenit) * 100)
                    : 0;
                  return (
                    <div
                      key={it.jenisIjin}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-bold text-sm text-slate-900 dark:text-white truncate" title={it.jenisIjin}>
                            {it.jenisIjin}
                          </span>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {it.frekuensi}x
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Total: <span className="font-bold text-indigo-600 dark:text-indigo-400">{it.jam} jam {it.sisaMenit} menit</span> ({it.totalMenit} m)
                        </div>
                        {it.potonganHariTotal > 0 && (
                          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                            Potongan: {it.potonganHariTotal.toFixed(2)} hari
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          <span>Porsi dari total izin</span>
                          <span className="font-bold">{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tabel Log Riwayat Izin Staf Terpilih */}
          {selectedStaffBreakdown.records.length > 0 && (
            <div className="pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5">
                Log Catatan Izin {selectedStaff.nama} ({selectedStaffBreakdown.records.length} Record)
              </h3>
              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-bold sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Tanggal</th>
                      <th className="py-2 px-3">Jenis Izin</th>
                      <th className="py-2 px-3">Jam / Rentang</th>
                      <th className="py-2 px-3 text-right">Durasi</th>
                      <th className="py-2 px-3 text-right">Potongan</th>
                      <th className="py-2 px-3">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {selectedStaffBreakdown.records.map((r, idx) => {
                      const durasiMin = r.durasiMenit || 0;
                      const jam = Math.floor(durasiMin / 60);
                      const mnt = durasiMin % 60;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-1.5 px-3 font-semibold whitespace-nowrap">{r.tanggal} ({r.hari})</td>
                          <td className="py-1.5 px-3">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{r.jenisIjin}</span>
                          </td>
                          <td className="py-1.5 px-3 whitespace-nowrap">
                            {r.jamAwal && r.jamAkhir ? `${r.jamAwal} - ${r.jamAkhir}` : '-'}
                          </td>
                          <td className="py-1.5 px-3 text-right font-bold whitespace-nowrap">
                            {jam > 0 ? `${jam}j ` : ''}{mnt}m ({durasiMin}m)
                          </td>
                          <td className="py-1.5 px-3 text-right font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                            {r.faktorPotongan ? `${r.faktorPotongan} hr` : '-'}
                          </td>
                          <td className="py-1.5 px-3 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={r.keperluan}>
                            {r.keperluan || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

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
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                <span>
                  Grafik Tren Tingkat Kehadiran Bulanan {selectedStaff ? `— ${selectedStaff.nama}` : ''} ({periodeLabel} {filterTahun})
                </span>
                {selectedStaff && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                    {selectedStaff.nip} • {selectedStaff.sekup}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {selectedStaff
                  ? `Visualisasi kurva garis persentase kehadiran bulanan staf: ${selectedStaff.nama} (${selectedStaff.jabatan})`
                  : 'Visualisasi kurva garis persentase jam kerja efektif operasional PT Batu Karang'}
              </p>
            </div>
          </div>

          {/* Metric Toggle (Hidden in print) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl no-print print:hidden">
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
                      {p.month.totalIjinMenit > 0
                        ? `${(p.month.totalIjinMenit / 60).toFixed(1).replace('.0', '').replace('.', ',')}j`
                        : '0j'}
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
            <strong>Analisis Tren Kehadiran Garis:</strong> {selectedStaff ? (
              <>Tingkat kehadiran <strong>{selectedStaff.nama}</strong> rata-rata <strong>{formatPctIndo(kpiSummary.avgPct)}</strong> dengan akumulasi izin <strong>{kpiSummary.totalIjinJam} jam</strong>. Disiplin terbaik berada pada bulan <strong>{kpiSummary.highestMonth}</strong>.</>
            ) : (
              <>Tingkat kehadiran staf stabil rata-rata <strong>{formatPctIndo(kpiSummary.avgPct)}</strong> (di atas batas toleransi 95%). Puncak disiplin tertinggi terjadi pada bulan <strong>{kpiSummary.highestMonth}</strong>, sementara fluktuasi izin dipengaruhi oleh agenda kerja dan pengajuan izin cuti/ijin staf.</>
            )}
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. GRAFIK BALOK MENYAMPING RANKING KEHADIRAN SELURUH KARYAWAN  */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 print:border-none print:shadow-none print:p-0 print:space-y-3 print:break-before-page">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Grafik Balok Peringkat Kehadiran Staf (Evaluasi Periode {periodeLabel} {filterTahun})
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {sortDirection === 'asc'
                  ? `Urutan Evaluasi Pembinaan: Karyawan paling perlu perhatian (warna merah) berada di atas, menuju tingkat kehadiran sempurna (hijau) di bawah (${staffRekapList.length} Staf)`
                  : `Urutan Prestasi Kehadiran: Karyawan dengan tingkat kehadiran tertinggi (warna hijau) berada di atas (${staffRekapList.length} Staf)`}
              </p>
            </div>
          </div>

          {/* Search, Filter Unit & Sort (no-print) */}
          <div className="flex flex-wrap items-center gap-2 no-print print:hidden">
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
          <span className="ml-auto text-slate-400 dark:text-slate-500 text-[11px] font-mono print:text-black print:font-bold">
            Total {allStaffRanked.length} Staf Ditampilkan
          </span>
        </div>

        {/* The Horizontal Bar Chart Rows (Balok Menyamping Seluruh Karyawan Tanpa Slider / Utuh) */}
        <div className="space-y-2 print:space-y-1.5">
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
                  className="p-2 sm:p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 transition-all flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-xs print:flex-row print:items-center print:gap-3 print:p-1.5 print:bg-white print:border-slate-300 break-inside-avoid print:break-inside-avoid"
                >
                  {/* Rank & Identitas */}
                  <div className="flex items-center gap-2.5 w-full md:w-64 shrink-0 min-w-0 print:w-56">
                    <span
                      className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${rankBadgeClass} print:print-color-adjust-exact`}
                      title={sortDirection === 'asc' ? `Urutan Prioritas #${idx + 1}` : `Peringkat #${originalRank}`}
                    >
                      {rankContent}
                    </span>
                    <div className="truncate min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white truncate print:text-black">
                        {st.nama}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate print:text-slate-600">
                        {st.nip} • {st.jabatan}
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Bar (Balok Menyamping) */}
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700/60 rounded-full h-4 overflow-hidden relative p-0.5 print:h-3 print:bg-slate-100 print:border print:border-slate-300">
                      <div
                        style={{ width: `${scaledBarWidth}%` }}
                        className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-700 relative print:print-color-adjust-exact`}
                      ></div>
                    </div>
                  </div>

                  {/* Nilai Persentase, Jam Izin & Status Badge */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 w-full md:w-56 text-right print:w-48 print:justify-end">
                    <div className="text-left md:text-right print:text-right">
                      <span className="font-mono font-black text-sm text-slate-900 dark:text-white print:text-black">
                        {formatPctIndo(st.pctKehadiran)}
                      </span>
                      <span className="block text-[10px] text-slate-500 font-mono print:text-slate-600">
                        {st.totalIjinPeriode > 0
                          ? `Ijin: ${Math.round(st.totalIjinPeriode / 60)}j (${st.totalIjinPeriode}m)`
                          : 'Ijin: 0 m'}
                      </span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 ${badgeColor} print:print-color-adjust-exact`}>
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden print:border-none print:shadow-none print:break-before-page print:overflow-visible">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/30">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span>Tabel Matriks Rekapitulasi Izin Staf ({periodeLabel} {filterTahun})</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                {displayedMonths.length} Bulan Ditampilkan
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Rincian menit izin yang terakumulasi per bulan untuk masing-masing staf pada periode {periodeLabel}
            </p>
          </div>
          <div className="flex items-center gap-2 no-print print:hidden">
            <button
              type="button"
              onClick={() => setTableShowAllMonths(!tableShowAllMonths)}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs cursor-pointer"
            >
              {tableShowAllMonths ? '🔍 Fokus Rentang Terpilih Saja' : '📅 Tampilkan 12 Bulan Penuh'}
            </button>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              {staffRekapList.length} Staf Terdata
            </span>
          </div>
        </div>

        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3">Nama Karyawan</th>
                <th className="py-3 px-2 text-slate-500 font-mono">NIP</th>
                {displayedMonths.map((m) => (
                  <th
                    key={m.bulanNum}
                    className={`py-3 px-2 text-center font-mono ${
                      m.isActive && tableShowAllMonths
                        ? 'bg-blue-100/70 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 font-bold'
                        : ''
                    }`}
                  >
                    {m.namaPendek}
                  </th>
                ))}
                <th className="py-3 px-3 text-right">Tot. Ijin ({periodeLabel})</th>
                <th className="py-3 px-3 text-right">% Kehadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
              {displayedMatrixStaff.map((st) => {
                const isExcellent = st.pctKehadiran >= 98;
                const isWarning = st.pctKehadiran < 95;

                return (
                  <tr key={st.nip} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 break-inside-avoid print:break-inside-avoid">
                    <td className="py-2.5 px-3 font-sans truncate max-w-[180px]">
                      <button
                        type="button"
                        onClick={() => openBreakdownForStaff(st.nip)}
                        className="text-left font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 group inline-flex items-center gap-1.5 transition-colors"
                        title="Klik untuk melihat rincian spesifik jenis izin staf ini"
                      >
                        <span className="truncate">{st.nama}</span>
                        {st.totalIjinPeriode > 0 && (
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 opacity-80 group-hover:opacity-100">
                            Rincian
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="py-2.5 px-2 text-slate-400">{st.nip}</td>
                    {displayedMonths.map((m) => {
                      const menit = st.bulananMenit[m.idx];
                      return (
                        <td
                          key={m.bulanNum}
                          className={`py-2.5 px-2 text-center ${
                            m.isActive && tableShowAllMonths ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                          } ${
                            menit > 0
                              ? 'text-red-600 dark:text-red-400 font-bold bg-red-50/50 dark:bg-red-950/20'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        >
                          {menit || '0'}
                        </td>
                      );
                    })}
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

        <TablePagination
          currentPage={safeMatrixPage}
          totalItems={staffRekapList.length}
          pageSize={matrixPageSize}
          onPageChange={setMatrixPage}
          itemLabel="rekap staf"
        />

        {/* Print Footer */}
        <div className="hidden print:block p-4 border-t border-black text-right text-xs font-semibold">
          Divisi Produksi I — PT Batu Karang | Dokumen Evaluasi Resmi
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL POPUP RINCIAN SPESIFIK JENIS IZIN STAF                    */}
      {/* ============================================================== */}
      {isBreakdownModalOpen && modalStaffBreakdown && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsBreakdownModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Rincian Durasi Jenis Izin — {modalStaffBreakdown.staff.nama}
                    </h3>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                      {modalStaffBreakdown.staff.nip}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {modalStaffBreakdown.staff.jabatan} • Bagian: {modalStaffBreakdown.staff.sekup} • Periode {filterTahun}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBreakdownModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Scrollable */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
              {/* Ringkasan KPI Modal */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[11px] font-semibold text-slate-500 block">Total Durasi</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {Math.round(modalStaffBreakdown.totalMenit / 60)}j ({modalStaffBreakdown.totalMenit}m)
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[11px] font-semibold text-slate-500 block">Frekuensi</span>
                  <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                    {modalStaffBreakdown.totalKejadian} catatan
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[11px] font-semibold text-slate-500 block">Potongan Gaji/Hari</span>
                  <span className="text-base font-black text-amber-600 dark:text-amber-400">
                    {modalStaffBreakdown.totalPotonganHari.toFixed(2)} hari
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[11px] font-semibold text-slate-500 block">Kategori Izin</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {modalStaffBreakdown.items.length} tipe
                  </span>
                </div>
              </div>

              {/* Rincian Tiap Jenis Izin */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5">
                  Rincian Per Tipe Izin
                </h4>
                {modalStaffBreakdown.items.length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    Staf ini belum pernah mengajukan izin pada periode {filterTahun}. Kehadiran 100%.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {modalStaffBreakdown.items.map((it) => {
                      const pct = modalStaffBreakdown.totalMenit > 0
                        ? Math.round((it.totalMenit / modalStaffBreakdown.totalMenit) * 100)
                        : 0;
                      return (
                        <div
                          key={it.jenisIjin}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {it.jenisIjin}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {it.frekuensi}x
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Durasi: <span className="font-bold text-indigo-600 dark:text-indigo-400">{it.jam}j {it.sisaMenit}m</span> ({it.totalMenit}m)
                          </div>
                          {it.potonganHariTotal > 0 && (
                            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                              Potongan: {it.potonganHariTotal.toFixed(2)} hari
                            </div>
                          )}
                          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                            <span>Porsi Izin</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Log Detail */}
              {modalStaffBreakdown.records.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Daftar Riwayat Izin ({modalStaffBreakdown.records.length} Record)
                  </h4>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-bold sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Tanggal</th>
                          <th className="py-2 px-3">Jenis Izin</th>
                          <th className="py-2 px-3">Jam</th>
                          <th className="py-2 px-3 text-right">Durasi</th>
                          <th className="py-2 px-3 text-right">Potongan</th>
                          <th className="py-2 px-3">Alasan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {modalStaffBreakdown.records.map((r, i) => {
                          const dMin = r.durasiMenit || 0;
                          return (
                            <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                              <td className="py-1.5 px-3 whitespace-nowrap">{r.tanggal}</td>
                              <td className="py-1.5 px-3 font-semibold text-indigo-600 dark:text-indigo-400">{r.jenisIjin}</td>
                              <td className="py-1.5 px-3 whitespace-nowrap">
                                {r.jamAwal && r.jamAkhir ? `${r.jamAwal} - ${r.jamAkhir}` : '-'}
                              </td>
                              <td className="py-1.5 px-3 text-right font-bold whitespace-nowrap">{dMin}m</td>
                              <td className="py-1.5 px-3 text-right text-amber-600 dark:text-amber-400 whitespace-nowrap">
                                {r.faktorPotongan ? `${r.faktorPotongan} hr` : '-'}
                              </td>
                              <td className="py-1.5 px-3 text-slate-500 max-w-xs truncate">{r.keperluan || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <button
                type="button"
                onClick={() => {
                  setFilterStaffNip(modalStaffBreakdown.staff.nip);
                  setIsBreakdownModalOpen(false);
                }}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
              >
                Tampilkan di Filter Rekap Utama
              </button>
              <button
                type="button"
                onClick={() => setIsBreakdownModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-bold text-xs transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
