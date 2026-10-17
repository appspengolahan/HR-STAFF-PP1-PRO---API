import React, { useState, useMemo } from 'react';
import {
  Globe,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  Building2,
  Printer,
  Copy,
  Check,
  Lock,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Users,
  Sun,
  Moon,
  Info,
} from 'lucide-react';
import { StaffData, PresensiRecord, AppBrandingSettings } from '../../types';
import { formatTanggalIndo, normalizeIsoDate } from '../../utils/dateFormatter';
import { appAlert } from '../../services/dialogService';

interface PublicInformationPortalProps {
  staffList: StaffData[];
  presensiList: PresensiRecord[];
  branding: AppBrandingSettings;
  onOpenLogin: () => void;
}

export const PublicInformationPortal: React.FC<PublicInformationPortalProps> = ({
  staffList = [],
  presensiList = [],
  branding,
  onOpenLogin,
}) => {
  // 1. Date Selection State
  // Default to today's date formatted as YYYY-MM-DD in local time
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  // 2. Interactive Navigation Tabs
  const [activeTab, setActiveTab] = useState<'harian' | 'rekap' | 'kapasitas'>('harian');

  // 3. Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSekup, setSelectedSekup] = useState<'Semua' | 'Operasional' | 'Administrasi'>('Semua');
  const [selectedBulanRekap, setSelectedBulanRekap] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  // Copy feedback state
  const [isCopied, setIsCopied] = useState(false);

  // Set today / yesterday quick buttons
  const handleSetQuickDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${day}`);
  };

  // Copy Link Handler
  const handleCopyPublicLink = async () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}?view=public`;
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      appAlert('Gagal menyalin link otomatis. Silakan salin URL dari address bar.');
    }
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // 4. Data Calculations for Selected Date
  const dateNorm = normalizeIsoDate(selectedDate);

  // Filter staff by sekup
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      if (selectedSekup === 'Semua') return true;
      return s.sekup === selectedSekup;
    });
  }, [staffList, selectedSekup]);

  // Daily records on selected date
  const recordsOnDate = useMemo(() => {
    return presensiList.filter((p) => normalizeIsoDate(p.tanggal) === dateNorm);
  }, [presensiList, dateNorm]);

  // Breakdown of staff status on selected date
  const dailyAttendanceList = useMemo(() => {
    return filteredStaff
      .map((staff) => {
        // Find record for this staff on selected date
        const rec = recordsOnDate.find(
          (r) =>
            r.nip === staff.nip ||
            r.nama.trim().toLowerCase() === staff.nama.trim().toLowerCase()
        );

        let status: 'HADIR' | 'SAKIT' | 'IJIN' | 'CUTI' | 'LIBUR_OFF' | 'BELUM_CATAT' = 'BELUM_CATAT';
        let jamMasuk = '-';
        let jamPulang = '-';
        let keterangan = '-';

        if (rec) {
          jamMasuk = rec.jamAwal || '-';
          jamPulang = rec.jamAkhir || '-';
          const ji = (rec.jenisIjin || '').toLowerCase();

          if (ji.includes('sakit')) {
            status = 'SAKIT';
            keterangan = rec.jenisIjin || 'Sakit';
          } else if (ji.includes('cuti')) {
            status = 'CUTI';
            keterangan = rec.jenisIjin || 'Cuti Tahunan';
          } else if (ji.includes('ijin') || ji.includes('izin')) {
            status = 'IJIN';
            keterangan = rec.jenisIjin || 'Izin';
          } else if (ji.includes('off') || ji.includes('libur')) {
            status = 'LIBUR_OFF';
            keterangan = 'Libur / Off';
          } else if (rec.jamAwal && rec.jamAwal !== '-') {
            status = 'HADIR';
            keterangan = rec.catatan || rec.keperluan || 'Hadir Normal';
          } else {
            status = 'BELUM_CATAT';
            keterangan = rec.catatan || rec.keperluan || 'Belum Terdata';
          }
        }

        return {
          id: staff.id,
          nip: staff.nip,
          nama: staff.nama,
          jabatan: staff.jabatan,
          sekup: staff.sekup,
          status,
          jamMasuk,
          jamPulang,
          keterangan,
        };
      })
      .filter((s) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          s.nama.toLowerCase().includes(q) ||
          s.nip.toLowerCase().includes(q) ||
          s.jabatan.toLowerCase().includes(q)
        );
      });
  }, [filteredStaff, recordsOnDate, searchQuery]);

  // Quick Stats Counter
  const stats = useMemo(() => {
    let hadir = 0;
    let sakit = 0;
    let ijin = 0;
    let cuti = 0;
    let belumCatat = 0;

    dailyAttendanceList.forEach((s) => {
      if (s.status === 'HADIR') hadir++;
      else if (s.status === 'SAKIT') sakit++;
      else if (s.status === 'IJIN') ijin++;
      else if (s.status === 'CUTI') cuti++;
      else belumCatat++;
    });

    const totalFiltered = dailyAttendanceList.length;
    const rate = totalFiltered > 0 ? Math.round((hadir / totalFiltered) * 100) : 0;

    return { hadir, sakit, ijin, cuti, belumCatat, totalFiltered, rate };
  }, [dailyAttendanceList]);

  // Staff on Leave / Permit today
  const staffOnLeave = useMemo(() => {
    return dailyAttendanceList.filter((s) => s.status === 'SAKIT' || s.status === 'IJIN' || s.status === 'CUTI');
  }, [dailyAttendanceList]);

  // Unit Breakdown for Tab 3 (Kapasitas Tim)
  const unitBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; operasional: number; administrasi: number }>();

    staffList.forEach((s) => {
      const dept = s.jabatan.includes('QC')
        ? 'Quality Control (QC)'
        : s.jabatan.includes('Mesin')
        ? 'Lini Produksi & Mesin'
        : s.jabatan.includes('Gudang')
        ? 'Gudang & Logistik'
        : s.sekup === 'Administrasi'
        ? 'Administrasi & Kantor'
        : 'Operasional Lapangan';

      const current = map.get(dept) || { total: 0, operasional: 0, administrasi: 0 };
      current.total += 1;
      if (s.sekup === 'Operasional') current.operasional += 1;
      else current.administrasi += 1;
      map.set(dept, current);
    });

    return Array.from(map.entries()).map(([dept, counts]) => ({
      dept,
      ...counts,
    }));
  }, [staffList]);

  // Monthly stats for Tab 2
  const monthlyStats = useMemo(() => {
    const [yearStr, monthStr] = selectedBulanRekap.split('-');
    const y = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);

    const monthRecords = presensiList.filter((p) => {
      const d = normalizeIsoDate(p.tanggal);
      if (!d) return false;
      const parts = d.split('-');
      return parseInt(parts[0], 10) === y && parseInt(parts[1], 10) === m;
    });

    const totalLogs = monthRecords.length;
    const hadirLogs = monthRecords.filter((p) => {
      const ji = (p.jenisIjin || '').toLowerCase();
      return (
        !ji.includes('sakit') &&
        !ji.includes('cuti') &&
        !ji.includes('ijin') &&
        !ji.includes('izin') &&
        p.jamAwal &&
        p.jamAwal !== '-'
      );
    }).length;

    const sakitLogs = monthRecords.filter((p) => (p.jenisIjin || '').toLowerCase().includes('sakit')).length;
    const ijinLogs = monthRecords.filter((p) => {
      const ji = (p.jenisIjin || '').toLowerCase();
      return (ji.includes('ijin') || ji.includes('izin')) && !ji.includes('sakit');
    }).length;
    const cutiLogs = monthRecords.filter((p) => (p.jenisIjin || '').toLowerCase().includes('cuti')).length;

    const rate = totalLogs > 0 ? Math.round((hadirLogs / totalLogs) * 100) : 0;

    return { totalLogs, hadirLogs, sakitLogs, ijinLogs, cutiLogs, rate, y, m };
  }, [presensiList, selectedBulanRekap]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Header Publik (Top Bar) */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo Brand & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl overflow-hidden bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-sm shadow-md shrink-0 border border-white/20">
              {branding?.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={branding.appName || 'Logo'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{branding?.badgeText || 'PP1'}</span>
              )}
            </div>

            <div className="leading-tight truncate">
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm sm:text-base text-white truncate tracking-wide">
                  {branding?.appName || 'HR STAFF - PRODUKSI I'}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Informasi Publik
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {branding?.appSubtitle || 'PT Batu Karang — Divisi Produksi I (PP1)'}
              </p>
            </div>
          </div>

          {/* Action Buttons: Print, Copy Link, Login Staf */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyPublicLink}
              title="Salin tautan publik ini untuk dibagikan di Linktree atau pesan"
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline text-emerald-300">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Salin Link</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              title="Cetak atau simpan ringkasan ke PDF"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Cetak (PDF)</span>
            </button>

            <button
              onClick={onOpenLogin}
              className="px-3 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Login Staf Internal</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Banner Informasi Tamu & Jaminan Privasi */}
      <section className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border-b border-slate-800/80 px-4 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-xs sm:text-sm">
                  Portal Transparansi Operasional — Divisi Produksi I
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700/50">
                  Read-Only
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Memuat data statistik kehadiran, kapasitas unit kerja, dan staf yang sedang bertugas/izin secara real-time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Data Finansial, Gaji &amp; NIK KTP Terlindungi 100%</span>
          </div>
        </div>
      </section>

      {/* 3. Main Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Navigasi Tab Publik */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('harian')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'harian'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Status Kehadiran &amp; Izin Harian</span>
            </button>

            <button
              onClick={() => setActiveTab('rekap')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'rekap'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Rekapitulasi Bulanan</span>
            </button>

            <button
              onClick={() => setActiveTab('kapasitas')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'kapasitas'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Kapasitas Tim Bagian</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 hidden lg:inline-flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            Total 32 Staf Terdaftar di Pabrik PP1
          </span>
        </div>

        {/* TAB 1: KEHADIRAN & STATUS IZIN HARIAN */}
        {activeTab === 'harian' && (
          <div className="space-y-6">
            {/* Filter Toolbar: Date Picker, Quick Buttons, Sekup, & Search */}
            <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Date Picker + Quick Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold text-white">Tanggal:</span>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-transparent text-white font-bold outline-none cursor-pointer"
                    />
                  </div>

                  {/* Tombol Cepat [Hari Ini] dan [Kemarin] */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSetQuickDate(0)}
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Hari Ini
                    </button>
                    <button
                      onClick={() => handleSetQuickDate(1)}
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Kemarin
                    </button>
                  </div>

                  <span className="text-xs text-indigo-300 font-bold ml-1">
                    ({formatTanggalIndo(selectedDate, true)})
                  </span>
                </div>

                {/* Filter Sekup Kerja & Live Search */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Sekup Filter Buttons */}
                  <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700/80 text-xs">
                    {(['Semua', 'Operasional', 'Administrasi'] as const).map((sekup) => (
                      <button
                        key={sekup}
                        onClick={() => setSelectedSekup(sekup)}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                          selectedSekup === sekup
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {sekup}
                      </button>
                    ))}
                  </div>

                  {/* Live Search Box */}
                  <div className="relative min-w-[200px] sm:min-w-[240px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari nama staf atau jabatan..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Daily KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {/* Card 1: Hadir */}
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-emerald-500/30 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Staf Hadir
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {stats.hadir}{' '}
                  <span className="text-xs font-normal text-slate-400">/ {stats.totalFiltered} staf</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold mt-1">
                  Tingkat Kehadiran: {stats.rate}%
                </div>
              </div>

              {/* Card 2: Sakit */}
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-amber-500/30 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Izin Sakit
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {stats.sakit}{' '}
                  <span className="text-xs font-normal text-slate-400">staf</span>
                </div>
                <div className="text-[11px] text-amber-300/80 mt-1">
                  Surat Dokter / Sakit Ringan
                </div>
              </div>

              {/* Card 3: Izin Lainnya */}
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-blue-500/30 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Izin / Kepentingan
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {stats.ijin}{' '}
                  <span className="text-xs font-normal text-slate-400">staf</span>
                </div>
                <div className="text-[11px] text-blue-300/80 mt-1">
                  Izin Keperluan Mendesak
                </div>
              </div>

              {/* Card 4: Cuti Tahunan */}
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-purple-500/30 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Cuti Tahunan
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {stats.cuti}{' '}
                  <span className="text-xs font-normal text-slate-400">staf</span>
                </div>
                <div className="text-[11px] text-purple-300/80 mt-1">
                  Cuti Terjadwal
                </div>
              </div>
            </div>

            {/* Info Staf yang Sedang Izin / Sakit / Cuti Hari Ini */}
            {staffOnLeave.length > 0 && (
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <h3 className="font-bold text-white text-xs sm:text-sm">
                    Daftar Staf yang Sedang Izin / Sakit / Cuti pada {formatTanggalIndo(selectedDate, true)} ({staffOnLeave.length} Staf)
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {staffOnLeave.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-white truncate">{s.nama}</div>
                        <div className="text-[10px] text-slate-400 truncate">{s.jabatan}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {s.keterangan}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabel Daftar Kehadiran Staf Lengkap */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    Daftar Personil &amp; Status Presensi
                  </h3>
                  <p className="text-xs text-slate-400">
                    Menampilkan {dailyAttendanceList.length} dari {staffList.length} personil terdaftar
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Tanggal Aktif: {selectedDate}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Nama Staf</th>
                      <th className="py-3 px-4">Jabatan</th>
                      <th className="py-3 px-4">Bagian / Sekup</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Jam Masuk</th>
                      <th className="py-3 px-4">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {dailyAttendanceList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-500">
                          Tidak ditemukan data staf yang sesuai dengan filter.
                        </td>
                      </tr>
                    ) : (
                      dailyAttendanceList.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-white">{s.nama}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{s.nip}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-300 font-medium">
                            {s.jabatan}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                s.sekup === 'Operasional'
                                  ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                                  : 'bg-blue-950/60 text-blue-300 border border-blue-800/60'
                              }`}
                            >
                              {s.sekup}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {s.status === 'HADIR' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Hadir
                              </span>
                            ) : s.status === 'SAKIT' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700/60">
                                Sakit
                              </span>
                            ) : s.status === 'IJIN' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-700/60">
                                Izin
                              </span>
                            ) : s.status === 'CUTI' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-700/60">
                                Cuti
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                                Belum Tercatat
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-semibold text-slate-300">
                            {s.jamMasuk}
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {s.keterangan}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REKAPITULASI BULANAN */}
        {activeTab === 'rekap' && (
          <div className="space-y-6">
            <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base">
                  Rekapitulasi Presensi Keseluruhan
                </h3>
                <p className="text-xs text-slate-400">
                  Ringkasan tren kehadiran staf berdasarkan arsip log presensi bulanan.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-white">Pilih Bulan:</span>
                <input
                  type="month"
                  value={selectedBulanRekap}
                  onChange={(e) => setSelectedBulanRekap(e.target.value)}
                  className="bg-transparent text-white font-bold outline-none cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2">
                <div className="text-xs font-bold uppercase text-slate-400">Tingkat Disiplin Kehadiran</div>
                <div className="text-3xl font-black text-emerald-400">{monthlyStats.rate}%</div>
                <p className="text-[11px] text-slate-400">
                  Dari total {monthlyStats.totalLogs} log kehadiran tercatat di bulan terpilih.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2">
                <div className="text-xs font-bold uppercase text-slate-400">Log Hadir Efektif</div>
                <div className="text-3xl font-black text-white">{monthlyStats.hadirLogs} Log</div>
                <p className="text-[11px] text-slate-400">
                  Staf masuk tepat waktu dan bertugas di lini masing-masing.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2">
                <div className="text-xs font-bold uppercase text-slate-400">Total Izin, Sakit &amp; Cuti</div>
                <div className="text-3xl font-black text-amber-400">
                  {monthlyStats.sakitLogs + monthlyStats.ijinLogs + monthlyStats.cutiLogs} Hari
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-3">
                  <span>Sakit: {monthlyStats.sakitLogs}</span>
                  <span>Izin: {monthlyStats.ijinLogs}</span>
                  <span>Cuti: {monthlyStats.cutiLogs}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: KAPASITAS TIM BAGIAN */}
        {activeTab === 'kapasitas' && (
          <div className="space-y-6">
            <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-4 sm:p-5">
              <h3 className="font-bold text-white text-sm sm:text-base">
                Distribusi &amp; Alokasi Kapasitas Personil (32 Staf)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pemetaan personil resmi Divisi Produksi I berdasarkan departemen operasional dan administrasi.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unitBreakdown.map((unit) => (
                <div
                  key={unit.dept}
                  className="p-5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{unit.dept}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                      {unit.total} Staf
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Operasional Lapangan / Mesin:</span>
                      <strong className="text-slate-200">{unit.operasional} orang</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Administrasi / Pengendali:</span>
                      <strong className="text-slate-200">{unit.administrasi} orang</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 4. Footer Publik & Informasi Kebijakan Privasi */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950/80 py-6 px-4 sm:px-6 text-center text-xs text-slate-500 space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Keamanan Data Terverifikasi
          </span>
          <span>•</span>
          <span>Sistem Manajemen HR Staff — Divisi Produksi I</span>
          <span>•</span>
          <span>PT Batu Karang</span>
        </div>
        <p className="text-[10px] text-slate-600 max-w-xl mx-auto">
          Halaman ini disediakan untuk akses informasi resmi publik dan tautan Linktree. Seluruh data sensitif finansial,
          nominal gaji, serta identitas kependudukan dilindungi dan tidak dipublikasikan.
        </p>
      </footer>
    </div>
  );
};
