import React, { useState } from 'react';
import { X, Printer, Send, Copy, Check, MessageSquare } from 'lucide-react';
import { SlipGajiRecord, StaffData } from '../../types';
import { formatRupiah } from '../../services/payrollEngine';

interface ThermalSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  slip: SlipGajiRecord | null;
  staff: StaffData | null;
}

export const ThermalSlipModal: React.FC<ThermalSlipModalProps> = ({
  isOpen,
  onClose,
  slip,
  staff,
}) => {
  const [copied, setCopied] = useState(false);
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('80mm');

  if (!isOpen || !slip) return null;

  const handlePrint = () => {
    window.print();
  };

  const generateWhatsappText = () => {
    return `*SLIP GAJI RESMI — PT BATU KARANG (DIVISI PRODUKSI I)*
Periode: ${slip.namaBulan} ${slip.tahun}
----------------------------------------
Nama: *${slip.nama}*
NIP: ${slip.nip}
Jabatan: ${slip.jabatan}
Unit: ${slip.sekup}
Status: ${slip.statusKepegawaian} | PTKP: ${slip.statusPTKP}
----------------------------------------
*PENGHASILAN:*
• Gaji Pokok: ${formatRupiah(slip.gajiPokok)}
• Tunjangan Jabatan: ${formatRupiah(slip.tunjanganJabatan)}
• Lembur Resmi: ${formatRupiah(slip.totalLembur)}
${slip.hariTidakDibayar > 0 ? `• Potongan Ijin (${slip.hariTidakDibayar} hari): -${formatRupiah(slip.potonganIjinRp)}\n` : ''}*TOTAL BRUTO:* ${formatRupiah(slip.totalGajiBruto)}
----------------------------------------
*POTONGAN RESMI:*
• BPJS JHT (2%): -${formatRupiah(slip.bpjsJht)}
• BPJS JP (1%): -${formatRupiah(slip.bpjsJp)}
• BPJS Kesehatan: -${formatRupiah(slip.bpjsKesehatan)}
• PPh21 TER (${(slip.tarifTerPct * 100).toFixed(2)}%): -${formatRupiah(slip.pph21Bulan)}
----------------------------------------
*GAJI DITERIMA (NETTO):*
💰 *${formatRupiah(slip.gajiDiterima)}*
Terbilang: _${slip.terbilangGaji || ''}_
----------------------------------------
_Dokumen digital resmi Divisi Produksi I - All Rights Reserved._`;
  };

  const handleCopyWa = () => {
    navigator.clipboard.writeText(generateWhatsappText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWa = () => {
    const text = encodeURIComponent(generateWhatsappText());
    let phone = staff?.telp || '';
    phone = phone.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 no-print">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Cetak Thermal POS &amp; Kirim WhatsApp
            </h2>
            <p className="text-xs text-slate-500">
              Slip Gaji Karyawan Bulanan: {slip.nama} ({slip.nip})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 p-0.5 text-xs font-semibold">
              <button
                onClick={() => setPaperWidth('58mm')}
                className={`px-2 py-1 rounded ${paperWidth === '58mm' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
              >
                58mm
              </button>
              <button
                onClick={() => setPaperWidth('80mm')}
                className={`px-2 py-1 rounded ${paperWidth === '80mm' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
              >
                80mm
              </button>
            </div>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Cetak Thermal
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex flex-col md:flex-row gap-6 bg-slate-100 dark:bg-slate-950 items-center justify-center">
          {/* Thermal Receipt Preview */}
          <div
            id="thermal-slip-paper"
            className="bg-white text-black p-4 shadow-lg border border-slate-300 rounded font-mono text-xs leading-relaxed"
            style={{
              width: paperWidth === '58mm' ? '54mm' : '76mm',
              fontSize: paperWidth === '58mm' ? '10px' : '11px',
            }}
          >
            <div className="text-center font-bold pb-2 border-b border-dashed border-black">
              <div>PT BATU KARANG</div>
              <div className="text-[10px]">DIVISI PRODUKSI I (PP1)</div>
              <div className="text-[9px] font-normal">SLIP GAJI KARYAWAN</div>
              <div className="text-[9px] font-normal">{slip.namaBulan} {slip.tahun}</div>
            </div>

            <div className="py-2 text-[10px] space-y-0.5 border-b border-dashed border-black">
              <div>NIP : {slip.nip}</div>
              <div className="font-bold truncate">{slip.nama}</div>
              <div>Jab : {slip.jabatan}</div>
              <div>PTKP: {slip.statusPTKP}</div>
            </div>

            <div className="py-2 space-y-1 border-b border-dashed border-black text-[10px]">
              <div className="flex justify-between">
                <span>Gaji Pokok:</span>
                <span>{formatRupiah(slip.gajiPokok)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tunjangan:</span>
                <span>{formatRupiah(slip.tunjanganJabatan)}</span>
              </div>
              {slip.totalLembur > 0 && (
                <div className="flex justify-between">
                  <span>Lembur SPKL:</span>
                  <span>{formatRupiah(slip.totalLembur)}</span>
                </div>
              )}
              {slip.hariTidakDibayar > 0 && (
                <div className="flex justify-between text-red-600 font-semibold">
                  <span>Pot. Ijin ({slip.hariTidakDibayar}h):</span>
                  <span>-{formatRupiah(slip.potonganIjinRp)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-1 border-t border-dotted border-black">
                <span>TOTAL BRUTO:</span>
                <span>{formatRupiah(slip.totalGajiBruto)}</span>
              </div>
            </div>

            <div className="py-2 space-y-0.5 border-b border-dashed border-black text-[9.5px]">
              <div className="flex justify-between">
                <span>BPJS JHT (2%):</span>
                <span>-{formatRupiah(slip.bpjsJht)}</span>
              </div>
              <div className="flex justify-between">
                <span>BPJS JP (1%):</span>
                <span>-{formatRupiah(slip.bpjsJp)}</span>
              </div>
              <div className="flex justify-between">
                <span>BPJS Kes:</span>
                <span>-{formatRupiah(slip.bpjsKesehatan)}</span>
              </div>
              <div className="flex justify-between">
                <span>PPh21 (TER):</span>
                <span>-{formatRupiah(slip.pph21Bulan)}</span>
              </div>
            </div>

            <div className="py-2 text-center border-b border-dashed border-black">
              <div className="text-[10px] font-bold">TOTAL DITERIMA:</div>
              <div className="text-sm font-extrabold tracking-wide mt-0.5">
                {formatRupiah(slip.gajiDiterima)}
              </div>
            </div>

            <div className="pt-2 text-center text-[8.5px] text-slate-600 leading-tight">
              <div>Dicetak: {new Date().toLocaleDateString('id-ID')}</div>
              <div>Divisi Produksi I - All Rights Reserved</div>
            </div>
          </div>

          {/* WhatsApp Text Card */}
          <div className="w-full md:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3 no-print">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              <MessageSquare className="w-4 h-4" />
              Rangkuman Format WhatsApp
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Kirim rincian slip gaji resmi langsung ke nomor WhatsApp karyawan (
              <strong>{staff?.telp || 'No HP Belum Diisi'}</strong>).
            </p>

            <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-mono max-h-52 overflow-y-auto whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">
              {generateWhatsappText()}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyWa}
                className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Tersalin' : 'Salin Teks'}
              </button>
              <button
                onClick={handleSendWa}
                className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                Buka WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
