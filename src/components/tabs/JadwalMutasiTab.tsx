import React, { useState } from 'react';
import {
  GitPullRequest,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Printer,
  Calendar,
  Zap,
} from 'lucide-react';
import { MutasiRecord, StaffData } from '../../types';

interface JadwalMutasiTabProps {
  mutasiList: MutasiRecord[];
  staffList: StaffData[];
  onUpdateMutasiStatus: (id: string, status: 'Diterapkan' | 'Dibatalkan') => void;
  onApplyDueMutations: () => void;
}

export const JadwalMutasiTab: React.FC<JadwalMutasiTabProps> = ({
  mutasiList,
  onUpdateMutasiStatus,
  onApplyDueMutations,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('Semua');

  const filtered = mutasiList.filter((m) => {
    if (filterStatus === 'Semua') return true;
    return m.status === filterStatus;
  });

  const handleExportPdf = () => {
    const originalTitle = document.title;
    document.title = `HR Karyawan - Divisi Produksi I - Jadwal Mutasi & Rotasi Staf`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-300 leading-relaxed no-print flex items-start gap-3 shadow-xs">
        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong>Pola Penjadwalan Mutasi Masa Depan:</strong> Mutasi yang tanggal efektifnya di masa depan otomatis masuk ke daftar ini berstatus <strong>"Terjadwal"</strong> dan belum mengubah data database karyawan. Sistem otomatis menerapkannya pada tanggal efektif tiba (pemicu otomatis harian jam 01:00).
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print bg-slate-50/50 dark:bg-slate-950/30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Filter Status:</span>
            {['Semua', 'Terjadwal', 'Diterapkan', 'Dibatalkan'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  filterStatus === st
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onApplyDueMutations}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Zap className="w-4 h-4" />
              Terapkan Mutasi Jatuh Tempo
            </button>
            <button
              onClick={handleExportPdf}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-mono">Tgl Efektif</th>
                <th className="py-3 px-4">Nama Karyawan &amp; NIP</th>
                <th className="py-3 px-4">Jenis Mutasi</th>
                <th className="py-3 px-4">Nilai Lama</th>
                <th className="py-3 px-4">Nilai Baru</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4">Diinput Oleh</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada catatan mutasi dengan status yang dipilih.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {item.tanggalEfektif}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{item.nama}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{item.nip}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">
                      {item.jenisMutasi}
                    </td>
                    <td className="py-3 px-4 text-slate-500 line-through">{item.nilaiLama}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {item.nilaiBaru}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {item.keterangan}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">{item.diinputOleh}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'Diterapkan'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : item.status === 'Terjadwal'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right no-print">
                      {item.status === 'Terjadwal' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onUpdateMutasiStatus(item.id, 'Diterapkan')}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold"
                          >
                            Terapkan
                          </button>
                          <button
                            onClick={() => onUpdateMutasiStatus(item.id, 'Dibatalkan')}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-semibold"
                          >
                            Batalkan
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">–</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
