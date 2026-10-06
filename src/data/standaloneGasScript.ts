export const STANDALONE_GAS_SCRIPT = `/**
 * ============================================================
 * PT BATU KARANG — DIVISI PRODUKSI 1 (PP1)
 * HEADLESS REST API (STANDALONE V3) — HR STAFF & KARYAWAN
 * Developed by Lalu Mahendra
 * ============================================================
 * PANDUAN PENERAPAN (DEPLOYMENT):
 * 1. Buka https://script.google.com/ lalu klik "+ Proyek Baru" (New Project).
 * 2. Beri nama proyek: "API Backend HR Batu Karang PP1".
 * 3. Hapus seluruh isi di file Code.gs, lalu tempel SELURUH KODE ini.
 * 4. Pastikan TARGET_SPREADSHEET_ID di bawah ini sudah sesuai.
 * 5. Klik menu: "Terapkan (Deploy)" -> "Penerapan Baru (New deployment)".
 * 6. Klik ikon gerigi (Pilih jenis) -> pilih "Aplikasi Web (Web app)".
 * 7. Konfigurasi:
 *    - Deskripsi : "Versi 3.0 Standalone Production"
 *    - Jalankan sebagai (Execute as) : "Saya (email Anda)"
 *    - Siapa yang memiliki akses (Who has access) : "Siapa saja (Anyone)"
 * 8. Klik "Terapkan (Deploy)" -> Klik "Beri Akses (Authorize access)" -> 
 *    Pilih Akun -> Klik "Advanced" -> Klik "Buka API Backend HR (tidak aman)" -> Klik "Izinkan (Allow)".
 * 9. Salin "URL Aplikasi Web" (akhiran /exec) dan tempel ke GAS Center di Web App React!
 * ============================================================
 */

const TARGET_SPREADSHEET_ID = "1KzEFolz_sE2bhUPTn2U2NWWPAgs3V9fpatYc7t1aGs0";

const SHEET_NAMES = {
  MASTER: "MASTER_STAFF",
  PRESENSI: "LOG_PRESENSI_IJIN",
  LEMBUR: "LOG_LEMBUR",
  LINKS: "LOG_LINK_ARSIP",
  MUTASI: "LOG_MUTASI_STAFF",
  CALON: "CALON_KARYAWAN",
  ARSIP_HAPUS: "LOG_RIWAYAT_HAPUS_STAFF"
};

function getSpreadsheet_() {
  if (TARGET_SPREADSHEET_ID) {
    return SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "ping";
    const ss = getSpreadsheet_();

    // 1. PING TEST
    if (action === "ping") {
      return jsonResponse_({
        status: "success",
        message: "Standalone GAS REST API HR Karyawan Aktif & Terhubung",
        timestamp: new Date().toISOString(),
        version: "3.0-Standalone-Production",
        spreadsheetName: ss.getName(),
        sheetsAvailable: ss.getSheets().map(s => s.getName())
      });
    }

    // 2. GET STAFF LIST (32 Staf Lengkap)
    if (action === "get_staff" || action === "get_all") {
      const sh = ss.getSheetByName(SHEET_NAMES.MASTER);
      if (!sh) throw new Error("Sheet MASTER_STAFF tidak ditemukan");
      const values = sh.getDataRange().getValues();
      const staffList = [];
      
      for (let r = 5; r < values.length; r++) {
        const row = values[r];
        if (row[2] && String(row[2]).trim() !== "") {
          const id = r - 4;
          const nip = row[3] || ("BK-PP1-" + String(id).padStart(3, "0"));
          const gp = Number(row[16]) || 0;
          const tj = Number(row[17]) || 0;
          
          staffList.push({
            id: id,
            nip: nip,
            nama: String(row[2]).trim(),
            status: String(row[3] || "PKWT 1").trim(),
            jabatan: String(row[4] || "-").trim(),
            level: String(row[5] || "Staff").trim(),
            sekup: (String(row[6] || "").toLowerCase().includes("admin") ? "Administrasi" : "Operasional"),
            statusAktif: String(row[7] || "Aktif").trim(),
            jk: String(row[8] || "Laki-laki").trim(),
            nik: String(row[9] || "").trim(),
            kk: String(row[10] || "").trim(),
            npwp: String(row[11] || "").trim(),
            email: String(row[12] || "").trim(),
            bank: String(row[13] || "Bank BCA").trim(),
            rekening: String(row[14] || "").trim(),
            telp: String(row[15] || "").trim(),
            gajiPokok: gp,
            tunjanganJabatan: tj,
            totalGaji: gp + tj,
            statusPTKP: String(row[19] || "TK/0").trim(),
            bpjsKesehatanNominal: Number(row[29]) || 0
          });
        }
      }

      if (action === "get_staff") {
        return jsonResponse_({ status: "success", count: staffList.length, data: staffList });
      }

      // If get_all, continue collecting presensi & links
      let presensiList = [];
      const shPresensi = ss.getSheetByName(SHEET_NAMES.PRESENSI);
      if (shPresensi) {
        const pValues = shPresensi.getDataRange().getValues();
        for (let r = 5; r < pValues.length; r++) {
          const row = pValues[r];
          if (row[2] && row[3]) {
            presensiList.push({
              rowNum: r + 1,
              tanggal: row[2] instanceof Date ? Utilities.formatDate(row[2], Session.getScriptTimeZone(), "yyyy-MM-dd") : String(row[2]),
              nama: String(row[3]).trim(),
              jamAwal: String(row[6] || "").trim(),
              jamAkhir: String(row[7] || "").trim(),
              durasiMenit: Number(row[8]) || 0,
              jenisIjin: String(row[9] || "Hadir").trim(),
              keperluan: String(row[10] || "").trim(),
              lampiranSurat: String(row[11] || "Tidak").trim(),
              catatan: String(row[12] || "").trim(),
              bulan: Number(row[14]) || 1,
              tahun: Number(row[15]) || 2026,
              faktorPotongan: Number(row[16]) || 0
            });
          }
        }
      }

      let linksList = [];
      const shLinks = ss.getSheetByName(SHEET_NAMES.LINKS);
      if (shLinks) {
        const lValues = shLinks.getDataRange().getValues();
        for (let r = 1; r < lValues.length; r++) {
          const row = lValues[r];
          if (row[1] && row[3]) {
            linksList.push({
              id: "lnk-" + r,
              nip: String(row[0] || "").trim(),
              nama: String(row[1] || "").trim(),
              label: String(row[2] || "Berkas Drive").trim(),
              url: String(row[3] || "").trim(),
              tanggalDitambahkan: "2026-10-01"
            });
          }
        }
      }

      return jsonResponse_({
        status: "success",
        staffCount: staffList.length,
        presensiCount: presensiList.length,
        linksCount: linksList.length,
        data: {
          staff: staffList,
          presensi: presensiList,
          links: linksList
        }
      });
    }

    // 3. GET PRESENSI
    if (action === "get_presensi") {
      const sh = ss.getSheetByName(SHEET_NAMES.PRESENSI);
      if (!sh) throw new Error("Sheet LOG_PRESENSI_IJIN tidak ditemukan");
      const values = sh.getDataRange().getValues();
      const list = [];
      for (let r = 5; r < values.length; r++) {
        const row = values[r];
        if (row[2] && row[3]) {
          list.push({
            rowNum: r + 1,
            tanggal: row[2] instanceof Date ? Utilities.formatDate(row[2], Session.getScriptTimeZone(), "yyyy-MM-dd") : String(row[2]),
            nama: String(row[3]).trim(),
            jamAwal: String(row[6] || "").trim(),
            jamAkhir: String(row[7] || "").trim(),
            durasiMenit: Number(row[8]) || 0,
            jenisIjin: String(row[9] || "Hadir").trim(),
            keperluan: String(row[10] || "").trim(),
            lampiranSurat: String(row[11] || "Tidak").trim(),
            catatan: String(row[12] || "").trim(),
            bulan: Number(row[14]) || 1,
            tahun: Number(row[15]) || 2026,
            faktorPotongan: Number(row[16]) || 0
          });
        }
      }
      return jsonResponse_({ status: "success", count: list.length, data: list });
    }

    return jsonResponse_({ status: "error", message: "Aksi tidak dikenal: " + action });
  } catch (err) {
    return jsonResponse_({ status: "error", message: err.toString() });
  }
}

function doPost(e) {
  try {
    let payload = {};
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }
    const action = payload.action || "save_presensi";
    const ss = getSpreadsheet_();

    // Simpan Presensi & Ijin
    if (action === "save_presensi") {
      const sh = ss.getSheetByName(SHEET_NAMES.PRESENSI);
      if (!sh) throw new Error("Sheet LOG_PRESENSI_IJIN tidak ditemukan");
      const rec = payload.record;
      sh.appendRow([
        "", "",
        rec.tanggal,
        rec.nama,
        rec.jabatan || "",
        rec.sekup || "Operasional",
        rec.jamAwal || "",
        rec.jamAkhir || "",
        rec.durasiMenit || 0,
        rec.jenisIjin || "Hadir",
        rec.keperluan || "",
        rec.lampiranSurat || "Tidak",
        rec.catatan || "",
        "", rec.bulan || 10, rec.tahun || 2026,
        rec.faktorPotongan || 0
      ]);
      return jsonResponse_({ status: "success", message: "Presensi tersimpan di GAS V3 Standalone" });
    }

    // Simpan Lembur SPKL
    if (action === "save_lembur") {
      const sh = ss.getSheetByName(SHEET_NAMES.LEMBUR);
      if (!sh) throw new Error("Sheet LOG_LEMBUR tidak ditemukan");
      const rec = payload.record;
      sh.appendRow([
        "", "",
        rec.tanggal,
        rec.nama,
        rec.sekup || "Operasional",
        "", "",
        rec.kategori || "Di Luar Jam Kerja (Weekday/Sabtu)",
        rec.jamMulai || "",
        rec.jamSelesai || "",
        "",
        rec.nominal || 0,
        rec.bulan || 10,
        rec.tahun || 2026
      ]);
      return jsonResponse_({ status: "success", message: "Lembur tersimpan di GAS V3 Standalone" });
    }

    return jsonResponse_({ status: "success", message: "Payload diterima", action: action });
  } catch (err) {
    return jsonResponse_({ status: "error", message: err.toString() });
  }
}
`;
