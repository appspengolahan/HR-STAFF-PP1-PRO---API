import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { CutiRecord, StaffData, AuthUser } from '../../types';

interface CutiIjinTabProps {
  cutiList: CutiRecord[];
  staffList: StaffData[];
  onAddCuti: (rec: CutiRecord) => void;
  onUpdateStatus: (id: string, status: 'Disetujui' | 'Ditolak', approver: string) => void;
  currentUser: AuthUser | null;
}

export const CutiIjinTab: React.FC<CutiIjinTabProps> = ({
  cutiList,
  staffList,
  onAddCuti,
  onUpdateStatus,
  currentUser,
}) => {
  const isStaffOnly = currentUser?.portalType === 'staff';
  const [filterStatus, setFilterStatus] = useState<string>('Semua');

  // Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formStaffNip, setFormStaffNip] = useState(isStaffOnly && currentUser ? currentUser.nip : staffList[0]?.nip || '');
  const [formJenisCuti, setFormJenisCuti] = useState<'Cuti Tahunan' | 'Cuti Melahirkan' | 'Izin Dinas Luar Kota' | 'Izin Menikah/Khusus'>('Cuti Tahunan');
  const [formTglMulai, setFormTglMulai] = useState(new Date().toISOString().split('T')[0]);
  const [formTglAkhir, setFormTglAkhir] = useState(new Date().toISOString().split('T')[0]);
  const [formAlasan, setFormAlasan] = useState('');

  const filtered = useMemo(() => {
    return cutiList.filter((c) => {
      const matchStaff = isStaffOnly && currentUser ? c.nip === currentUser.nip : true;
      const matchStatus = filterStatus === 'Semua' ? true : c.status === filterStatus;
      return matchStaff && matchStatus;
    });
  }, [cutiList, isStaffOnly, currentUser, filterStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const st = staffList.find((s) => s.nip === formStaffNip);
    if (!st) {
      alert('Pilih karyawan terlebih dahulu.');
      return;
    }

    const d1 = new Date(formTglMulai);
    const d2 = new Date(formTglAkhir);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const newRecord: CutiRecord = {
      id: `ct-${Date.now()}`,
      nip: st.nip,
      nama: st.nama,
      jenisCuti: formJenisCuti,
      tanggalMulai: formTglMulai,
      tanggalAkhir: formTglAkhir,
      durasiHari: diffDays,
      alasan: formAlasan,
      status: 'Pending',
    };

    onAddCuti(newRecord);
    setIsFormOpen(false);
    setFormAlasan('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-300 leading-relaxed no-print flex items-start gap-3 shadow-xs">
        <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <strong>Alur Pengajuan Cuti &amp; Izin Berjenjang:</strong> Setiap pengajuan cuti tahunan atau izin dinas diverifikasi oleh Kepala Departemen dan disetujui Manajer Operasional. Status cuti yang telah disetujui akan otomatis dicatat sebagai ijin resmi pada rekapitulasi presensi.
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print bg-slate-50/50 dark:bg-slate-950/30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Filter Status:</span>
            {['Semua', 'Pending', 'Disetujui', 'Ditolak'].map((st) => (
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

          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajukan Permohonan Cuti
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Nama Staf &amp; NIP</th>
                <th className="py-3 px-4">Jenis Cuti</th>
                <th className="py-3 px-4">Tanggal Mulai</th>
                <th className="py-3 px-4">Tanggal Akhir</th>
                <th className="py-3 px-4 text-center">Durasi</th>
                <th className="py-3 px-4">Alasan Cuti</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right no-print">Aksi Persetujuan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada data pengajuan cuti dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{item.nama}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{item.nip}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {item.jenisCuti}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">{item.tanggalMulai}</td>
                    <td className="py-3 px-4 font-mono">{item.tanggalAkhir}</td>
                    <td className="py-3 px-4 text-center font-bold">{item.durasiHari} Hari</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {item.alasan}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'Disetujui'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : item.status === 'Ditolak'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right no-print">
                      {!isStaffOnly && item.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() =>
                              onUpdateStatus(item.id, 'Disetujui', currentUser?.nama || 'Manajer')
                            }
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Setujui
                          </button>
                          <button
                            onClick={() =>
                              onUpdateStatus(item.id, 'Ditolak', currentUser?.nama || 'Manajer')
                            }
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Tolak
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          {item.disetujuiOleh ? `Oleh: ${item.disetujuiOleh}` : 'Selesai'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ajukan Cuti */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Formulir Pengajuan Cuti / Izin Karyawan
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {!isStaffOnly ? (
                <div>
                  <label className="block font-semibold mb-1">Pilih Karyawan Staf</label>
                  <select
                    required
                    value={formStaffNip}
                    onChange={(e) => setFormStaffNip(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-semibold"
                  >
                    {staffList.map((s) => (
                      <option key={s.nip} value={s.nip}>
                        {s.nama} ({s.nip} — {s.jabatan})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold mb-1">Pemohon</label>
                  <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg font-bold">
                    {currentUser?.nama} ({currentUser?.nip})
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1">Kategori Cuti / Izin</label>
                <select
                  value={formJenisCuti}
                  onChange={(e) =>
                    setFormJenisCuti(
                      e.target.value as
                        | 'Cuti Tahunan'
                        | 'Cuti Melahirkan'
                        | 'Izin Dinas Luar Kota'
                        | 'Izin Menikah/Khusus'
                    )
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-semibold"
                >
                  <option value="Cuti Tahunan">Cuti Tahunan (Hak 12 Hari)</option>
                  <option value="Cuti Melahirkan">Cuti Melahirkan (3 Bulan)</option>
                  <option value="Izin Dinas Luar Kota">Izin Dinas / Pelatihan Luar Kota</option>
                  <option value="Izin Menikah/Khusus">Izin Menikah / Keperluan Khusus</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={formTglMulai}
                    onChange={(e) => setFormTglMulai(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tanggal Berakhir</label>
                  <input
                    type="date"
                    required
                    value={formTglAkhir}
                    onChange={(e) => setFormTglAkhir(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Alasan / Rincian Pengajuan</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Jelaskan alasan pengajuan dan rencana serah terima pekerjaan sementara..."
                  value={formAlasan}
                  onChange={(e) => setFormAlasan(e.target.value)}
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Kirim Pengajuan Cuti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
