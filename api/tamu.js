// File: api/tamu.js

import db from "../config/db"; // PASTIKAN PATH INI BENAR

export default function handler(req, res) {
  const { method } = req;

  // Menggunakan switch untuk menangani setiap metode HTTP
  switch (method) {
    case "GET":
      // Cek apakah ada ID di query URL (untuk /api/tamu?id=123)
      if (req.query.id) {
        getGuestById(req, res);
      } else {
        getAllGuests(req, res);
      }
      break;
    case "POST":
      createGuest(req, res);
      break;
    case "PUT":
      updateGuest(req, res);
      break;
    case "DELETE":
      deleteGuest(req, res);
      break;
    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

// --- FUNGSI-FUNGSI LOGIKA (disalin dari kode lama Anda) ---

// GET /api/tamu - Ambil semua data tamu
const getAllGuests = (req, res) => {
  const sql = "SELECT * FROM tamu ORDER BY tanggal_kehadiran DESC, id DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ BACKEND: Gagal mengambil semua data tamu:", err);
      return res
        .status(500)
        .json({ error: "Gagal mengambil data tamu", detail: err.message });
    }
    res.status(200).json(results);
  });
};

// GET /api/tamu?id=:id - Ambil data tamu spesifik
const getGuestById = (req, res) => {
  const guestId = req.query.id; // Diubah dari req.params.id
  const sql = "SELECT * FROM tamu WHERE id = ?";
  db.query(sql, [guestId], (err, results) => {
    if (err) {
      console.error(`❌ BACKEND: Gagal mengambil data tamu dengan ID ${guestId}:`, err);
      return res.status(500).json({ error: "Gagal mengambil data tamu dari database", detail: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: `Data tamu dengan ID ${guestId} tidak ditemukan` });
    }
    res.status(200).json(results[0]);
  });
};

// POST /api/tamu - Menyimpan data tamu baru
const createGuest = (req, res) => {
  const newGuestData = { ...req.body };
  const jam_submit_data = new Date();
  const {
    nama_lengkap, jenis_kelamin, email, no_hp, pekerjaan, alamat, keperluan, staff, dituju, tanggal_kehadiran, tujuan_kunjungan, topik_konsultasi, deskripsi_kebutuhan,
  } = newGuestData;
  const status = newGuestData.status || "Belum Diproses";
  if (!nama_lengkap || !jenis_kelamin || !keperluan || !tanggal_kehadiran || !alamat || !no_hp) {
    return res.status(400).json({ error: "Data wajib (Nama, Jenis Kelamin, No HP, Alamat, Keperluan, Tanggal Kehadiran) tidak lengkap." });
  }
  let validatedDateKehadiran;
  try {
    validatedDateKehadiran = new Date(tanggal_kehadiran);
    if (isNaN(validatedDateKehadiran.getTime())) throw new Error("Format tanggal tidak valid");
  } catch (e) {
    return res.status(400).json({ error: "Format tanggal kehadiran tidak valid.", detail: e.message });
  }
  const sql = `INSERT INTO tamu (nama_lengkap, jenis_kelamin, email, no_hp, pekerjaan, alamat, keperluan, staff, dituju, tanggal_kehadiran, status, tujuan_kunjungan, topik_konsultasi, deskripsi_kebutuhan, jam_submit_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const values = [
    nama_lengkap, jenis_kelamin, email || null, no_hp, pekerjaan || null, alamat, keperluan, staff || null, dituju || null, validatedDateKehadiran, status,
    keperluan === "mitra_statistik" || keperluan === "tamu_umum" ? tujuan_kunjungan || null : null,
    keperluan === "konsultasi_statistik" ? topik_konsultasi || null : null,
    keperluan === "konsultasi_statistik" ? deskripsi_kebutuhan || null : null,
    jam_submit_data,
  ];
  db.query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Gagal menyimpan data tamu ke database.", detail: err.message, sqlMessage: err.sqlMessage });
    }
    db.query("SELECT * FROM tamu WHERE id = ?", [result.insertId], (errSelect, newGuestArray) => {
      if (errSelect || newGuestArray.length === 0) {
        return res.status(201).json({ message: "Data tamu berhasil disimpan! (Gagal mengambil data terbaru)", id: result.insertId, status: status });
      }
      res.status(201).json({ message: "Data tamu berhasil disimpan!", id: result.insertId, guest: newGuestArray[0] });
    });
  });
};

// PUT /api/tamu?id=:id - Update data tamu
const updateGuest = (req, res) => {
  const guestId = req.query.id; // Diubah dari req.params.id
  const receivedFields = req.body;
  // ... (seluruh logika PUT Anda disalin ke sini tanpa perubahan) ...
  // Anda bisa salin seluruh isi dari `router.put("/:id", (req, res) => { ... });` Anda di sini
  // Saya akan singkatkan agar tidak terlalu panjang, tapi pastikan Anda salin semuanya.
  const selectSql = "SELECT * FROM tamu WHERE id = ?";
  db.query(selectSql, [guestId], (errFetch, currentResults) => {
    if (errFetch) return res.status(500).json({ error: "Gagal memproses update (fetch awal).", detail: errFetch.message });
    if (currentResults.length === 0) return res.status(404).json({ error: `Data tamu ID ${guestId} tidak ditemukan.` });
    
    const fieldsToUpdate = {};
    const allowedFieldsToUpdate = [ "nama_lengkap", "jenis_kelamin", "email", "no_hp", "pekerjaan", "alamat", "keperluan", "staff", "dituju", "tanggal_kehadiran", "status", "tujuan_kunjungan", "topik_konsultasi", "deskripsi_kebutuhan", "diterima_oleh", "isi_pertemuan", "dokumentasi" ];
    allowedFieldsToUpdate.forEach(field => {
        if (receivedFields.hasOwnProperty(field)) {
            fieldsToUpdate[field] = receivedFields[field] === "" ? null : receivedFields[field];
        }
    });

    if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(200).json({ message: "Tidak ada data yang diubah.", guest: currentResults[0] });
    }

    const setClauses = Object.keys(fieldsToUpdate).map(key => `\`${key}\` = ?`).join(", ");
    const finalValues = [...Object.values(fieldsToUpdate), guestId];
    const updateSql = `UPDATE tamu SET ${setClauses} WHERE id = ?`;

    db.query(updateSql, finalValues, (errUpdate, result) => {
        if (errUpdate) return res.status(500).json({ error: "Gagal mengupdate data tamu di database.", detail: errUpdate.sqlMessage || errUpdate.message });
        
        db.query(selectSql, [guestId], (errFetchAgain, updatedGuestResult) => {
            if (errFetchAgain || updatedGuestResult.length === 0) {
                return res.status(200).json({ message: "Data tamu berhasil diperbarui (gagal mengambil data terbaru).", updated_id: guestId });
            }
            res.status(200).json({ message: "Data tamu berhasil diperbarui!", guest: updatedGuestResult[0] });
        });
    });
  });
};

// DELETE /api/tamu?id=:id - Hapus data tamu
const deleteGuest = (req, res) => {
  const guestId = req.query.id; // Diubah dari req.params.id
  const sql = "DELETE FROM tamu WHERE id = ?";
  db.query(sql, [guestId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Gagal menghapus data tamu", detail: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: `Data tamu dengan ID ${guestId} tidak ditemukan untuk dihapus` });
    }
    res.status(200).json({ message: "Data tamu berhasil dihapus" });
  });
};