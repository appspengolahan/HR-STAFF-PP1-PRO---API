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

  const durasiJam = Math.floor(record.durasiMenit / 60);
  const durasiMenitSisa = record.durasiMenit % 60;

  // Determine checked status
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

  // Waktu pelaksanaan spesifik
  let jamMasukDisplay = '-';
  let jamKeluarDisplay = '-';
  let jamMasukKembaliDisplay = '-';

  if (isTerlambat) {
    jamMasukDisplay = record.jamAkhir || record.jamAwal || '08:48';
  } else if (isPulangCepat) {
    jamKeluarDisplay = record.jamAwal || '14:00';
  } else if (isKeluarSementara) {
    jamKeluarDisplay = record.jamAwal || '10:00';
    jamMasukKembaliDisplay = record.jamAkhir || '12:00';
  }

  // Format tanggal & hari
  const hariDisplay = record.hari || getNamaHariIndo(record.tanggal);
  const tglDisplay = formatTanggalDmy(record.tanggal);
  const tglKotaTtd = formatTanggalIndo(new Date());

  const boxChecked = (checked: boolean) => (
    <span className="font-bold text-[12px] leading-none inline-block align-middle mr-1">
      {checked ? '⌧' : '☐'}
    </span>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 text-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden">
        {/* Modal Controls (No Print) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 no-print">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span>Formulir Resmi Surat Permohonan Ijin</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                Format Standar Perusahaan
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Format baku perusahaan PT Batu Karang Divisi Produksi I (Siap Cetak Fisik / PDF)
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
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-200 dark:bg-slate-950 flex justify-center items-center">
          <div
            id="surat-ijin-print-paper"
            className="bg-white text-black shadow-2xl border border-slate-300 mx-auto"
            style={{
              width: '20.5cm',
              minHeight: '15cm',
              padding: '0.8cm 1.1cm 0.8cm 1.1cm',
              boxSizing: 'border-box',
              fontFamily: 'Arial, sans-serif',
              fontSize: '11px',
              lineHeight: '1.4',
            }}
          >
            {/* Header Judul */}
            <div className="text-center mb-3">
              <h1 className="text-[15px] font-bold tracking-wide uppercase m-0 leading-tight">
                SURAT PERMOHONAN IJIN
              </h1>
              <div className="text-[12px] font-bold italic mt-0.5">
                Karyawan Bulanan
              </div>
            </div>

            {/* Identitas Karyawan */}
            <div className="mb-2">
              <div className="mb-1 text-[11px]">Yang bertanda tangan di bawah ini;</div>
              <div className="space-y-0.5">
                <div className="flex items-baseline">
                  <span className="w-[110px] font-bold">Nama</span>
                  <span className="mr-2">:</span>
                  <span className="flex-1 font-bold border-b border-dotted border-black pb-0.5">
                    {record.nama}
                  </span>
                </div>

                <div className="flex items-baseline">
                  <span className="w-[110px] font-bold">Jabatan</span>
                  <span className="mr-2">:</span>
                  <span className="flex-1 border-b border-dotted border-black pb-0.5">
                    {staff?.jabatan || 'Staf Operasional'}
                  </span>
                </div>

                <div className="flex items-baseline">
                  <span className="w-[110px] font-bold">Divisi / Unit</span>
                  <span className="mr-2">:</span>
                  <span className="flex-1 border-b border-dotted border-black pb-0.5">
                    Produksi I / {staff?.sekup || 'Operasional'}
                  </span>
                </div>
              </div>
            </div>

            {/* Checkbox Options */}
            <div className="my-2.5 text-[11px] leading-relaxed">
              <div className="font-bold mb-0.5">Dengan ini mengajukan*</div>
              <div className="space-y-0.5 pl-0.5">
                <div>
                  {boxChecked(isNormatif)} Ijin Normatif,&nbsp;&nbsp;
                  {boxChecked(isTidakMasuk)} Ijin Tidak Masuk Kerja,&nbsp;&nbsp;
                  {boxChecked(isTerlambat)} Ijin Datang Terlambat,
                </div>
                <div>
                  {boxChecked(isKeluarSementara)} Ijin Meninggalkan Tempat Kerja Sementara Waktu,&nbsp;&nbsp;
                  {boxChecked(isPulangCepat)} Ijin Pulang Lebih Cepat,
                </div>
                <div>
                  {boxChecked(false)} Ijin Melaksanakan Tugas Kerja Yang Bersifat Ekstern Perusahaan**,
                </div>
                <div>
                  {boxChecked(isFormKehadiran)} Form Kehadiran***
                </div>
              </div>
            </div>

            {/* Waktu Pelaksanaan */}
            <div className="my-2 text-[11px] space-y-1">
              <div>pada :</div>
              <div className="space-y-0.5">
                <div className="flex items-baseline">
                  <span className="w-[170px] font-bold">Hari</span>
                  <span className="mr-2">:</span>
                  <span className="w-[100px] border-b border-dotted border-black pb-0.5">{hariDisplay}</span>
                  <span className="mx-2">s/d</span>
                  <span className="flex-1 border-b border-dotted border-black pb-0.5">{hariDisplay}</span>
                </div>

                <div className="flex items-baseline">
                  <span className="w-[170px] font-bold">Tanggal</span>
                  <span className="mr-2">:</span>
                  <span className="w-[100px] font-mono border-b border-dotted border-black pb-0.5">{tglDisplay}</span>
                  <span className="mx-2">s/d</span>
                  <span className="flex-1 font-mono border-b border-dotted border-black pb-0.5">{tglDisplay}</span>
                </div>

                <div className="flex items-baseline">
                  <span className="w-[170px] font-bold">Keterangan ijin / Form***</span>
                  <span className="mr-2">:</span>
                  <span className="flex-1 font-semibold border-b border-dotted border-black pb-0.5">
                    {record.keperluan || '-'}
                  </span>
                </div>

                <div className="flex items-baseline flex-wrap gap-y-1">
                  <span className="w-[170px] font-bold">Jam masuk</span>
                  <span className="mr-2">:</span>
                  <span className="w-[85px] border-b border-dotted border-black pb-0.5 font-mono">
                    {jamMasukDisplay}
                  </span>
                  <span className="ml-4 font-bold">Jam keluar:</span>
                  <span className="w-[75px] ml-1 border-b border-dotted border-black pb-0.5 font-mono">
                    {jamKeluarDisplay}
                  </span>
                  <span className="ml-4 font-bold">Jam masuk kembali:</span>
                  <span className="w-[75px] ml-1 border-b border-dotted border-black pb-0.5 font-mono">
                    {jamMasukKembaliDisplay}
                  </span>
                </div>

                <div className="flex items-baseline">
                  <span className="w-[170px] font-bold">Jumlah Ijin (Jam Kerja)</span>
                  <span className="mr-2">:</span>
                  <span className="flex-1 border-b border-dotted border-black pb-0.5">
                    <strong>{durasiJam}</strong> Jam <strong>{durasiMenitSisa}</strong> Menit
                  </span>
                </div>

                <div className="text-[10px] italic text-slate-700 pl-2">
                  (Diisi Hanya Jam Kerja Yang Diambil Untuk Ijin Saja)
                </div>
              </div>
            </div>

            {/* Pernyataan */}
            <div className="my-2.5 text-[10.5px] leading-relaxed">
              Demikian surat ijin ini kami buat dengan sebenarnya, kami bersedia menerima sanksi administrasi apabila dikemudian hari terjadi penyalahgunaan ijin / tidak sesuai dengan ijin yang kami ajukan.
            </div>

            {/* Kolom Tanda Tangan */}
            <div className="mt-4 pt-1 grid grid-cols-[1fr_220px] gap-6 text-[10px]">
              {/* Pejabat yang berwenang */}
              <div>
                <div className="font-bold text-[11px] mb-1">Pejabat yang berwenang</div>
                <div className="grid grid-cols-4 gap-1 text-center">
                  <div>
                    <div className="font-semibold leading-tight">Mengetahui 3,</div>
                    <div className="text-[9px] font-medium leading-tight">HRD II &amp; Umum II</div>
                    <div className="h-12"></div>
                    <div>(...............)</div>
                  </div>
                  <div>
                    <div className="font-semibold leading-tight">Mengetahui 2,</div>
                    <div className="h-15"></div>
                    <div>(...............)</div>
                  </div>
                  <div>
                    <div className="font-semibold leading-tight">Mengetahui 1,</div>
                    <div className="h-15"></div>
                    <div>(...............)</div>
                  </div>
                  <div>
                    <div className="font-semibold leading-tight">Menyetujui</div>
                    <div className="h-15"></div>
                    <div>(...............)</div>
                  </div>
                </div>
              </div>

              {/* Karyawan ybs */}
              <div className="text-center flex flex-col justify-between">
                <div>
                  <div className="font-bold">Malang, {tglDisplay}</div>
                  <div className="mt-0.5 font-semibold">Karyawan ybs,</div>
                </div>
                <div>
                  <div className="h-10"></div>
                  <div className="font-bold border-b border-black inline-block px-2">
                    ( {record.nama} )
                  </div>
                </div>
              </div>
            </div>

            {/* Footnotes */}
            <div className="mt-4 pt-1.5 text-[8.5px] text-slate-700 space-y-0.5 leading-tight border-t border-slate-300">
              <div>* pilih salah satu (v).</div>
              <div>** Khusus tugas kerja yang bersifat ekstern Perusahaan tanpa dilengkapi Surat Tugas dari atasan.</div>
              <div>*** Jika salah satu dari cecklok masuk / pulang tidak terdeteksi di mesin absen sidik jari</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
