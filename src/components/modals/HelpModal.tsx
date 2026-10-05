import React from 'react';
import { X, HelpCircle, AlertTriangle, CheckCircle, Clock, Calendar, DollarSign, ShieldAlert } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Bantuan &amp; Panduan Penggunaan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sistem HR Staff &amp; Karyawan — PT Batu Karang (PP1)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Versi & Identitas */}
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
            <h3 className="font-bold text-blue-900 dark:text-blue-300 text-sm flex items-center gap-1.5 mb-1">
              📌 Nama Project &amp; Versi
            </h3>
            <p className="text-xs text-blue-800 dark:text-blue-300/90 leading-relaxed">
              <strong>Sistem HR Staff &amp; Karyawan Tetap (Divisi Produksi I)</strong> — Versi 2.0 (Modernized React 19 + TypeScript + Headless GAS V2 Architecture).
            </p>
          </div>

          {/* Jam Kerja Resmi */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5 mb-2.5">
              <Clock className="w-4 h-4 text-blue-500" />
              Ketentuan Jam Kerja Resmi Divisi Produksi I
            </h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Hari</th>
                    <th className="py-2.5 px-3">Jam Kerja</th>
                    <th className="py-2.5 px-3">Istirahat</th>
                    <th className="py-2.5 px-3">Durasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-medium">Senin – Kamis</td>
                    <td className="py-2 px-3">08:00 – 16:00</td>
                    <td className="py-2 px-3">11:30 – 12:30</td>
                    <td className="py-2 px-3 text-blue-600 font-bold">420 Menit (7 Jam)</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-medium">Jumat</td>
                    <td className="py-2 px-3">08:00 – 16:30</td>
                    <td className="py-2 px-3">11:00 – 12:30</td>
                    <td className="py-2 px-3 text-blue-600 font-bold">420 Menit (7 Jam)</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-medium">Sabtu</td>
                    <td className="py-2 px-3">08:00 – 13:00</td>
                    <td className="py-2 px-3 text-slate-400">–</td>
                    <td className="py-2 px-3 text-blue-600 font-bold">300 Menit (5 Jam)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              <Calendar className="w-3 h-3 inline mr-1 text-slate-400" />
              <strong>26 Hari Kerja Per Bulan (Tetap)</strong>: 22 hari kerja Senin–Jumat + 4 hari Sabtu = total 10.440 menit kerja standar per bulan.
            </p>
          </div>

          {/* Ketentuan Lembur */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5 mb-1.5">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              Ketentuan Lembur Staff (SPKL)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Lembur staf kantor &amp; karyawan tetap dihitung <strong>flat 2× tarif harian</strong> pada hari lembur resmi (Minggu, tanggal merah, atau tugas lembur di luar jam kerja normal), berapa pun jumlah jam aktualnya pada hari tersebut:
            </p>
            <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-800/70 rounded-lg text-xs font-mono text-emerald-700 dark:text-emerald-400">
              Tarif Lembur Harian = 2 × ( (Gaji Pokok + Tunjangan Jabatan) ÷ 26 )
            </div>
          </div>

          {/* Aturan Faktor Potongan */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5 mb-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Faktor Potongan Gaji Akibat Ijin
            </h3>
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Faktor 0 (Dibayar 100%)</strong>: Hadir, Sakit dengan Surat Dokter resmi, Ijin Normatif, atau Terlambat/Pulang Awal &le; 2 jam.</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span><strong>Faktor 0.5 (Dipotong Setengah Hari)</strong>: Ijin Terlambat, Ijin Pulang Awal, atau Ijin Keluar Sementara antara 2 jam s.d. 4 jam.</span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span><strong>Faktor 1 (Hangus Penuh)</strong>: Terlambat &ge; 4 jam, Sakit surat tangan tanpa dokter, Ijin pribadi surat tangan, dan Alpha.</span>
              </div>
            </div>
          </div>

          {/* Fitur Utama */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2">
              📖 Modul &amp; Cara Penggunaan
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 dark:text-slate-300">
              <li><strong>Presensi &amp; Ijin</strong>: Mencatat pengecualian ketidakhadiran, status GPS Geofence 150m, dan tombol cetak fisik <em>Surat Permohonan Ijin resmi (20.5 × 16 cm)</em>.</li>
              <li><strong>Lembur</strong>: Checklist staf lembur batch, otomatis terhitung dengan nominal flat resmi.</li>
              <li><strong>Rekap Presensi</strong>: Matriks kehadiran 12 bulan per staf, grafik tren bulanan, dan ranking kehadiran.</li>
              <li><strong>Slip Gaji</strong>: Menghasilkan slip resmi TER (PMK 168/2023), BPJS JHT/JP/Kes, cetak thermal POS, dan ekspor WhatsApp.</li>
              <li><strong>Database Karyawan</strong>: Manajemen 32+ staf, NIP format <code>BK-PP1-xxx</code>, peringatan PKWT &le; 26 hari, dan mutasi internal.</li>
              <li><strong>Calon Karyawan</strong>: Pantau masa pelatihan seleksi, tombol lulus otomatis migrasi ke Database Staff PKWT 1.</li>
              <li><strong>Matriks KPI</strong>: Skoring berkala berbobot (Disiplin 30%, Rendemen 40%, K3 20%, Inisiatif 10%).</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-1 text-xs">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            Sistem HR Staff &amp; Karyawan All Rights Reserved . Divisi Produksi I . Developed by Lalu Mahendra
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Jika menemukan bug atau kendala teknis, silahkan hubungi Developer [Lalu Mahendra]
          </p>
        </div>
      </div>
    </div>
  );
};
