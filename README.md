# Sunny Rose Photo Store

Sistem web untuk fotografer: upload semua foto (tampil gratis dengan watermark),
pembeli hanya bisa download resolusi penuh tanpa watermark setelah bayar.

## Fitur

- **Publik**: galeri foto (preview berwatermark), detail foto, keranjang, checkout via WhatsApp.
- **Fotografer (admin)**: login, upload foto (langsung ke Cloudinary + auto watermark preview),
  kelola/tayangkan/sembunyikan/hapus foto, lihat daftar pesanan, dan konfirmasi pembayaran manual.
- **Pembayaran**: tidak pakai payment gateway. Pembeli checkout lalu diarahkan chat WhatsApp ke
  fotografer untuk transfer manual (QRIS/rekening). Setelah dana diterima, fotografer klik
  **Tandai Lunas** di dashboard admin — sistem otomatis membuat link download (kedaluwarsa &
  dibatasi jumlah klik) dan mengirim email ke pembeli. Foto asli tersimpan privat di Cloudinary —
  tidak bisa diakses langsung tanpa link bertanda tangan.

## Tumpukan Teknologi

Next.js (App Router) + TypeScript + Prisma (SQLite) + Cloudinary + Nodemailer.

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
   - `WHATSAPP_NUMBER` — nomor WhatsApp fotografer (format `08xx` atau `62xx`) untuk tombol chat
     konfirmasi pembayaran.
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

## Deploy ke Produksi

- Set semua environment variable di platform hosting (Vercel/VPS/dll).
- Untuk database produksi, disarankan pindah ke PostgreSQL: ubah `provider` di
  `prisma/schema.prisma` menjadi `postgresql` dan `DATABASE_URL` ke koneksi Postgres Anda, lalu
  jalankan `npx prisma migrate deploy`.

## Struktur Alur Pembayaran

1. Pembeli isi nama, email, dan no. WhatsApp lalu checkout → server membuat `Order` (status
   `PENDING`) → pembeli diarahkan ke halaman `/order/[id]` yang berisi tombol **Chat WhatsApp**
   (pesan sudah terisi otomatis: no. pesanan, daftar foto, total harga).
2. Pembeli transfer manual ke fotografer, lalu fotografer mengecek mutasi/QRIS masuk.
3. Fotografer buka `/admin/orders`, cari pesanan tersebut, klik **Tandai Lunas**. Sistem otomatis:
   status order jadi `PAID`, membuat link download (per foto, kedaluwarsa 7 hari, maksimal 5x
   download), dan mengirim email berisi link tersebut ke pembeli. Link juga langsung tampil di
   halaman `/order/[id]` (halaman ini polling status setiap 15 detik selama masih `PENDING`).
4. Kalau pembeli batal/tidak jadi bayar, fotografer bisa klik **Batalkan** di daftar pesanan.
5. Link download memverifikasi token (status pesanan, masa berlaku, batas jumlah unduhan) → foto
   asli diambil dari Cloudinary lewat URL bertanda tangan yang berlaku singkat (5 menit).
