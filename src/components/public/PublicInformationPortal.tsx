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
  BarChart3,
  Eye,
  EyeOff,
  ArrowUpDown,
  Award,
  Medal,
  QrCode,
} from 'lucide-react';
import { StaffData, PresensiRecord, AppBrandingSettings } from '../../types';
import { formatTanggalIndo, normalizeIsoDate } from '../../utils/dateFormatter';
import { normalizePresensiRecord } from '../../utils/workHoursUtils';
import { NAMA_BULAN_INDO } from '../../services/payrollEngine';
import { appAlert } from '../../services/dialogService';

const MENIT_PER_BULAN_STANDAR = 10440; // 26 hari kerja baku (22 x 420m + 4 x 300m)

interface PublicInformationPortalProps {
  staffList: StaffData[];
  presensiList: PresensiRecord[];
  branding: AppBrandingSettings;
  onOpenLogin: () => void;
  onOpenQrLogin?: () => void;
}

export const PublicInformationPortal: React.FC<PublicInformationPortalProps> = ({
  staffList = [],
  presensiList = [],
  branding,
  onOpenLogin,
  onOpenQrLogin,
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
  const [activeTab, setActiveTab] = useState<'harian' | 'rekap' | 'kapasitas' | 'terendah'>('harian');

  // 3. Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSekup, setSelectedSekup] = useState<'Semua' | 'Operasional' | 'Administrasi'>('Semua');
  const [subFilterTidakHadir, setSubFilterTidakHadir] = useState<'Semua' | 'Sakit' | 'Izin' | 'Cuti'>('Semua');
  const [selectedBulanRekap, setSelectedBulanRekap] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  // State untuk Grafik Balok Rekapitulasi Presensi (Default: Tidak Ditampilkan)
  const [showMonthlyChart, setShowMonthlyChart] = useState<boolean>(false);
  const [showYearlyChart, setShowYearlyChart] = useState<boolean>(false);
  const [sortOrderMonthly, setSortOrderMonthly] = useState<'asc' | 'desc'>('asc'); // asc = kehadiran terendah di atas untuk evaluasi pembinaan
  const [sortOrderYearly, setSortOrderYearly] = useState<'asc' | 'desc'>('asc');
  const [filterTerendahPeriod, setFilterTerendahPeriod] = useState<'bulan' | 'tahun'>('bulan');

  // Check if selected date is Sunday
  const isSunday = useMemo(() => {
    const d = new Date(selectedDate);
    return !isNaN(d.getTime()) && d.getDay() === 0;
  }, [selectedDate]);

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

  // Normalisasi data presensi secara komprehensif (SOP jam kerja baku, istirahat, & potongan resmi)
  const normalizedPresensiList = useMemo(() => {
    return presensiList.map(normalizePresensiRecord);
  }, [presensiList]);

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
    return normalizedPresensiList.filter((p) => normalizeIsoDate(p.tanggal) === dateNorm);
  }, [normalizedPresensiList, dateNorm]);

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

        // Sesuai sistem HR Divisi Produksi I (exception-based):
        // Jika tidak ada catatan ijin/sakit/cuti pada tanggal tersebut, otomatis dianggap HADIR!
        let status: 'HADIR' | 'SAKIT' | 'IJIN' | 'CUTI' | 'LIBUR_OFF' = 'HADIR';
        let jamMasuk = '08:00';
        let jamPulang = '16:00';
        let keterangan = 'Hadir';
        let jamRentang = '-';

        if (isSunday) {
          status = 'LIBUR_OFF';
          keterangan = 'Libur Operasional Mingguan';
          jamRentang = 'Off';
        } else if (rec) {
          jamMasuk = rec.jamAwal || '-';
          jamPulang = rec.jamAkhir || '-';
          if (rec.jamAwal && rec.jamAkhir && rec.jamAwal !== '-' && rec.jamAkhir !== '-') {
            jamRentang = `${rec.jamAwal} – ${rec.jamAkhir}`;
          } else if (rec.jamAwal && rec.jamAwal !== '-') {
            jamRentang = rec.jamAwal;
          }
          const ji = (rec.jenisIjin || '').toLowerCase();

          if (ji.includes('sakit')) {
            status = 'SAKIT';
            keterangan = rec.jenisIjin || 'Sakit';
          } else if (ji.includes('cuti')) {
            status = 'CUTI';
            keterangan = rec.jenisIjin || 'Cuti Tahunan';
          } else if (ji.includes('off') || ji.includes('libur')) {
            status = 'LIBUR_OFF';
            keterangan = 'Libur / Off';
          } else if (
            ji.includes('ijin') ||
            ji.includes('izin') ||
            ji.includes('terlambat') ||
            ji.includes('pulang awal') ||
            ji.includes('keluar') ||
            ji.includes('alpha') ||
            ji.includes('mangkir')
          ) {
            status = 'IJIN';
            keterangan = rec.keperluan ? `${rec.jenisIjin} — ${rec.keperluan}` : (rec.jenisIjin || 'Izin');
          } else if (rec.jamAwal && rec.jamAwal !== '-') {
            status = 'HADIR';
            keterangan = rec.catatan || rec.keperluan || 'Hadir Normal';
          } else {
            status = 'HADIR';
            keterangan = 'Hadir';
          }
        } else {
          // Tidak ada catatan ketidakhadiran -> Otomatis dianggap Hadir!
          status = 'HADIR';
          keterangan = 'Hadir';
          jamRentang = '-';
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
          jamRentang,
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
  }, [filteredStaff, recordsOnDate, searchQuery, isSunday]);

  // Quick Stats Counter
  const stats = useMemo(() => {
    let hadir = 0;
    let sakit = 0;
    let ijin = 0;
    let cuti = 0;

    dailyAttendanceList.forEach((s) => {
      if (s.status === 'HADIR') hadir++;
      else if (s.status === 'SAKIT') sakit++;
      else if (s.status === 'IJIN') ijin++;
      else if (s.status === 'CUTI') cuti++;
    });

    const totalFiltered = dailyAttendanceList.length;
    // Pada hari kerja, tingkat kehadiran = (staf hadir / total staf) * 100%
    const rate = isSunday
      ? 100
      : totalFiltered > 0
      ? Math.round((hadir / totalFiltered) * 100)
      : 100;

    return { hadir, sakit, ijin, cuti, totalFiltered, rate };
  }, [dailyAttendanceList, isSunday]);

  // Staf yang tidak hadir pada hari terpilih (HANYA staf yang memiliki catatan Sakit, Izin, Cuti)
  const staffTidakHadir = useMemo(() => {
    if (isSunday) return [];
    return dailyAttendanceList.filter((s) => s.status !== 'HADIR' && s.status !== 'LIBUR_OFF');
  }, [dailyAttendanceList, isSunday]);

  // Subfilter staf tidak hadir
  const filteredTidakHadir = useMemo(() => {
    return staffTidakHadir.filter((s) => {
      if (subFilterTidakHadir === 'Semua') return true;
      if (subFilterTidakHadir === 'Sakit') return s.status === 'SAKIT';
      if (subFilterTidakHadir === 'Izin') return s.status === 'IJIN';
      if (subFilterTidakHadir === 'Cuti') return s.status === 'CUTI';
      return true;
    });
  }, [staffTidakHadir, subFilterTidakHadir]);

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

  // Parsing bulan & tahun terpilih pada Tab Rekapitulasi Presensi
  const { rekapTahun, rekapBulan, namaBulanRekap } = useMemo(() => {
    const [yearStr, monthStr] = (selectedBulanRekap || '').split('-');
    const now = new Date();
    const y = parseInt(yearStr, 10) || now.getFullYear();
    const m = parseInt(monthStr, 10) || (now.getMonth() + 1);
    const namaBulan = NAMA_BULAN_INDO[m - 1] || 'Bulan Berjalan';
    return { rekapTahun: y, rekapBulan: m, namaBulanRekap: namaBulan };
  }, [selectedBulanRekap]);

  // Format Helper Persentase Format Indonesia (koma): misal "97,5%"
  const formatPctIndo = (num: number): string => {
    return num.toFixed(1).replace('.', ',') + '%';
  };

  // 1. Rekapitulasi Presensi Bulan Berjalan (Semua Staf)
  const staffMonthlyRanking = useMemo(() => {
    const stdMinutes = MENIT_PER_BULAN_STANDAR; // 10,440 menit

    const list = staffList.map((st) => {
      const records = normalizedPresensiList.filter((p) => {
        const matchesStaff =
          (p.nip && p.nip === st.nip) ||
          (p.nama && p.nama.trim().toLowerCase() === st.nama.trim().toLowerCase());
        if (!matchesStaff) return false;

        const d = normalizeIsoDate(p.tanggal);
        if (d) {
          const parts = d.split('-');
          return parseInt(parts[0], 10) === rekapTahun && parseInt(parts[1], 10) === rekapBulan;
        }
        return p.tahun === rekapTahun && p.bulan === rekapBulan;
      });

      const totalIjinMenit = records.reduce((acc, p) => acc + (p.durasiMenit || 0), 0);
      const countIjin = records.length;
      const totalIjinJam = Math.round((totalIjinMenit / 60) * 10) / 10;
      const pctKehadiran = Math.max(
        0,
        Math.min(100, ((stdMinutes - totalIjinMenit) / stdMinutes) * 100)
      );

      const sakitCount = records.filter((r) => (r.jenisIjin || '').toLowerCase().includes('sakit')).length;
      const cutiCount = records.filter((r) => (r.jenisIjin || '').toLowerCase().includes('cuti')).length;
      const ijinCount = records.filter(
        (r) =>
          !((r.jenisIjin || '').toLowerCase().includes('sakit')) &&
          !((r.jenisIjin || '').toLowerCase().includes('cuti'))
      ).length;

      return {
        id: st.id,
        nip: st.nip,
        nama: st.nama,
        jabatan: st.jabatan,
        sekup: st.sekup,
        totalIjinMenit,
        totalIjinJam,
        countIjin,
        pctKehadiran,
        sakitCount,
        cutiCount,
        ijinCount,
        records,
      };
    });

    return [...list].sort((a, b) => {
      if (sortOrderMonthly === 'asc') {
        return a.pctKehadiran - b.pctKehadiran; // Terendah di atas (sesuai evaluasi pembinaan)
      }
      return b.pctKehadiran - a.pctKehadiran; // Tertinggi di atas
    });
  }, [staffList, normalizedPresensiList, rekapTahun, rekapBulan, sortOrderMonthly]);

  // 2. Rekapitulasi Presensi Tahun Berjalan (Januari s/d Bulan Berjalan)
  const staffYearlyRanking = useMemo(() => {
    const jumlahBulan = Math.max(1, Math.min(12, rekapBulan));
    const stdMinutesYearly = MENIT_PER_BULAN_STANDAR * jumlahBulan;

    const list = staffList.map((st) => {
      const records = normalizedPresensiList.filter((p) => {
        const matchesStaff =
          (p.nip && p.nip === st.nip) ||
          (p.nama && p.nama.trim().toLowerCase() === st.nama.trim().toLowerCase());
        if (!matchesStaff) return false;

        const d = normalizeIsoDate(p.tanggal);
        let bln = p.bulan;
        let thn = p.tahun;
        if (d) {
          const parts = d.split('-');
          thn = parseInt(parts[0], 10);
          bln = parseInt(parts[1], 10);
        }
        return thn === rekapTahun && bln >= 1 && bln <= rekapBulan;
      });

      const totalIjinMenit = records.reduce((acc, p) => acc + (p.durasiMenit || 0), 0);
      const countIjin = records.length;
      const totalIjinJam = Math.round((totalIjinMenit / 60) * 10) / 10;
      const pctKehadiran = Math.max(
        0,
        Math.min(100, ((stdMinutesYearly - totalIjinMenit) / stdMinutesYearly) * 100)
      );

      const sakitCount = records.filter((r) => (r.jenisIjin || '').toLowerCase().includes('sakit')).length;
      const cutiCount = records.filter((r) => (r.jenisIjin || '').toLowerCase().includes('cuti')).length;
      const ijinCount = records.filter(
        (r) =>
          !((r.jenisIjin || '').toLowerCase().includes('sakit')) &&
          !((r.jenisIjin || '').toLowerCase().includes('cuti'))
      ).length;

      return {
        id: st.id,
        nip: st.nip,
        nama: st.nama,
        jabatan: st.jabatan,
        sekup: st.sekup,
        totalIjinMenit,
        totalIjinJam,
        countIjin,
        pctKehadiran,
        sakitCount,
        cutiCount,
        ijinCount,
        records,
      };
    });

    return [...list].sort((a, b) => {
      if (sortOrderYearly === 'asc') {
        return a.pctKehadiran - b.pctKehadiran; // Terendah di atas
      }
      return b.pctKehadiran - a.pctKehadiran; // Tertinggi di atas
    });
  }, [staffList, normalizedPresensiList, rekapTahun, rekapBulan, sortOrderYearly]);

  // 3. Ringkasan Metrik 3 Kartu KPI Tab Rekapitulasi Presensi
  const monthlyStats = useMemo(() => {
    const monthRecords = normalizedPresensiList.filter((p) => {
      const d = normalizeIsoDate(p.tanggal);
      if (!d) return p.tahun === rekapTahun && p.bulan === rekapBulan;
      const parts = d.split('-');
      return parseInt(parts[0], 10) === rekapTahun && parseInt(parts[1], 10) === rekapBulan;
    });

    const totalLogs = monthRecords.length;
    const sakitLogs = monthRecords.filter((p) => (p.jenisIjin || '').toLowerCase().includes('sakit')).length;
    const ijinLogs = monthRecords.filter((p) => {
      const ji = (p.jenisIjin || '').toLowerCase();
      return (
        (ji.includes('ijin') || ji.includes('izin') || ji.includes('terlambat') || ji.includes('pulang')) &&
        !ji.includes('sakit')
      );
    }).length;
    const cutiLogs = monthRecords.filter((p) => (p.jenisIjin || '').toLowerCase().includes('cuti')).length;

    // Tingkat Disiplin Kehadiran Efektif Divisi
    const totalStaff = staffList.length || 32;
    const totalStdMenit = totalStaff * MENIT_PER_BULAN_STANDAR;
    const totalIjinMenit = monthRecords.reduce((acc, p) => acc + (p.durasiMenit || 0), 0);
    const divisionRate = Math.max(0, Math.min(100, ((totalStdMenit - totalIjinMenit) / totalStdMenit) * 100));

    // Staf berdisiplin 100% sempurna tanpa izin
    const perfectStaffCount = staffMonthlyRanking.filter((s) => s.pctKehadiran >= 99.8).length;

    return {
      totalLogs,
      sakitLogs,
      ijinLogs,
      cutiLogs,
      rate: divisionRate.toFixed(1).replace('.', ','),
      rateNum: divisionRate,
      perfectStaffCount,
      totalStaff,
      y: rekapTahun,
      m: rekapBulan,
    };
  }, [normalizedPresensiList, rekapTahun, rekapBulan, staffList, staffMonthlyRanking]);

  // 4. Staf 10 Kehadiran Terendah (Evaluasi Prioritas Pembinaan)
  const bottom10Staff = useMemo(() => {
    const source = filterTerendahPeriod === 'bulan' ? staffMonthlyRanking : staffYearlyRanking;
    return [...source]
      .sort((a, b) => a.pctKehadiran - b.pctKehadiran)
      .slice(0, 10);
  }, [staffMonthlyRanking, staffYearlyRanking, filterTerendahPeriod]);

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

            {onOpenQrLogin && (
              <button
                type="button"
                onClick={onOpenQrLogin}
                title="Tampilkan QR Code Presisi Tinggi untuk scan login staf"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <QrCode className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">QR Login</span>
              </button>
            )}

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
              <span>Rekapitulasi Presensi</span>
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

            <button
              onClick={() => setActiveTab('terendah')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'terendah'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>10 Kehadiran Terendah</span>
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

            {/* Tabel Staf Yang Tidak Hadir (Menggantikan Daftar Personil & Status Presensi) */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-white">
                      Staf Yang Tidak Hadir
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {staffTidakHadir.length} Staf
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Menampilkan staf yang berhalangan hadir (Sakit, Izin, Cuti) pada {formatTanggalIndo(selectedDate, true)}
                  </p>
                </div>

                {/* Subfilter Kategori Ketidakhadiran */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 text-xs">
                  {[
                    { id: 'Semua', label: `Semua (${staffTidakHadir.length})` },
                    { id: 'Sakit', label: `Sakit (${stats.sakit})` },
                    { id: 'Izin', label: `Izin (${stats.ijin})` },
                    { id: 'Cuti', label: `Cuti (${stats.cuti})` },
                  ].map((flt) => (
                    <button
                      key={flt.id}
                      onClick={() => setSubFilterTidakHadir(flt.id as any)}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-[11px] ${
                        subFilterTidakHadir === flt.id
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {flt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Nama Staf</th>
                      <th className="py-3 px-4">Jabatan</th>
                      <th className="py-3 px-4">Bagian / Sekup</th>
                      <th className="py-3 px-4 text-center">Status Ketidakhadiran</th>
                      <th className="py-3 px-4 text-center">Jam / Durasi Ijin</th>
                      <th className="py-3 px-4">Keterangan / Alasan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredTidakHadir.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 px-4">
                          {isSunday ? (
                            <div className="flex flex-col items-center justify-center space-y-1.5 text-slate-400">
                              <Calendar className="w-7 h-7 text-indigo-400 mb-1" />
                              <span className="font-bold text-white text-sm">
                                Hari Minggu — Hari Libur Operasional Pabrik PP1
                              </span>
                              <span className="text-xs text-slate-400">
                                Seluruh staf diliburkan sesuai jadwal baku jam kerja resmi PT Batu Karang.
                              </span>
                            </div>
                          ) : staffTidakHadir.length === 0 ? (
                            <div className="flex flex-col items-center justify-center space-y-1.5 text-emerald-400">
                              <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-1" />
                              <span className="font-bold text-white text-sm">
                                Seluruh Staf Hadir Lengkap
                              </span>
                              <span className="text-xs text-slate-400">
                                Tidak ada staf yang tercatat izin, sakit, cuti, atau berhalangan hadir pada tanggal ini.
                              </span>
                            </div>
                          ) : (
                            <div className="text-slate-400 text-xs">
                              Tidak ada data staf untuk filter ketidakhadiran "{subFilterTidakHadir}".
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredTidakHadir.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white">{s.nama}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{s.nip}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-300 font-medium">
                            {s.jabatan}
                          </td>
                          <td className="py-3.5 px-4">
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
                          <td className="py-3.5 px-4 text-center">
                            {s.status === 'SAKIT' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700/60">
                                <AlertTriangle className="w-3 h-3 text-amber-400" />
                                Sakit
                              </span>
                            ) : s.status === 'IJIN' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-700/60">
                                <Clock className="w-3 h-3 text-blue-400" />
                                Izin
                              </span>
                            ) : s.status === 'CUTI' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-700/60">
                                <Calendar className="w-3 h-3 text-purple-400" />
                                Cuti
                              </span>
                            ) : s.status === 'LIBUR_OFF' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                Libur / Off
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60">
                                Tidak Hadir
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-300">
                            {s.jamRentang || s.jamMasuk}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300 text-xs">
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

        {/* TAB 2: REKAPITULASI PRESENSI */}
        {activeTab === 'rekap' && (
          <div className="space-y-6">
            {/* Header Pemilih Bulan & Keterangan */}
            <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                  <span>Rekapitulasi Presensi Keseluruhan</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700/50">
                    {namaBulanRekap} {rekapTahun}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Ringkasan tren kehadiran staf berdasarkan arsip log presensi resmi PT Batu Karang.
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

            {/* 3 KARTU KPI RESMI YANG DIPERTAHANKAN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Kartu 1: Tingkat Disiplin Kehadiran */}
              <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2">
                <div className="text-xs font-bold uppercase text-slate-400 flex items-center justify-between">
                  <span>Tingkat Disiplin Kehadiran</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-black text-emerald-400 font-mono">
                  {monthlyStats.rate}%
                </div>
                <p className="text-[11px] text-slate-400">
                  Rata-rata jam kerja efektif {monthlyStats.totalStaff} staf di bulan {namaBulanRekap}.
                </p>
              </div>

              {/* Kartu 2: Log Hadir Efektif / Staf Sempurna */}
              <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2">
                <div className="text-xs font-bold uppercase text-slate-400 flex items-center justify-between">
                  <span>Staf Hadir 100% Sempurna</span>
                  <Medal className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-black text-white font-mono">
                  {monthlyStats.perfectStaffCount}{' '}
                  <span className="text-sm font-sans text-slate-400">/ {monthlyStats.totalStaff} Staf</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Staf masuk penuh waktu tanpa catatan izin di bulan {namaBulanRekap}.
                </p>
              </div>

              {/* Kartu 3: Total Izin, Sakit & Cuti */}
              <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2">
                <div className="text-xs font-bold uppercase text-slate-400 flex items-center justify-between">
                  <span>Total Izin, Sakit &amp; Cuti</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-black text-amber-400 font-mono">
                  {monthlyStats.sakitLogs + monthlyStats.ijinLogs + monthlyStats.cutiLogs} Kejadian
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-3">
                  <span>Sakit: {monthlyStats.sakitLogs}</span>
                  <span>Izin: {monthlyStats.ijinLogs}</span>
                  <span>Cuti: {monthlyStats.cutiLogs}</span>
                </div>
              </div>
            </div>

            {/* ========================================================== */}
            {/* GRAFIK BALOK 1: REKAPITULASI BULAN BERJALAN (SEMUA STAF)   */}
            {/* ========================================================== */}
            <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 print:border-none print:shadow-none print:p-0 print:space-y-3 print:break-before-page">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Grafik Balok Rekapitulasi Bulan Berjalan</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                        {namaBulanRekap} {rekapTahun}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Visualisasi persentase kehadiran seluruh {staffMonthlyRanking.length} staf pada bulan {namaBulanRekap}
                    </p>
                  </div>
                </div>

                {/* Kontrol Toggle & Sort (No-Print) */}
                <div className="flex items-center gap-2 no-print print:hidden">
                  {showMonthlyChart && (
                    <button
                      onClick={() => setSortOrderMonthly(sortOrderMonthly === 'asc' ? 'desc' : 'asc')}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-slate-700"
                      title="Ubah Urutan"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <span>{sortOrderMonthly === 'asc' ? 'Terendah di Atas (Evaluasi)' : 'Tertinggi di Atas'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowMonthlyChart(!showMonthlyChart)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      showMonthlyChart
                        ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {showMonthlyChart ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showMonthlyChart ? 'Sembunyikan Grafik' : 'Tampilkan Grafik'}</span>
                  </button>
                </div>
              </div>

              {/* Tampilan Ketika Ditutup (Default) */}
              {!showMonthlyChart && (
                <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center space-y-2 no-print">
                  <BarChart3 className="w-8 h-8 text-blue-400 mx-auto opacity-70" />
                  <p className="text-xs text-slate-200 font-semibold">
                    Grafik Balok Bulan Berjalan Ditutup (Bawaan: Tidak Ditampilkan)
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                    Klik tombol <strong>"Tampilkan Grafik"</strong> di atas untuk membuka visualisasi balok kehadiran {staffMonthlyRanking.length} staf untuk bulan {namaBulanRekap} {rekapTahun}.
                  </p>
                </div>
              )}

              {/* Tampilan Balok Kehadiran (Ketika Dibuka atau Dicetak) */}
              {(showMonthlyChart || false) && (
                <div className="space-y-3">
                  {/* Legend Indikator */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold pt-1 border-b border-slate-800/80 pb-2">
                    <span className="flex items-center gap-1.5 text-rose-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                      &lt; 95.0% (Perlu Pembinaan)
                    </span>
                    <span className="flex items-center gap-1.5 text-blue-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                      95.0% - 97.9% (Memenuhi Baku)
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                      &ge; 98.0% (Sangat Baik / Sempurna)
                    </span>
                    <span className="ml-auto text-slate-400 text-[11px] font-mono print:text-black">
                      Total {staffMonthlyRanking.length} Staf Terdata
                    </span>
                  </div>

                  {/* List Balok Seluruh Karyawan (Tanpa Slider / Tampil Utuh) */}
                  <div className="space-y-2 print:space-y-1.5">
                    {staffMonthlyRanking.map((st, idx) => {
                      let barGradient = 'from-emerald-500 to-teal-500';
                      let badgeColor = 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60';
                      let statusText = 'Sangat Baik';

                      if (st.pctKehadiran >= 99.8) {
                        statusText = 'Sempurna 100%';
                        badgeColor = 'bg-emerald-950 text-emerald-200 border border-emerald-600';
                      } else if (st.pctKehadiran >= 98.0) {
                        statusText = 'Sangat Baik';
                      } else if (st.pctKehadiran >= 95.0) {
                        barGradient = 'from-blue-500 to-indigo-500';
                        badgeColor = 'bg-blue-950/80 text-blue-300 border border-blue-700/60';
                        statusText = 'Memenuhi Baku';
                      } else {
                        barGradient = 'from-rose-500 to-red-600';
                        badgeColor = 'bg-rose-950/80 text-rose-300 border border-rose-700/60';
                        statusText = 'Perlu Pembinaan';
                      }

                      const minDisplayPct = 85.0;
                      const scaledBarWidth = Math.max(
                        8,
                        Math.min(100, ((st.pctKehadiran - minDisplayPct) / (100 - minDisplayPct)) * 100)
                      );

                      return (
                        <div
                          key={st.nip}
                          className="p-2 sm:p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 transition-all flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs break-inside-avoid print:break-inside-avoid print:bg-white print:border-slate-300 print:text-black print:flex-row print:items-center"
                        >
                          {/* Rank & Identitas Staf */}
                          <div className="flex items-center gap-2.5 w-full sm:w-60 shrink-0 min-w-0 print:w-52">
                            <span
                              className={`w-6 h-6 rounded-lg font-black text-[11px] flex items-center justify-center shrink-0 print:print-color-adjust-exact ${
                                st.pctKehadiran < 95
                                  ? 'bg-rose-500 text-white font-black'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              #{idx + 1}
                            </span>
                            <div className="truncate min-w-0">
                              <div className="font-bold text-white truncate print:text-black">
                                {st.nama}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono truncate print:text-slate-600">
                                {st.nip} • {st.jabatan}
                              </div>
                            </div>
                          </div>

                          {/* Horizontal Bar (Balok Menyamping) */}
                          <div className="flex-1 min-w-0 flex items-center gap-3">
                            <div className="flex-1 bg-slate-800/80 rounded-full h-3.5 overflow-hidden relative p-0.5 print:h-3 print:bg-slate-100 print:border print:border-slate-300">
                              <div
                                style={{ width: `${scaledBarWidth}%` }}
                                className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-500 relative print:print-color-adjust-exact`}
                              ></div>
                            </div>
                          </div>

                          {/* Nilai Persentase, Jam Izin & Status Badge */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 w-full sm:w-52 text-right print:w-44 print:justify-end">
                            <div className="text-left sm:text-right print:text-right">
                              <span className="font-mono font-black text-sm text-white print:text-black">
                                {formatPctIndo(st.pctKehadiran)}
                              </span>
                              <span className="block text-[10px] text-slate-400 font-mono print:text-slate-600">
                                {st.totalIjinMenit > 0
                                  ? `Izin: ${st.totalIjinJam}j (${st.totalIjinMenit}m)`
                                  : 'Izin: 0m'}
                              </span>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 ${badgeColor} print:print-color-adjust-exact`}
                            >
                              {statusText}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ========================================================== */}
            {/* GRAFIK BALOK 2: REKAPITULASI TAHUN BERJALAN (JANUARI - NOW) */}
            {/* ========================================================== */}
            <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 print:border-none print:shadow-none print:p-0 print:space-y-3 print:break-before-page">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Grafik Balok Rekapitulasi Tahun Berjalan</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                        Januari – {namaBulanRekap} {rekapTahun}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Visualisasi akumulasi tingkat kehadiran kumulatif {rekapBulan} bulan berjalan ({staffYearlyRanking.length} Staf)
                    </p>
                  </div>
                </div>

                {/* Kontrol Toggle & Sort (No-Print) */}
                <div className="flex items-center gap-2 no-print print:hidden">
                  {showYearlyChart && (
                    <button
                      onClick={() => setSortOrderYearly(sortOrderYearly === 'asc' ? 'desc' : 'asc')}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-slate-700"
                      title="Ubah Urutan"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <span>{sortOrderYearly === 'asc' ? 'Terendah di Atas (Evaluasi)' : 'Tertinggi di Atas'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowYearlyChart(!showYearlyChart)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      showYearlyChart
                        ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {showYearlyChart ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showYearlyChart ? 'Sembunyikan Grafik' : 'Tampilkan Grafik'}</span>
                  </button>
                </div>
              </div>

              {/* Tampilan Ketika Ditutup (Default) */}
              {!showYearlyChart && (
                <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center space-y-2 no-print">
                  <TrendingUp className="w-8 h-8 text-indigo-400 mx-auto opacity-70" />
                  <p className="text-xs text-slate-200 font-semibold">
                    Grafik Balok Tahun Berjalan Ditutup (Bawaan: Tidak Ditampilkan)
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                    Klik tombol <strong>"Tampilkan Grafik"</strong> di atas untuk membuka akumulasi kehadiran 32 staf dari Januari s/d {namaBulanRekap} {rekapTahun}.
                  </p>
                </div>
              )}

              {/* Tampilan Balok Kehadiran Tahunan (Ketika Dibuka atau Dicetak) */}
              {(showYearlyChart || false) && (
                <div className="space-y-3">
                  {/* Legend Indikator */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold pt-1 border-b border-slate-800/80 pb-2">
                    <span className="flex items-center gap-1.5 text-rose-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                      &lt; 95.0% (Perlu Pembinaan)
                    </span>
                    <span className="flex items-center gap-1.5 text-blue-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                      95.0% - 97.9% (Memenuhi Baku)
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                      &ge; 98.0% (Sangat Baik / Sempurna)
                    </span>
                    <span className="ml-auto text-slate-400 text-[11px] font-mono print:text-black">
                      Akumulasi {rekapBulan} Bulan ({staffYearlyRanking.length} Staf)
                    </span>
                  </div>

                  {/* List Balok Seluruh Karyawan (Tanpa Slider / Tampil Utuh) */}
                  <div className="space-y-2 print:space-y-1.5">
                    {staffYearlyRanking.map((st, idx) => {
                      let barGradient = 'from-emerald-500 to-teal-500';
                      let badgeColor = 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60';
                      let statusText = 'Sangat Baik';

                      if (st.pctKehadiran >= 99.8) {
                        statusText = 'Sempurna 100%';
                        badgeColor = 'bg-emerald-950 text-emerald-200 border border-emerald-600';
                      } else if (st.pctKehadiran >= 98.0) {
                        statusText = 'Sangat Baik';
                      } else if (st.pctKehadiran >= 95.0) {
                        barGradient = 'from-blue-500 to-indigo-500';
                        badgeColor = 'bg-blue-950/80 text-blue-300 border border-blue-700/60';
                        statusText = 'Memenuhi Baku';
                      } else {
                        barGradient = 'from-rose-500 to-red-600';
                        badgeColor = 'bg-rose-950/80 text-rose-300 border border-rose-700/60';
                        statusText = 'Perlu Pembinaan';
                      }

                      const minDisplayPct = 85.0;
                      const scaledBarWidth = Math.max(
                        8,
                        Math.min(100, ((st.pctKehadiran - minDisplayPct) / (100 - minDisplayPct)) * 100)
                      );

                      return (
                        <div
                          key={st.nip}
                          className="p-2 sm:p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 transition-all flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs break-inside-avoid print:break-inside-avoid print:bg-white print:border-slate-300 print:text-black print:flex-row print:items-center"
                        >
                          {/* Rank & Identitas Staf */}
                          <div className="flex items-center gap-2.5 w-full sm:w-60 shrink-0 min-w-0 print:w-52">
                            <span
                              className={`w-6 h-6 rounded-lg font-black text-[11px] flex items-center justify-center shrink-0 print:print-color-adjust-exact ${
                                st.pctKehadiran < 95
                                  ? 'bg-rose-500 text-white font-black'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              #{idx + 1}
                            </span>
                            <div className="truncate min-w-0">
                              <div className="font-bold text-white truncate print:text-black">
                                {st.nama}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono truncate print:text-slate-600">
                                {st.nip} • {st.jabatan}
                              </div>
                            </div>
                          </div>

                          {/* Horizontal Bar (Balok Menyamping) */}
                          <div className="flex-1 min-w-0 flex items-center gap-3">
                            <div className="flex-1 bg-slate-800/80 rounded-full h-3.5 overflow-hidden relative p-0.5 print:h-3 print:bg-slate-100 print:border print:border-slate-300">
                              <div
                                style={{ width: `${scaledBarWidth}%` }}
                                className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-500 relative print:print-color-adjust-exact`}
                              ></div>
                            </div>
                          </div>

                          {/* Nilai Persentase, Jam Izin & Status Badge */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 w-full sm:w-52 text-right print:w-44 print:justify-end">
                            <div className="text-left sm:text-right print:text-right">
                              <span className="font-mono font-black text-sm text-white print:text-black">
                                {formatPctIndo(st.pctKehadiran)}
                              </span>
                              <span className="block text-[10px] text-slate-400 font-mono print:text-slate-600">
                                {st.totalIjinMenit > 0
                                  ? `Izin: ${st.totalIjinJam}j (${st.totalIjinMenit}m)`
                                  : 'Izin: 0m'}
                              </span>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 ${badgeColor} print:print-color-adjust-exact`}
                            >
                              {statusText}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: 10 KEHADIRAN TERENDAH (EVALUASI PEMBINAAN DISIPLIN) */}
        {activeTab === 'terendah' && (
          <div className="space-y-6">
            <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>10 Kehadiran Terendah — Evaluasi Disiplin Staf</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pemeringkatan 10 staf dengan tingkat kehadiran terendah untuk prioritas bimbingan dan tindak lanjut manajemen.
                </p>
              </div>

              {/* Toggle Periode: Bulan vs Tahun */}
              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs">
                <button
                  onClick={() => setFilterTerendahPeriod('bulan')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    filterTerendahPeriod === 'bulan'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bulan {namaBulanRekap}
                </button>
                <button
                  onClick={() => setFilterTerendahPeriod('tahun')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    filterTerendahPeriod === 'tahun'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Januari – {namaBulanRekap}
                </button>
              </div>
            </div>

            {/* Daftar 10 Staf Terendah */}
            <div className="space-y-3">
              {bottom10Staff.length === 0 ? (
                <div className="p-10 rounded-2xl bg-slate-800/40 border border-slate-800 text-center text-slate-400 text-xs">
                  Tidak ada data staf untuk dievaluasi pada periode ini.
                </div>
              ) : (
                bottom10Staff.map((st, idx) => {
                  const isUnderStandard = st.pctKehadiran < 95.0;
                  const isWarning = st.pctKehadiran >= 95.0 && st.pctKehadiran < 98.0;

                  return (
                    <div
                      key={st.nip}
                      className="p-4 rounded-2xl bg-slate-800/50 hover:bg-slate-800/80 border border-slate-800 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Identitas & Nomor Peringkat */}
                      <div className="flex items-center gap-3 min-w-0 md:w-72">
                        <span
                          className={`w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center shrink-0 shadow-xs ${
                            idx === 0
                              ? 'bg-rose-600 text-white ring-2 ring-rose-400'
                              : idx < 3
                              ? 'bg-rose-700/80 text-rose-100'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          #{idx + 1}
                        </span>

                        <div className="min-w-0 truncate">
                          <div className="font-bold text-white text-sm truncate flex items-center gap-2">
                            <span>{st.nama}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-700">
                              {st.sekup}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 font-mono truncate">
                            {st.nip} • {st.jabatan}
                          </div>
                        </div>
                      </div>

                      {/* Bar Kehadiran & Detail Jam Izin */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium">Tingkat Kehadiran Efektif</span>
                          <span
                            className={`font-mono font-black ${
                              isUnderStandard
                                ? 'text-rose-400'
                                : isWarning
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {formatPctIndo(st.pctKehadiran)}
                          </span>
                        </div>

                        <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden p-0.5">
                          <div
                            style={{ width: `${Math.max(5, st.pctKehadiran)}%` }}
                            className={`h-full rounded-full ${
                              isUnderStandard
                                ? 'bg-gradient-to-r from-red-600 to-rose-500'
                                : isWarning
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                            }`}
                          ></div>
                        </div>

                        {/* Rincian Izin Sakit Cuti */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                          <span>
                            Total Izin: <strong className="text-white">{st.totalIjinJam} jam</strong> ({st.totalIjinMenit} m)
                          </span>
                          <span>•</span>
                          <span>Sakit: {st.sakitCount}x</span>
                          <span>•</span>
                          <span>Izin/Terlambat: {st.ijinCount}x</span>
                          <span>•</span>
                          <span>Cuti: {st.cutiCount}x</span>
                        </div>
                      </div>

                      {/* Status Pembinaan Badge */}
                      <div className="shrink-0 self-start md:self-center">
                        <span
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 ${
                            isUnderStandard
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : isWarning
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          {isUnderStandard ? (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Prioritas Pembinaan
                            </>
                          ) : isWarning ? (
                            <>
                              <Clock className="w-3.5 h-3.5" />
                              Pemantauan Berkala
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Kedisiplinan Baik
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: KAPASITAS TIM BAGIAN */}
        {activeTab === 'kapasitas' && (
          <div className="space-y-6">
            <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-4 sm:p-5">
              <h3 className="font-bold text-white text-sm sm:text-base">
                Distribusi &amp; Alokasi Kapasitas Staf (32 Staf)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pemetaan staf resmi Divisi Produksi I berdasarkan departemen operasional dan administrasi.
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
