// File: api/users/login.js

import pool from "../../config/db.js"; // Menggunakan pool pg yang sudah support Promise

export default async function handler(req, res) { // Ubah menjadi async function
  // Endpoint ini hanya menerima metode POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username dan password harus diisi" });
  }

  // Bungkus dengan try...catch untuk menangani error async
  try {
    // Ganti placeholder '?' menjadi '$1', '$2' untuk PostgreSQL
    const query = 'SELECT * FROM users WHERE username = $1 AND password = $2';
    
    // Gunakan await untuk menjalankan query
    const result = await pool.query(query, [username, password]);

    // Hasilnya ada di 'result.rows
    if (result.rows.length > 0) {
      return res.status(200).json({ message: "Login berhasil", user: result.rows[0] });
    } else {
      return res.status(401).json({ error: "Username atau password salah" });
    }
  } catch (err) {
    console.error('Query error:', err);
    return res.status(500).json({ error: "Server error" });
  }
}