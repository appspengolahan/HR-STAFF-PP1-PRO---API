import { StaffData, PresensiRecord, LinkArsip, LemburRecord } from '../types';
import { storageService } from './storageService';

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
        const rawPend = r[30] ? r[30].replace(/^"|"$/g, '').trim() : '';
        const validPend = ['SD', 'SMP', 'SMA/SMK', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3'];
        const pendidikanTerakhir: any = validPend.includes(rawPend)
          ? rawPend
          : jabatan.includes('Manajer') || jabatan.includes('Kepala')
          ? 'S1'
          : 'SMA/SMK';

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
      presensiRows.slice(1).forEach((r, idx) => {
        if (r.length > 3 && r[2] && r[3]) {
          const rawTgl = r[2].replace(/^"|"$/g, '').trim();
          const nama = r[3].replace(/^"|"$/g, '').trim();
          const jamAwal = (r[6] || '').replace(/^"|"$/g, '').trim();
          const jamAkhir = (r[7] || '').replace(/^"|"$/g, '').trim();
          const durasi = parseInt((r[8] || '0').replace(/[^\d]/g, ''), 10) || 0;
          const jenisIjin = (r[9] || 'Hadir').replace(/^"|"$/g, '').trim() as any;
          const keperluan = (r[10] || '').replace(/^"|"$/g, '').trim();
          const lampiranSurat = ((r[11] || 'Tidak').replace(/^"|"$/g, '').trim() || 'Tidak') as any;
          const catatan = (r[12] || '').replace(/^"|"$/g, '').trim();

          let isoTgl = rawTgl;
          let bulan = 1;
          let tahun = 2026;
          if (rawTgl.includes('/')) {
            const p = rawTgl.split('/');
            if (p.length === 3) {
              isoTgl = `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
              bulan = parseInt(p[1], 10);
              tahun = parseInt(p[2], 10);
            }
          }

          let faktor = 0;
          if (['Sakit (S Tangan)', 'Ijin (S Tangan)', 'Alpha'].includes(jenisIjin)) {
            faktor = 1;
          } else if (['Ijin Terlambat', 'Ijin Keluar Sementara', 'Ijin Pulang Awal'].includes(jenisIjin)) {
            if (durasi <= 120) faktor = 0;
            else if (durasi < 240) faktor = 0.5;
            else faktor = 1;
          }

          const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
          let hariName = 'Hari';
          try {
            const dt = new Date(isoTgl);
            if (!isNaN(dt.getTime())) {
              hariName = dayNames[dt.getDay()];
            }
          } catch (_) {}

          const st = newStaff.find((s) => s.nama === nama);

          newPresensi.push({
            id: `pr-${idx + 1}`,
            rowNum: idx + 6,
            tanggal: isoTgl,
            hari: hariName,
            nip: st?.nip || 'BK-PP1-999',
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
      console.warn('Gagal membaca LOG_PRESENSI_IJIN:', e);
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
