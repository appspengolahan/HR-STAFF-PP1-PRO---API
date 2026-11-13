import React, { useState, useEffect, useRef, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Download,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  ShieldCheck,
  X,
  Sparkles,
  Users,
  Lock,
  Globe,
  Printer,
  FileDown,
} from 'lucide-react';
import { appAlert } from '../../services/dialogService';
import { formatTanggalIndo } from '../../utils/dateFormatter';

export type QrTargetType = 'staff-login' | 'management-login' | 'public-portal';

interface QrLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTarget?: QrTargetType;
}

export const QrLoginModal: React.FC<QrLoginModalProps> = ({
  isOpen,
  onClose,
  defaultTarget = 'staff-login',
}) => {
  const [targetType, setTargetType] = useState<QrTargetType>(defaultTarget);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [displaySize, setDisplaySize] = useState<'normal' | 'large' | 'jumbo'>('normal');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSvgString, setQrSvgString] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isGeneratingDownload, setIsGeneratingDownload] = useState<boolean>(false);

  // Sync default target when modal opens
  useEffect(() => {
    if (isOpen) {
      setTargetType(defaultTarget);
    }
  }, [isOpen, defaultTarget]);

  // Compute the exact target URL
  const targetUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname;

    switch (targetType) {
      case 'staff-login':
        return `${origin}${pathname}?view=login&gate=staff`;
      case 'management-login':
        return `${origin}${pathname}?view=login&gate=management`;
      case 'public-portal':
        return `${origin}${pathname}?view=public`;
      default:
        return `${origin}${pathname}?view=login&gate=staff`;
    }
  }, [targetType]);

  // Target info descriptors
  const targetMeta = useMemo(() => {
    switch (targetType) {
      case 'staff-login':
        return {
          title: 'QR Code Login Staf Mandiri',
          subtitle: 'Arahkan kamera smartphone staf ke QR ini untuk langsung membuka Portal Mandiri Staf.',
          badge: 'Login Staf',
          badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-800',
          fileNamePrefix: 'QR_Login_Staf_PP1_PT_Batu_Karang',
          headerLabel: 'SCAN UNTUK LOGIN PORTAL MANDIRI STAF',
          instruction: 'Gunakan kamera smartphone atau aplikasi Google Lens untuk scan. Masukkan NIP, Email, & PIN (standar 123456).',
        };
      case 'management-login':
        return {
          title: 'QR Code Login Manajemen & HR',
          subtitle: 'Akses khusus untuk Project Manager, Admin HR, Site Engineer, dan Kepala Departemen.',
          badge: 'Manajemen / HR',
          badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
          fileNamePrefix: 'QR_Login_Manajemen_PP1_PT_Batu_Karang',
          headerLabel: 'SCAN UNTUK LOGIN MANAJEMEN & HR',
          instruction: 'Khusus staf berwenang / pimpinan. Memerlukan email terdaftar dan kata sandi manajemen.',
        };
      case 'public-portal':
        return {
          title: 'QR Code Portal Informasi Publik',
          subtitle: 'Tautan portal informasi transparan bagi pimpinan, tamu, atau audit tanpa perlu login.',
          badge: 'Publik (Linktree)',
          badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
          fileNamePrefix: 'QR_Portal_Publik_PP1_PT_Batu_Karang',
          headerLabel: 'PORTAL INFORMASI PUBLIK (READ-ONLY)',
          instruction: 'Dapat diakses langsung oleh siapa pun tanpa password untuk melihat statistik kehadiran harian.',
        };
    }
  }, [targetType]);

  // Generate High-Precision QR Code whenever targetUrl changes
  useEffect(() => {
    if (!targetUrl || !isOpen) return;

    let isMounted = true;

    // High Error Correction ('H' = 30% recovery, suitable for stickers, posters, screen scans)
    QRCode.toDataURL(targetUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 720,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Gagal generate QR Code Data URL:', err);
      });

    QRCode.toString(targetUrl, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((svg) => {
        if (isMounted) setQrSvgString(svg);
      })
      .catch((err) => {
        console.error('Gagal generate QR Code SVG:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [targetUrl, isOpen]);

  if (!isOpen) return null;

  // Handle Copy URL
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2200);
    } catch {
      appAlert('Gagal menyalin link secara otomatis. Silakan salin teks URL secara manual.');
    }
  };

  // Handle Download High-Res PNG (Poster Siap Cetak 1200x1500)
  const handleDownloadPng = async () => {
    if (!qrDataUrl) return;
    setIsGeneratingDownload(true);

    try {
      const canvas = document.createElement('canvas');
      const width = 1200;
      const height = 1500;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Background Clean White & Border Frame
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Top Navy Accent Bar
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(0, 0, width, 18);

      // Outer Decorative Border
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 40, width - 60, height - 80);

      // Inner Frame
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(40, 50, width - 80, height - 100);

      // 2. Header Kop Perusahaan
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 38px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PT BATU KARANG', width / 2, 120);

      ctx.fillStyle = '#2563eb';
      ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
      ctx.fillText('DIVISI PRODUKSI I (PP1)', width / 2, 165);

      // Divider line
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(150, 195);
      ctx.lineTo(width - 150, 195);
      ctx.stroke();

      // 3. Title Box
      ctx.fillStyle = targetType === 'public-portal' ? '#059669' : '#1e40af';
      ctx.font = '900 32px system-ui, -apple-system, sans-serif';
      ctx.fillText(targetMeta.headerLabel, width / 2, 250);

      ctx.fillStyle = '#64748b';
      ctx.font = '500 20px system-ui, -apple-system, sans-serif';
      ctx.fillText('Pindai (Scan) QR Code berikut menggunakan Kamera Smartphone / Google Lens', width / 2, 290);

      // 4. Draw QR Code Image
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      qrImg.src = qrDataUrl;
      await new Promise((resolve, reject) => {
        qrImg.onload = resolve;
        qrImg.onerror = reject;
      });

      // White Plate Container with subtle shadow
      const qrBoxSize = 720;
      const qrBoxX = (width - qrBoxSize) / 2;
      const qrBoxY = 330;

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 6;
      ctx.strokeRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);

      // Draw QR Image
      const padding = 20;
      ctx.drawImage(
        qrImg,
        qrBoxX + padding,
        qrBoxY + padding,
        qrBoxSize - padding * 2,
        qrBoxSize - padding * 2
      );

      // Center Badge/Logo in QR
      const centerBadgeSize = 90;
      const centerBadgeX = width / 2 - centerBadgeSize / 2;
      const centerBadgeY = qrBoxY + qrBoxSize / 2 - centerBadgeSize / 2;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(centerBadgeX - 4, centerBadgeY - 4, centerBadgeSize + 8, centerBadgeSize + 8);
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(centerBadgeX, centerBadgeY, centerBadgeSize, centerBadgeSize);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
      ctx.fillText('PP1', width / 2, centerBadgeY + 58);

      // 5. Instruction Footer Box
      const infoBoxY = qrBoxY + qrBoxSize + 40;
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(100, infoBoxY, width - 200, 180);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(100, infoBoxY, width - 200, 180);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.fillText('PETUNJUK AKSES MASUK STAF:', width / 2, infoBoxY + 45);

      ctx.fillStyle = '#334155';
      ctx.font = '500 18px system-ui, -apple-system, sans-serif';
      ctx.fillText('1. Arahkan kamera HP ke kode QR di atas hingga link muncul', width / 2, infoBoxY + 85);
      ctx.fillText('2. Masukkan NIP Staf & PIN Akses (Standar: 123456)', width / 2, infoBoxY + 118);
      ctx.fillText('3. Masuk ke halaman Absensi, Slip Gaji, dan Formulir Izin', width / 2, infoBoxY + 150);

      // 6. Bottom Copyright Note
      ctx.fillStyle = '#94a3b8';
      ctx.font = '15px system-ui, -apple-system, sans-serif';
      const nowStr = formatTanggalIndo(new Date());
      ctx.fillText(`Dokumen Resmi Sistem HR Staf Divisi Produksi I — Dicetak pada: ${nowStr}`, width / 2, height - 60);

      // Download Trigger
      const dataUri = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `${targetMeta.fileNamePrefix}_HD.png`;
      link.href = dataUri;
      link.click();
    } catch (e) {
      console.error('Gagal download QR PNG:', e);
      appAlert('Gagal membuat gambar PNG resolusi tinggi. Silakan coba kembali.');
    } finally {
      setIsGeneratingDownload(false);
    }
  };

  // Handle Download SVG Vektor
  const handleDownloadSvg = () => {
    if (!qrSvgString) return;
    const blob = new Blob([qrSvgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${targetMeta.fileNamePrefix}_Vektor.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Determine QR display size pixel style
  const getQrSizePixel = () => {
    if (isExpanded) {
      return 'w-[320px] h-[320px] sm:w-[460px] sm:h-[460px] md:w-[520px] md:h-[520px]';
    }
    switch (displaySize) {
      case 'jumbo':
        return 'w-[340px] h-[340px] sm:w-[420px] sm:h-[420px]';
      case 'large':
        return 'w-[280px] h-[280px] sm:w-[340px] sm:h-[340px]';
      case 'normal':
      default:
        return 'w-[230px] h-[230px] sm:w-[270px] sm:h-[270px]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 no-print">
      <div
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col text-slate-800 dark:text-slate-100 transition-all duration-300 overflow-hidden ${
          isExpanded
            ? 'w-full max-w-4xl h-[95dvh] max-h-[920px]'
            : 'w-full max-w-2xl max-h-[92dvh]'
        }`}
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  QR Code Presisi Tinggi
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${targetMeta.badgeColor}`}
                >
                  {targetMeta.badge}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {targetMeta.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Toggle Expand Modal */}
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              title={isExpanded ? 'Perkecil Ukuran Modal' : 'Perbesar Tampilan Layar Penuh'}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Target Switcher Tabs */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/40 shrink-0 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Target QR:
          </span>
          <button
            type="button"
            onClick={() => setTargetType('staff-login')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              targetType === 'staff-login'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Login Staf Mandiri</span>
          </button>
          <button
            type="button"
            onClick={() => setTargetType('management-login')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              targetType === 'management-login'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Login Manajemen / HR</span>
          </button>
          <button
            type="button"
            onClick={() => setTargetType('public-portal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              targetType === 'public-portal'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Portal Publik (Linktree)</span>
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Main Visual Display: QR Board */}
          <div className="flex flex-col items-center justify-center">
            {/* Visual Frame */}
            <div className="relative group p-4 sm:p-6 bg-white rounded-3xl border-4 border-slate-900 dark:border-slate-100 shadow-xl flex flex-col items-center justify-center transition-all">
              {/* Header Badge */}
              <div className="mb-2 text-center">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                  PT BATU KARANG • DIVISI PRODUKSI I
                </span>
                <div className="text-xs font-extrabold text-slate-900 mt-1">
                  {targetMeta.headerLabel}
                </div>
              </div>

              {/* QR Image Rendering */}
              {qrDataUrl ? (
                <div className={`relative flex items-center justify-center ${getQrSizePixel()}`}>
                  <img
                    src={qrDataUrl}
                    alt="High-Precision QR Code"
                    className="w-full h-full object-contain select-none"
                  />
                  {/* Center Emblem Logo */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-600 text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-lg border-2 border-white">
                      PP1
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-64 h-64 flex items-center justify-center text-slate-400 text-xs">
                  Membuat QR Code Presisi Tinggi...
                </div>
              )}

              {/* Bottom Tag */}
              <div className="mt-2 text-center">
                <span className="text-[11px] font-bold text-slate-600">
                  Scan kamera HP / Google Lens
                </span>
              </div>
            </div>

            {/* Size Controls when not expanded */}
            {!isExpanded && (
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-semibold text-[11px]">Ukuran Tampilan:</span>
                <div className="inline-flex rounded-xl p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setDisplaySize('normal')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      displaySize === 'normal'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Sedang
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplaySize('large')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      displaySize === 'large'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Besar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplaySize('jumbo')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      displaySize === 'jumbo'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Jumbo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Instruksi Bagi Staf */}
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-2">
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-bold text-xs">
              <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Instruksi Scan Staf di Lapangan / Pos Operasional</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              {targetMeta.instruction}
            </p>
          </div>

          {/* Kotak Tautan URL & Aksi Salin */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs">
              Tautan Lengkap Tujuan QR:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={targetUrl}
                className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-200 focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyUrl}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0 ${
                  isCopied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Link</span>
                  </>
                )}
              </button>
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Buka tautan di tab baru"
                className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-300 dark:border-slate-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer: Download HD & Expand Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Kecilkan Tampilan</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Buka Layar Penuh (Expand)</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Download SVG Vektor */}
            <button
              type="button"
              onClick={handleDownloadSvg}
              title="Unduh file vektor SVG untuk kebutuhan cetak ukuran tak terbatas"
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Unduh SVG</span>
            </button>

            {/* Download PNG HD */}
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isGeneratingDownload}
              title="Unduh Poster Gambar PNG Siap Cetak (1200 x 1500 px)"
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingDownload ? 'Menyiapkan HD...' : 'Download Gambar QR (HD)'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-colors cursor-pointer"
            >
              Selesai
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
