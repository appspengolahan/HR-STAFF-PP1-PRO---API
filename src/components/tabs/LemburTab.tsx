import React, { useState, useMemo } from 'react';
import {
  Clock,
  Plus,
  Printer,
  Search,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Award,
  AlertCircle,
} from 'lucide-react';
import { LemburRecord, StaffData } from '../../types';
import { formatRupiah, NAMA_BULAN_INDO } from '../../services/payrollEngine';

interface LemburTabProps {
  lemburList: LemburRecord[];
  staffList: StaffData[];
  onAddLemburBatch: (records: LemburRecord[]) => void;
  currentUserNip?: string;
  isStaffPortal?: boolean;
}

export const LemburTab: React.FC<LemburTabProps> = ({
  lemburList,
  staffList,
  onAddLemburBatch,
  currentUserNip,
  isStaffPortal = false,
}) => {
  const now = new Date();
  const [filterTahun, setFilterTahun] = useState<number>(now.getFullYear());
  const [filterBulan, setFilterBulan] = useState<number>(now.getMonth() + 1);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formTanggal, setFormTanggal] = useState(now.toISOString().split('T')[0]);
  const [formKategori, setFormKategori] = useState<
    'Minggu' | 'Tanggal Merah/Libur Nasional' | 'Di Luar Jam Kerja (Weekday/Sabtu)'
  >('Minggu');
  const [formJamMulai, setFormJamMulai] = useState('08:30');
  const [formJamSelesai, setFormJamSelesai] = useState('14:30');
  const [formKeterangan, setFormKeterangan] = useState('');
  const [selectedStaffNips, setSelectedStaffNips] = useState<string[]>([]);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');

  // Filtered recent lembur list
  const filteredList = useMemo(() => {
    return lemburList.filter((item) => {
      const matchTahun = item.tahun === filterTahun;
      const matchBulan = item.bulan === filterBulan;
      const matchStaff = isStaffPortal && currentUserNip ? item.nip === currentUserNip : true;
      return matchTahun && matchBulan && matchStaff;
    });
  }, [lemburList, filterTahun, filterBulan, isStaffPortal, currentUserNip]);

  // Summary Metrics
  const summary = useMemo(() => {
    const totalNominal = filteredList.reduce((acc, l) => acc + (l.nominal || 0), 0);
    const count = filteredList.length;
    return { totalNominal, count };
  }, [filteredList]);

  // Ranking Lembur Terbanyak Tahunan
  const rankingList = useMemo(() => {
    const map: Record<string, { nama: string; nip: string; jumlah: number; totalNominal: number }> = {};

    lemburList
      .filter((l) => l.tahun === filterTahun)
      .forEach((l) => {
        if (!map[l.nip]) {
          map[l.nip] = { nama: l.nama, nip: l.nip, jumlah: 0, totalNominal: 0 };
        }
        map[l.nip].jumlah += 1;
        map[l.nip].totalNominal += l.nominal || 0;
      });

    return Object.values(map)
      .sort((a, b) => b.totalNominal - a.totalNominal)
      .slice(0, 10);
  }, [lemburList, filterTahun]);

  // Handle multi-staff selection
  const handleToggleStaff = (nip: string) => {
    if (selectedStaffNips.includes(nip)) {
      setSelectedStaffNips(selectedStaffNips.filter((n) => n !== nip));
    } else {
      setSelectedStaffNips([...selectedStaffNips, nip]);
    }
  };

  const handleSelectAllStaff = () => {
    if (selectedStaffNips.length === staffList.length) {
      setSelectedStaffNips([]);
    } else {
      setSelectedStaffNips(staffList.map((s) => s.nip));
    }
  };

  const handleSubmitLembur = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStaffNips.length === 0) {
      alert('Pilih minimal 1 orang staf yang mengikuti lembur.');
      return;
    }

    const tgl = new Date(formTanggal);
    const recordsToAdd: LemburRecord[] = [];

    selectedStaffNips.forEach((nip) => {
      const st = staffList.find((s) => s.nip === nip);
      if (st) {
        // Flat 2x tarif harian = 2 * ((GP + Tunjangan) / 26)
        const gp = st.gajiPokok || 0;
        const tj = st.tunjanganJabatan || 0;
        const nominalFlat = Math.round(((gp + tj) / 26) * 2);

        recordsToAdd.push({
          id: `lb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          tanggal: formTanggal,
          nip: st.nip,
          nama: st.nama,
          sekup: st.sekup,
          kategori: formKategori,
          jamMulai: formJamMulai,
          jamSelesai: formJamSelesai,
          nominal: nominalFlat,
          status: 'Disetujui',
          keterangan: formKeterangan,
          bulan: tgl.getMonth() + 1,
          tahun: tgl.getFullYear(),
        });
      }
    });

    onAddLemburBatch(recordsToAdd);
    setIsFormOpen(false);
    setSelectedStaffNips([]);
    setFormKeterangan('');
  };

  const handleExportPdf = () => {
    const originalTitle = document.title;
    document.title = `HR Karyawan - Divisi Produksi I - Rekap Lembur SPKL ${NAMA_BULAN_INDO[filterBulan - 1]} ${filterTahun}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Banner Aturan Lembur */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-300 leading-relaxed no-print flex items-start gap-3 shadow-xs">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong>Aturan Lembur Staff Kantor &amp; Karyawan Tetap (SPKL Resmi):</strong> Lembur staf hanya dihitung jika berada di luar jam kerja normal (Hari Minggu, Tanggal Merah, atau pekerjaan darurat lembur mesin). Dibayar <strong>flat 2× tarif harian</strong> [<code>2 × (Gaji Pokok + Tunjangan) ÷ 26</code>], berapa pun jumlah jam aktualnya pada hari tersebut.
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Jumlah Kejadian Lembur Bulan Ini ({NAMA_BULAN_INDO[filterBulan - 1]})
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {summary.count} Kejadian
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Tugas lembur terverifikasi</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Total Nominal Upah Lembur Staf
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {formatRupiah(summary.totalNominal)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Masuk komponen bruto slip gaji</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Card: History & Action */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Controls (No Print) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print bg-slate-50/50 dark:bg-slate-950/30">
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Bulan</label>
              <select
                value={filterBulan}
                onChange={(e) => setFilterBulan(Number(e.target.value))}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-white"
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
                value={filterTahun}
                onChange={(e) => setFilterTahun(Number(e.target.value))}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-white"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isStaffPortal && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Catat Lembur Multi-Staf
              </button>
            )}
            <button
              onClick={handleExportPdf}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block p-4 border-b border-black">
          <div className="text-base font-bold text-center">
            REKAP SURAT PERINTAH KERJA LEMBUR (SPKL)
          </div>
          <div className="text-xs text-center text-slate-600">
            Divisi Produksi I — Periode {NAMA_BULAN_INDO[filterBulan - 1]} {filterTahun}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Nama Staf &amp; NIP</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4">Kategori Lembur</th>
                <th className="py-3 px-4">Jam Pelaksanaan</th>
                <th className="py-3 px-4">Upah Flat (2× Harian)</th>
                <th className="py-3 px-4">Uraian Tugas Lembur</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Belum ada catatan lembur resmi pada periode {NAMA_BULAN_INDO[filterBulan - 1]} {filterTahun}.
                  </td>
                </tr>
              ) : (
                filteredList.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-medium">{row.tanggal}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{row.nama}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{row.nip}</div>
                    </td>
                    <td className="py-3 px-4">{row.sekup}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        {row.kategori}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {row.jamMulai || '-'} – {row.jamSelesai || '-'}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(row.nominal)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {row.keterangan || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Print Footer */}
        <div className="hidden print:block p-4 border-t border-black text-right text-xs font-semibold">
          Divisi Produksi I - All Rights Reserved
        </div>
      </div>

      {/* Ranking Lembur Tahunan */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Peringkat Akumulasi Lembur Staf Terbanyak (Tahun {filterTahun})
            </h3>
          </div>
          <span className="text-xs text-slate-400">Berdasarkan Total Nominal Diterima</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <th className="pb-2 w-10 text-center">#</th>
                <th className="pb-2">Nama Karyawan</th>
                <th className="pb-2">NIP</th>
                <th className="pb-2 text-center">Jumlah Kejadian</th>
                <th className="pb-2 text-right">Total Nominal Upah Lembur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rankingList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-400">
                    Belum ada data lembur tahun {filterTahun}
                  </td>
                </tr>
              ) : (
                rankingList.map((st, idx) => (
                  <tr key={st.nip} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 font-bold text-slate-900 dark:text-white">{st.nama}</td>
                    <td className="py-2.5 font-mono text-[11px] text-slate-500">{st.nip}</td>
                    <td className="py-2.5 text-center font-semibold text-slate-700 dark:text-slate-300">
                      {st.jumlah}×
                    </td>
                    <td className="py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(st.totalNominal)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Catat Lembur Multi-Staf Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Catat Perintah Lembur Resmi (Multi-Staf)
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitLembur} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Tanggal Lembur</label>
                  <input
                    type="date"
                    required
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Kategori Lembur</label>
                  <select
                    value={formKategori}
                    onChange={(e) =>
                      setFormKategori(
                        e.target.value as
                          | 'Minggu'
                          | 'Tanggal Merah/Libur Nasional'
                          | 'Di Luar Jam Kerja (Weekday/Sabtu)'
                      )
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-semibold"
                  >
                    <option value="Minggu">Minggu (Flat 2x)</option>
                    <option value="Tanggal Merah/Libur Nasional">Tanggal Merah/Libur Nasional</option>
                    <option value="Di Luar Jam Kerja (Weekday/Sabtu)">Di Luar Jam Kerja</option>
                  </select>
                </div>
              </div>

              {/* Checklist Multi Staf */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold">
                    Pilih Staf yang Mengikuti Lembur ({selectedStaffNips.length} Terpilih)
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllStaff}
                    className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    {selectedStaffNips.length === staffList.length ? 'Batal Semua' : 'Pilih Semua'}
                  </button>
                </div>

                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Saring nama staf..."
                    value={staffSearchQuery}
                    onChange={(e) => setStaffSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2 space-y-1 bg-slate-50/50 dark:bg-slate-950/40">
                  {staffList
                    .filter((s) => s.nama.toLowerCase().includes(staffSearchQuery.toLowerCase()))
                    .map((st) => {
                      const isChecked = selectedStaffNips.includes(st.nip);
                      return (
                        <label
                          key={st.nip}
                          className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-amber-500/10 text-amber-900 dark:text-amber-200 font-semibold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleStaff(st.nip)}
                            className="w-4 h-4 text-amber-600 rounded"
                          />
                          <span className="flex-1 truncate">
                            {st.nama}{' '}
                            <span className="text-[10px] text-slate-400 font-mono">({st.jabatan})</span>
                          </span>
                          <span className="text-[10px] font-mono text-emerald-600">
                            {formatRupiah(Math.round(((st.gajiPokok + st.tunjanganJabatan) / 26) * 2))}
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Jam Mulai (Catatan)</label>
                  <input
                    type="time"
                    value={formJamMulai}
                    onChange={(e) => setFormJamMulai(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Jam Selesai (Catatan)</label>
                  <input
                    type="time"
                    value={formJamSelesai}
                    onChange={(e) => setFormJamSelesai(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Uraian Tugas Lembur</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Overhaul preventif rotary dryer line 1 & pembersihan silo..."
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Simpan Perintah Lembur ({selectedStaffNips.length} Staf)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
