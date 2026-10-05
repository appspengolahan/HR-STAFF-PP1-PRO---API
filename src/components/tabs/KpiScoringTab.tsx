import React, { useState, useMemo } from 'react';
import {
  Award,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Shield,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { KpiRecord, StaffData, AuthUser } from '../../types';
import { NAMA_BULAN_INDO } from '../../services/payrollEngine';

interface KpiScoringTabProps {
  kpiList: KpiRecord[];
  staffList: StaffData[];
  onSaveKpi: (kpi: KpiRecord) => void;
  currentUser: AuthUser | null;
}

export const KpiScoringTab: React.FC<KpiScoringTabProps> = ({
  kpiList,
  staffList,
  onSaveKpi,
  currentUser,
}) => {
  const now = new Date();
  const [filterBulan, setFilterBulan] = useState<number>(now.getMonth() + 1);
  const [filterTahun, setFilterTahun] = useState<number>(now.getFullYear());
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form State
  const [formNip, setFormNip] = useState(staffList[0]?.nip || '');
  const [formDisiplin, setFormDisiplin] = useState(90);
  const [formRendemen, setFormRendemen] = useState(90);
  const [formK3, setFormK3] = useState(90);
  const [formInisiatif, setFormInisiatif] = useState(90);
  const [formCatatan, setFormCatatan] = useState('');

  const filtered = useMemo(() => {
    return kpiList.filter((k) => k.bulan === filterBulan && k.tahun === filterTahun);
  }, [kpiList, filterBulan, filterTahun]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const st = staffList.find((s) => s.nip === formNip);
    if (!st) return;

    // Bobot resmi: Disiplin 30%, Rendemen 40%, K3 20%, Inisiatif 10%
    const totalScore = Math.round(
      formDisiplin * 0.3 + formRendemen * 0.4 + formK3 * 0.2 + formInisiatif * 0.1
    );

    let grade: 'A' | 'B' | 'C' | 'D' = 'C';
    if (totalScore >= 90) grade = 'A';
    else if (totalScore >= 80) grade = 'B';
    else if (totalScore >= 70) grade = 'C';
    else grade = 'D';

    const newKpi: KpiRecord = {
      id: `kpi-${st.nip}-${filterBulan}-${filterTahun}`,
      nip: st.nip,
      nama: st.nama,
      bulan: filterBulan,
      tahun: filterTahun,
      disiplin: formDisiplin,
      rendemen: formRendemen,
      k3: formK3,
      inisiatif: formInisiatif,
      totalScore,
      grade,
      catatan: formCatatan,
      penilai: currentUser?.nama || 'Lalu Mahendra Ali Akbar',
    };

    onSaveKpi(newKpi);
    setIsFormOpen(false);
    setFormCatatan('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Bobot Matriks Banner */}
      <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-900 dark:text-purple-300 leading-relaxed no-print flex items-start gap-3 shadow-xs">
        <Award className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
        <div>
          <strong>Matriks Scoring KPI Bulanan (Standar Divisi Produksi I):</strong>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 font-mono text-[11px]">
            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-purple-200 dark:border-purple-800">
              <span className="text-slate-400 block text-[10px]">Bobot 30%</span>
              <strong>Disiplin &amp; Kehadiran</strong>
            </div>
            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-purple-200 dark:border-purple-800">
              <span className="text-slate-400 block text-[10px]">Bobot 40%</span>
              <strong>Capaian Rendemen Output</strong>
            </div>
            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-purple-200 dark:border-purple-800">
              <span className="text-slate-400 block text-[10px]">Bobot 20%</span>
              <strong>K3 / Zero Accident</strong>
            </div>
            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-purple-200 dark:border-purple-800">
              <span className="text-slate-400 block text-[10px]">Bobot 10%</span>
              <strong>Inisiatif &amp; Kerjasama</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Controls */}
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

          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Beri Nilai KPI Staf
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Nama Karyawan &amp; NIP</th>
                <th className="py-3 px-4 text-center">Disiplin (30%)</th>
                <th className="py-3 px-4 text-center">Rendemen (40%)</th>
                <th className="py-3 px-4 text-center">K3 (20%)</th>
                <th className="py-3 px-4 text-center">Inisiatif (10%)</th>
                <th className="py-3 px-4 text-center font-bold">Skor Akhir</th>
                <th className="py-3 px-4 text-center">Grade</th>
                <th className="py-3 px-4">Catatan Evaluasi</th>
                <th className="py-3 px-4">Penilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-sans">
                    Belum ada nilai KPI yang diinput untuk periode {NAMA_BULAN_INDO[filterBulan - 1]} {filterTahun}.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-white">
                      {item.nama}
                      <span className="block text-[10px] text-slate-500 font-mono">{item.nip}</span>
                    </td>
                    <td className="py-3 px-4 text-center">{item.disiplin}</td>
                    <td className="py-3 px-4 text-center">{item.rendemen}</td>
                    <td className="py-3 px-4 text-center">{item.k3}</td>
                    <td className="py-3 px-4 text-center">{item.inisiatif}</td>
                    <td className="py-3 px-4 text-center font-black text-sm text-purple-600 dark:text-purple-400">
                      {item.totalScore}
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          item.grade === 'A'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : item.grade === 'B'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        Grade {item.grade}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {item.catatan || '-'}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-500">{item.penilai}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Input KPI */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Penilaian KPI Bulanan Staf
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Pilih Karyawan Staf</label>
                <select
                  required
                  value={formNip}
                  onChange={(e) => setFormNip(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-semibold"
                >
                  {staffList.map((s) => (
                    <option key={s.nip} value={s.nip}>
                      {s.nama} ({s.nip} — {s.jabatan})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Disiplin &amp; Kehadiran (30%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={formDisiplin}
                    onChange={(e) => setFormDisiplin(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Capaian Rendemen (40%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={formRendemen}
                    onChange={(e) => setFormRendemen(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">K3 / Safety Zero Incident (20%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={formK3}
                    onChange={(e) => setFormK3(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Inisiatif &amp; Inovasi (10%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={formInisiatif}
                    onChange={(e) => setFormInisiatif(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Catatan Evaluasi / Rekomendasi</label>
                <textarea
                  rows={2}
                  placeholder="Catatan prestasi, performa lini, atau hal yang perlu ditingkatkan..."
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
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
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Simpan Penilaian KPI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
