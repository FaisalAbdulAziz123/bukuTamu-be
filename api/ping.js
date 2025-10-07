// File: /api/ping.js

export default function handler(req, res) {
  // Fungsi ini hanya mengembalikan pesan sukses
  // Tidak ada koneksi database sama sekali
  res.status(200).json({ 
    message: "Pong! Backend Anda berhasil di-deploy di Vercel." 
  });
}