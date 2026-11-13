import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Receipt,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  AlertTriangle,
  ArrowRight,
  X,
  ChevronDown,
  Check,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import { StaffData, PresensiRecord, LemburRecord, SlipGajiRecord } from '../../types';
import {
  calculateSlipGaji,
  formatRupiah,
  NAMA_BULAN_INDO,
  getEffectiveFaktorPotongan,
} from '../../services/payrollEngine';
import { ThermalSlipModal } from '../modals/ThermalSlipModal';
import { TablePagination } from '../TablePagination';
import { usePrintMode } from '../../hooks/usePrintMode';

interface SlipGajiTabProps {
  staffList: StaffData[];
  presensiList: PresensiRecord[];
  lemburList: LemburRecord[];
  currentUserNip?: string;
  isStaffPortal?: boolean;
}

export const SlipGajiTab: React.FC<SlipGajiTabProps> = ({
  staffList,
  presensiList,
  lemburList,
  currentUserNip,
  isStaffPortal = false,
}) => {
  const now = new Date();
  const [viewMode, setViewMode] = useState<'individual' | 'all'>('individual');
  // Default kosong agar tidak langsung menampilkan slip gaji siapapun saat halaman dibuka
  const [selectedNip, setSelectedNip] = useState<string>(
    isStaffPortal && currentUserNip ? currentUserNip : ''
  );
  const [selectedBulan, setSelectedBulan] = useState<number>(now.getMonth() + 1);
  const [selectedTahun, setSelectedTahun] = useState<number>(now.getFullYear());
  const [isThermalOpen, setIsThermalOpen] = useState(false);

  // Kotak saran nama staf (Autocomplete Combobox)
  const [staffQuery, setStaffQuery] = useState<string>(() => {
    if (isStaffPortal && currentUserNip) {
      const own = staffList.find((s) => s.nip === currentUserNip);
      return own ? own.nama : '';
    }
    return '';
  });
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
  const [highlightedStaffIdx, setHighlightedStaffIdx] = useState(0);
  const staffDropdownRef = useRef<HTMLDivElement>(null);
  const staffInputRef = useRef<HTMLInputElement>(null);

  // Filter state for Rekap Seluruh Staf
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOnlyDeductions, setFilterOnlyDeductions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;
  const { isPrinting, triggerPrint } = usePrintMode();

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterOnlyDeductions, selectedBulan, selectedTahun]);

  // Sinkronisasi NIP saat berada di Portal Mandiri Staf (dan reset saat keluar dari mode portal staf)
  const prevIsStaffPortalRef = useRef(isStaffPortal);
  useEffect(() => {
    if (isStaffPortal && currentUserNip) {
      setSelectedNip(currentUserNip);
      const own = staffList.find((s) => s.nip === currentUserNip);
      if (own) setStaffQuery(own.nama);
    } else if (prevIsStaffPortalRef.current && !isStaffPortal) {
      setSelectedNip('');
      setStaffQuery('');
    }
    prevIsStaffPortalRef.current = isStaffPortal;
  }, [isStaffPortal, currentUserNip, staffList]);

  // Tutup kotak saran saat tap/klik di luar area
  useEffect(() => {
    const handleClickOutside = (e: PointerEvent) => {
      if (staffDropdownRef.current && !staffDropdownRef.current.contains(e.target as Node)) {
        setIsStaffDropdownOpen(false);
        if (selectedNip) {
          const st = staffList.find((s) => s.nip === selectedNip);
          if (st) setStaffQuery(st.nama);
        }
      }
    };
    if (isStaffDropdownOpen) {
      document.addEventListener('pointerdown', handleClickOutside);
    }
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isStaffDropdownOpen, selectedNip, staffList]);

  const staffSuggestions = useMemo(() => {
    const q = staffQuery.trim().toLowerCase();
    if (!q) return staffList;
    return staffList.filter(
      (s) => s.nama.toLowerCase().includes(q) || s.nip.toLowerCase().includes(q)
    );
  }, [staffList, staffQuery]);

  const selectedStaff = useMemo(() => {
    if (!selectedNip) return null;
    return staffList.find((s) => s.nip === selectedNip) || null;
  }, [staffList, selectedNip]);

  // Helper untuk mengekstrak bulan dan tahun presensi secara tangguh
  const getRecordMonthYear = (p: PresensiRecord) => {
    let m = p.bulan;
    let y = p.tahun;
    if (p.tanggal) {
      if (p.tanggal.includes('-')) {
        const parts = p.tanggal.split('-');
        if (parts.length === 3) {
          y = parseInt(parts[0], 10);
          m = parseInt(parts[1], 10);
        }
      } else if (p.tanggal.includes('/')) {
        const parts = p.tanggal.split('/');
        if (parts.length === 3) {
          m = parseInt(parts[1], 10);
          y = parseInt(parts[2], 10);
        }
      }
    }
    return { month: m, year: y };
  };

  // Compute live slip gaji record untuk staf terpilih
  const currentSlip = useMemo<SlipGajiRecord | null>(() => {
    if (!selectedStaff) return null;

    // Total lembur bulan berjalan
    const stafLembur = lemburList.filter((l) => {
      const match =
        (l.nip && l.nip.trim() === selectedStaff.nip.trim()) ||
        (l.nama && l.nama.trim().toLowerCase() === selectedStaff.nama.trim().toLowerCase());
      return match && l.bulan === selectedBulan && l.tahun === selectedTahun;
    });
    const totalLembur = stafLembur.reduce((acc, l) => acc + (l.nominal || 0), 0);

    // Hari tidak dibayar (akumulasi faktor potongan presensi)
    const stafPresensi = presensiList.filter((p) => {
      const match =
        (p.nip && p.nip.trim() === selectedStaff.nip.trim()) ||
        (p.nama && p.nama.trim().toLowerCase() === selectedStaff.nama.trim().toLowerCase());
      if (!match) return false;
      const { month, year } = getRecordMonthYear(p);
      return month === selectedBulan && year === selectedTahun;
    });

    const hariTidakDibayar = stafPresensi.reduce(
      (acc, p) => acc + getEffectiveFaktorPotongan(p),
      0
    );

    return calculateSlipGaji(
      selectedStaff,
      selectedBulan,
      selectedTahun,
      totalLembur,
      hariTidakDibayar
    );
  }, [selectedStaff, selectedBulan, selectedTahun, lemburList, presensiList]);

  // Compute slip gaji untuk SELURUH staf (32 Staf) untuk audit & verifikasi menyeluruh
  const allStaffSlips = useMemo(() => {
    return staffList.map((st) => {
      const stafLembur = lemburList.filter((l) => {
        const match =
          (l.nip && l.nip.trim() === st.nip.trim()) ||
          (l.nama && l.nama.trim().toLowerCase() === st.nama.trim().toLowerCase());
        return match && l.bulan === selectedBulan && l.tahun === selectedTahun;
      });
      const totalLembur = stafLembur.reduce((acc, l) => acc + (l.nominal || 0), 0);

      const stafPresensi = presensiList.filter((p) => {
        const match =
          (p.nip && p.nip.trim() === st.nip.trim()) ||
          (p.nama && p.nama.trim().toLowerCase() === st.nama.trim().toLowerCase());
        if (!match) return false;
        const { month, year } = getRecordMonthYear(p);
        return month === selectedBulan && year === selectedTahun;
      });

      const hariTidakDibayar = stafPresensi.reduce(
        (acc, p) => acc + getEffectiveFaktorPotongan(p),
        0
      );

      const slip = calculateSlipGaji(
        st,
        selectedBulan,
        selectedTahun,
        totalLembur,
        hariTidakDibayar
      );

      return {
        staff: st,
        slip,
        presensiRecords: stafPresensi,
      };
    });
  }, [staffList, presensiList, lemburList, selectedBulan, selectedTahun]);

  // Ringkasan metrik audit payroll seluruh staf
  const auditSummary = useMemo(() => {
    let totalBruto = 0;
    let totalPotonganIjin = 0;
    let totalHariIjin = 0;
    let stafTerkenaPotongan = 0;
    let totalBpjs = 0;
    let totalPph = 0;
    let totalNetto = 0;

    allStaffSlips.forEach(({ slip }) => {
      totalBruto += slip.totalGajiBruto;
      totalPotonganIjin += slip.potonganIjinRp;
      totalHariIjin += slip.hariTidakDibayar;
      if (slip.hariTidakDibayar > 0) {
        stafTerkenaPotongan += 1;
      }
      totalBpjs += slip.bpjsJht + slip.bpjsJp + slip.bpjsKesehatan;
      totalPph += slip.pph21Bulan;
      totalNetto += slip.gajiDiterima;
    });

    return {
      totalBruto,
      totalPotonganIjin,
      totalHariIjin,
      stafTerkenaPotongan,
      totalBpjs,
      totalPph,
      totalNetto,
      totalStaff: allStaffSlips.length,
    };
  }, [allStaffSlips]);

  // Filtered all staff list for table
  const filteredAllStaffSlips = useMemo(() => {
    return allStaffSlips.filter(({ staff, slip }) => {
      if (filterOnlyDeductions && slip.hariTidakDibayar === 0) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        staff.nama.toLowerCase().includes(q) ||
        staff.nip.toLowerCase().includes(q) ||
        staff.jabatan.toLowerCase().includes(q) ||
        staff.sekup.toLowerCase().includes(q)
      );
    });
  }, [allStaffSlips, searchQuery, filterOnlyDeductions]);

  const totalPages = Math.max(1, Math.ceil(filteredAllStaffSlips.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const displayedStaffSlips = useMemo(() => {
    if (isPrinting) return filteredAllStaffSlips;
    const start = (safePage - 1) * pageSize;
    return filteredAllStaffSlips.slice(start, start + pageSize);
  }, [filteredAllStaffSlips, isPrinting, safePage]);

  const handlePrintA4 = () => {
    triggerPrint(
      `HR Karyawan - Divisi Produksi I - Slip Gaji ${selectedStaff?.nama || 'Staf'} ${NAMA_BULAN_INDO[selectedBulan - 1]} ${selectedTahun}`
    );
  };

  const handleSelectStaff = (st: StaffData) => {
    setSelectedNip(st.nip);
    setStaffQuery(st.nama);
    setIsStaffDropdownOpen(false);
  };

  const handleClearSelectedStaff = () => {
    setSelectedNip('');
    setStaffQuery('');
    setHighlightedStaffIdx(0);
    setIsStaffDropdownOpen(false);
    staffInputRef.current?.focus();
  };

  const handleStaffKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isStaffDropdownOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setIsStaffDropdownOpen(true);
      return;
    }
    if (!isStaffDropdownOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedStaffIdx((prev) =>
        staffSuggestions.length > 0 ? (prev + 1) % staffSuggestions.length : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedStaffIdx((prev) =>
        staffSuggestions.length > 0 ? (prev - 1 + staffSuggestions.length) % staffSuggestions.length : 0
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = staffSuggestions[highlightedStaffIdx];
      if (target) handleSelectStaff(target);
    } else if (e.key === 'Escape') {
      setIsStaffDropdownOpen(false);
    }
  };

  const handleSelectStaffForSlip = (nip: string) => {
    const target = staffList.find((s) => s.nip === nip);
    setSelectedNip(nip);
    setStaffQuery(target ? target.nama : '');
    setIsStaffDropdownOpen(false);
    setViewMode('individual');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Controller Bar (No Print) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 no-print print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switcher */}
          {!isStaffPortal && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold mr-2">
              <button
                type="button"
                onClick={() => setViewMode('individual')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'individual'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Slip A4 Perorangan
              </button>
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'all'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Rekap Seluruh Staf ({allStaffSlips.length})
                {auditSummary.stafTerkenaPotongan > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-black">
                    {auditSummary.stafTerkenaPotongan} potong
                  </span>
                )}
              </button>
            </div>
          )}

          {viewMode === 'individual' && !isStaffPortal ? (
            <div ref={staffDropdownRef} className="relative min-w-[240px] sm:min-w-[270px]">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Cari &amp; Pilih Nama Staf
              </label>
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  ref={staffInputRef}
                  type="text"
                  value={staffQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStaffQuery(val);
                    if (!val.trim()) {
                      setSelectedNip('');
                    } else if (selectedStaff && val.trim().toLowerCase() !== selectedStaff.nama.toLowerCase()) {
                      setSelectedNip('');
                    }
                    setHighlightedStaffIdx(0);
                    if (!isStaffDropdownOpen) setIsStaffDropdownOpen(true);
                  }}
                  onFocus={() => setIsStaffDropdownOpen(true)}
                  onKeyDown={handleStaffKeyDown}
                  placeholder="Ketik nama staf untuk buka slip..."
                  className="w-full min-h-[40px] pl-8 pr-16 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute right-1.5 flex items-center gap-0.5">
                  {(staffQuery || selectedNip) && (
                    <button
                      type="button"
                      onClick={handleClearSelectedStaff}
                      title="Sembunyikan / bersihkan pilihan staf"
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsStaffDropdownOpen((prev) => !prev)}
                    title="Tampilkan daftar saran nama staf"
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isStaffDropdownOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              {isStaffDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 flex items-center justify-between">
                    <span>Saran Nama Karyawan</span>
                    <span>{staffSuggestions.length} staf</span>
                  </div>
                  {staffSuggestions.length === 0 ? (
                    <div className="px-3 py-4 text-center text-slate-400 text-xs">
                      Tidak ditemukan nama staf "{staffQuery}"
                    </div>
                  ) : (
                    staffSuggestions.map((st, idx) => {
                      const isSelected = selectedNip === st.nip;
                      const isHighlighted = idx === highlightedStaffIdx;
                      return (
                        <button
                          key={st.nip}
                          type="button"
                          onClick={() => handleSelectStaff(st)}
                          onMouseEnter={() => setHighlightedStaffIdx(idx)}
                          className={`w-full min-h-[44px] px-3 py-2 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer text-xs ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                              : isHighlighted
                              ? 'bg-slate-100 dark:bg-slate-800/70 text-slate-900 dark:text-white'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {st.nama.charAt(0).toUpperCase()}
                            </div>
                            <div className="truncate">
                              <div className="truncate font-semibold">{st.nama}</div>
                              <div className="text-[10px] font-mono text-slate-400">{st.nip}</div>
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          ) : viewMode === 'individual' && isStaffPortal ? (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Karyawan Pemilik Slip
              </label>
              <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white">
                {selectedStaff?.nama} ({selectedStaff?.nip})
              </div>
            </div>
          ) : null}

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Bulan Gaji</label>
            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(Number(e.target.value))}
              className="min-h-[40px] px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
            >
              {NAMA_BULAN_INDO.map((bln, idx) => (
                <option key={bln} value={idx + 1}>
                  {bln}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tahun</label>
            <select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(Number(e.target.value))}
              className="min-h-[40px] px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>
        </div>

        {viewMode === 'individual' && (
          <div className="flex flex-wrap items-center gap-2">
            {!isStaffPortal && currentSlip && (
              <button
                type="button"
                onClick={handleClearSelectedStaff}
                className="min-h-[44px] sm:min-h-0 px-3 py-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
                title="Sembunyikan slip gaji dari layar"
              >
                <EyeOff className="w-4 h-4" />
                Sembunyikan
              </button>
            )}
            <button
              type="button"
              disabled={!currentSlip}
              onClick={() => setIsThermalOpen(true)}
              className="min-h-[44px] sm:min-h-0 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Receipt className="w-4 h-4 text-emerald-500" />
              Thermal POS &amp; WA
            </button>
            <button
              type="button"
              disabled={!currentSlip}
              onClick={handlePrintA4}
              className="min-h-[44px] sm:min-h-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Printer className="w-4 h-4" />
              Cetak PDF A4 Resmi
            </button>
          </div>
        )}
      </div>

      {/* VIEW MODE 1: REKAPITULASI & AUDIT GAJI SELURUH STAF */}
      {viewMode === 'all' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Summary Audit Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Total Gaji Bruto ({NAMA_BULAN_INDO[selectedBulan - 1]} {selectedTahun})
              </span>
              <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
                {formatRupiah(auditSummary.totalBruto)}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                32 Staf aktif Divisi Produksi I
              </span>
            </div>

            <div className="bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-red-700 dark:text-red-400">
                  Potongan Ijin Presensi
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300">
                  {auditSummary.stafTerkenaPotongan} Staf Terkena
                </span>
              </div>
              <div className="text-xl font-black font-mono text-red-600 dark:text-red-400 mt-1">
                - {formatRupiah(auditSummary.totalPotonganIjin)}
              </div>
              <span className="text-[10px] text-red-600/80 dark:text-red-400/80 mt-1 block font-medium">
                Total {auditSummary.totalHariIjin} hari kerja tidak dibayar
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Total Potongan BPJS &amp; PPh21
              </span>
              <div className="text-xl font-black font-mono text-slate-800 dark:text-slate-200 mt-1">
                - {formatRupiah(auditSummary.totalBpjs + auditSummary.totalPph)}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                JHT, JP, BPJS Kes, &amp; PPh21 TER
              </span>
            </div>

            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block">
                Total Gaji Bersih (Take Home Pay)
              </span>
              <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {formatRupiah(auditSummary.totalNetto)}
              </div>
              <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-1 block font-medium">
                Siap ditransfer ke rekening staf
              </span>
            </div>
          </div>

          {/* Table Controller & Filter */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari staf, NIP, atau jabatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer self-start sm:self-center">
              <input
                type="checkbox"
                checked={filterOnlyDeductions}
                onChange={(e) => setFilterOnlyDeductions(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded-md border-slate-300 dark:border-slate-700 focus:ring-red-500"
              />
              <span>Tampilkan hanya staf yang memiliki potongan ijin ({auditSummary.stafTerkenaPotongan})</span>
            </label>
          </div>

          {/* Table Data */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Tabel Verifikasi Slip Gaji Seluruh Staf — {NAMA_BULAN_INDO[selectedBulan - 1]} {selectedTahun}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Menampilkan {filteredAllStaffSlips.length} dari {allStaffSlips.length} staf. Seluruh potongan ijin dihitung otomatis dari log presensi dengan basis 26 hari kerja baku.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">No</th>
                    <th className="py-3 px-3">Karyawan / NIP</th>
                    <th className="py-3 px-3">Jabatan &amp; Unit</th>
                    <th className="py-3 px-3 text-right">Gaji Pokok</th>
                    <th className="py-3 px-3 text-right">Tunjangan</th>
                    <th className="py-3 px-3 text-right">Lembur</th>
                    <th className="py-3 px-3 text-center">Hari Ijin</th>
                    <th className="py-3 px-3 text-right">Potongan Ijin</th>
                    <th className="py-3 px-3 text-right">Gaji Bruto</th>
                    <th className="py-3 px-3 text-right">BPJS</th>
                    <th className="py-3 px-3 text-right">PPh21</th>
                    <th className="py-3 px-3 text-right">Gaji Diterima (THP)</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {displayedStaffSlips.map(({ staff, slip }, index) => {
                    const rowNumber = isPrinting ? index + 1 : (safePage - 1) * pageSize + index + 1;
                    const isAdiTri = staff.nip === 'BK-PP1-023';
                    const hasPotongan = slip.hariTidakDibayar > 0;

                    return (
                      <tr
                        key={staff.nip}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                          isAdiTri
                            ? 'bg-blue-50/40 dark:bg-blue-950/20'
                            : hasPotongan
                            ? 'bg-amber-50/20 dark:bg-amber-950/10'
                            : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center font-mono text-slate-400 text-[11px]">
                          {rowNumber}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {staff.nama}
                            {isAdiTri && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-bold">
                                Target Verifikasi
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[10px] text-slate-400">{staff.nip}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-slate-800 dark:text-slate-200">{staff.jabatan}</div>
                          <div className="text-[10px] text-slate-400">{staff.sekup}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                          {formatRupiah(slip.gajiPokok)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                          {formatRupiah(slip.tunjanganJabatan)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                          {slip.totalLembur > 0 ? `+ ${formatRupiah(slip.totalLembur)}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {slip.hariTidakDibayar > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                              {slip.hariTidakDibayar} hari
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">0</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold">
                          {slip.potonganIjinRp > 0 ? (
                            <span className="text-red-600 dark:text-red-400">
                              - {formatRupiah(slip.potonganIjinRp)}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatRupiah(slip.totalGajiBruto)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-red-600/80 dark:text-red-400/80">
                          - {formatRupiah(slip.bpjsJht + slip.bpjsJp + slip.bpjsKesehatan)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                          {slip.pph21Bulan > 0 ? `- ${formatRupiah(slip.pph21Bulan)}` : 'Rp 0'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-blue-600 dark:text-blue-400">
                          {formatRupiah(slip.gajiDiterima)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleSelectStaffForSlip(staff.nip)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Slip
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <TablePagination
              currentPage={safePage}
              totalItems={filteredAllStaffSlips.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              itemLabel="slip gaji staf"
            />
          </div>
        </div>
      )}

      {/* VIEW MODE 2: PRIVACY SHIELD WHEN NO STAFF SELECTED */}
      {viewMode === 'individual' && !currentSlip && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-12 shadow-xs max-w-2xl mx-auto text-center space-y-4 no-print">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-slate-200 dark:border-slate-700 shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Tampilan Slip Gaji Terlindungi (Privasi Aktif)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Demi menjaga kerahasiaan data gaji staf saat layar dibuka di hadapan umum, slip gaji tidak ditampilkan secara otomatis. Ketik dan pilih nama karyawan pada kotak saran di atas untuk membuka rincian slip gaji.
            </p>
          </div>
          {!isStaffPortal && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsStaffDropdownOpen(true);
                  staffInputRef.current?.focus();
                }}
                className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4" />
                Cari Nama Staf Sekarang
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: SLIP GAJI A4 SHEET DOCUMENT (PERORANGAN) */}
      {viewMode === 'individual' && currentSlip && (
        <div
          id="slip-gaji-a4-sheet"
          className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm max-w-4xl mx-auto space-y-6"
        >
          {/* Header Kop Resmi */}
          <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-black text-lg">
                BK
              </div>
              <div>
                <h1 className="text-lg font-black tracking-wide leading-tight">
                  PT BATU KARANG
                </h1>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  DIVISI PRODUKSI I — PABRIK PENGOLAHAN BAHAN BAKU
                </p>
                <p className="text-[10px] text-slate-500">
                  Alamat: Kawasan Industri Terpadu PP1, Malang — Jawa Timur
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-base font-black tracking-wider uppercase">SLIP GAJI BULANAN</div>
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Periode: {currentSlip.namaBulan} {currentSlip.tahun}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Ref: BK-PAY/{currentSlip.tahun}/{String(currentSlip.bulan).padStart(2, '0')}/{currentSlip.nip}
              </div>
            </div>
          </div>

          {/* Staf Profile Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-850 text-xs border border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 block">Nama Karyawan</span>
              <strong className="text-slate-900 dark:text-white text-sm">{currentSlip.nama}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">NIP &amp; Status</span>
              <span className="font-mono font-bold">{currentSlip.nip}</span>
              <span className="ml-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                ({currentSlip.statusKepegawaian})
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Jabatan &amp; Unit</span>
              <span className="font-semibold">{currentSlip.jabatan}</span>
              <span className="block text-[10px] text-slate-500">{currentSlip.sekup}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Status PTKP &amp; TER</span>
              <span className="font-semibold">{currentSlip.statusPTKP}</span>
              <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                Kategori TER {currentSlip.kategoriTer} ({(currentSlip.tarifTerPct * 100).toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Notifikasi Potongan Ijin Aktif */}
          {currentSlip.hariTidakDibayar > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <span>
                  <strong>Potongan Ijin Aktif ({currentSlip.hariTidakDibayar} Hari Kerja):</strong> Terhitung potongan sebesar <strong>{formatRupiah(currentSlip.potonganIjinRp)}</strong> berdasarkan catatan presensi tidak dibayar pada {currentSlip.namaBulan} {currentSlip.tahun}.
                </span>
              </div>
              <span className="text-[10px] font-mono text-red-600 dark:text-red-400 font-bold shrink-0">
                Rate Harian: {formatRupiah(Math.round((currentSlip.gajiPokok + currentSlip.tunjanganJabatan) / 26))}/hari
              </span>
            </div>
          )}

          {/* Payroll Breakdown (2 Cols: Penghasilan vs Potongan) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kolom 1: Komponen Penghasilan */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1.5 flex justify-between items-center">
                <span>I. PENGHASILAN (EARNINGS)</span>
                <span className="text-[10px] font-normal text-slate-500">Nominal (Rp)</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Gaji Pokok (GP)</span>
                  <span className="font-semibold font-mono">{formatRupiah(currentSlip.gajiPokok)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Tunjangan Jabatan</span>
                  <span className="font-semibold font-mono">
                    {formatRupiah(currentSlip.tunjanganJabatan)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">
                    Lembur Resmi (SPKL) Flat 2×
                  </span>
                  <span className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                    + {formatRupiah(currentSlip.totalLembur)}
                  </span>
                </div>

                {currentSlip.hariTidakDibayar > 0 && (
                  <div className="flex justify-between text-red-600 dark:text-red-400 font-semibold bg-red-50/50 dark:bg-red-950/20 px-2 py-1 rounded-lg">
                    <span>
                      Potongan Ijin / Alpha ({currentSlip.hariTidakDibayar} hari)
                    </span>
                    <span className="font-mono">
                      - {formatRupiah(currentSlip.potonganIjinRp)}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-dashed border-slate-300 dark:border-slate-700 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                  <span>TOTAL GAJI BRUTO</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">
                    {formatRupiah(currentSlip.totalGajiBruto)}
                  </span>
                </div>
              </div>
            </div>

            {/* Kolom 2: Potongan Resmi (Deductions) */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1.5 flex justify-between items-center">
                <span>II. POTONGAN RESMI (DEDUCTIONS)</span>
                <span className="text-[10px] font-normal text-slate-500">Nominal (Rp)</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">
                    BPJS JHT (2% dari Ketentuan Penuh)
                  </span>
                  <span className="font-semibold font-mono text-red-600 dark:text-red-400">
                    - {formatRupiah(currentSlip.bpjsJht)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">
                    BPJS JP (1%, Plafon Rp 11.086.300)
                  </span>
                  <span className="font-semibold font-mono text-red-600 dark:text-red-400">
                    - {formatRupiah(currentSlip.bpjsJp)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">
                    BPJS Kesehatan (Nominal Tetap)
                  </span>
                  <span className="font-semibold font-mono text-red-600 dark:text-red-400">
                    - {formatRupiah(currentSlip.bpjsKesehatan)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">
                    PPh21 TER (PMK 168/2023 - {(currentSlip.tarifTerPct * 100).toFixed(2)}%)
                  </span>
                  <span className="font-semibold font-mono text-red-600 dark:text-red-400">
                    - {formatRupiah(currentSlip.pph21Bulan)}
                  </span>
                </div>

                <div className="pt-2 border-t border-dashed border-slate-300 dark:border-slate-700 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                  <span>TOTAL POTONGAN RESMI</span>
                  <span className="font-mono text-red-600 dark:text-red-400">
                    - {formatRupiah(
                      currentSlip.bpjsJht +
                        currentSlip.bpjsJp +
                        currentSlip.bpjsKesehatan +
                        currentSlip.pph21Bulan
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Grand Total Take Home Pay */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold opacity-90 block">
                GAJI BERSIH DITERIMA (TAKE HOME PAY)
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono mt-0.5 tracking-tight">
                {formatRupiah(currentSlip.gajiDiterima)}
              </div>
            </div>

            <div className="text-right sm:max-w-xs text-xs">
              <span className="text-[11px] opacity-80 block">Terbilang :</span>
              <span className="italic font-medium leading-tight">
                "{currentSlip.terbilangGaji}"
              </span>
            </div>
          </div>

          {/* Notes & Bank Transfer Info */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <div>
              <strong>Rekening Tujuan:</strong> Bank {selectedStaff?.bank || 'BCA'} No.{' '}
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {selectedStaff?.rekening || '-'}
              </span>{' '}
              a/n {currentSlip.nama}.
            </div>
            <div>
              <strong>Catatan Perpajakan:</strong> Metode pemotongan PPh21 menggunakan Tarif Efektif Rata-rata (TER) sesuai PP 58/2023 &amp; PMK 168/2023 berdasarkan status PTKP {currentSlip.statusPTKP}.
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs">
            <div>
              <div className="text-[11px] text-slate-500 mb-1">Dibuat Oleh,</div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Payroll Keuangan</div>
              <div className="h-16 flex items-end justify-center font-bold font-mono">
                ( Yohana )
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-500 mb-1">Disetujui Oleh,</div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Manajer Operasional PP1</div>
              <div className="h-16 flex items-end justify-center font-bold font-mono">
                ( Lalu Mahendra Ali Akbar )
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-500 mb-1">Diterima Oleh,</div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Karyawan Penerima</div>
              <div className="h-16 flex items-end justify-center font-bold font-mono">
                ( {currentSlip.nama} )
              </div>
            </div>
          </div>

          {/* Official Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-right text-[10px] text-slate-400">
            Divisi Produksi I - All Rights Reserved
          </div>
        </div>
      )}

      {/* Thermal Slip & WhatsApp Modal */}
      <ThermalSlipModal
        isOpen={isThermalOpen}
        onClose={() => setIsThermalOpen(false)}
        slip={currentSlip}
        staff={selectedStaff}
      />
    </div>
  );
};
