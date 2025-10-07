// File: api/users.js

import db from "../config/db"; // PASTIKAN PATH INI BENAR

// Helper function dari kode lama Anda, kita pertahankan
const executeQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(query, params, (error, results) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
};

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query; // Ambil ID dari query untuk GET by ID, PUT, dan DELETE

  switch (method) {
    case 'GET':
      if (id) {
        // GET /api/users?id=:id
        try {
          const rows = await executeQuery("SELECT * FROM users WHERE id = ?", [id]);
          if (!rows || rows.length === 0) return res.status(404).json({ message: "User tidak ditemukan" });
          res.status(200).json(rows[0]);
        } catch (err) {
          res.status(500).json({ error: "Gagal mengambil data user", details: err.message });
        }
      } else {
        // GET /api/users
        try {
          const rows = await executeQuery("SELECT * FROM users");
          res.status(200).json(rows || []);
        } catch (err) {
          res.status(500).json({ error: "Gagal mengambil data users", details: err.message });
        }
      }
      break;

    case 'POST':
      // POST /api/users
      const { name, nip, username, password } = req.body;
      if (!name || !nip || !username || !password) return res.status(400).json({ error: "Semua field (name, nip, username, password) harus diisi" });
      try {
        await executeQuery("INSERT INTO users (name, nip, username, password) VALUES (?, ?, ?, ?)", [name, nip, username, password]);
        res.status(201).json({ message: "User berhasil ditambahkan" });
      } catch (err) {
        res.status(500).json({ error: "Gagal menambahkan user", details: err.message });
      }
      break;

    case 'PUT':
      // PUT /api/users?id=:id
      if (!id) return res.status(400).json({ error: "ID User diperlukan untuk update" });
      const { name: newName, nip: newNip, username: newUsername, password: newPassword } = req.body;
      try {
        const oldUser = await executeQuery("SELECT * FROM users WHERE id = ?", [id]);
        if (!oldUser || oldUser.length === 0) return res.status(44).json({ message: "User tidak ditemukan" });
        const updatedUser = {
          name: newName || oldUser[0].name, nip: newNip || oldUser[0].nip, username: newUsername || oldUser[0].username, password: newPassword || oldUser[0].password,
        };
        await executeQuery("UPDATE users SET name = ?, nip = ?, username = ?, password = ? WHERE id = ?", [updatedUser.name, updatedUser.nip, updatedUser.username, updatedUser.password, id]);
        res.status(200).json({ message: "User berhasil diperbarui" });
      } catch (err) {
        res.status(500).json({ error: "Gagal memperbarui user", details: err.message });
      }
      break;

    case 'DELETE':
      // DELETE /api/users?id=:id
      if (!id) return res.status(400).json({ error: "ID User diperlukan untuk menghapus" });
      try {
        const result = await executeQuery("DELETE FROM users WHERE id = ?", [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "User tidak ditemukan" });
        res.status(200).json({ message: "User berhasil dihapus" });
      } catch (err) {
        res.status(500).json({ error: "Gagal menghapus user", details: err.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}