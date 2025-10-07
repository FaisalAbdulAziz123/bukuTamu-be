// File: config/db.js

// 1. Ganti driver dari 'mysql' menjadi 'pg' untuk PostgreSQL
import { Pool } from 'pg';

// 2. Cek apakah environment variable sudah ada
if (!process.env.DATABASE_URL) {
  throw new Error('FATAL ERROR: DATABASE_URL is not set in environment variables.');
}

// 3. Buat koneksi pool menggunakan DATABASE_URL dari Vercel
//    Semua detail (host, user, password, database) dibaca otomatis dari URL ini.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // Konfigurasi ini penting untuk koneksi ke database cloud seperti Neon
    rejectUnauthorized: false,
  },
});

// Kita export pool-nya langsung.
// Metode query dari 'pg' sudah otomatis mengembalikan Promise, jadi lebih simpel.
export default pool;