// File: api/users/login.js

import pool from "../../config/db.js";
import cors from 'cors';

// Inisialisasi middleware cors dengan domain frontend Anda
const corsMiddleware = cors({
  // PERBAIKAN DI SINI: Hapus path dan slash di akhir
  origin: 'https://faisalabdulaziz123.github.io',
  methods: ['POST', 'OPTIONS'],
});

// Fungsi helper untuk menjalankan middleware
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

// Fungsi utama
export default async function handler(req, res) {
  // Jalankan middleware cors di awal handler
  await runMiddleware(req, res, corsMiddleware);
  
  // Endpoint ini hanya menerima metode POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username dan password harus diisi" });
  }

  try {
    const query = 'SELECT * FROM users WHERE username = $1 AND password = $2';
    const result = await pool.query(query, [username, password]);

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