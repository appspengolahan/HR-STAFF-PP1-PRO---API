export const STANDALONE_GAS_SCRIPT = `/**
 * ============================================================
 * PT BATU KARANG — DIVISI PRODUKSI 1 (PP1)
 * HEADLESS REST API (STANDALONE V2) — HR STAFF & KARYAWAN
 * Developed by Lalu Mahendra
 * ============================================================
 * CATATAN DEPLOYMENT:
 * 1. Buat Project Google Apps Script baru di script.google.com
 * 2. Tempel seluruh kode ini ke editor Code.gs
 * 3. Isi TARGET_SPREADSHEET_ID dengan ID Spreadsheet Anda
 * 4. Klik "Deploy" -> "New deployment" -> Select type: "Web app"
 * 5. Execute as: "Me" | Who has access: "Anyone"
 * 6. Salin Web App URL (akhiran /exec) dan tempel ke modal "GAS Center" di Web App React.
 * ============================================================
 */

const TARGET_SPREADSHEET_ID = "1KzEFolz_sE2bhUPTn2U2NWWPAgs3V9fpatYc7t1aGs0";

const SHEET_NAMES = {
  MASTER: "MASTER_STAFF",
  PRESENSI: "LOG_PRESENSI_IJIN",
  LEMBUR: "LOG_LEMBUR",
  GAJI: "LOG_GAJI",
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
    const action = e && e.parameter && e.parameter.action ? e.parameter.action : "ping";
    const ss = getSpreadsheet_();

    if (action === "ping") {
      return jsonResponse_({
        status: "success",
        message: "Standalone GAS REST API HR Karyawan Aktif",
        timestamp: new Date().toISOString(),
        version: "2.0-Standalone-Parallel",
        spreadsheetName: ss.getName()
      });
    }

    if (action === "get_staff") {
      const sh = ss.getSheetByName(SHEET_NAMES.MASTER);
      if (!sh) throw new Error("Sheet MASTER_STAFF tidak ditemukan");
      const values = sh.getDataRange().getValues();
      const staffList = [];
      for (let r = 5; r < values.length; r++) {
        const row = values[r];
        if (row[2]) { // Kolom C: Nama
          staffList.push({
            id: row[1] || (r - 4),
            nip: row[3] || "BK-PP1-STF-" + String(r - 4).padStart(3, "0"),
            nama: row[2],
            status: row[3] || "PKWT 1",
            jabatan: row[4] || "-",
            level: row[5] || "Staff",
            sekup: row[6] || "Operasional",
            statusAktif: row[7] || "Aktif",
            gajiPokok: Number(row[16]) || 0,
            tunjanganJabatan: Number(row[17]) || 0,
            statusPTKP: row[19] || "TK/0",
            bpjsKesehatanNominal: Number(row[29]) || 0
          });
        }
      }
      return jsonResponse_({ status: "success", count: staffList.length, data: staffList });
    }

    if (action === "get_presensi") {
      const sh = ss.getSheetByName(SHEET_NAMES.PRESENSI);
      if (!sh) throw new Error("Sheet LOG_PRESENSI_IJIN tidak ditemukan");
      const values = sh.getDataRange().getValues();
      const list = [];
      for (let r = 5; r < values.length; r++) {
        const row = values[r];
        if (row[2] && row[3]) { // C: Tanggal, D: Nama
          list.push({
            rowNum: r + 1,
            tanggal: row[2] instanceof Date ? Utilities.formatDate(row[2], Session.getScriptTimeZone(), "yyyy-MM-dd") : String(row[2]),
            nama: row[3],
            jamAwal: row[6] || "",
            jamAkhir: row[7] || "",
            durasiMenit: Number(row[8]) || 0,
            jenisIjin: row[9] || "Hadir",
            keperluan: row[10] || "",
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
    const action = payload.action || "sync_batch";
    const ss = getSpreadsheet_();

    if (action === "save_presensi") {
      const sh = ss.getSheetByName(SHEET_NAMES.PRESENSI);
      if (!sh) throw new Error("Sheet LOG_PRESENSI_IJIN tidak ditemukan");
      const rec = payload.record;
      sh.appendRow([
        "", "",
        rec.tanggal,
        rec.nama,
        rec.jabatan || "",
        rec.sekup || "",
        rec.jamAwal || "",
        rec.jamAkhir || "",
        rec.durasiMenit || 0,
        rec.jenisIjin || "Hadir",
        rec.keperluan || "",
        rec.lampiranSurat || "Tidak",
        rec.catatan || "",
        "", rec.bulan || 1, rec.tahun || 2026,
        rec.faktorPotongan || 0
      ]);
      return jsonResponse_({ status: "success", message: "Presensi tersimpan di GAS V2 Standalone" });
    }

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
        rec.kategori || "Di Luar Jam Kerja",
        rec.jamMulai || "",
        rec.jamSelesai || "",
        "",
        rec.nominal || 0,
        rec.bulan || 1,
        rec.tahun || 2026
      ]);
      return jsonResponse_({ status: "success", message: "Lembur tersimpan di GAS V2 Standalone" });
    }

    return jsonResponse_({ status: "success", message: "Payload diterima", payload });
  } catch (err) {
    return jsonResponse_({ status: "error", message: err.toString() });
  }
}
`;
