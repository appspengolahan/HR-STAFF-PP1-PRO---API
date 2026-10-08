import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { StaffData, PresensiRecord, LemburRecord, SlipGajiRecord } from '../../types';
import {
  calculateSlipGaji,
  formatRupiah,
  NAMA_BULAN_INDO,
  getEffectiveFaktorPotongan,
} from '../../services/payrollEngine';
import { ThermalSlipModal } from '../modals/ThermalSlipModal';

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
  const [selectedNip, setSelectedNip] = useState<string>(
    isStaffPortal && currentUserNip ? currentUserNip : staffList[0]?.nip || 'BK-PP1-023'
  );
  const [selectedBulan, setSelectedBulan] = useState<number>(now.getMonth() + 1);
  const [selectedTahun, setSelectedTahun] = useState<number>(now.getFullYear());
  const [isThermalOpen, setIsThermalOpen] = useState(false);

  // Filter state for Rekap Seluruh Staf
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOnlyDeductions, setFilterOnlyDeductions] = useState(false);

  const selectedStaff = useMemo(() => {
    return staffList.find((s) => s.nip === selectedNip) || staffList[0] || null;
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

  const handlePrintA4 = () => {
    const originalTitle = document.title;
    document.title = `HR Karyawan - Divisi Produksi I - Slip Gaji ${selectedStaff?.nama || 'Staf'} ${NAMA_BULAN_INDO[selectedBulan - 1]} ${selectedTahun}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const handleSelectStaffForSlip = (nip: string) => {
    setSelectedNip(nip);
    setViewMode('individual');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Controller Bar (No Print) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 no-print">
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
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Pilih Karyawan Staf
              </label>
              <select
                value={selectedNip}
                onChange={(e) => setSelectedNip(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white min-w-[210px]"
              >
                {staffList.map((s) => (
                  <option key={s.nip} value={s.nip}>
                    {s.nama} ({s.nip})
                  </option>
                ))}
              </select>
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
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
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
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>
        </div>

        {viewMode === 'individual' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsThermalOpen(true)}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-emerald-500" />
              Thermal POS &amp; WA
            </button>
            <button
              type="button"
              onClick={handlePrintA4}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
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
                  {filteredAllStaffSlips.map(({ staff, slip }, index) => {
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
                          {index + 1}
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
          </div>
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
