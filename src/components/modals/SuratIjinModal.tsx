import React from 'react';
import { X, Printer } from 'lucide-react';
import { PresensiRecord, StaffData } from '../../types';
import { formatTanggalIndo, formatTanggalDmy, getNamaHariIndo } from '../../utils/dateFormatter';

interface SuratIjinModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: PresensiRecord | null;
  staff: StaffData | null;
}

export const SuratIjinModal: React.FC<SuratIjinModalProps> = ({
  isOpen,
  onClose,
  record,
  staff,
}) => {
  if (!isOpen || !record) return null;

  const handlePrint = () => {
    window.print();
  };

  const tglCetak = formatTanggalIndo(new Date());

  const durasiJam = Math.floor(record.durasiMenit / 60);
  const durasiMenitSisa = record.durasiMenit % 60;

  // Determine which checkbox is checked
  const isNormatif = record.jenisIjin === 'Ijin Normatif';
  const isTidakMasuk =
    record.jenisIjin === 'Sakit (S Dokter)' ||
    record.jenisIjin === 'Sakit (S Tangan)' ||
    record.jenisIjin === 'Ijin (S Tangan)' ||
    record.jenisIjin === 'Alpha';
  const isTerlambat = record.jenisIjin === 'Ijin Terlambat';
  const isKeluarSementara = record.jenisIjin === 'Ijin Keluar Sementara';
  const isPulangCepat = record.jenisIjin === 'Ijin Pulang Awal';
  const isFormKehadiran = record.jenisIjin === 'Hadir';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 text-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Modal Controls (No Print) */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 no-print">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">
              Preview Cetak Surat Permohonan Ijin Resmi
            </h2>
            <p className="text-xs text-slate-500">
              Standar Format Ukuran Fisik Dokumen: 20.5 cm × 16 cm (Siap Tanda Tangan Basah)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Cetak Formulir (Print)
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Paper Container */}
        <div className="p-6 overflow-y-auto bg-slate-200 dark:bg-slate-950 flex justify-center items-center">
          <div
            id="surat-ijin-print-paper"
            className="bg-white text-black shadow-xl border border-slate-300 mx-auto"
            style={{
              width: '20.5cm',
              height: '16cm',
              padding: '0.6cm 0.9cm 0.7cm 0.9cm',
              boxSizing: 'border-box',
              fontFamily: 'Arial, sans-serif',
              fontSize: '11px',
              lineHeight: '1.35',
            }}
          >
            {/* Header */}
            <div className="text-center mb-2">
              <div className="text-base font-bold tracking-wider uppercase border-b-2 border-black inline-block pb-0.5">
                SURAT PERMOHONAN IJIN
              </div>
              <div className="text-xs font-semibold italic text-slate-800">
                Karyawan Bulanan — Divisi Produksi I
              </div>
            </div>

            <div className="mb-2">Yang bertanda tangan di bawah ini :</div>

            {/* Identitas */}
            <div className="grid grid-cols-[130px_10px_1fr] gap-y-1 mb-2">
              <span className="font-semibold">Nama</span>
              <span>:</span>
              <span className="font-bold uppercase tracking-wide border-b border-dotted border-black inline-block">
                {record.nama}
              </span>

              <span className="font-semibold">NIP / Jabatan</span>
              <span>:</span>
              <span className="border-b border-dotted border-black inline-block">
                {record.nip} — {staff?.jabatan || 'Staf Divisi Produksi I'}
              </span>

              <span className="font-semibold">Divisi / Unit</span>
              <span>:</span>
              <span className="border-b border-dotted border-black inline-block">
                Divisi Produksi I / {staff?.sekup || 'Operasional'}
              </span>
            </div>

            {/* Checkbox Opsi Ijin */}
            <div className="my-2 p-1.5 border border-slate-300 rounded bg-slate-50/50 text-[10.5px]">
              <div className="font-bold mb-1">Dengan ini mengajukan permohonan* :</div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                <div>
                  <span className="font-bold mr-1">{isNormatif ? '[✓]' : '[  ]'}</span> Ijin Normatif
                </div>
                <div>
                  <span className="font-bold mr-1">{isTidakMasuk ? '[✓]' : '[  ]'}</span> Ijin Tidak Masuk Kerja (Sakit/Alpha)
                </div>
                <div>
                  <span className="font-bold mr-1">{isTerlambat ? '[✓]' : '[  ]'}</span> Ijin Datang Terlambat
                </div>
                <div>
                  <span className="font-bold mr-1">{isKeluarSementara ? '[✓]' : '[  ]'}</span> Ijin Keluar Sementara Waktu
                </div>
                <div>
                  <span className="font-bold mr-1">{isPulangCepat ? '[✓]' : '[  ]'}</span> Ijin Pulang Lebih Cepat
                </div>
                <div>
                  <span className="font-bold mr-1">[  ]</span> Tugas Kerja Bersifat Eksternal**
                </div>
                <div>
                  <span className="font-bold mr-1">{isFormKehadiran ? '[✓]' : '[  ]'}</span> Form Kehadiran Khusus***
                </div>
              </div>
            </div>

            {/* Waktu & Keperluan */}
            <div className="grid grid-cols-[130px_10px_1fr] gap-y-1 mb-2">
              <span className="font-semibold">Hari / Tanggal</span>
              <span>:</span>
              <span>
                <strong>{record.hari || getNamaHariIndo(record.tanggal)}</strong>, {formatTanggalIndo(record.tanggal)} ({formatTanggalDmy(record.tanggal)})
              </span>

              <span className="font-semibold">Keperluan Ijin</span>
              <span>:</span>
              <span className="border-b border-dotted border-black inline-block font-medium">
                {record.keperluan || '-'}
              </span>

              <span className="font-semibold">Jam Pelaksanaan</span>
              <span>:</span>
              <span>
                Mulai: <strong>{record.jamAwal || '08:00'}</strong> s/d Selesai: <strong>{record.jamAkhir || '16:00'}</strong>
                <span className="ml-3 font-semibold text-slate-700">
                  (Jumlah: {durasiJam} Jam {durasiMenitSisa} Menit)
                </span>
              </span>
            </div>

            <div className="text-[9.5px] italic text-slate-700 mb-3 leading-tight">
              Demikian surat permohonan ini kami buat dengan sebenarnya. Kami bersedia menerima sanksi administrasi apabila dikemudian hari terjadi penyalahgunaan ijin / tidak sesuai dengan keterangan yang kami ajukan.
            </div>

            {/* Tanda Tangan */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <div className="text-[10px] font-bold text-slate-800 mb-1">
                  Pejabat yang berwenang :
                </div>
                <div className="grid grid-cols-4 gap-1 text-[9px] text-center border-t border-slate-400 pt-1">
                  <div>
                    <div className="h-10 flex items-end justify-center font-bold">Menyetujui</div>
                    <div className="border-b border-dotted border-black mt-6"></div>
                    <div className="text-[8px] text-slate-600">Kabag / Spv</div>
                  </div>
                  <div>
                    <div className="h-10 flex items-end justify-center font-bold">Mengetahui 1</div>
                    <div className="border-b border-dotted border-black mt-6"></div>
                    <div className="text-[8px] text-slate-600">Foreman</div>
                  </div>
                  <div>
                    <div className="h-10 flex items-end justify-center font-bold">Mengetahui 2</div>
                    <div className="border-b border-dotted border-black mt-6"></div>
                    <div className="text-[8px] text-slate-600">Manajer PP1</div>
                  </div>
                  <div>
                    <div className="h-10 flex items-end justify-center font-bold leading-tight">HRD II &amp; Umum II</div>
                    <div className="border-b border-dotted border-black mt-6"></div>
                    <div className="text-[8px] text-slate-600">Personalia</div>
                  </div>
                </div>
              </div>

              <div className="text-right flex flex-col justify-between items-end pr-4">
                <div className="text-center text-[10px]">
                  <div>Malang, {tglCetak}</div>
                  <div className="mt-1 font-semibold">Karyawan Pemohon,</div>
                  <div className="mt-9 font-bold uppercase underline">
                    {record.nama}
                  </div>
                  <div className="text-[9px] text-slate-600">NIP: {record.nip}</div>
                </div>
              </div>
            </div>

            {/* Footnotes */}
            <div className="mt-2 pt-1 border-t border-slate-300 text-[8px] text-slate-500 leading-tight">
              <div>* Pilih salah satu dengan memberi tanda checklist. | ** Khusus tugas eksternal tanpa surat tugas dinas atasan. | *** Mesin fingerprint tidak mendeteksi cecklok.</div>
              <div className="text-right font-semibold">Divisi Produksi I - All Rights Reserved</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
