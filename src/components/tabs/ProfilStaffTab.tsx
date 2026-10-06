import React, { useState, useMemo } from 'react';
import {
  UserCircle,
  FileText,
  ExternalLink,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Calendar,
  Building,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { StaffData, PresensiRecord, LinkArsip, AuthUser } from '../../types';
import { formatRupiah, NAMA_BULAN_INDO } from '../../services/payrollEngine';
import { formatTanggalDmy } from '../../utils/dateFormatter';

interface ProfilStaffTabProps {
  staffList: StaffData[];
  presensiList: PresensiRecord[];
  linksList: LinkArsip[];
  onAddLink: (link: LinkArsip) => void;
  onDeleteLink: (id: string) => void;
  selectedStaffNip?: string;
  currentUser: AuthUser | null;
}

export const ProfilStaffTab: React.FC<ProfilStaffTabProps> = ({
  staffList,
  presensiList,
  linksList,
  onAddLink,
  onDeleteLink,
  selectedStaffNip,
  currentUser,
}) => {
  const isStaffPortal = currentUser?.portalType === 'staff';
  const initialNip =
    isStaffPortal && currentUser
      ? currentUser.nip
      : selectedStaffNip || staffList[0]?.nip || 'BK-PP1-001';

  const [activeNip, setActiveNip] = useState<string>(initialNip);

  // Link Form State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const currentStaff = useMemo(() => {
    return staffList.find((s) => s.nip === activeNip) || staffList[0] || null;
  }, [staffList, activeNip]);

  // Links for this staff
  const staffLinks = useMemo(() => {
    if (!currentStaff) return [];
    return linksList.filter((l) => l.nip === currentStaff.nip);
  }, [linksList, currentStaff]);

  // Attendance Progress: Bulan Ini vs Bulan Lalu
  const presensiMetrics = useMemo(() => {
    if (!currentStaff) return null;
    const now = new Date();
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();
    const prevMonth = curMonth > 1 ? curMonth - 1 : 12;
    const prevYear = curMonth > 1 ? curYear : curYear - 1;

    // Filter ijin staf
    const curPresensi = presensiList.filter(
      (p) => p.nip === currentStaff.nip && p.bulan === curMonth && p.tahun === curYear
    );
    const prevPresensi = presensiList.filter(
      (p) => p.nip === currentStaff.nip && p.bulan === prevMonth && p.tahun === prevYear
    );

    const curIjinMenit = curPresensi.reduce((acc, p) => acc + (p.durasiMenit || 0), 0);
    const prevIjinMenit = prevPresensi.reduce((acc, p) => acc + (p.durasiMenit || 0), 0);

    const menitBulan = 10440;
    const curPct = Math.max(0, Math.min(100, ((menitBulan - curIjinMenit) / menitBulan) * 100));
    const prevPct = Math.max(0, Math.min(100, ((menitBulan - prevIjinMenit) / menitBulan) * 100));

    const getIndex = (pct: number) => {
      if (pct >= 95) return { label: 'Baik', color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60' };
      if (pct >= 90) return { label: 'Cukup', color: 'text-amber-600 bg-amber-100 dark:bg-amber-950/60' };
      return { label: 'Kurang', color: 'text-red-600 bg-red-100 dark:bg-red-950/60' };
    };

    let progress: 'Membaik' | 'Menurun' | 'Stabil' = 'Stabil';
    if (curPct - prevPct > 0.5) progress = 'Membaik';
    else if (prevPct - curPct > 0.5) progress = 'Menurun';

    return {
      curMonthName: NAMA_BULAN_INDO[curMonth - 1],
      prevMonthName: NAMA_BULAN_INDO[prevMonth - 1],
      curPct,
      prevPct,
      curIndex: getIndex(curPct),
      prevIndex: getIndex(prevPct),
      progress,
    };
  }, [currentStaff, presensiList]);

  const handleSaveLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStaff) return;
    onAddLink({
      id: `lnk-${Date.now()}`,
      nip: currentStaff.nip,
      nama: currentStaff.nama,
      label: linkLabel.trim(),
      url: linkUrl.trim(),
      tanggalDitambahkan: new Date().toISOString().split('T')[0],
    });
    setIsLinkModalOpen(false);
    setLinkLabel('');
    setLinkUrl('');
  };

  if (!currentStaff) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Selector (Only if not staff portal) */}
      {!isStaffPortal && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-blue-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Pilih Profil Staf untuk Ditampilkan:
            </span>
          </div>

          <select
            value={activeNip}
            onChange={(e) => setActiveNip(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
          >
            {staffList.map((s) => (
              <option key={s.nip} value={s.nip}>
                {s.nama} ({s.nip} — {s.jabatan})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Top Profile Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-900/20 shrink-0">
              {currentStaff.nama.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 dark:text-white">
                  {currentStaff.nama}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  {currentStaff.status}
                </span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                {currentStaff.jabatan} — Divisi Produksi I ({currentStaff.sekup})
              </p>
              <div className="text-[11px] text-slate-400 font-mono mt-1">
                NIP: {currentStaff.nip} | NIK: {currentStaff.nik}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-xl text-xs font-bold ${
                currentStaff.statusAktif === 'Aktif'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              Status: {currentStaff.statusAktif}
            </span>
          </div>
        </div>

        {/* Attendance Index Progress Comparison */}
        {presensiMetrics && (
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Indikator Tingkat Kehadiran Staf (Bulan Lalu vs Bulan Ini)</span>
              <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                Progress:{' '}
                {presensiMetrics.progress === 'Membaik' ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                ) : presensiMetrics.progress === 'Menurun' ? (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                ) : (
                  <Minus className="w-4 h-4 text-slate-400" />
                )}
                <strong>{presensiMetrics.progress}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    Bulan Lalu ({presensiMetrics.prevMonthName})
                  </div>
                  <div className="text-xl font-black font-mono mt-0.5">
                    {presensiMetrics.prevPct.toFixed(2)}%
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${presensiMetrics.prevIndex.color}`}
                >
                  {presensiMetrics.prevIndex.label}
                </span>
              </div>

              <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    Bulan Ini ({presensiMetrics.curMonthName})
                  </div>
                  <div className="text-xl font-black font-mono mt-0.5 text-blue-600 dark:text-blue-400">
                    {presensiMetrics.curPct.toFixed(2)}%
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${presensiMetrics.curIndex.color}`}
                >
                  {presensiMetrics.curIndex.label}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Attribute Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
          {/* Data Pribadi & Kontak */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1.5 flex items-center gap-1.5">
              <UserCircle className="w-4 h-4 text-blue-500" />
              Identitas &amp; Kontak
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-slate-400 block text-[10px]">Email Resmi</span>
                <span className="font-semibold">{currentStaff.email || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">No. Telepon / WhatsApp</span>
                <span className="font-semibold">{currentStaff.telp || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Domisili</span>
                <span className="font-semibold">{currentStaff.domisili || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Pendidikan Terakhir</span>
                <span className="font-semibold">{currentStaff.pendidikanTerakhir || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Jenis Kelamin</span>
                <span className="font-semibold">{currentStaff.jk}</span>
              </div>
            </div>
          </div>

          {/* Kepegawaian & PKWT */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-500" />
              Kontrak &amp; Struktural
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-slate-400 block text-[10px]">Status Kepegawaian</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {currentStaff.status}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Awal PKWT</span>
                <span className="font-mono">{formatTanggalDmy(currentStaff.awalPKWT)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Akhir PKWT</span>
                <span className="font-mono">{formatTanggalDmy(currentStaff.akhirPKWT)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Proyeksi Jabatan</span>
                <span className="font-semibold">{currentStaff.proyeksiJabatan || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Sanksi Administratif</span>
                <span className="font-semibold text-emerald-600">{currentStaff.sanksi || '-'}</span>
              </div>
            </div>
          </div>

          {/* Payroll, Bank & BPJS */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              Payroll &amp; Perpajakan
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-slate-400 block text-[10px]">Gaji Pokok &amp; Tunjangan</span>
                <span className="font-bold font-mono">
                  {formatRupiah(currentStaff.gajiPokok)} + {formatRupiah(currentStaff.tunjanganJabatan)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Status PTKP</span>
                <span className="font-bold">{currentStaff.statusPTKP}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Rekening Payroll</span>
                <span className="font-mono">
                  {currentStaff.bank} — {currentStaff.rekening}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">BPJS Kesehatan (Nominal)</span>
                <span className="font-mono font-bold">
                  {formatRupiah(currentStaff.bpjsKesehatanNominal)} / bulan
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Faskes Terdaftar</span>
                <span className="font-semibold">{currentStaff.faskes || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Link Arsip Administratif (Google Drive) */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-500" />
                Link Arsip Dokumen Administratif (Google Drive)
              </h3>
              <p className="text-xs text-slate-500">
                Penyimpanan berkas SK, kontrak kerja, ijazah, dan dokumen legal staf ini.
              </p>
            </div>

            <button
              onClick={() => setIsLinkModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors no-print"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Link
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {staffLinks.length === 0 ? (
              <div className="col-span-2 p-4 text-center text-slate-400 border border-dashed rounded-xl text-xs">
                Belum ada tautan dokumen arsip Drive yang tersimpan untuk staf ini.
              </div>
            ) : (
              staffLinks.map((link) => (
                <div
                  key={link.id}
                  className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="truncate mr-3">
                    <div className="font-bold text-slate-900 dark:text-white truncate">
                      {link.label}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Ditambahkan: {link.tanggalDitambahkan}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-semibold text-[11px] flex items-center gap-1 hover:bg-blue-700 transition-colors"
                    >
                      Buka Drive <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      onClick={() => onDeleteLink(link.id)}
                      className="p-1 text-slate-400 hover:text-red-500 no-print"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal Tambah Link Arsip */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Tambah Link Dokumen Arsip
              </h3>
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLink} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nama / Label Dokumen</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SK Pengangkatan Tetap 2026, Ijazah S1..."
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">URL Google Drive / Berkas</label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Simpan Tautan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
