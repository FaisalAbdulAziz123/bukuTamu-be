// File: api/tamu.js

import pool from "../config/db.js";
import cors from 'cors'; // 1. Impor package cors

// 2. Inisialisasi middleware cors dengan domain frontend Anda
const corsMiddleware = cors({
  origin: 'https://faisalabdulaziz123.github.io', // PENTING: Pastikan ini URL GitHub Pages Anda
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

// 3. Buat fungsi helper untuk menjalankan middleware
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Fungsi utama yang menangani request
export default async function handler(req, res) {
  // 4. Jalankan middleware cors di awal handler
  await runMiddleware(req, res, corsMiddleware);

  const { method } = req;

  // Sisa kode Anda tidak berubah sama sekali
  switch (method) {
    case "GET":
      try {
        if (req.query.id) {
          await getGuestById(req, res);
        } else {
          await getAllGuests(req, res);
        }
      } catch (error) {
        res.status(500).json({ error: "Internal Server Error", detail: error.message });
      }
      break;
    case "POST":
      await createGuest(req, res);
      break;
    case "PUT":
      await updateGuest(req, res);
      break;
    case "DELETE":
      await deleteGuest(req, res);
      break;
    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

// --- FUNGSI-FUNGSI LOGIKA ANDA (TIDAK ADA PERUBAHAN) ---

const getAllGuests = async (req, res) => {
  try {
    const sql = "SELECT * FROM tamu ORDER BY tanggal_kehadiran DESC, id DESC";
    const result = await pool.query(sql);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ BACKEND: Gagal mengambil semua data tamu:", err);
    res.status(500).json({ error: "Gagal mengambil data tamu", detail: err.message });
  }
};

const getGuestById = async (req, res) => {
  const { id } = req.query;
  try {
    const sql = "SELECT * FROM tamu WHERE id = $1";
    const result = await pool.query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: `Data tamu dengan ID ${id} tidak ditemukan` });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(`❌ BACKEND: Gagal mengambil data tamu dengan ID ${id}:`, err);
    res.status(500).json({ error: "Gagal mengambil data tamu dari database", detail: err.message });
  }
};

const createGuest = async (req, res) => {
  const {
    nama_lengkap, jenis_kelamin, email, no_hp, pekerjaan, alamat, keperluan, staff, dituju, tanggal_kehadiran, tujuan_kunjungan, topik_konsultasi, deskripsi_kebutuhan, status
  } = req.body;

  if (!nama_lengkap || !jenis_kelamin || !keperluan || !tanggal_kehadiran || !alamat || !no_hp) {
    return res.status(400).json({ error: "Data wajib tidak lengkap." });
  }

  try {
    const sql = `
      INSERT INTO tamu (
        nama_lengkap, jenis_kelamin, email, no_hp, pekerjaan, alamat, keperluan, 
        staff, dituju, tanggal_kehadiran, status, tujuan_kunjungan, 
        topik_konsultasi, deskripsi_kebutuhan, jam_submit_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      RETURNING *; 
    `;

    const values = [
      nama_lengkap, jenis_kelamin, email || null, no_hp, pekerjaan || null, alamat, keperluan, staff || null, dituju || null, tanggal_kehadiran,
      status || "Belum Diproses",
      tujuan_kunjungan || null,
      topik_konsultasi || null,
      deskripsi_kebutuhan || null
    ];

    const result = await pool.query(sql, values);
    res.status(201).json({ message: "Data tamu berhasil disimpan!", guest: result.rows[0] });

  } catch (err) {
    console.error("❌ BACKEND: Gagal menyimpan data tamu baru:", err);
    res.status(500).json({ error: "Gagal menyimpan data tamu ke database.", detail: err.message });
  }
};

const updateGuest = async (req, res) => {
  const { id } = req.query;
  const fields = req.body;

  const allowedFields = ["nama_lengkap", "jenis_kelamin", "email", "no_hp", "pekerjaan", "alamat", "keperluan", "staff", "dituju", "tanggal_kehadiran", "status", "tujuan_kunjungan", "topik_konsultasi", "deskripsi_kebutuhan"];

  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  allowedFields.forEach(field => {
    if (fields[field] !== undefined) {
      setClauses.push(`${field} = $${paramIndex}`);
      values.push(fields[field]);
      paramIndex++;
    }
  });

  if (setClauses.length === 0) {
    return res.status(400).json({ message: "Tidak ada data yang diubah." });
  }

  values.push(id);

  try {
    const sql = `UPDATE tamu SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *;`;
    const result = await pool.query(sql, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: `Data tamu dengan ID ${id} tidak ditemukan.` });
    }

    res.status(200).json({ message: "Data tamu berhasil diperbarui!", guest: result.rows[0] });
  } catch (err) {
    console.error(`❌ BACKEND: Gagal mengupdate data tamu ID ${id}:`, err);
    res.status(500).json({ error: "Gagal mengupdate data tamu di database.", detail: err.message });
  }
};

const deleteGuest = async (req, res) => {
  const { id } = req.query;
  try {
    const sql = "DELETE FROM tamu WHERE id = $1";
    const result = await pool.query(sql, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: `Data tamu dengan ID ${id} tidak ditemukan untuk dihapus` });
    }

    res.status(200).json({ message: "Data tamu berhasil dihapus" });
  } catch (err) {
    console.error(`❌ BACKEND: Gagal menghapus data tamu ID ${id}:`, err);
    res.status(500).json({ error: "Gagal menghapus data tamu", detail: err.message });
  }
};