import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Send,
  Download,
  DollarSign,
  ShieldCheck,
  Building,
  User,
  CheckCircle,
  AlertCircle,
  Receipt,
  MessageSquare,
} from 'lucide-react';
import { StaffData, PresensiRecord, LemburRecord, SlipGajiRecord } from '../../types';
import {
  calculateSlipGaji,
  formatRupiah,
  NAMA_BULAN_INDO,
} from '../../services/payrollEngine';
import { ThermalSlipModal } from '../modals/ThermalSlipModal';

interface SlipGajiTabProps {
  staffList: StaffData[];
  presensiList: PresensiRecord[];
  lemburList: LemburRecord[];
  currentUserNip?: string;
  isStaffPortal?: boolean;
}

export const SlipGajiTab: React.FC<SlipGajiTabProps> = ({
  staffList,
  presensiList,
  lemburList,
  currentUserNip,
  isStaffPortal = false,
}) => {
  const now = new Date();
  const [selectedNip, setSelectedNip] = useState<string>(
    isStaffPortal && currentUserNip ? currentUserNip : staffList[0]?.nip || 'BK-PP1-001'
  );
  const [selectedBulan, setSelectedBulan] = useState<number>(now.getMonth() + 1);
  const [selectedTahun, setSelectedTahun] = useState<number>(now.getFullYear());
  const [isThermalOpen, setIsThermalOpen] = useState(false);

  const selectedStaff = useMemo(() => {
    return staffList.find((s) => s.nip === selectedNip) || staffList[0] || null;
  }, [staffList, selectedNip]);

  // Compute live slip gaji record
  const currentSlip = useMemo<SlipGajiRecord | null>(() => {
    if (!selectedStaff) return null;

    // Total lembur bulan berjalan
    const stafLembur = lemburList.filter(
      (l) => l.nip === selectedStaff.nip && l.bulan === selectedBulan && l.tahun === selectedTahun
    );
    const totalLembur = stafLembur.reduce((acc, l) => acc + (l.nominal || 0), 0);

    // Hari tidak dibayar (akumulasi faktor potongan presensi)
    const stafPresensi = presensiList.filter(
      (p) => p.nip === selectedStaff.nip && p.bulan === selectedBulan && p.tahun === selectedTahun
    );
    const hariTidakDibayar = stafPresensi.reduce((acc, p) => acc + (p.faktorPotongan || 0), 0);

    return calculateSlipGaji(
      selectedStaff,
      selectedBulan,
      selectedTahun,
      totalLembur,
      hariTidakDibayar
    );
  }, [selectedStaff, selectedBulan, selectedTahun, lemburList, presensiList]);

  const handlePrintA4 = () => {
    const originalTitle = document.title;
    document.title = `HR Karyawan - Divisi Produksi I - Slip Gaji ${selectedStaff?.nama || 'Staf'} ${NAMA_BULAN_INDO[selectedBulan - 1]} ${selectedTahun}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Selector Card (No Print) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 no-print">
        <div className="flex flex-wrap items-center gap-3">
          {!isStaffPortal ? (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Pilih Karyawan Staf
              </label>
              <select
                value={selectedNip}
                onChange={(e) => setSelectedNip(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white min-w-[200px]"
              >
                {staffList.map((s) => (
                  <option key={s.nip} value={s.nip}>
                    {s.nama} ({s.nip})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Karyawan Pemilik Slip
              </label>
              <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white">
                {selectedStaff?.nama} ({selectedStaff?.nip})
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Bulan Gaji</label>
            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(Number(e.target.value))}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
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
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(Number(e.target.value))}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsThermalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Receipt className="w-4 h-4 text-emerald-500" />
            Thermal POS &amp; WA
          </button>
          <button
            onClick={handlePrintA4}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            Cetak PDF A4 Resmi
          </button>
        </div>
      </div>

      {/* Slip Gaji A4 Sheet Document */}
      {currentSlip && (
        <div
          id="slip-gaji-a4-sheet"
          className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm max-w-4xl mx-auto space-y-6"
        >
          {/* Header Kop Resmi */}
          <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-black text-lg">
                BK
              </div>
              <div>
                <h1 className="text-lg font-black tracking-wide leading-tight">
                  PT BATU KARANG
                </h1>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  DIVISI PRODUKSI I — PABRIK PENGOLAHAN BAHAN BAKU
                </p>
                <p className="text-[10px] text-slate-500">
                  Alamat: Kawasan Industri Terpadu PP1, Malang — Jawa Timur
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-base font-black tracking-wider uppercase">SLIP GAJI BULANAN</div>
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Periode: {currentSlip.namaBulan} {currentSlip.tahun}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Ref: BK-PAY/{currentSlip.tahun}/{String(currentSlip.bulan).padStart(2, '0')}/{currentSlip.nip}
              </div>
            </div>
          </div>

          {/* Staf Profile Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-850 text-xs border border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 block">Nama Karyawan</span>
              <strong className="text-slate-900 dark:text-white text-sm">{currentSlip.nama}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">NIP &amp; Status</span>
              <span className="font-mono font-bold">{currentSlip.nip}</span>
              <span className="ml-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                ({currentSlip.statusKepegawaian})
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Jabatan &amp; Unit</span>
              <span className="font-semibold">{currentSlip.jabatan}</span>
              <span className="block text-[10px] text-slate-500">{currentSlip.sekup}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Status PTKP &amp; TER</span>
              <span className="font-semibold">{currentSlip.statusPTKP}</span>
              <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                Kategori TER {currentSlip.kategoriTer} ({(currentSlip.tarifTerPct * 100).toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Payroll Breakdown (2 Cols: Penghasilan vs Potongan) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kolom 1: Komponen Penghasilan */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1.5 flex justify-between items-center">
                <span>I. PENGHASILAN (EARNINGS)</span>
                <span className="text-[10px] font-normal text-slate-500">Nominal (Rp)</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Gaji Pokok (GP)</span>
                  <span className="font-semibold font-mono">{formatRupiah(currentSlip.gajiPokok)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Tunjangan Jabatan</span>
                  <span className="font-semibold font-mono">
                    {formatRupiah(currentSlip.tunjanganJabatan)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">
                    Lembur Resmi (SPKL) Flat 2×
                  </span>
                  <span className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                    + {formatRupiah(currentSlip.totalLembur)}
                  </span>
                </div>

                {currentSlip.hariTidakDibayar > 0 && (
                  <div className="flex justify-between text-red-600 dark:text-red-400">
                    <span>
                      Potongan Ijin / Alpha ({currentSlip.hariTidakDibayar} hari)
                    </span>
                    <span className="font-semibold font-mono">
                      - {formatRupiah(currentSlip.potonganIjinRp)}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-dashed border-slate-300 dark:border-slate-700 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                  <span>TOTAL GAJI BRUTO</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">
                    {formatRupiah(currentSlip.totalGajiBruto)}
                  </span>
                </div>
              </div>
            </div>

            {/* Kolom 2: Potongan Resmi (Deductions) */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1.5 flex justify-between items-center">
                <span>II. POTONGAN RESMI (DEDUCTIONS)</span>
                <span className="text-[10px] font-normal text-slate-500">Nominal (Rp)</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">
                    BPJS JHT (2% dari Ketentuan Penuh)
                  </span>
                  <span className="font-semibold font-mono text-red-600 dark:text-red-400">
                    - {formatRupiah(currentSlip.bpjsJht)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">
                    BPJS JP (1%, Plafon Rp 11.086.300)
                  </span>
                  <span className="font-semibold font-mono text-red-600 dark:text-red-400">
                    - {formatRupiah(currentSlip.bpjsJp)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">
                    BPJS Kesehatan (Nominal Tetap)
                  </span>
                  <span className="font-semibold font-mono text-red-600 dark:text-red-400">
                    - {formatRupiah(currentSlip.bpjsKesehatan)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">
                    PPh21 TER (PMK 168/2023 - {(currentSlip.tarifTerPct * 100).toFixed(2)}%)
                  </span>
                  <span className="font-semibold font-mono text-red-600 dark:text-red-400">
                    - {formatRupiah(currentSlip.pph21Bulan)}
                  </span>
                </div>

                <div className="pt-2 border-t border-dashed border-slate-300 dark:border-slate-700 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                  <span>TOTAL POTONGAN</span>
                  <span className="font-mono text-red-600 dark:text-red-400">
                    - {formatRupiah(
                      currentSlip.bpjsJht +
                        currentSlip.bpjsJp +
                        currentSlip.bpjsKesehatan +
                        currentSlip.pph21Bulan
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Grand Total Take Home Pay */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold opacity-90 block">
                GAJI BERSIH DITERIMA (TAKE HOME PAY)
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono mt-0.5 tracking-tight">
                {formatRupiah(currentSlip.gajiDiterima)}
              </div>
            </div>

            <div className="text-right sm:max-w-xs text-xs">
              <span className="text-[11px] opacity-80 block">Terbilang :</span>
              <span className="italic font-medium leading-tight">
                "{currentSlip.terbilangGaji}"
              </span>
            </div>
          </div>

          {/* Notes & Bank Transfer Info */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <div>
              <strong>Rekening Tujuan:</strong> Bank {selectedStaff?.bank || 'BCA'} No.{' '}
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {selectedStaff?.rekening || '-'}
              </span>{' '}
              a/n {currentSlip.nama}.
            </div>
            <div>
              <strong>Catatan Perpajakan:</strong> Metode pemotongan PPh21 menggunakan Tarif Efektif Rata-rata (TER) sesuai PP 58/2023 &amp; PMK 168/2023 berdasarkan status PTKP {currentSlip.statusPTKP}.
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs">
            <div>
              <div className="text-[11px] text-slate-500 mb-1">Dibuat Oleh,</div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Payroll Keuangan</div>
              <div className="h-16 flex items-end justify-center font-bold font-mono">
                ( Hendra Wijaya )
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-500 mb-1">Disetujui Oleh,</div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Manajer Operasional PP1</div>
              <div className="h-16 flex items-end justify-center font-bold font-mono">
                ( Lalu Mahendra Ali Akbar )
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-500 mb-1">Diterima Oleh,</div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Karyawan Penerima</div>
              <div className="h-16 flex items-end justify-center font-bold font-mono">
                ( {currentSlip.nama} )
              </div>
            </div>
          </div>

          {/* Official Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-right text-[10px] text-slate-400">
            Divisi Produksi I - All Rights Reserved
          </div>
        </div>
      )}

      {/* Thermal Slip & WhatsApp Modal */}
      <ThermalSlipModal
        isOpen={isThermalOpen}
        onClose={() => setIsThermalOpen(false)}
        slip={currentSlip}
        staff={selectedStaff}
      />
    </div>
  );
};
