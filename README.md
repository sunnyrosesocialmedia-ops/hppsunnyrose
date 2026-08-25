# Sunny Rose Photo Store

Sistem web untuk fotografer: upload semua foto (tampil gratis dengan watermark),
pembeli hanya bisa download resolusi penuh tanpa watermark setelah bayar.

## Fitur

- **Publik**: galeri foto (preview berwatermark), detail foto, keranjang, checkout via Midtrans.
- **Fotografer (admin)**: login, upload foto (langsung ke Cloudinary + auto watermark preview),
  kelola/tayangkan/sembunyikan/hapus foto, lihat daftar pesanan & pendapatan.
- **Setelah bayar lunas**: sistem otomatis membuat link download (kedaluwarsa & dibatasi jumlah
  klik) dan mengirim email ke pembeli. Foto asli tersimpan privat di Cloudinary — tidak bisa
  diakses langsung tanpa link bertanda tangan.

## Tumpukan Teknologi

Next.js (App Router) + TypeScript + Prisma (SQLite) + Cloudinary + Midtrans Snap + Nodemailer.

## Menjalankan di Lokal

1. **Install dependency**

   ```bash
   npm install
   ```

2. **Siapkan environment variable**

   ```bash
   cp .env.example .env
   ```

   Isi minimal:
   - `SESSION_SECRET` — string acak panjang (bebas, mis. hasil `openssl rand -hex 32`).
   - `CLOUDINARY_*` — daftar gratis di [cloudinary.com](https://cloudinary.com), ambil dari Dashboard.
   - `MIDTRANS_*` — daftar di [dashboard.midtrans.com](https://dashboard.midtrans.com), pakai
     **Sandbox** dulu untuk uji coba (`MIDTRANS_IS_PRODUCTION=false`).
   - `SMTP_*` — opsional untuk testing (kalau kosong, isi email hanya ditulis ke console log,
     bukan benar-benar terkirim).

3. **Siapkan database**

   ```bash
   npx prisma migrate dev --name init
   ```

4. **Buat akun login fotografer (admin) pertama**

   ```bash
   npm run create-admin
   ```

   (atau isi `ADMIN_EMAIL` & `ADMIN_PASSWORD` di `.env` lalu jalankan perintah yang sama tanpa
   diminta input).

5. **Jalankan aplikasi**

   ```bash
   npm run dev
   ```

   - Situs publik: `http://localhost:3000`
   - Login fotografer: `http://localhost:3000/admin/login`

## Webhook Pembayaran (penting)

Supaya status pesanan otomatis berubah jadi "Lunas" dan email download terkirim, Midtrans harus
bisa memanggil server Anda. Di dashboard Midtrans, set **Payment Notification URL** ke:

```
https://domain-anda.com/api/webhook/midtrans
```

Untuk testing di lokal, pakai tunnel seperti `ngrok` lalu arahkan notification URL ke
`https://xxxx.ngrok.io/api/webhook/midtrans`, dan set `APP_URL` ke URL ngrok tersebut.

## Deploy ke Produksi

- Set semua environment variable di platform hosting (Vercel/VPS/dll).
- Untuk database produksi, disarankan pindah ke PostgreSQL: ubah `provider` di
  `prisma/schema.prisma` menjadi `postgresql` dan `DATABASE_URL` ke koneksi Postgres Anda, lalu
  jalankan `npx prisma migrate deploy`.
- Ganti `MIDTRANS_IS_PRODUCTION=true` dan pakai Server/Client Key **Production** setelah akun
  Midtrans Anda disetujui.

## Struktur Alur Pembayaran

1. Pembeli checkout → server membuat `Order` (status `PENDING`) + transaksi Midtrans Snap →
   diarahkan ke halaman pembayaran Midtrans.
2. Midtrans mengirim notifikasi ke `/api/webhook/midtrans` setelah pembayaran selesai.
3. Jika lunas: status order jadi `PAID`, link download (per foto, kedaluwarsa 7 hari, maksimal
   5x download) dibuat dan dikirim via email, sekaligus tampil di halaman `/order/[id]`.
4. Link download memverifikasi token → foto asli diambil dari Cloudinary lewat URL bertanda
   tangan yang berlaku singkat (5 menit).
