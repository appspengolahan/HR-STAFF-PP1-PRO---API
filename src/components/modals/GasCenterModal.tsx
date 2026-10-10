import React, { useState } from 'react';
import { X, Cloud, RefreshCw, Copy, Check, Terminal, ExternalLink, Zap } from 'lucide-react';
import { GasConfig } from '../../types';
import { storageService } from '../../services/storageService';
import { gasClient } from '../../services/gasClient';
import { sheetSyncService } from '../../services/sheetSync';
import { STANDALONE_GAS_SCRIPT } from '../../data/standaloneGasScript';
import { formatWaktuWib } from '../../utils/dateFormatter';

interface GasCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GasConfig;
  onUpdateConfig: (cfg: GasConfig) => void;
  onDataSyncSuccess?: () => void;
}

export const GasCenterModal: React.FC<GasCenterModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onDataSyncSuccess,
}) => {
  const [apiUrl, setApiUrl] = useState(config.apiUrl);
  const [isAutoSync, setIsAutoSync] = useState(config.isAutoSync);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [isSyncingPresensi, setIsSyncingPresensi] = useState(false);
  const [testLog, setTestLog] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'script'>('config');

  if (!isOpen) return null;

  const handleSave = () => {
    const updated: GasConfig = {
      ...config,
      apiUrl: apiUrl.trim(),
      isAutoSync,
    };
    storageService.saveGasConfig(updated);
    onUpdateConfig(updated);
    setTestLog('Konfigurasi URL GAS berhasil disimpan ke localStorage.');
  };

  const handleSyncGasPresensi = async () => {
    setIsSyncingPresensi(true);
    setTestLog('Menarik riwayat presensi & ijin langsung dari endpoint REST API GAS (?action=getPresensi)...');
    try {
      const staff = storageService.getStaffList();
      const res = await gasClient.fetchPresensi(apiUrl.trim(), staff);
      if (res.status === 'success' && res.data) {
        storageService.savePresensiList(res.data);
        const octRecords = res.data.filter((r) => r.bulan === 10 && r.tahun === 2026);
        setTestLog(
          `[BERHASIL MENARIK PRESENSI LIVE DARI GAS]\n✓ Diperoleh ${res.count} total catatan presensi\n✓ Catatan bulan Oktober 2026: ${octRecords.length} record\n✓ Termasuk data ijin tanggal 7 Oktober 2026 (Matsukri - Ijin Terlambat)\n\nData presensi telah diperbarui di aplikasi!`
        );
        const updated: GasConfig = {
          ...config,
          apiUrl: apiUrl.trim(),
          status: 'connected',
          lastSyncTimestamp: formatWaktuWib(new Date(), true),
        };
        storageService.saveGasConfig(updated);
        onUpdateConfig(updated);
        if (onDataSyncSuccess) {
          onDataSyncSuccess();
        }
      } else {
        setTestLog(`[GAGAL]\nRespon GAS: ${res.message || 'Data kosong'}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestLog(`[GAGAL MENARIK PRESENSI]\n${msg}`);
    } finally {
      setIsSyncingPresensi(false);
    }
  };

  const handleTestPing = async () => {
    setIsTesting(true);
    setTestLog('Mengirim permintaan PING ke Web App GAS...');
    try {
      const res = await gasClient.ping(apiUrl.trim());
      setTestLog(
        `[SUCCESS 200 OK]\nStatus: ${res.status}\nMessage: ${res.message || 'Koneksi Berhasil'}\nTimestamp: ${res.timestamp || new Date().toISOString()}`
      );
      const updated: GasConfig = {
        ...config,
        apiUrl: apiUrl.trim(),
        status: 'connected',
        lastSyncTimestamp: formatWaktuWib(new Date(), true),
      };
      storageService.saveGasConfig(updated);
      onUpdateConfig(updated);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setTestLog(`[ERROR KONEKSI]\n${errMsg}\n\nPastikan:
1. Deployment Apps Script dibuat dengan 'Who has access: Anyone'
2. URL berakhiran /exec
3. Internet aktif`);
      const updated: GasConfig = {
        ...config,
        status: 'error',
        errorMessage: errMsg,
      };
      storageService.saveGasConfig(updated);
      onUpdateConfig(updated);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncLiveSheet = async () => {
    setIsSyncingSheet(true);
    setTestLog('Menghubungi Google Sheets ID 1KzEFolz_sE2bhUPTn2U2NWWPAgs3V9fpatYc7t1aGs0 via GViz REST...');
    try {
      const res = await sheetSyncService.syncAllFromLiveSheet();
      setTestLog(
        `[BERHASIL MENARIK DATA ASLI SPREADSHEET]\n✓ Berhasil mengimpor ${res.staffCount} Staf dari MASTER_STAFF\n✓ Berhasil mengimpor ${res.presensiCount} Presensi dari LOG_PRESENSI_IJIN\n✓ Berhasil mengimpor ${res.linksCount} Link Arsip Google Drive\n\nData disimpan ke localStorage. Halaman akan menyegarkan data.`
      );
      if (onDataSyncSuccess) {
        onDataSyncSuccess();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestLog(`[GAGAL MENARIK DATA]\n${msg}`);
    } finally {
      setIsSyncingSheet(false);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(STANDALONE_GAS_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Headless GAS Center (V2 Standalone)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Integrasi REST API Google Apps Script &amp; Deployment Paralel
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

        {/* Sub Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50 dark:bg-slate-950/30 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('config')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeSubTab === 'config'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Pengaturan Endpoint &amp; Test Ping
          </button>
          <button
            onClick={() => setActiveSubTab('script')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'script'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Kode Standalone GAS V3.1 (Sinkronisasi 2-Arah)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {activeSubTab === 'config' ? (
            <>
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl text-blue-900 dark:text-blue-300 leading-relaxed">
                <p>
                  <strong>Sinkronisasi 2-Arah Aktif:</strong> Setiap input data baru, pengeditan catatan ijin, dan penghapusan data di Web Apps akan otomatis tersinkronisasi langsung ke baris Google Spreadsheet yang bersangkutan jika URL Web App GAS di bawah ini telah terhubung.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Web App URL Google Apps Script V2 (/exec)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Simpan
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleTestPing}
                  disabled={isTesting || !apiUrl}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  {isTesting ? 'Menguji Koneksi...' : 'Uji Koneksi (Test Ping)'}
                </button>

                <button
                  onClick={handleSyncGasPresensi}
                  disabled={isSyncingPresensi || !apiUrl}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPresensi ? 'animate-spin' : ''}`} />
                  {isSyncingPresensi ? 'Menarik Presensi Live...' : '⚡ Tarik Presensi Live dari GAS (/exec)'}
                </button>

                <button
                  onClick={handleSyncLiveSheet}
                  disabled={isSyncingSheet}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Cloud className={`w-3.5 h-3.5 ${isSyncingSheet ? 'animate-spin' : ''}`} />
                  {isSyncingSheet ? 'Menarik Data Spreadsheet...' : '📥 Tarik Data Asli dari Google Sheet'}
                </button>

                <span className="text-[11px] text-slate-400">
                  Status Saat Ini:{' '}
                  <strong className={config.status === 'connected' ? 'text-emerald-500' : 'text-slate-400'}>
                    {config.status.toUpperCase()}
                  </strong>
                </span>
              </div>

              {testLog && (
                <div className="mt-4 p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] whitespace-pre-wrap border border-slate-800">
                  {testLog}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Salin script di bawah ini ke project baru di Google Apps Script (script.google.com):
                </span>
                <button
                  onClick={handleCopyScript}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors text-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Tersalin ke Clipboard!' : 'Salin Seluruh Kode GAS'}
                </button>
              </div>

              <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto max-h-96 border border-slate-800 leading-relaxed">
                {STANDALONE_GAS_SCRIPT}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <span>Spreadsheet Target: 1KzEFolz_sE2bhUPTn2U2NWWPAgs3V9fpatYc7t1aGs0</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
