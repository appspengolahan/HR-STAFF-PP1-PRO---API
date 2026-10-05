import React, { useState, useMemo } from 'react';
import {
  Users,
  CheckCircle,
  Briefcase,
  Building2,
  DollarSign,
  AlertTriangle,
  Clock,
  MapPin,
  TrendingUp,
  FileText,
  Calendar,
  Layers,
  ChevronRight,
  Award,
} from 'lucide-react';
import { StaffData, PresensiRecord, LemburRecord } from '../../types';
import { formatRupiah, NAMA_BULAN_INDO } from '../../services/payrollEngine';

interface DashboardTabProps {
  staffList: StaffData[];
  presensiList: PresensiRecord[];
  lemburList: LemburRecord[];
  onNavigateTab: (tab: string) => void;
  selectedDept: 'Semua' | 'Operasional' | 'Administrasi';
}

// Koordinat Sentral Pabrik PT Batu Karang PP1 (-7.2504, 112.7688)
const FACTORY_COORDS = { lat: -7.2504, lng: 112.7688, maxRadiusM: 150 };

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  staffList,
  presensiList,
  lemburList,
  onNavigateTab,
  selectedDept,
}) => {
  const now = new Date();
  const [bebanBulan, setBebanBulan] = useState<number>(now.getMonth() + 1);
  const [bebanTahun, setBebanTahun] = useState<number>(now.getFullYear());

  // Geolocation state
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'checking' | 'inside' | 'outside' | 'error'>('idle');
  const [userDistance, setUserDistance] = useState<number | null>(null);
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);

  // Filtered staff by department
  const filteredStaff = useMemo(() => {
    if (selectedDept === 'Semua') return staffList;
    return staffList.filter((s) => s.sekup === selectedDept);
  }, [staffList, selectedDept]);

  // General Staff Counts
  const stats = useMemo(() => {
    const total = filteredStaff.length;
    const aktif = filteredStaff.filter((s) => s.statusAktif === 'Aktif').length;
    const operasional = filteredStaff.filter((s) => s.sekup === 'Operasional').length;
    const administrasi = filteredStaff.filter((s) => s.sekup === 'Administrasi').length;
    const tetap = filteredStaff.filter((s) => s.status === 'TETAP').length;
    const pkwt = filteredStaff.filter((s) => s.status.startsWith('PKWT') || s.status === 'MAGANG').length;

    // Lembur bulan berjalan
    const lemburBulanIni = lemburList.filter((l) => l.bulan === bebanBulan && l.tahun === bebanTahun);
    const totalNominalLembur = lemburBulanIni.reduce((acc, l) => acc + (l.nominal || 0), 0);
    const countLembur = lemburBulanIni.length;

    return { total, aktif, operasional, administrasi, tetap, pkwt, totalNominalLembur, countLembur };
  }, [filteredStaff, lemburList, bebanBulan, bebanTahun]);

  // Beban Gaji Bulanan (Dihitung Live)
  const bebanGaji = useMemo(() => {
    let totalKetentuan = 0;
    let totalPotongan = 0;
    const activeStaff = filteredStaff.filter((s) => s.statusAktif === 'Aktif');

    activeStaff.forEach((s) => {
      const nominal = (s.gajiPokok || 0) + (s.tunjanganJabatan || 0);
      totalKetentuan += nominal;

      // Cari potongan ijin staf pada bulan & tahun ini
      const staffPresensi = presensiList.filter(
        (p) => p.nip === s.nip && p.bulan === bebanBulan && p.tahun === bebanTahun
      );
      const totalFaktor = staffPresensi.reduce((sum, p) => sum + (p.faktorPotongan || 0), 0);
      const potongan = totalFaktor * (nominal / 26);
      totalPotongan += potongan;
    });

    const totalSetelahPotongan = totalKetentuan - totalPotongan;

    return {
      activeCount: activeStaff.length,
      totalKetentuan,
      totalPotongan,
      totalSetelahPotongan,
    };
  }, [filteredStaff, presensiList, bebanBulan, bebanTahun]);

  // PKWT Alerts (Sisa Hari <= 26)
  const pkwtAlerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return staffList
      .filter((s) => s.statusAktif === 'Aktif' && s.status !== 'TETAP' && s.akhirPKWT && s.akhirPKWT.includes('-'))
      .map((s) => {
        const tglAkhir = new Date(s.akhirPKWT!);
        const diffMs = tglAkhir.getTime() - today.getTime();
        const sisaHari = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return {
          nama: s.nama,
          nip: s.nip,
          jabatan: s.jabatan,
          akhirPKWT: s.akhirPKWT!,
          sisaHari,
          isUrgent: sisaHari <= 7,
        };
      })
      .filter((item) => item.sisaHari <= 26)
      .sort((a, b) => a.sisaHari - b.sisaHari);
  }, [staffList]);

  // Check GPS Geofence
  const handleCheckGeofence = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setGpsErrorMsg('Perangkat Anda tidak mendukung fitur Geolocation');
      return;
    }

    setGpsStatus('checking');
    setGpsErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        const dist = calculateDistanceMeters(
          userLat,
          userLng,
          FACTORY_COORDS.lat,
          FACTORY_COORDS.lng
        );
        setUserDistance(dist);
        if (dist <= FACTORY_COORDS.maxRadiusM) {
          setGpsStatus('inside');
        } else {
          setGpsStatus('outside');
        }
      },
      (err) => {
        setGpsStatus('error');
        setGpsErrorMsg(err.message || 'Gagal mendeteksi lokasi GPS');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Alert PKWT jika ada */}
      {pkwtAlerts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3 text-amber-700 dark:text-amber-400 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Peringatan Masa Berlaku PKWT Segera Berakhir (&le; 26 Hari)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-amber-500/20 text-slate-600 dark:text-slate-300 font-semibold">
                  <th className="pb-2">NIP &amp; Nama Staf</th>
                  <th className="pb-2">Jabatan</th>
                  <th className="pb-2">Tanggal Berakhir</th>
                  <th className="pb-2">Sisa Waktu</th>
                  <th className="pb-2 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-500/10">
                {pkwtAlerts.map((st) => (
                  <tr key={st.nip} className="hover:bg-amber-500/5">
                    <td className="py-2.5 font-bold text-slate-800 dark:text-white">
                      {st.nama}{' '}
                      <span className="font-mono text-[10px] text-slate-500">({st.nip})</span>
                    </td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-300">{st.jabatan}</td>
                    <td className="py-2.5 font-mono">{st.akhirPKWT}</td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          st.isUrgent
                            ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 animate-pulse'
                            : 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {st.sisaHari <= 0 ? 'Sudah Berakhir' : `${st.sisaHari} Hari Lagi`}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => onNavigateTab('mutasi')}
                        className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold transition-colors"
                      >
                        Perpanjang / Mutasi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>Total Staf</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</div>
          <div className="text-[10px] text-slate-400 mt-1">Divisi Produksi I</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>Staf Aktif</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.aktif}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {((stats.aktif / (stats.total || 1)) * 100).toFixed(2)}% dari total
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>Operasional</span>
            <Briefcase className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.operasional}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Lini Mesin &amp; QC</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>Administrasi</span>
            <Building2 className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.administrasi}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">HR, Fin, IT &amp; Legal</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>Karyawan Tetap</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.tetap}</div>
          <div className="text-[10px] text-slate-400 mt-1">Status Permanen</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>Kontrak PKWT</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.pkwt}</div>
          <div className="text-[10px] text-slate-400 mt-1">PKWT 1–7 &amp; Magang</div>
        </div>
      </div>

      {/* Middle Row: Beban Gaji Bulanan & Geofence GPS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Beban Gaji Live Calculation (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                Estimasi Total Beban Gaji Staf Pabrik
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gaji Pokok + Tunjangan Jabatan ({bebanGaji.activeCount} Staf Aktif) — Dihitung Live
              </p>
            </div>

            {/* Month & Year Select */}
            <div className="flex items-center gap-2 text-xs">
              <select
                value={bebanBulan}
                onChange={(e) => setBebanBulan(Number(e.target.value))}
                className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white font-semibold"
              >
                {NAMA_BULAN_INDO.map((bln, idx) => (
                  <option key={bln} value={idx + 1}>
                    {bln}
                  </option>
                ))}
              </select>

              <select
                value={bebanTahun}
                onChange={(e) => setBebanTahun(Number(e.target.value))}
                className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white font-semibold"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
                Total Ketentuan Gaji
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {formatRupiah(bebanGaji.totalKetentuan)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">GP + Tunjangan Baku</div>
            </div>

            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
              <div className="text-xs text-red-700 dark:text-red-400 font-semibold mb-1">
                Total Potongan Ijin
              </div>
              <div className="text-xl font-bold text-red-600 dark:text-red-400">
                - {formatRupiah(bebanGaji.totalPotongan)}
              </div>
              <div className="text-[10px] text-red-500/80 mt-1">Akumulasi ijin 26h</div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
              <div className="text-xs text-blue-700 dark:text-blue-400 font-semibold mb-1">
                Total Setelah Potongan
              </div>
              <div className="text-xl font-black text-blue-600 dark:text-blue-300">
                {formatRupiah(bebanGaji.totalSetelahPotongan)}
              </div>
              <div className="text-[10px] text-blue-500/80 mt-1">Beban Netto Pokok</div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            * Catatan: Beban lembur resmi (SPKL) bulan ini tercatat sebesar{' '}
            <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
              {formatRupiah(stats.totalNominalLembur)}
            </strong>{' '}
            ({stats.countLembur} kejadian). Rincian gaji per staf dapat dicetak pada tab Slip Gaji.
          </p>
        </div>

        {/* GPS Geofence Quick Check (1 Col) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-500" />
                Validasi GPS Geofence Pabrik
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                Radius 150m
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Sentral Pabrik PP1 di koordinat <code>-7.2504, 112.7688</code>. Presensi masuk staf diverifikasi via GPS perangkat.
            </p>
          </div>

          {/* Status Display */}
          <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-850 flex flex-col items-center justify-center text-center space-y-2">
            {gpsStatus === 'idle' && (
              <span className="text-xs text-slate-500">
                Klik tombol di bawah untuk memeriksa radius jarak Anda dari gerbang pabrik.
              </span>
            )}
            {gpsStatus === 'checking' && (
              <span className="text-xs text-blue-600 font-bold animate-pulse">
                Membaca satelit GPS perangkat...
              </span>
            )}
            {gpsStatus === 'inside' && (
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                  Dalam Radius Pabrik ({userDistance} meter)
                </div>
                <div className="text-[11px] text-slate-500">
                  Lokasi Anda valid untuk presensi mandiri.
                </div>
              </div>
            )}
            {gpsStatus === 'outside' && (
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  Di Luar Radius Pabrik ({userDistance} meter)
                </div>
                <div className="text-[11px] text-slate-500">
                  Maksimal jarak yang diizinkan adalah 150 meter dari gerbang utama.
                </div>
              </div>
            )}
            {gpsStatus === 'error' && (
              <span className="text-xs text-red-500 font-medium">{gpsErrorMsg}</span>
            )}
          </div>

          <button
            onClick={handleCheckGeofence}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            <MapPin className="w-4 h-4" />
            Cek Lokasi Geofence Sekarang
          </button>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigateTab('presensi')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600">
                Presensi &amp; Ijin Pengecualian
              </div>
              <div className="text-[11px] text-slate-400">Cetak Surat Ijin Fisik 20.5 × 16 cm</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </div>

        <div
          onClick={() => onNavigateTab('slip')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600">
                Slip Gaji &amp; Payroll TER
              </div>
              <div className="text-[11px] text-slate-400">Cetak Struk Thermal &amp; PDF A4</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </div>

        <div
          onClick={() => onNavigateTab('database')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600">
                Database 32 Staf Kantor
              </div>
              <div className="text-[11px] text-slate-400">Kelola Profil, BPJS &amp; Jadwal Mutasi</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};
