import React from 'react';
import { X, Printer } from 'lucide-react';
import { PresensiRecord, StaffData } from '../../types';
import { formatTanggalIndo, formatTanggalDmy, getNamaHariIndo } from '../../utils/dateFormatter';
import { normalizePresensiRecord } from '../../utils/workHoursUtils';

interface SuratIjinModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: PresensiRecord | null;
  staff: StaffData | null;
}

export const SuratIjinModal: React.FC<SuratIjinModalProps> = ({
  isOpen,
  onClose,
  record: rawRecord,
  staff,
}) => {
  if (!isOpen || !rawRecord) return null;

  const record = normalizePresensiRecord(rawRecord);

  const handlePrint = () => {
    window.print();
  };

  const durasiJam = Math.floor(record.durasiMenit / 60);
  const durasiMenitSisa = record.durasiMenit % 60;

  // Determine checked status matching company standard rules
  const isNormatif = record.jenisIjin === 'Ijin Normatif';
  const isTidakMasuk =
    record.jenisIjin === 'Sakit (S Dokter)' ||
    record.jenisIjin === 'Sakit (S Tangan)' ||
    record.jenisIjin === 'Ijin (S Tangan)' ||
    record.jenisIjin === 'Alpha' ||
    String(record.jenisIjin).toLowerCase().includes('tidak masuk');
  const isTerlambat = record.jenisIjin === 'Ijin Terlambat';
  const isKeluarSementara = record.jenisIjin === 'Ijin Keluar Sementara';
  const isPulangCepat = record.jenisIjin === 'Ijin Pulang Awal';
  const isEkstern =
    String(record.catatan || '').toLowerCase().includes('ekstern') ||
    String(record.keperluan || '').toLowerCase().includes('ekstern');
  const isFormKehadiran = record.jenisIjin === 'Hadir';

  // Waktu pelaksanaan spesifik
  let jamMasukDisplay = '-';
  let jamKeluarDisplay = '-';
  let jamMasukKembaliDisplay = '-';

  if (isTerlambat) {
    jamMasukDisplay = record.jamAkhir || record.jamAwal || '08:48';
  } else if (isPulangCepat) {
    jamKeluarDisplay = record.jamAwal || '14:00';
  } else if (isKeluarSementara) {
    jamKeluarDisplay = record.jamAwal || '10:30';
    jamMasukKembaliDisplay = record.jamAkhir || '13:00';
  }

  // Format tanggal & hari
  const hariDisplay = record.hari || getNamaHariIndo(record.tanggal);
  const tglDisplay = formatTanggalDmy(record.tanggal);
  const tglKotaTtd = formatTanggalIndo(new Date());

  // Render Checkbox Box: 13x13px square with 1px solid black border and crisp black checkmark
  const renderBox = (checked: boolean) => (
    <span
      className="inline-flex items-center justify-center w-[13px] h-[13px] border border-black mr-1.5 align-middle select-none shrink-0"
      style={{ verticalAlign: 'baseline', transform: 'translateY(-1px)' }}
    >
      {checked && (
        <svg
          viewBox="0 0 16 16"
          className="w-[10px] h-[10px] text-black fill-current stroke-current"
          strokeWidth="0.8"
        >
          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
        </svg>
      )}
    </span>
  );

  const resolvedJabatan = staff?.jabatan || (record as unknown as { jabatan?: string })?.jabatan || 'Mandor Proses Tembakau';
  const resolvedSekup = staff?.sekup || (record as unknown as { sekup?: string })?.sekup || 'Operasional';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 print:static print:p-0 print:bg-transparent">
      <div className="bg-white dark:bg-slate-900 text-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden print:border-none print:shadow-none print:max-h-none print:w-auto">
        {/* Modal Controls (No Print) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 no-print print:hidden">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span>Formulir Resmi Surat Permohonan Ijin</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                Standar Perusahaan PT Batu Karang
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Format baku resmi Karyawan Bulanan Divisi Produksi I (Siap Cetak Fisik / PDF)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Cetak Formulir (Print)
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Paper Container */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-200 dark:bg-slate-950 flex justify-center items-center print:p-0 print:bg-transparent print:overflow-visible">
          <div
            id="surat-ijin-print-paper"
            className="bg-white text-black shadow-2xl border border-slate-300 mx-auto print:border-none print:shadow-none"
            style={{
              width: '210mm',
              minHeight: '148mm',
              padding: '12mm 18mm 10mm 18mm',
              boxSizing: 'border-box',
              fontFamily: 'Arial, Helvetica, sans-serif',
              fontSize: '11px',
              lineHeight: '1.45',
              color: '#000000',
              backgroundColor: '#ffffff',
            }}
          >
            {/* Header Judul Standar Perusahaan */}
            <div className="text-center mb-4">
              <h1 className="text-[16px] font-bold tracking-wide uppercase m-0 leading-tight text-black">
                SURAT PERMOHONAN IJIN
              </h1>
              <div className="text-[12px] font-bold italic mt-0.5 text-black">
                Karyawan Bulanan
              </div>
            </div>

            {/* Identitas Karyawan */}
            <div className="mb-2 text-[11px] text-black">
              <div className="mb-1 text-[11px]">Yang bertanda tangan di bawah ini;</div>
              <div className="space-y-0.5">
                <div className="flex items-baseline">
                  <span className="w-[115px] font-bold">Nama</span>
                  <span className="mr-2">:</span>
                  <span className="font-bold border-b border-dotted border-black pb-0.5 min-w-[260px] inline-block">
                    {record.nama}
                  </span>
                </div>

                <div className="flex items-baseline">
                  <span className="w-[115px] font-bold">Jabatan</span>
                  <span className="mr-2">:</span>
                  <span className="font-bold border-b border-dotted border-black pb-0.5 min-w-[260px] inline-block">
                    {resolvedJabatan}
                  </span>
                </div>

                <div className="flex items-baseline">
                  <span className="w-[115px] font-bold">Divisi / Unit</span>
                  <span className="mr-2">:</span>
                  <span className="font-bold border-b border-dotted border-black pb-0.5 min-w-[260px] inline-block">
                    Produksi I / {resolvedSekup}
                  </span>
                </div>
              </div>
            </div>

            {/* Checkbox Options Standar Perusahaan */}
            <div className="my-2.5 text-[11px] leading-relaxed text-black">
              <div className="font-bold mb-1">Dengan ini mengajukan*</div>
              <div className="space-y-0.5 pl-0.5">
                <div className="flex items-center flex-wrap gap-x-2">
                  <span className="inline-flex items-center">
                    {renderBox(isNormatif)} Ijin Normatif,
                  </span>
                  <span className="inline-flex items-center">
                    {renderBox(isTidakMasuk)} Ijin Tidak Masuk Kerja,
                  </span>
                  <span className="inline-flex items-center">
                    {renderBox(isTerlambat)} Ijin Datang Terlambat,
                  </span>
                </div>
                <div className="flex items-center flex-wrap gap-x-2">
                  <span className="inline-flex items-center">
                    {renderBox(isKeluarSementara)} Ijin Meninggalkan Tempat Kerja Sementara Waktu,
                  </span>
                  <span className="inline-flex items-center">
                    {renderBox(isPulangCepat)} Ijin Pulang Lebih Cepat,
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="inline-flex items-center">
                    {renderBox(isEkstern)} Ijin Melaksanakan Tugas Kerja Yang Bersifat Ekstern Perusahaan**,
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="inline-flex items-center">
                    {renderBox(isFormKehadiran)} Form Kehadiran***
                  </span>
                </div>
              </div>
            </div>

            {/* Waktu Pelaksanaan */}
            <div className="my-2 text-[11px] text-black">
              <div className="mb-0.5">pada :</div>
              <div className="space-y-0.5">
                <div className="flex items-baseline">
                  <span className="w-[170px] font-bold">Hari</span>
                  <span className="mr-2">:</span>
                  <span className="font-bold border-b border-dotted border-black pb-0.5 inline-block w-[110px]">
                    {hariDisplay}
                  </span>
                  <span className="mx-2">s/d</span>
                  <span className="font-bold border-b border-dotted border-black pb-0.5 inline-block w-[120px]">
                    {hariDisplay}
                  </span>
                </div>

                <div className="flex items-baseline">
                  <span className="w-[170px] font-bold">Tanggal</span>
                  <span className="mr-2">:</span>
                  <span className="font-bold border-b border-dotted border-black pb-0.5 inline-block w-[110px]">
                    {tglDisplay}
                  </span>
                  <span className="mx-2">s/d</span>
                  <span className="font-bold border-b border-dotted border-black pb-0.5 inline-block w-[120px]">
                    {tglDisplay}
                  </span>
                </div>

                <div className="flex items-baseline">
                  <span className="w-[170px] font-bold">Keterangan ijin / Form***</span>
                  <span className="mr-2">:</span>
                  <span className="border-b border-dotted border-black pb-0.5 inline-block flex-1 max-w-[450px]">
                    {record.keperluan || '-'}
                  </span>
                </div>

                <div className="flex items-baseline flex-wrap">
                  <span className="w-[170px] font-bold">Jam masuk</span>
                  <span className="mr-2">:</span>
                  <span className="border-b border-dotted border-black pb-0.5 inline-block w-[80px] text-center">
                    {jamMasukDisplay}
                  </span>
                  <span className="ml-5">Jam keluar:</span>
                  <span className="border-b border-dotted border-black pb-0.5 inline-block w-[80px] ml-1.5 text-center">
                    {jamKeluarDisplay}
                  </span>
                  <span className="ml-5">Jam masuk kembali:</span>
                  <span className="border-b border-dotted border-black pb-0.5 inline-block w-[130px] ml-1.5 text-center">
                    {jamMasukKembaliDisplay}
                  </span>
                </div>

                <div className="flex items-baseline">
                  <span className="w-[170px] font-bold">Jumlah Ijin (Jam Kerja)</span>
                  <span className="mr-2">:</span>
                  <span className="border-b border-dotted border-black pb-0.5 inline-block min-w-[150px]">
                    <strong className="font-bold">{durasiJam}</strong> Jam{' '}
                    <strong className="font-bold">{durasiMenitSisa}</strong> Menit
                  </span>
                </div>

                <div className="text-[10px] text-black pl-1 mt-0.5">
                  (Diisi Hanya Jam Kerja Yang Diambil Untuk Ijin Saja)
                </div>
              </div>
            </div>

            {/* Pernyataan */}
            <div className="my-2.5 text-[11px] leading-relaxed text-black">
              Demikian surat ijin ini kami buat dengan sebenarnya, kami bersedia menerima sanksi administrasi apabila dikemudian hari terjadi penyalahgunaan ijin / tidak sesuai dengan ijin yang kami ajukan.
            </div>

            {/* Kolom Tanda Tangan */}
            <div className="mt-4 pt-1 grid grid-cols-[1fr_220px] gap-6 text-[10px] text-black">
              {/* Pejabat yang berwenang */}
              <div>
                <div className="font-bold text-[11px] mb-1">Pejabat yang berwenang</div>
                <div className="grid grid-cols-4 gap-1 text-center">
                  <div>
                    <div className="leading-tight">Mengetahui 3,</div>
                    <div className="text-[9.5px] leading-tight">HRD II &amp; Umum II</div>
                    <div className="h-14"></div>
                    <div>(...................)</div>
                  </div>
                  <div>
                    <div className="leading-tight">Mengetahui 2,</div>
                    <div className="h-[70px]"></div>
                    <div>(...................)</div>
                  </div>
                  <div>
                    <div className="leading-tight">Mengetahui 1,</div>
                    <div className="h-[70px]"></div>
                    <div>(...................)</div>
                  </div>
                  <div>
                    <div className="leading-tight">Menyetujui</div>
                    <div className="h-[70px]"></div>
                    <div>(...................)</div>
                  </div>
                </div>
              </div>

              {/* Karyawan ybs */}
              <div className="text-center flex flex-col justify-between">
                <div>
                  <div className="font-bold text-[11px]">Malang, {tglKotaTtd}</div>
                  <div className="mt-0.5">Karyawan ybs,</div>
                </div>
                <div>
                  <div className="h-14"></div>
                  <div className="font-bold">
                    ( {record.nama} )
                  </div>
                </div>
              </div>
            </div>

            {/* Footnotes */}
            <div className="mt-3.5 text-[9px] text-black space-y-0.5 leading-tight">
              <div className="underline">* pilih salah satu (√).</div>
              <div className="underline">** Khusus tugas kerja yang bersifat ekstern Perusahaan tanpa dilengkapi Surat Tugas dari atasan.</div>
              <div className="underline">*** Jika salah satu dari cecklok masuk / pulang tidak terdeteksi di mesin absen sidik jari</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
