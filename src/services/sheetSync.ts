import { StaffData, PresensiRecord, LinkArsip, LemburRecord } from '../types';
import { storageService } from './storageService';
import { gasClient } from './gasClient';
import { getEffectiveFaktorPotongan } from './payrollEngine';

const SPREADSHEET_ID = '1KzEFolz_sE2bhUPTn2U2NWWPAgs3V9fpatYc7t1aGs0';

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

export const sheetSyncService = {
  async fetchLiveSheetCsv(sheetName: string): Promise<string[][]> {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
      sheetName
    )}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}: Gagal membaca sheet ${sheetName}`);
    const text = await res.text();
    const lines = text.split('\n').filter((l) => l.trim().length > 0);
    return lines.map((l) => parseCsvLine(l));
  },

  async syncAllFromLiveSheet(): Promise<{
    staffCount: number;
    presensiCount: number;
    linksCount: number;
    lemburCount: number;
  }> {
    // 1. Fetch MASTER_STAFF
    const staffRows = await this.fetchLiveSheetCsv('MASTER_STAFF');
    const newStaff: StaffData[] = [];
    const headers = staffRows[0] || [];
    const pendColIdx = headers.findIndex((h) => h.toLowerCase().includes('pendidikan'));

    staffRows.slice(1).forEach((r, idx) => {
      if (r.length > 2 && r[2] && r[2] !== 'Nama') {
        const id = idx + 1;
        const nip = `BK-PP1-${String(id).padStart(3, '0')}`;
        const nama = r[2].replace(/^"|"$/g, '').trim();
        const status = (r[3] || 'PKWT 1').replace(/^"|"$/g, '').trim() as any;
        const jabatan = (r[4] || '-').replace(/^"|"$/g, '').trim();
        const level = (r[5] || 'Staff').replace(/^"|"$/g, '').trim();
        const rawSekup = (r[6] || '').replace(/^"|"$/g, '').trim();
        const sekup: 'Operasional' | 'Administrasi' =
          rawSekup === 'Administrasi' || rawSekup === 'Operasional'
            ? rawSekup
            : jabatan.toLowerCase().includes('administrasi')
            ? 'Administrasi'
            : 'Operasional';

        const statusAktif = ((r[7] || 'Aktif').replace(/^"|"$/g, '').trim() || 'Aktif') as any;
        const jk = ((r[8] || 'Laki-laki').replace(/^"|"$/g, '').trim() || 'Laki-laki') as any;
        const nik = (r[9] || '').replace(/^"|"$/g, '').trim();
        const kk = (r[10] || '').replace(/^"|"$/g, '').trim();
        const npwp = (r[11] || '').replace(/^"|"$/g, '').trim();
        const email = (r[12] || '').replace(/^"|"$/g, '').trim();
        const bank = (r[13] || 'Bank Permata').replace(/^"|"$/g, '').trim();
        const rekening = (r[14] || '').replace(/^"|"$/g, '').trim();
        const telp = (r[15] || '').replace(/^"|"$/g, '').trim();

        const parseRp = (v: string) => {
          if (!v) return 0;
          const clean = v.replace(/[^\d]/g, '');
          return clean ? parseInt(clean, 10) : 0;
        };

        const gp = parseRp(r[16]);
        const tunjangan = parseRp(r[17]);
        const totalGaji = parseRp(r[18]) || gp + tunjangan;
        const statusPTKP = (r[19] || 'TK/0').replace(/^"|"$/g, '').trim();
        const domisili = (r[20] || 'Malang').replace(/^"|"$/g, '').trim();
        const proyeksiJabatan = r[21] ? r[21].replace(/^"|"$/g, '').trim() : '';
        const sanksi = r[22] ? r[22].replace(/^"|"$/g, '').trim() : '-';
        const awalPKWT = r[23] ? r[23].replace(/^"|"$/g, '').trim() : '';
        const akhirPKWT = r[24] ? r[24].replace(/^"|"$/g, '').trim() : '';
        const limitPKWT = r[25] ? r[25].replace(/^"|"$/g, '').trim() : '';
        const plafonLevel = r[26] ? r[26].replace(/^"|"$/g, '').trim() : '';
        const deskripsiJabatan = r[27] ? r[27].replace(/^"|"$/g, '').trim() : '';
        const faskes = r[28] ? r[28].replace(/^"|"$/g, '').trim() : '';
        const bpjsKesehatanNominal = parseRp(r[29]);

        // Dynamic lookup for Pendidikan Terakhir
        const rawPend = (pendColIdx !== -1 && r[pendColIdx] ? r[pendColIdx] : r[30] || '').replace(/^"|"$/g, '').trim();
        let pendidikanTerakhir: 'SD' | 'SMP' | 'SMA/SMK' | 'D1' | 'D2' | 'D3' | 'D4' | 'S1' | 'S2' | 'S3' = 'SMA/SMK';
        const pendUpper = rawPend.toUpperCase();
        if (pendUpper.includes('S3') || pendUpper.includes('DOKTOR')) {
          pendidikanTerakhir = 'S3';
        } else if (pendUpper.includes('S2') || pendUpper.includes('MAGISTER')) {
          pendidikanTerakhir = 'S2';
        } else if (pendUpper.includes('S1') || pendUpper.includes('SARJANA')) {
          pendidikanTerakhir = 'S1';
        } else if (pendUpper.includes('D4')) {
          pendidikanTerakhir = 'D4';
        } else if (pendUpper.includes('D3') || pendUpper.includes('DIPLOMA 3')) {
          pendidikanTerakhir = 'D3';
        } else if (pendUpper.includes('D2')) {
          pendidikanTerakhir = 'D2';
        } else if (pendUpper.includes('D1')) {
          pendidikanTerakhir = 'D1';
        } else if (pendUpper.includes('SMP') || pendUpper.includes('SLTP')) {
          pendidikanTerakhir = 'SMP';
        } else if (pendUpper.includes('SD')) {
          pendidikanTerakhir = 'SD';
        } else if (pendUpper.includes('SMA') || pendUpper.includes('SMK') || pendUpper.includes('SLTA')) {
          pendidikanTerakhir = 'SMA/SMK';
        } else if (jabatan.includes('Manajer') || jabatan.includes('Kepala')) {
          pendidikanTerakhir = 'S1';
        }

        newStaff.push({
          id,
          nip,
          nama,
          status,
          jabatan,
          level,
          sekup,
          statusAktif,
          jk,
          nik,
          kk,
          npwp,
          email,
          bank,
          rekening,
          telp,
          domisili,
          pendidikanTerakhir,
          gajiPokok: gp,
          tunjanganJabatan: tunjangan,
          totalGaji,
          statusPTKP,
          proyeksiJabatan,
          sanksi,
          awalPKWT,
          akhirPKWT,
          limitPKWT,
          plafonLevel,
          deskripsiJabatan,
          faskes,
          bpjsKesehatanNominal,
          shiftDefault: sekup === 'Administrasi' ? 'Non-Shift' : 'Shift 1',
        });
      }
    });

    if (newStaff.length > 0) {
      storageService.saveStaffList(newStaff);
    }

    // 2. Fetch LOG_LINK_ARSIP
    let newLinks: LinkArsip[] = [];
    try {
      const linkRows = await this.fetchLiveSheetCsv('LOG_LINK_ARSIP');
      linkRows.slice(1).forEach((r, idx) => {
        if (r.length > 4 && r[2] && r[4]) {
          const nama = r[2].replace(/^"|"$/g, '').trim();
          const label = (r[3] || 'FOLDER DATA').replace(/^"|"$/g, '').trim();
          const url = r[4].replace(/^"|"$/g, '').trim();
          const tgl = (r[5] || '13/08/2026').replace(/^"|"$/g, '').trim();
          const st = newStaff.find((s) => s.nama === nama);
          newLinks.push({
            id: `lnk-${idx + 1}`,
            nip: st?.nip || `BK-PP1-${idx + 1}`,
            nama,
            label,
            url,
            tanggalDitambahkan: tgl,
          });
        }
      });
      if (newLinks.length > 0) {
        storageService.saveLinksList(newLinks);
      }
    } catch (e) {
      console.warn('Gagal membaca LOG_LINK_ARSIP:', e);
    }

    // 3. Fetch LOG_PRESENSI_IJIN
    let newPresensi: PresensiRecord[] = [];
    try {
      const presensiRows = await this.fetchLiveSheetCsv('LOG_PRESENSI_IJIN');
      const allStaff = newStaff.length > 0 ? newStaff : storageService.getStaffList();
      
      presensiRows.forEach((r, idx) => {
        // Skip header row if present
        if (r[2] === 'Tanggal' || r[3] === 'Nama Staf' || r[3] === 'Nama') return;

        if (r.length > 3 && r[2] && r[3]) {
          const rowId = r[1] && !isNaN(Number(r[1].replace(/[^\d]/g, ''))) ? Number(r[1].replace(/[^\d]/g, '')) : idx + 1;
          const rawTgl = r[2].replace(/^"|"$/g, '').trim();
          const nama = r[3].replace(/^"|"$/g, '').trim();
          const jamAwal = (r[6] || '08:00').replace(/^"|"$/g, '').trim();
          const jamAkhir = (r[7] || '15:00').replace(/^"|"$/g, '').trim();
          const durasi = parseInt((r[8] || '0').replace(/[^\d]/g, ''), 10) || 0;
          const jenisIjin = (r[9] || 'Hadir').replace(/^"|"$/g, '').trim() as any;
          const keperluan = (r[10] || '').replace(/^"|"$/g, '').trim();
          const lampiranSurat = ((r[11] || '').toLowerCase().includes('ya') ? 'Ya' : 'Tidak') as any;
          const catatan = (r[12] || '').replace(/^"|"$/g, '').trim();

          let isoTgl = rawTgl;
          let bulan = 10;
          let tahun = 2026;
          if (rawTgl.includes('/')) {
            const p = rawTgl.split('/');
            if (p.length === 3) {
              isoTgl = `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
              bulan = parseInt(p[1], 10);
              tahun = parseInt(p[2], 10);
            }
          } else if (rawTgl.includes('-')) {
            const p = rawTgl.split('-');
            if (p.length === 3) {
              isoTgl = rawTgl;
              tahun = parseInt(p[0], 10);
              bulan = parseInt(p[1], 10);
            }
          }

          const rawFaktor = (r[16] || '').replace(',', '.').replace(/^"|"$/g, '').trim();
          const parsedFaktor = rawFaktor !== '' && !isNaN(parseFloat(rawFaktor)) ? parseFloat(rawFaktor) : undefined;
          const faktor = getEffectiveFaktorPotongan({
            jenisIjin,
            durasiMenit: durasi,
            lampiranSurat,
            catatan,
            faktorPotongan: parsedFaktor,
          });

          const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
          let hariName = 'Hari';
          try {
            const dt = new Date(isoTgl);
            if (!isNaN(dt.getTime())) {
              hariName = dayNames[dt.getDay()];
            }
          } catch (_) {}

          const st = allStaff.find((s) => s.nama.toLowerCase() === nama.toLowerCase());

          newPresensi.push({
            id: `pr-${rowId}`,
            rowNum: rowId,
            tanggal: isoTgl,
            hari: hariName,
            nip: st?.nip || `BK-PP1-${String(rowId).padStart(3, '0')}`,
            nama,
            jamAwal,
            jamAkhir,
            durasiMenit: durasi,
            jenisIjin,
            faktorPotongan: faktor,
            keperluan,
            lampiranSurat,
            catatan,
            bulan,
            tahun,
            shift: 'Shift 1',
            geofenceValid: true,
          });
        }
      });

      if (newPresensi.length > 0) {
        storageService.savePresensiList(newPresensi);
      }
    } catch (e) {
      console.warn('Gagal membaca LOG_PRESENSI_IJIN via CSV, mencoba fallback ke GAS REST API:', e);
      try {
        const gasCfg = storageService.getGasConfig();
        if (gasCfg.apiUrl) {
          const gasRes = await gasClient.fetchPresensi(gasCfg.apiUrl, newStaff.length > 0 ? newStaff : storageService.getStaffList());
          if (gasRes.status === 'success' && gasRes.data && gasRes.data.length > 0) {
            newPresensi = gasRes.data;
            storageService.savePresensiList(newPresensi);
          }
        }
      } catch (gasErr) {
        console.error('Fallback GAS REST API juga gagal:', gasErr);
      }
    }

    // 4. Fetch LOG_LEMBUR
    let newLembur: LemburRecord[] = [];
    try {
      const lemburRows = await this.fetchLiveSheetCsv('LOG_LEMBUR');
      lemburRows.slice(1).forEach((r, idx) => {
        if (r.length > 3 && r[2] && r[3] && r[2].trim() && r[3].trim()) {
          const rawTgl = r[2].replace(/^"|"$/g, '').trim();
          const nama = r[3].replace(/^"|"$/g, '').trim();
          const sekup = (r[4] || 'Operasional').replace(/^"|"$/g, '').trim() as any;
          const kategori = (r[7] || 'Di Luar Jam Kerja').replace(/^"|"$/g, '').trim();
          const jamMulai = (r[8] || '').replace(/^"|"$/g, '').trim();
          const jamSelesai = (r[9] || '').replace(/^"|"$/g, '').trim();
          const nominal = parseInt((r[11] || '0').replace(/[^\d]/g, ''), 10) || 0;
          const st = newStaff.find((s) => s.nama === nama);
          newLembur.push({
            id: `lb-sheet-${idx + 1}`,
            tanggal: rawTgl,
            nip: st?.nip || `BK-PP1-${idx + 1}`,
            nama,
            sekup,
            kategori: kategori as any,
            jamMulai,
            jamSelesai,
            nominal,
            status: 'Disetujui',
            bulan: 10,
            tahun: 2026,
          });
        }
      });
      storageService.saveLemburList(newLembur);
    } catch (e) {
      console.warn('Gagal membaca LOG_LEMBUR:', e);
      storageService.saveLemburList([]);
    }

    return {
      staffCount: newStaff.length,
      presensiCount: newPresensi.length,
      linksCount: newLinks.length,
      lemburCount: newLembur.length,
    };
  },
};
