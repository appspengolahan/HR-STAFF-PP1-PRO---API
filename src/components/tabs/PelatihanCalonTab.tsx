import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  UserPlus,
} from 'lucide-react';
import { CalonKaryawan, StaffData } from '../../types';
import { formatTanggalDmy } from '../../utils/dateFormatter';

interface PelatihanCalonTabProps {
  calonList: CalonKaryawan[];
  onAddCalon: (calon: CalonKaryawan) => void;
  onGraduateCalon: (calonId: string, staffData: StaffData) => void;
  onExtendCalon: (calonId: string, newEndDate: string, reason: string) => void;
  onFailCalon: (calonId: string, reason: string) => void;
}

export const PelatihanCalonTab: React.FC<PelatihanCalonTabProps> = ({
  calonList,
  onAddCalon,
  onGraduateCalon,
  onExtendCalon,
  onFailCalon,
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedCalon, setSelectedCalon] = useState<CalonKaryawan | null>(null);

  // New Calon Form
  const [namaCalon, setNamaCalon] = useState('');
  const [proyeksi, setProyeksi] = useState('');
  const [sekup, setSekup] = useState<'Operasional' | 'Administrasi'>('Operasional');
  const [tglMulai, setTglMulai] = useState(new Date().toISOString().split('T')[0]);
  const [tglAkhir, setTglAkhir] = useState('');
  const [catatan, setCatatan] = useState('');

  // Status Action Modal State
  const [actionStatus, setActionStatus] = useState<'Lolos' | 'Diperpanjang' | 'Tidak Lolos'>('Lolos');
  const [gradJabatan, setGradJabatan] = useState('');
  const [gradGp, setGradGp] = useState<number>(3900000);
  const [gradTunjangan, setGradTunjangan] = useState<number>(600000);
  const [extEndDate, setExtEndDate] = useState('');
  const [reasonText, setReasonText] = useState('');

  const handleCreateCalon = (e: React.FormEvent) => {
    e.preventDefault();
    const d1 = new Date(tglMulai);
    const d2 = new Date(tglAkhir);
    const durasi = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const today = new Date();
    const sisa = Math.ceil((d2.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const newCalon: CalonKaryawan = {
      id: `cln-${Date.now()}`,
      nama: namaCalon.trim(),
      proyeksiJabatan: proyeksi.trim(),
      sekup,
      tanggalMulai: tglMulai,
      tanggalAkhir: tglAkhir,
      durasiHari: durasi,
      sisaHari: sisa,
      statusPelatihan: 'Sedang Berjalan',
      jumlahPerpanjangan: 0,
      catatan,
      diinputOleh: 'Fitri Handayani',
      alert: sisa < 10,
    };

    onAddCalon(newCalon);
    setIsAddOpen(false);
    setNamaCalon('');
    setProyeksi('');
  };

  const handleProcessStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCalon) return;

    if (actionStatus === 'Lolos') {
      const newStaff: StaffData = {
        id: Date.now(),
        nip: `BK-PP1-${Math.floor(100 + Math.random() * 900)}`,
        nama: selectedCalon.nama,
        status: 'PKWT 1',
        jabatan: gradJabatan || selectedCalon.proyeksiJabatan,
        level: 'Staff',
        sekup: selectedCalon.sekup,
        statusAktif: 'Aktif',
        jk: 'Laki-laki',
        nik: '3507000000000000',
        email: `${selectedCalon.nama.toLowerCase().replace(/\s+/g, '.')}@batukarang.co.id`,
        bank: 'BCA',
        rekening: '0000000000',
        telp: '081200000000',
        domisili: 'Malang',
        pendidikanTerakhir: 'SMA/SMK',
        gajiPokok: gradGp,
        tunjanganJabatan: gradTunjangan,
        totalGaji: gradGp + gradTunjangan,
        statusPTKP: 'TK/0',
        bpjsKesehatanNominal: 100000,
        awalPKWT: new Date().toISOString().split('T')[0],
        akhirPKWT: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        shiftDefault: 'Shift 1',
      };
      onGraduateCalon(selectedCalon.id, newStaff);
    } else if (actionStatus === 'Diperpanjang') {
      onExtendCalon(selectedCalon.id, extEndDate, reasonText);
    } else if (actionStatus === 'Tidak Lolos') {
      onFailCalon(selectedCalon.id, reasonText);
    }

    setSelectedCalon(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-900 dark:text-emerald-300 leading-relaxed no-print flex items-start gap-3 shadow-xs">
        <GraduationCap className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong>Masa Pelatihan &amp; Seleksi Calon Karyawan:</strong> Calon karyawan menjalani masa evaluasi teknis. Status <strong>"Lolos"</strong> otomatis memindahkan data pelamar menjadi staf aktif (status awal PKWT 1). Status <strong>"Tidak Lolos"</strong> akan mengosongkan baris dari daftar aktif dan mencatat jejak audit ke riwayat.
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between no-print bg-slate-50/50 dark:bg-slate-950/30">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Daftar Calon Karyawan Dalam Masa Pelatihan ({calonList.length} Orang)
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Calon Baru
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Nama Calon</th>
                <th className="py-3 px-4">Proyeksi Jabatan</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4 font-mono">Tgl Mulai</th>
                <th className="py-3 px-4 font-mono">Tgl Akhir</th>
                <th className="py-3 px-4 text-center">Durasi</th>
                <th className="py-3 px-4 text-center">Sisa Waktu</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right no-print">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {calonList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada calon karyawan yang sedang dalam masa pelatihan seleksi.
                  </td>
                </tr>
              ) : (
                calonList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {item.nama}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {item.proyeksiJabatan}
                    </td>
                    <td className="py-3 px-4">{item.sekup}</td>
                    <td className="py-3 px-4 font-mono">{formatTanggalDmy(item.tanggalMulai)}</td>
                    <td className="py-3 px-4 font-mono">{formatTanggalDmy(item.tanggalAkhir)}</td>
                    <td className="py-3 px-4 text-center">{item.durasiHari} Hari</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.alert
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 animate-pulse'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {item.sisaHari <= 0 ? 'Hari Terakhir' : `${item.sisaHari} Hari`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {item.statusPelatihan}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right no-print">
                      <button
                        onClick={() => {
                          setSelectedCalon(item);
                          setGradJabatan(item.proyeksiJabatan);
                        }}
                        className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Calon Baru */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Tambah Calon Karyawan Pelatihan Baru
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCalon} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nama Lengkap Calon</label>
                <input
                  type="text"
                  required
                  placeholder="Ketik nama pelamar..."
                  value={namaCalon}
                  onChange={(e) => setNamaCalon(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Proyeksi Jabatan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Operator Rotary..."
                    value={proyeksi}
                    onChange={(e) => setProyeksi(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Unit</label>
                  <select
                    value={sekup}
                    onChange={(e) => setSekup(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  >
                    <option value="Operasional">Operasional</option>
                    <option value="Administrasi">Administrasi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Tanggal Mulai Pelatihan</label>
                  <input
                    type="date"
                    required
                    value={tglMulai}
                    onChange={(e) => setTglMulai(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tanggal Akhir Pelatihan</label>
                  <input
                    type="date"
                    required
                    value={tglAkhir}
                    onChange={(e) => setTglAkhir(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  placeholder="Program magang, pelatihan K3..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Simpan Calon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Update Status Calon */}
      {selectedCalon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Evaluasi Akhir Masa Pelatihan
                </h3>
                <p className="text-xs text-slate-500">
                  Calon: <strong>{selectedCalon.nama}</strong> ({selectedCalon.proyeksiJabatan})
                </p>
              </div>
              <button
                onClick={() => setSelectedCalon(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessStatus} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Keputusan Status Baru</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Lolos', 'Diperpanjang', 'Tidak Lolos'] as const).map((st) => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setActionStatus(st)}
                      className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all ${
                        actionStatus === st
                          ? st === 'Lolos'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : st === 'Diperpanjang'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                            : 'bg-red-600 text-white border-red-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {actionStatus === 'Lolos' && (
                <div className="space-y-3 p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl">
                  <div className="font-bold text-emerald-800 dark:text-emerald-300">
                    Konfigurasi Masuk Database Karyawan (Status PKWT 1)
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Jabatan Resmi Definitif</label>
                    <input
                      type="text"
                      required
                      value={gradJabatan}
                      onChange={(e) => setGradJabatan(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Gaji Pokok Awal (Rp)</label>
                      <input
                        type="number"
                        required
                        value={gradGp}
                        onChange={(e) => setGradGp(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Tunjangan Jabatan (Rp)</label>
                      <input
                        type="number"
                        required
                        value={gradTunjangan}
                        onChange={(e) => setGradTunjangan(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {actionStatus === 'Diperpanjang' && (
                <div className="space-y-3 p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl">
                  <div>
                    <label className="block font-semibold mb-1">Tanggal Akhir Baru</label>
                    <input
                      type="date"
                      required
                      value={extEndDate}
                      onChange={(e) => setExtEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Alasan Perpanjangan Pelatihan</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Membutuhkan pendalaman materi SOP mesin krosok..."
                      value={reasonText}
                      onChange={(e) => setReasonText(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg"
                    />
                  </div>
                </div>
              )}

              {actionStatus === 'Tidak Lolos' && (
                <div className="space-y-3 p-3.5 bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl">
                  <div>
                    <label className="block font-semibold mb-1">Alasan Tidak Lolos Seleksi</label>
                    <input
                      type="text"
                      required
                      placeholder="Catatan hasil evaluasi kompetensi..."
                      value={reasonText}
                      onChange={(e) => setReasonText(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg"
                    />
                  </div>
                  <p className="text-[11px] text-red-600">
                    * Baris ini akan dikosongkan dari daftar calon dan diarsipkan secara aman di riwayat pelatihan.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCalon(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Konfirmasi Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
