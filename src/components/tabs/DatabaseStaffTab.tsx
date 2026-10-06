import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Printer,
  Edit3,
  Trash2,
  AlertTriangle,
  GitPullRequest,
  CheckCircle2,
  FileText,
  UserCheck,
} from 'lucide-react';
import { StaffData, MutasiRecord } from '../../types';
import { formatRupiah } from '../../services/payrollEngine';
import { PkwtAlertCard, parsePkwtDate } from '../PkwtAlertCard';
import { formatTanggalIndo } from '../../utils/dateFormatter';

interface DatabaseStaffTabProps {
  staffList: StaffData[];
  onAddStaff: (staff: StaffData) => void;
  onUpdateStaff: (nip: string, patch: Partial<StaffData>) => void;
  onDeleteStaff: (nip: string) => void;
  onAddMutasi: (mutasi: MutasiRecord) => void;
  onViewProfile: (nip: string) => void;
}

export const DatabaseStaffTab: React.FC<DatabaseStaffTabProps> = ({
  staffList,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  onAddMutasi,
  onViewProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSekup, setFilterSekup] = useState<'Semua' | 'Operasional' | 'Administrasi'>('Semua');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [filterPendidikan, setFilterPendidikan] = useState<string>('Semua');

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffData | null>(null);
  const [selectedStaffForMutasi, setSelectedStaffForMutasi] = useState<StaffData | null>(null);

  // Edit Staff Form State
  const [editNama, setEditNama] = useState('');
  const [editJabatan, setEditJabatan] = useState('');
  const [editLevel, setEditLevel] = useState('Staff');
  const [editSekup, setEditSekup] = useState<'Operasional' | 'Administrasi'>('Operasional');
  const [editStatus, setEditStatus] = useState<'MAGANG' | 'PKWT 1' | 'PKWT 2' | 'PKWT 3' | 'PKWT 4' | 'PKWT 5' | 'PKWT 6' | 'PKWT 7' | 'TETAP'>('PKWT 1');
  const [editPendidikan, setEditPendidikan] = useState<'SD' | 'SMP' | 'SMA/SMK' | 'D1' | 'D2' | 'D3' | 'D4' | 'S1' | 'S2' | 'S3'>('SMA/SMK');
  const [editDomisili, setEditDomisili] = useState('Malang');
  const [editTelp, setEditTelp] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editGp, setEditGp] = useState<number>(0);
  const [editTunjangan, setEditTunjangan] = useState<number>(0);
  const [editPtkp, setEditPtkp] = useState('TK/0');

  // New Staff Form State
  const [formNama, setFormNama] = useState('');
  const [formNip, setFormNip] = useState(`BK-PP1-${String(staffList.length + 1).padStart(3, '0')}`);
  const [formJabatan, setFormJabatan] = useState('');
  const [formLevel, setFormLevel] = useState('Staff');
  const [formSekup, setFormSekup] = useState<'Operasional' | 'Administrasi'>('Operasional');
  const [formStatus, setFormStatus] = useState<'MAGANG' | 'PKWT 1' | 'PKWT 2' | 'PKWT 3' | 'PKWT 4' | 'PKWT 5' | 'PKWT 6' | 'PKWT 7' | 'TETAP'>('PKWT 1');
  const [formJk, setFormJk] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [formNik, setFormNik] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelp, setFormTelp] = useState('');
  const [formDomisili, setFormDomisili] = useState('Malang');
  const [formPendidikan, setFormPendidikan] = useState<'SD' | 'SMP' | 'SMA/SMK' | 'D1' | 'D2' | 'D3' | 'D4' | 'S1' | 'S2' | 'S3'>('SMA/SMK');
  const [formGp, setFormGp] = useState<number>(3900000);
  const [formTunjangan, setFormTunjangan] = useState<number>(600000);
  const [formPtkp, setFormPtkp] = useState<'TK/0' | 'TK/1' | 'TK/2' | 'TK/3' | 'K/0' | 'K/1' | 'K/2' | 'K/3'>('TK/0');
  const [formBpjsKes, setFormBpjsKes] = useState<number>(100000);
  const [formAwalPkwt, setFormAwalPkwt] = useState(new Date().toISOString().split('T')[0]);
  const [formAkhirPkwt, setFormAkhirPkwt] = useState('');

  // Mutasi Form State
  const [mutJenis, setMutJenis] = useState<
    'Jabatan' | 'Level/Kategori' | 'Sekup' | 'Status Kepegawaian' | 'Status Aktif' | 'Gaji Pokok' | 'Tunjangan Jabatan'
  >('Jabatan');
  const [mutTanggal, setMutTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [mutNilaiBaru, setMutNilaiBaru] = useState('');
  const [mutKeterangan, setMutKeterangan] = useState('');

  // Filtered List
  const filtered = useMemo(() => {
    return staffList.filter((s) => {
      const matchSekup = filterSekup === 'Semua' ? true : s.sekup === filterSekup;
      const matchStatus = filterStatus === 'Semua' ? true : s.status === filterStatus;
      const matchPendidikan = filterPendidikan === 'Semua' ? true : s.pendidikanTerakhir === filterPendidikan;
      const matchSearch =
        s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nip.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.jabatan.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSekup && matchStatus && matchPendidikan && matchSearch;
    });
  }, [staffList, filterSekup, filterStatus, filterPendidikan, searchQuery]);

  const handleOpenEdit = (st: StaffData) => {
    setEditingStaff(st);
    setEditNama(st.nama);
    setEditJabatan(st.jabatan);
    setEditLevel(st.level);
    setEditSekup(st.sekup);
    setEditStatus(st.status);
    setEditPendidikan(st.pendidikanTerakhir || 'SMA/SMK');
    setEditDomisili(st.domisili || 'Malang');
    setEditTelp(st.telp || '');
    setEditEmail(st.email || '');
    setEditGp(st.gajiPokok || 0);
    setEditTunjangan(st.tunjanganJabatan || 0);
    setEditPtkp(st.statusPTKP || 'TK/0');
    setIsEditOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    onUpdateStaff(editingStaff.nip, {
      nama: editNama.trim(),
      jabatan: editJabatan.trim(),
      level: editLevel,
      sekup: editSekup,
      status: editStatus,
      pendidikanTerakhir: editPendidikan,
      domisili: editDomisili.trim(),
      telp: editTelp.trim(),
      email: editEmail.trim(),
      gajiPokok: editGp,
      tunjanganJabatan: editTunjangan,
      totalGaji: editGp + editTunjangan,
      statusPTKP: editPtkp,
    });
    setIsEditOpen(false);
    setEditingStaff(null);
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const newStaff: StaffData = {
      id: staffList.length ? Math.max(...staffList.map((s) => s.id)) + 1 : 1,
      nip: formNip.trim().toUpperCase(),
      nama: formNama.trim(),
      jabatan: formJabatan.trim(),
      level: formLevel,
      sekup: formSekup,
      status: formStatus,
      statusAktif: 'Aktif',
      jk: formJk,
      nik: formNik.trim() || '3507000000000000',
      email: formEmail.trim(),
      bank: 'BCA',
      rekening: '0000000000',
      telp: formTelp.trim(),
      domisili: formDomisili.trim(),
      pendidikanTerakhir: formPendidikan,
      gajiPokok: formGp,
      tunjanganJabatan: formTunjangan,
      totalGaji: formGp + formTunjangan,
      statusPTKP: formPtkp,
      bpjsKesehatanNominal: formBpjsKes,
      awalPKWT: formAwalPkwt,
      akhirPKWT: formStatus === 'TETAP' ? 'Tidak berlaku (TETAP)' : formAkhirPkwt,
      shiftDefault: 'Shift 1',
    };

    onAddStaff(newStaff);
    setIsAddOpen(false);
    setFormNama('');
    setFormJabatan('');
  };

  const handleApplyMutasi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForMutasi) return;

    let nilaiLama = '';
    if (mutJenis === 'Jabatan') nilaiLama = selectedStaffForMutasi.jabatan;
    else if (mutJenis === 'Level/Kategori') nilaiLama = selectedStaffForMutasi.level;
    else if (mutJenis === 'Sekup') nilaiLama = selectedStaffForMutasi.sekup;
    else if (mutJenis === 'Status Kepegawaian') nilaiLama = selectedStaffForMutasi.status;
    else if (mutJenis === 'Status Aktif') nilaiLama = selectedStaffForMutasi.statusAktif;
    else if (mutJenis === 'Gaji Pokok') nilaiLama = String(selectedStaffForMutasi.gajiPokok);
    else if (mutJenis === 'Tunjangan Jabatan') nilaiLama = String(selectedStaffForMutasi.tunjanganJabatan);

    const todayStr = new Date().toISOString().split('T')[0];
    const isFuture = mutTanggal > todayStr;

    const mutasiRec: MutasiRecord = {
      id: `mut-${Date.now()}`,
      tanggalEfektif: mutTanggal,
      nip: selectedStaffForMutasi.nip,
      nama: selectedStaffForMutasi.nama,
      jenisMutasi: mutJenis,
      nilaiLama,
      nilaiBaru: mutNilaiBaru,
      keterangan: mutKeterangan,
      diinputOleh: 'Lalu Mahendra Ali Akbar',
      status: isFuture ? 'Terjadwal' : 'Diterapkan',
    };

    onAddMutasi(mutasiRec);

    // If effective today or past, apply immediately
    if (!isFuture) {
      const patch: Partial<StaffData> = {};
      if (mutJenis === 'Jabatan') patch.jabatan = mutNilaiBaru;
      else if (mutJenis === 'Level/Kategori') patch.level = mutNilaiBaru;
      else if (mutJenis === 'Sekup') patch.sekup = mutNilaiBaru as 'Operasional' | 'Administrasi';
      else if (mutJenis === 'Status Kepegawaian') patch.status = mutNilaiBaru as any;
      else if (mutJenis === 'Status Aktif') patch.statusAktif = mutNilaiBaru as 'Aktif' | 'Non Aktif';
      else if (mutJenis === 'Gaji Pokok') patch.gajiPokok = Number(mutNilaiBaru) || 0;
      else if (mutJenis === 'Tunjangan Jabatan') patch.tunjanganJabatan = Number(mutNilaiBaru) || 0;

      onUpdateStaff(selectedStaffForMutasi.nip, patch);
    }

    setSelectedStaffForMutasi(null);
    setMutNilaiBaru('');
    setMutKeterangan('');
  };

  const handleExportPdf = () => {
    const originalTitle = document.title;
    document.title = `HR Karyawan - Divisi Produksi I - Master Database Staf Karyawan`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Alert PKWT Segera Berakhir (<= 26 Hari) */}
      <PkwtAlertCard
        staffList={staffList}
        onActionClick={(nip) => {
          const st = staffList.find((s) => s.nip === nip);
          if (st) {
            setSelectedStaffForMutasi(st);
            setMutNilaiBaru(st.jabatan);
          }
        }}
        actionLabel="Perpanjang / Mutasi"
      />

      {/* Top Main Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 no-print bg-slate-50/50 dark:bg-slate-950/30">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari NIP, nama, jabatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
              />
            </div>

            <div>
              <select
                value={filterSekup}
                onChange={(e) => setFilterSekup(e.target.value as any)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
              >
                <option value="Semua">Unit: Semua</option>
                <option value="Operasional">Operasional</option>
                <option value="Administrasi">Administrasi</option>
              </select>
            </div>

            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
              >
                <option value="Semua">Status: Semua</option>
                <option value="TETAP">TETAP</option>
                <option value="PKWT 1">PKWT 1</option>
                <option value="PKWT 2">PKWT 2</option>
                <option value="PKWT 3">PKWT 3</option>
                <option value="MAGANG">MAGANG</option>
              </select>
            </div>

            <div>
              <select
                value={filterPendidikan}
                onChange={(e) => setFilterPendidikan(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
              >
                <option value="Semua">Pendidikan: Semua</option>
                <option value="S1">S1</option>
                <option value="D4">D4</option>
                <option value="D3">D3</option>
                <option value="SMA/SMK">SMA/SMK</option>
                <option value="SMP">SMP</option>
                <option value="SD">SD</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah Staf Baru
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
            MASTER DATABASE KARYAWAN &amp; STAF KANTOR (DIVISI PRODUKSI I)
          </div>
          <div className="text-xs text-center text-slate-600">
            PT Batu Karang — Data Per Tanggal {formatTanggalIndo(new Date(), true)}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3 font-mono">NIP</th>
                <th className="py-3 px-3">Nama Karyawan</th>
                <th className="py-3 px-3">Jabatan &amp; Level</th>
                <th className="py-3 px-3">Pendidikan</th>
                <th className="py-3 px-3">Unit</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Gaji Pokok</th>
                <th className="py-3 px-3">PTKP</th>
                <th className="py-3 px-3">Akhir PKWT</th>
                <th className="py-3 px-3 text-right no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((st) => {
                const isTetap = st.status === 'TETAP';
                return (
                  <tr key={st.nip} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {st.nip}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {st.nama}
                      <span className="block text-[10px] text-slate-400 font-normal">{st.email}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{st.jabatan}</div>
                      <div className="text-[10px] text-slate-400">{st.level}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-mono">
                        {st.pendidikanTerakhir || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-3">{st.sekup}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isTetap
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {st.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                      {formatRupiah(st.gajiPokok)}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">{st.statusPTKP}</td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      <div>{st.akhirPKWT || '-'}</div>
                      {!isTetap && st.akhirPKWT && (() => {
                        const date = parsePkwtDate(st.akhirPKWT);
                        if (date) {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          date.setHours(0, 0, 0, 0);
                          const diff = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          if (diff <= 26) {
                            return (
                              <span
                                className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  diff < 0
                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                }`}
                              >
                                {diff} hari
                              </span>
                            );
                          }
                        }
                        return null;
                      })()}
                    </td>
                    <td className="py-3 px-3 text-right no-print">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewProfile(st.nip)}
                          title="Lihat Profil & Arsip Dokumen"
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-semibold transition-colors"
                        >
                          Profil
                        </button>
                        <button
                          onClick={() => handleOpenEdit(st)}
                          title="Edit Data Staf & Pendidikan Terakhir"
                          className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStaffForMutasi(st);
                            setMutNilaiBaru(st.jabatan);
                          }}
                          title="Ajukan Mutasi Jabatan / Gaji"
                          className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <GitPullRequest className="w-3 h-3" />
                          Mutasi
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus ${st.nama} (${st.nip})? Data akan diarsipkan.`)) {
                              onDeleteStaff(st.nip);
                            }
                          }}
                          title="Hapus / Nonaktifkan"
                          className="p-1 text-slate-400 hover:text-red-500 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Print Footer */}
        <div className="hidden print:block p-4 border-t border-black text-right text-xs font-semibold">
          Divisi Produksi I - All Rights Reserved
        </div>
      </div>

      {/* Modal Tambah Staf Baru */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Registrasi Staf Karyawan Baru
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">NIP (Format: BK-PP1-xxx)</label>
                  <input
                    type="text"
                    required
                    value={formNip}
                    onChange={(e) => setFormNip(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg uppercase font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama staf..."
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Jabatan Resmi</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Teknisi Elektrikal..."
                    value={formJabatan}
                    onChange={(e) => setFormJabatan(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Level / Kategori</label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  >
                    <option value="Staff">Staff</option>
                    <option value="Foreman">Foreman</option>
                    <option value="Koordinator">Koordinator</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Manajer">Manajer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Unit / Sekup</label>
                  <select
                    value={formSekup}
                    onChange={(e) => setFormSekup(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  >
                    <option value="Operasional">Operasional</option>
                    <option value="Administrasi">Administrasi</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Status Kepegawaian</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  >
                    <option value="MAGANG">MAGANG</option>
                    <option value="PKWT 1">PKWT 1</option>
                    <option value="PKWT 2">PKWT 2</option>
                    <option value="PKWT 3">PKWT 3</option>
                    <option value="TETAP">TETAP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Gaji Pokok (GP)</label>
                  <input
                    type="number"
                    required
                    value={formGp}
                    onChange={(e) => setFormGp(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tunjangan Jabatan</label>
                  <input
                    type="number"
                    required
                    value={formTunjangan}
                    onChange={(e) => setFormTunjangan(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Status PTKP</label>
                  <select
                    value={formPtkp}
                    onChange={(e) => setFormPtkp(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-semibold"
                  >
                    <option value="TK/0">TK/0</option>
                    <option value="TK/1">TK/1</option>
                    <option value="TK/2">TK/2</option>
                    <option value="TK/3">TK/3</option>
                    <option value="K/0">K/0</option>
                    <option value="K/1">K/1</option>
                    <option value="K/2">K/2</option>
                    <option value="K/3">K/3</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Nominal BPJS Kes (Rp)</label>
                  <input
                    type="number"
                    required
                    value={formBpjsKes}
                    onChange={(e) => setFormBpjsKes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Awal PKWT</label>
                  <input
                    type="date"
                    value={formAwalPkwt}
                    onChange={(e) => setFormAwalPkwt(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Akhir PKWT</label>
                  <input
                    type="date"
                    disabled={formStatus === 'TETAP'}
                    value={formAkhirPkwt}
                    onChange={(e) => setFormAkhirPkwt(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">No. WhatsApp</label>
                  <input
                    type="tel"
                    value={formTelp}
                    onChange={(e) => setFormTelp(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Simpan Staf Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajukan Mutasi Staf */}
      {selectedStaffForMutasi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Ajukan Mutasi / Promosi Staf
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedStaffForMutasi.nama} ({selectedStaffForMutasi.nip})
                </p>
              </div>
              <button
                onClick={() => setSelectedStaffForMutasi(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyMutasi} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Jenis Mutasi</label>
                  <select
                    value={mutJenis}
                    onChange={(e) => setMutJenis(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-semibold"
                  >
                    <option value="Jabatan">Jabatan</option>
                    <option value="Level/Kategori">Level/Kategori</option>
                    <option value="Sekup">Sekup (Operasional/Admin)</option>
                    <option value="Status Kepegawaian">Status Kepegawaian</option>
                    <option value="Gaji Pokok">Gaji Pokok</option>
                    <option value="Tunjangan Jabatan">Tunjangan Jabatan</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tanggal Efektif</label>
                  <input
                    type="date"
                    required
                    value={mutTanggal}
                    onChange={(e) => setMutTanggal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Nilai Baru</label>
                <input
                  type="text"
                  required
                  placeholder="Nilai baru yang akan diterapkan..."
                  value={mutNilaiBaru}
                  onChange={(e) => setMutNilaiBaru(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Keterangan / Alasan Mutasi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Promosi jabatan hasil penilaian kinerja Q3..."
                  value={mutKeterangan}
                  onChange={(e) => setMutKeterangan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
              </div>

              <p className="text-[11px] text-slate-500 italic">
                * Jika tanggal efektif adalah di masa depan, mutasi akan berstatus <strong>"Terjadwal"</strong> dan otomatis diterapkan saat tanggal tersebut tiba.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedStaffForMutasi(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Simpan Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Data Staf (Termasuk Pendidikan Terakhir) */}
      {isEditOpen && editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Edit Data Staf: {editingStaff.nama}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    NIP: {editingStaff.nip}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditOpen(false);
                  setEditingStaff(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={editNama}
                    onChange={(e) => setEditNama(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-blue-600 dark:text-blue-400">
                    Pendidikan Terakhir *
                  </label>
                  <select
                    value={editPendidikan}
                    onChange={(e) => setEditPendidikan(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-blue-400 dark:border-blue-600 rounded-lg font-bold"
                  >
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA/SMK">SMA/SMK</option>
                    <option value="D1">D1</option>
                    <option value="D2">D2</option>
                    <option value="D3">D3</option>
                    <option value="D4">D4</option>
                    <option value="S1">S1</option>
                    <option value="S2">S2</option>
                    <option value="S3">S3</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Jabatan Resmi</label>
                  <input
                    type="text"
                    required
                    value={editJabatan}
                    onChange={(e) => setEditJabatan(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Level / Grade</label>
                  <input
                    type="text"
                    value={editLevel}
                    onChange={(e) => setEditLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Unit / Sekup Kerja</label>
                  <select
                    value={editSekup}
                    onChange={(e) => setEditSekup(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  >
                    <option value="Operasional">Operasional</option>
                    <option value="Administrasi">Administrasi</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Status Kepegawaian</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  >
                    <option value="TETAP">TETAP</option>
                    <option value="PKWT 1">PKWT 1</option>
                    <option value="PKWT 2">PKWT 2</option>
                    <option value="PKWT 3">PKWT 3</option>
                    <option value="PKWT 4">PKWT 4</option>
                    <option value="PKWT 5">PKWT 5</option>
                    <option value="PKWT 6">PKWT 6</option>
                    <option value="PKWT 7">PKWT 7</option>
                    <option value="MAGANG">MAGANG</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Domisili</label>
                  <input
                    type="text"
                    value={editDomisili}
                    onChange={(e) => setEditDomisili(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={editTelp}
                    onChange={(e) => setEditTelp(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block font-semibold mb-1">Gaji Pokok (Rp)</label>
                  <input
                    type="number"
                    value={editGp}
                    onChange={(e) => setEditGp(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tunjangan Jabatan (Rp)</label>
                  <input
                    type="number"
                    value={editTunjangan}
                    onChange={(e) => setEditTunjangan(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Status PTKP</label>
                  <input
                    type="text"
                    value={editPtkp}
                    onChange={(e) => setEditPtkp(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditingStaff(null);
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
