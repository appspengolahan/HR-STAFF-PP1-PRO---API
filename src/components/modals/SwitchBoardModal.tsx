import React, { useState } from 'react';
import { X, Search, ExternalLink, CheckCircle, Layers } from 'lucide-react';

interface SwitchBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AppModule {
  nomor: number;
  id: string;
  nama: string;
  kategori: 'Supply Chain' | 'Operasional & Mesin' | 'Administrasi' | 'Kemitraan';
  deskripsi: string;
  url: string;
  isExternal: boolean;
  isCurrentApp?: boolean;
  statusBadge: string;
}

const APPS: AppModule[] = [
  {
    nomor: 1,
    id: 'mod-1',
    nama: '1. Monitoring Stock PP1',
    kategori: 'Supply Chain',
    deskripsi: 'Data stok Cengkeh, Tembakau, Krosok & Silo Blend terhubung live ke cloud Vercel.',
    url: 'https://monitoring-stock-pp-1-pro-api.vercel.app',
    isExternal: true,
    statusBadge: 'Live Vercel',
  },
  {
    nomor: 2,
    id: 'mod-2',
    nama: '2. Mutasi Stock',
    kategori: 'Supply Chain',
    deskripsi: 'Rekap arus masuk, keluar, dan transfer antar-gudang pabrik berbasis nomor batch.',
    url: '#mutasi-stock',
    isExternal: false,
    statusBadge: 'Ekosistem PP1',
  },
  {
    nomor: 3,
    id: 'mod-3',
    nama: '3. General Monitoring',
    kategori: 'Operasional & Mesin',
    deskripsi: 'Telemetri OEE pabrik, status 4 lini mesin pengolahan, suhu, dan kelembaban (RH).',
    url: '#general-monitoring',
    isExternal: false,
    statusBadge: 'Ekosistem PP1',
  },
  {
    nomor: 4,
    id: 'mod-4',
    nama: '4. Data Proses (4 Komoditas)',
    kategori: 'Operasional & Mesin',
    deskripsi: 'Fase 2 pengolahan: Sortasi Cengkeh, Rotary Tembakau, Destem Krosok, & Silo Blend.',
    url: '#data-proses',
    isExternal: false,
    statusBadge: 'Ekosistem PP1',
  },
  {
    nomor: 5,
    id: 'mod-5',
    nama: '5. Log Surat & Arsip',
    kategori: 'Administrasi',
    deskripsi: 'Penomoran surat otomatis format [No]/PP1-BK/[Bulan]/[Tahun] & template kop resmi.',
    url: '#log-surat',
    isExternal: false,
    statusBadge: 'Ekosistem PP1',
  },
  {
    nomor: 6,
    id: 'mod-6',
    nama: '6. Pengadaan SPP',
    kategori: 'Administrasi',
    deskripsi: 'Alur pengajuan digital suku cadang mesin dengan persetujuan manajerial berjenjang.',
    url: '#pengadaan-spp',
    isExternal: false,
    statusBadge: 'Ekosistem PP1',
  },
  {
    nomor: 7,
    id: 'mod-7',
    nama: '7. CRM Clients Hub',
    kategori: 'Kemitraan',
    deskripsi: 'Database mitra industri rokok rekanan, jadwal kuota kirim, dan volume kontrak.',
    url: '#crm-clients',
    isExternal: false,
    statusBadge: 'Ekosistem PP1',
  },
  {
    nomor: 8,
    id: 'mod-8',
    nama: '8. HR Staff & Karyawan PP1',
    kategori: 'Administrasi',
    deskripsi: 'Sistem komprehensif Staf & Karyawan Tetap: GPS geofence, shift, payroll TER, SPKL & KPI.',
    url: '#hr-staff',
    isExternal: false,
    isCurrentApp: true,
    statusBadge: 'Aplikasi Aktif',
  },
];

export const SwitchBoardModal: React.FC<SwitchBoardModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  if (!isOpen) return null;

  const categories = ['Semua', 'Supply Chain', 'Operasional & Mesin', 'Administrasi', 'Kemitraan'];

  const filtered = APPS.filter((app) => {
    const matchSearch =
      app.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.deskripsi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === 'Semua' || app.kategori === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold shadow-md shadow-blue-900/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Master Switch Board PP1
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-400/30">
                  Workspace OS
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Portal Ekosistem 8 Modul Operasional PT Batu Karang — Divisi Produksi 1
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

        {/* Filters */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari modul operasional..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* App Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((app) => (
            <div
              key={app.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                app.isCurrentApp
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/20 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {app.kategori}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      app.isCurrentApp
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    }`}
                  >
                    {app.statusBadge}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                  {app.nama}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  {app.deskripsi}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                {app.isCurrentApp ? (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    Sedang Aktif Saat Ini
                  </span>
                ) : app.isExternal ? (
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
                  >
                    Buka Aplikasi <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <button
                    onClick={() => {
                      alert(`Modul "${app.nama}" terdaftar dalam Workspace OS PT Batu Karang.`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                  >
                    Buka Workspace Modul
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center text-xs text-slate-500 dark:text-slate-400">
          PT Batu Karang — Divisi Produksi 1 (PP1) | Master Blueprint &amp; Technical Roadmap
        </div>
      </div>
    </div>
  );
};
