import React, { useState, useMemo } from 'react';
import {
  CalendarCheck2,
  Plus,
  Printer,
  Search,
  Filter,
  FileText,
  Clock,
  Trash2,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Edit3,
  X,
  Check,
} from 'lucide-react';
import { PresensiRecord, StaffData, JenisIjin } from '../../types';
import { NAMA_BULAN_INDO } from '../../services/payrollEngine';
import { SuratIjinModal } from '../modals/SuratIjinModal';
import { getNamaHariIndo } from '../../utils/dateFormatter';

interface PresensiTabProps {
  presensiList: PresensiRecord[];
  staffList: StaffData[];
  onAddPresensi: (rec: PresensiRecord) => void;
  onAddPresensiBatch: (records: PresensiRecord[]) => void;
  onUpdatePresensi?: (id: string, updatedRec: Partial<PresensiRecord>) => void;
  onDeletePresensi: (id: string) => void;
  currentUserNip?: string;
  isStaffPortal?: boolean;
}

const JENIS_IJIN_OPTIONS: JenisIjin[] = [
  'Sakit (S Dokter)',
  'Sakit (S Tangan)',
  'Ijin Normatif',
  'Ijin (S Tangan)',
  'Ijin Terlambat',
  'Ijin Keluar Sementara',
  'Ijin Pulang Awal',
  'Alpha',
  'Hadir',
];

