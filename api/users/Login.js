// File: api/users/login.js

import pool from "../../config/db.js";
import Cors from "cors";

// 🔧 Inisialisasi middleware CORS
const cors = Cors({
  origin: "https://faisalabdulaziz123.github.io", // domain frontend
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

// 🔧 Fungsi helper untuk menjalankan middleware di Next.js
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

// ✅ Handler utama
export default async function handler(req, res) {
  // Jalankan CORS middleware
  await runMiddleware(req, res, cors);

  // ✅ Tangani preflight request (OPTIONS)
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "https://faisalabdulaziz123.github.io");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(200).end();
  }

  // ✅ Hanya izinkan metode POST
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username dan password harus diisi" });
  }

  try {
    const query = "SELECT * FROM users WHERE username = $1 AND password = $2";
    const result = await pool.query(query, [username, password]);

    if (result.rows.length > 0) {
      return res.status(200).json({
        message: "Login berhasil",
        user: result.rows[0],
      });
    } else {
      return res.status(401).json({ error: "Username atau password salah" });
    }
  } catch (err) {
    console.error("Query error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
