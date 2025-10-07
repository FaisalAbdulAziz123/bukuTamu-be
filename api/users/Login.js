// File: api/users/login.js

import db from "../../config/db"; // PATH-NYA BERBEDA! Naik 2 level

export default function handler(req, res) {
  // Endpoint ini hanya menerima metode POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username dan password harus diisi" });
  }

  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error('Query error:', err);
      return res.status(500).json({ error: "Server error" });
    }
    if (results.length > 0) {
      return res.status(200).json({ message: "Login berhasil", user: results[0] });
    } else {
      return res.status(401).json({ error: "Username atau password salah" });
    }
  });
}