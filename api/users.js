// File: api/users.js

import pool from "../config/db.js"; // Import pool koneksi dari file config/db.js yang baru

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query; // Ambil ID dari query untuk GET by ID, PUT, dan DELETE

  switch (method) {
    case 'GET':
      if (id) {
        // GET /api/users?id=[id]
        try {
          const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
          if (result.rows.length === 0) return res.status(404).json({ message: "User tidak ditemukan" });
          res.status(200).json(result.rows[0]);
        } catch (err) {
          res.status(500).json({ error: "Gagal mengambil data user", details: err.message });
        }
      } else {
        // GET /api/users
        try {
          const result = await pool.query("SELECT * FROM users ORDER BY id ASC");
          res.status(200).json(result.rows || []);
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
        const result = await pool.query(
          "INSERT INTO users (name, nip, username, password) VALUES ($1, $2, $3, $4) RETURNING *",
          [name, nip, username, password]
        );
        res.status(201).json({ message: "User berhasil ditambahkan", user: result.rows[0] });
      } catch (err) {
        res.status(500).json({ error: "Gagal menambahkan user", details: err.message });
      }
      break;

    case 'PUT':
      // PUT /api/users?id=[id]
      if (!id) return res.status(400).json({ error: "ID User diperlukan untuk update" });
      const { name: newName, nip: newNip, username: newUsername, password: newPassword } = req.body;
      try {
        const oldUserResult = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        if (oldUserResult.rows.length === 0) return res.status(404).json({ message: "User tidak ditemukan" });

        const oldUser = oldUserResult.rows[0];
        const updatedUser = {
          name: newName || oldUser.name,
          nip: newNip || oldUser.nip,
          username: newUsername || oldUser.username,
          password: newPassword || oldUser.password,
        };

        const result = await pool.query(
          "UPDATE users SET name = $1, nip = $2, username = $3, password = $4 WHERE id = $5 RETURNING *",
          [updatedUser.name, updatedUser.nip, updatedUser.username, updatedUser.password, id]
        );

        res.status(200).json({ message: "User berhasil diperbarui", user: result.rows[0] });
      } catch (err) {
        res.status(500).json({ error: "Gagal memperbarui user", details: err.message });
      }
      break;

    case 'DELETE':
      // DELETE /api/users?id=[id]
      if (!id) return res.status(400).json({ error: "ID User diperlukan untuk menghapus" });
      try {
        const result = await pool.query("DELETE FROM users WHERE id = $1", [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: "User tidak ditemukan" });
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