export const PresensiTab: React.FC<PresensiTabProps> = ({
  presensiList,
  staffList,
  onAddPresensiBatch,
  onUpdatePresensi,
  onDeletePresensi,
  currentUserNip,
  isStaffPortal = false,
}) => {
  const now = new Date();
  const [filterBulan, setFilterBulan] = useState<number>(now.getMonth() + 1);
  const [filterTahun, setFilterTahun] = useState<number>(now.getFullYear());
  const [filterNama, setFilterNama] = useState<string>(isStaffPortal && currentUserNip ? currentUserNip : '');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formTglAwal, setFormTglAwal] = useState(now.toISOString().split('T')[0]);
  const [formTglAkhir, setFormTglAkhir] = useState('');
  const [formStaffNip, setFormStaffNip] = useState(isStaffPortal && currentUserNip ? currentUserNip : '');
  const [formJenisIjin, setFormJenisIjin] = useState<JenisIjin>('Ijin Terlambat');
  const [formSehariPenuh, setFormSehariPenuh] = useState(false);
  const [formJamAwal, setFormJamAwal] = useState('08:00');
  const [formJamAkhir, setFormJamAkhir] = useState('10:00');
  const [formKeperluan, setFormKeperluan] = useState('');
  const [formLampiran, setFormLampiran] = useState<'Ya' | 'Tidak'>('Tidak');
  const [formCatatan, setFormCatatan] = useState('');

  // Surat Ijin Modal
  const [selectedRecordForSurat, setSelectedRecordForSurat] = useState<PresensiRecord | null>(null);

  // Edit Record State
  const [selectedRecordForEdit, setSelectedRecordForEdit] = useState<PresensiRecord | null>(null);
  const [editTanggal, setEditTanggal] = useState('');
  const [editStaffNip, setEditStaffNip] = useState('');
  const [editJenisIjin, setEditJenisIjin] = useState<JenisIjin>('Ijin Terlambat');
  const [editJamAwal, setEditJamAwal] = useState('08:00');
  const [editJamAkhir, setEditJamAkhir] = useState('10:00');
  const [editDurasiMenit, setEditDurasiMenit] = useState(120);
  const [editFaktorPotongan, setEditFaktorPotongan] = useState(0);
  const [editKeperluan, setEditKeperluan] = useState('');
  const [editLampiranSurat, setEditLampiranSurat] = useState<'Ya' | 'Tidak'>('Tidak');
  const [editCatatan, setEditCatatan] = useState('');

  const handleOpenEditModal = (rec: PresensiRecord) => {
    setSelectedRecordForEdit(rec);
    const rawTgl = rec.tanggal;
    let isoDate = rawTgl;
    if (rawTgl.includes('/')) {
      const p = rawTgl.split('/');
      if (p.length === 3) {
        isoDate = `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
      }
    }
    setEditTanggal(isoDate);
    setEditStaffNip(rec.nip);
    setEditJenisIjin(rec.jenisIjin);
    setEditJamAwal(rec.jamAwal || '');
    setEditJamAkhir(rec.jamAkhir || '');
    setEditDurasiMenit(rec.durasiMenit || 0);
    setEditFaktorPotongan(rec.faktorPotongan || 0);
    setEditKeperluan(rec.keperluan || '');
    setEditLampiranSurat(rec.lampiranSurat || 'Tidak');
    setEditCatatan(rec.catatan || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForEdit) return;

    const st = staffList.find((s) => s.nip === editStaffNip);
    const d = new Date(editTanggal);
    const bulan = !isNaN(d.getTime()) ? d.getMonth() + 1 : selectedRecordForEdit.bulan;
    const tahun = !isNaN(d.getTime()) ? d.getFullYear() : selectedRecordForEdit.tahun;
    const hari = getNamaHariIndo(editTanggal);

    const updated: Partial<PresensiRecord> = {
      tanggal: editTanggal,
      hari,
      nip: editStaffNip,
      nama: st?.nama || selectedRecordForEdit.nama,
      jenisIjin: editJenisIjin,
      jamAwal: editJamAwal,
      jamAkhir: editJamAkhir,
      durasiMenit: Number(editDurasiMenit) || 0,
      faktorPotongan: Number(editFaktorPotongan) || 0,
      keperluan: editKeperluan,
      lampiranSurat: editLampiranSurat,
      catatan: editCatatan,
      bulan,
      tahun,
    };

    if (onUpdatePresensi) {
      onUpdatePresensi(selectedRecordForEdit.id, updated);
    }
    setSelectedRecordForEdit(null);
  };

  // Compute Faktor Potongan automatically
  const computeFaktor = (jenis: JenisIjin, durasiMenit: number): number => {
    if (jenis === 'Hadir' || jenis === 'Sakit (S Dokter)' || jenis === 'Ijin Normatif') return 0;
    if (jenis === 'Sakit (S Tangan)' || jenis === 'Ijin (S Tangan)' || jenis === 'Alpha') return 1;
    if (
      jenis === 'Ijin Terlambat' ||
      jenis === 'Ijin Keluar Sementara' ||
      jenis === 'Ijin Pulang Awal'
    ) {
      if (durasiMenit <= 120) return 0;
      if (durasiMenit < 240) return 0.5;
      return 1;
    }
    return 0;
  };

  // Helper to format date as DD/MM/YYYY
  const formatTanggalDisplay = (tgl: string): string => {
    if (!tgl) return '-';
    if (tgl.includes('/')) return tgl;
    const parts = tgl.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return tgl;
  };

  // Filtered List - Sorted Descending by Date (Terbaru di paling atas, terlama di paling bawah)
  const filteredList = useMemo(() => {
    return presensiList
      .filter((item) => {
        const matchBulan = item.bulan === filterBulan;
        const matchTahun = item.tahun === filterTahun;
        const matchStaff = isStaffPortal
          ? item.nip === currentUserNip
          : filterNama ? item.nip === filterNama : true;
        const matchSearch =
          item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.keperluan && item.keperluan.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchBulan && matchTahun && matchStaff && matchSearch;
      })
      .sort((a, b) => {
        const getTime = (dStr: string) => {
          if (!dStr) return 0;
          if (dStr.includes('/')) {
            const p = dStr.split('/');
            return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0])).getTime();
          }
          return new Date(dStr).getTime();
        };
        const diff = getTime(b.tanggal) - getTime(a.tanggal);
        if (diff !== 0) return diff;
        return (b.rowNum || 0) - (a.rowNum || 0);
      });
  }, [presensiList, filterBulan, filterTahun, filterNama, searchQuery, isStaffPortal, currentUserNip]);

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const st = staffList.find((s) => s.nip === formStaffNip);
    if (!st) {
      alert('Pilih karyawan terlebih dahulu.');
      return;
    }

    const tglAwal = new Date(formTglAwal);
    const tglAkhir = formTglAkhir ? new Date(formTglAkhir) : tglAwal;

    if (tglAkhir < tglAwal) {
      alert('Tanggal Akhir tidak boleh sebelum Tanggal Awal.');
      return;
    }

    const recordsToAdd: PresensiRecord[] = [];
    const cur = new Date(tglAwal);

    while (cur <= tglAkhir) {
      const dayOfWeek = cur.getDay(); // 0 is Sunday
      if (dayOfWeek !== 0) {
        // Skip Minggu (hari kerja Senin-Sabtu)
        const hariNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const hariStr = hariNames[dayOfWeek];
        const dateStr = cur.toISOString().split('T')[0];

        let jamAwal = formJamAwal;
        let jamAkhir = formJamAkhir;
        let durasi = 0;

        if (formSehariPenuh) {
          if (hariStr === 'Sabtu') {
            jamAwal = '08:00';
            jamAkhir = '13:00';
            durasi = 300;
          } else {
            jamAwal = '08:00';
            jamAkhir = '16:00';
            durasi = 420;
          }
        } else {
          // Calculate minutes between jamAwal and jamAkhir
          const [h1, m1] = jamAwal.split(':').map(Number);
          const [h2, m2] = jamAkhir.split(':').map(Number);
          durasi = Math.max(0, (h2 * 60 + m2) - (h1 * 60 + m1));
        }

        const faktor = computeFaktor(formJenisIjin, durasi);

        recordsToAdd.push({
          id: `pr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          tanggal: dateStr,
          hari: hariStr,
          nip: st.nip,
          nama: st.nama,
          jamAwal,
          jamAkhir,
          durasiMenit: durasi,
          jenisIjin: formJenisIjin,
          faktorPotongan: faktor,
          keperluan: formKeperluan,
          lampiranSurat: formLampiran,
          catatan: formCatatan,
          bulan: cur.getMonth() + 1,
          tahun: cur.getFullYear(),
          shift: st.shiftDefault || 'Shift 1',
          geofenceValid: true,
        });
      }
      cur.setDate(cur.getDate() + 1);
    }

    if (recordsToAdd.length === 0) {
      alert('Tidak ada hari kerja dalam rentang tanggal yang dipilih (hanya hari Minggu).');
      return;
    }

    onAddPresensiBatch(recordsToAdd);
    setIsFormOpen(false);
    // Reset form
    setFormKeperluan('');
    setFormCatatan('');
  };

  const handleExportPdf = () => {
    const originalTitle = document.title;
    document.title = `HR Karyawan - Divisi Produksi I - Presensi & Ijin Bulan ${NAMA_BULAN_INDO[filterBulan - 1]} ${filterTahun}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const selectedStaffData = useMemo(() => {
    if (!selectedRecordForSurat) return null;
    return staffList.find((s) => s.nip === selectedRecordForSurat.nip) || null;
  }, [selectedRecordForSurat, staffList]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Policy banner */}
      <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-300 leading-relaxed no-print flex items-start gap-3 shadow-xs">
        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong>Prinsip Presensi Exception-Only (26 Hari Kerja Baku):</strong> Seluruh staf kantor &amp; karyawan tetap otomatis dianggap <strong>Hadir 100%</strong>. Anda hanya perlu menginput pengecualian ketidakhadiran (Sakit, Izin, Terlambat, Alpha). Faktor potongan gaji (0, 0.5, atau 1 hari) terhitung otomatis sesuai durasi.
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Controls (No Print) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 no-print bg-slate-50/50 dark:bg-slate-950/30">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Bulan</label>
              <select
                value={filterBulan}
                onChange={(e) => setFilterBulan(Number(e.target.value))}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-white"
              >
                {NAMA_BULAN_INDO.map((bln, i) => (
                  <option key={bln} value={i + 1}>
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

            {!isStaffPortal && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Nama Staf</label>
                <select
                  value={filterNama}
                  onChange={(e) => setFilterNama(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white max-w-[180px]"
                >
                  <option value="">-- Semua Staf --</option>
                  {staffList.map((s) => (
                    <option key={s.nip} value={s.nip}>
                      {s.nama}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Cari Cepat</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari keperluan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Catat Ijin / Pengecualian
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

        {/* Print Header */}
        <div className="hidden print:block p-4 border-b border-black">
          <div className="text-base font-bold text-center">
            REKAP DAFTAR IJIN &amp; KETIDAKHADIRAN STAF
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
                <th className="py-3 px-4">Hari</th>
                <th className="py-3 px-4">Nama Staf &amp; NIP</th>
                <th className="py-3 px-4">Jenis Ijin</th>
                <th className="py-3 px-4">Jam &amp; Durasi</th>
                <th className="py-3 px-4">Faktor Potongan</th>
                <th className="py-3 px-4">Keperluan</th>
                <th className="py-3 px-4 text-right no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada catatan ijin/ketidakhadiran pada periode ini. Seluruh staf tercatat Hadir Penuh.
                  </td>
                </tr>
              ) : (
                filteredList.map((row) => {
                  let badgeStyle = 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
                  if (row.jenisIjin.startsWith('Sakit')) {
                    badgeStyle = 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
                  } else if (row.jenisIjin === 'Alpha') {
                    badgeStyle = 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
                  }

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-medium">{formatTanggalDisplay(row.tanggal)}</td>
                      <td className="py-3 px-4">{row.hari}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{row.nama}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{row.nip}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeStyle}`}>
                          {row.jenisIjin}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {row.jamAwal && row.jamAkhir ? (
                          <span>
                            {row.jamAwal} – {row.jamAkhir} ({row.durasiMenit}m)
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Sehari penuh</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-mono font-bold ${
                            row.faktorPotongan > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {row.faktorPotongan === 0
                            ? '0 (Dibayar)'
                            : row.faktorPotongan === 0.5
                            ? '0,5 (Setengah Hari)'
                            : '1,0 (Hangus)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {row.keperluan || '-'}
                      </td>
                      <td className="py-3 px-4 text-right no-print">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(row)}
                            title="Edit Data Presensi & Ijin"
                            className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setSelectedRecordForSurat(row)}
                            title="Cetak Formulir Surat Ijin Fisik Resmi (20.5 x 16 cm)"
                            className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Surat Ijin</span>
                          </button>
                          {!isStaffPortal && (
                            <button
                              onClick={() => {
                                if (confirm(`Hapus catatan ijin ${row.nama} tanggal ${row.tanggal}?`)) {
                                  onDeletePresensi(row.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-red-500 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Print Footer */}
        <div className="hidden print:block p-4 border-t border-black text-right text-xs font-semibold">
          Divisi Produksi I - All Rights Reserved
        </div>
      </div>

      {/* Form Add Ijin Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Catat Ijin / Ketidakhadiran Baru
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Tanggal Awal</label>
                  <input
                    type="date"
                    required
                    value={formTglAwal}
                    onChange={(e) => setFormTglAwal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Tanggal Akhir <span className="font-normal text-slate-400">(opsional rentang)</span>
                  </label>
                  <input
                    type="date"
                    value={formTglAkhir}
                    onChange={(e) => setFormTglAkhir(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Karyawan Staf</label>
                <select
                  required
                  value={formStaffNip}
                  onChange={(e) => setFormStaffNip(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs"
                >
                  <option value="">-- Pilih Staf --</option>
                  {staffList.map((s) => (
                    <option key={s.nip} value={s.nip}>
                      {s.nama} ({s.nip} — {s.jabatan})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Jenis Ijin</label>
                <select
                  value={formJenisIjin}
                  onChange={(e) => setFormJenisIjin(e.target.value as JenisIjin)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-semibold"
                >
                  {JENIS_IJIN_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <input
                  type="checkbox"
                  id="sehariPenuhCb"
                  checked={formSehariPenuh}
                  onChange={(e) => setFormSehariPenuh(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="sehariPenuhCb" className="font-medium cursor-pointer">
                  Sehari Penuh (Jam otomatis terisi sesuai jadwal jam kerja resmi)
                </label>
              </div>

              {!formSehariPenuh && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Jam Awal (Masuk/Ijin)</label>
                    <input
                      type="time"
                      value={formJamAwal}
                      onChange={(e) => setFormJamAwal(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Jam Akhir (Selesai/Kembali)</label>
                    <input
                      type="time"
                      value={formJamAkhir}
                      onChange={(e) => setFormJamAkhir(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1">Keperluan / Alasan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sakit demam berobat ke klinik, kendala teknis kendaraan, dinas..."
                  value={formKeperluan}
                  onChange={(e) => setFormKeperluan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Lampiran Surat Resmi</label>
                  <select
                    value={formLampiran}
                    onChange={(e) => setFormLampiran(e.target.value as 'Ya' | 'Tidak')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs"
                  >
                    <option value="Tidak">Tidak</option>
                    <option value="Ya">Ya (Surat Dokter / Tugas)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Catatan Tambahan</label>
                  <input
                    type="text"
                    placeholder="Opsional..."
                    value={formCatatan}
                    onChange={(e) => setFormCatatan(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs"
                  />
                </div>
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Simpan Catatan Ijin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Presensi & Ijin */}
      {selectedRecordForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-500" />
                  <span>Edit Catatan Presensi &amp; Ijin</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedRecordForEdit.nama} ({selectedRecordForEdit.nip})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecordForEdit(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Tanggal Ijin
                  </label>
                  <input
                    type="date"
                    required
                    value={editTanggal}
                    onChange={(e) => setEditTanggal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Karyawan / Staf
                  </label>
                  <select
                    value={editStaffNip}
                    onChange={(e) => setEditStaffNip(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                  >
                    {staffList.map((st) => (
                      <option key={st.nip} value={st.nip}>
                        {st.nama} ({st.nip} - {st.jabatan})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Jenis Ijin / Status
                  </label>
                  <select
                    value={editJenisIjin}
                    onChange={(e) => {
                      const j = e.target.value as JenisIjin;
                      setEditJenisIjin(j);
                      setEditFaktorPotongan(computeFaktor(j, editDurasiMenit));
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-blue-600 dark:text-blue-400"
                  >
                    {JENIS_IJIN_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Faktor Potongan Upah
                  </label>
                  <select
                    value={editFaktorPotongan}
                    onChange={(e) => setEditFaktorPotongan(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold font-mono text-amber-600 dark:text-amber-400"
                  >
                    <option value={0}>0 (Dibayar Penuh / Bebas Potongan)</option>
                    <option value={0.5}>0,5 (Potong Setengah Hari)</option>
                    <option value={1}>1,0 (Hangus 1 Hari Penuh)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Jam Awal
                  </label>
                  <input
                    type="time"
                    value={editJamAwal}
                    onChange={(e) => setEditJamAwal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Jam Akhir
                  </label>
                  <input
                    type="time"
                    value={editJamAkhir}
                    onChange={(e) => setEditJamAkhir(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Durasi (Menit)
                  </label>
                  <input
                    type="number"
                    value={editDurasiMenit}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setEditDurasiMenit(val);
                      setEditFaktorPotongan(computeFaktor(editJenisIjin, val));
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Keperluan / Alasan Ijin
                </label>
                <input
                  type="text"
                  required
                  value={editKeperluan}
                  onChange={(e) => setEditKeperluan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  placeholder="Misal: Ke dokter, Mengantar Manten, Rapat Sekolah"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Lampiran Surat Resmi
                  </label>
                  <select
                    value={editLampiranSurat}
                    onChange={(e) => setEditLampiranSurat(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Tidak">Tidak Ada Lampiran</option>
                    <option value="Ya">Ada Lampiran (Surat Dokter / Undangan)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Catatan Khusus
                  </label>
                  <input
                    type="text"
                    value={editCatatan}
                    onChange={(e) => setEditCatatan(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    placeholder="Opsional"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedRecordForEdit(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Surat Ijin Physical Print Modal */}
      <SuratIjinModal
        isOpen={!!selectedRecordForSurat}
        onClose={() => setSelectedRecordForSurat(null)}
        record={selectedRecordForSurat}
        staff={selectedStaffData}
      />
    </div>
  );
};
