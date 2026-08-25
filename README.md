# Sunny Rose Photo Store

Sistem web untuk fotografer: upload semua foto (tampil gratis dengan watermark),
pembeli hanya bisa download resolusi penuh tanpa watermark setelah bayar.

## Fitur

- **Publik**: galeri foto (preview berwatermark), detail foto, keranjang, checkout via Midtrans.
- **Fotografer (admin)**: login, upload foto (disimpan di disk server + auto watermark preview
  pakai `sharp`), kelola/tayangkan/sembunyikan/hapus foto, lihat daftar pesanan & pendapatan.
- **Setelah bayar lunas**: sistem otomatis membuat link download (kedaluwarsa & dibatasi jumlah
  klik) dan mengirim email ke pembeli. Foto asli tersimpan privat di disk server (folder di luar
  `public/`) — tidak bisa diakses langsung tanpa lolos verifikasi token pesanan.

## Tumpukan Teknologi

Next.js (App Router) + TypeScript + Prisma (SQLite) + sharp (watermark) + Midtrans Snap +
Nodemailer.

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
   - `STORAGE_DIR` — folder tempat foto disimpan di server (default `./storage`, dibuat otomatis).
     Pastikan disk server punya cukup ruang & di-backup rutin — inilah satu-satunya salinan foto asli.
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

- **Butuh server dengan disk persisten** (VPS seperti biasa, bukan hosting serverless seperti
  Vercel/Netlify — platform tersebut tidak menyimpan file yang diupload saat runtime).
- Set semua environment variable di server. Pastikan `STORAGE_DIR` menunjuk ke disk yang persisten
  dan **dibackup rutin** (mis. rsync/cron ke penyimpanan lain) — kalau folder ini hilang, foto asli
  ikut hilang.
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
4. Link download memverifikasi token (status pesanan, masa berlaku, batas jumlah unduhan) →
   baru setelah lolos, file asli dibaca dari `STORAGE_DIR/originals` dan dikirim ke pembeli.
