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

Next.js (App Router) + TypeScript + Prisma (PostgreSQL) + Cloudinary + Nodemailer.

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
   - `DATABASE_URL` — connection string PostgreSQL. Untuk lokal, gampangnya pakai database gratis
     dari [neon.tech](https://neon.tech) atau [supabase.com](https://supabase.com) (tinggal daftar,
     copy connection string-nya), atau Postgres yang jalan di komputer sendiri.
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

## Deploy ke Vercel

1. **Push kode ke GitHub** (kalau belum) — repo ini sudah siap.

2. **Import project di Vercel**
   - Buka [vercel.com](https://vercel.com) → **Add New → Project** → pilih repo GitHub ini.
   - Vercel otomatis mendeteksi ini project Next.js, tidak perlu ubah setting build.

3. **Tambahkan database PostgreSQL**
   - Di halaman project Vercel → tab **Storage** → **Create Database** → pilih **Postgres**
     (biasanya via integrasi Neon). Ini gratis untuk pemakaian kecil.
   - Setelah dibuat, Vercel otomatis menambahkan env var koneksinya ke project — cek namanya
     (mis. `DATABASE_URL` atau `POSTGRES_URL`). Kalau namanya bukan `DATABASE_URL`, tambahkan satu
     env var baru bernama **`DATABASE_URL`** dengan nilai yang sama (Prisma di kode ini membaca
     nama `DATABASE_URL` secara spesifik).

4. **Isi environment variable lain** di project Settings → Environment Variables:
   - `SESSION_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`,
     `WHATSAPP_NUMBER`, `WATERMARK_TEXT`, `SMTP_*` (kalau pakai email), `MAIL_FROM`.
   - `APP_URL` — isi dengan domain Vercel Anda (mis. `https://nama-project.vercel.app`), dipakai
     untuk link download di email.

5. **Deploy.** Build command bawaan project ini (`prisma generate && prisma migrate deploy && next build`)
   otomatis membuat semua tabel di database Postgres yang baru setiap kali deploy — tidak perlu
   langkah manual tambahan.

6. **Buat akun login fotografer pertama.** Ada dua cara:

   - **Dari komputer lokal** (kalau punya Node.js & repo ini di-clone): jalankan `create-admin`
     dengan `DATABASE_URL` diarahkan ke database production yang sama:

     ```bash
     DATABASE_URL="connection-string-dari-vercel" npm run create-admin
     ```

   - **Lewat browser saja** (tanpa terminal): isi env var `SETUP_SECRET` di Vercel (string acak
     bebas), redeploy, lalu buka `https://nama-project.vercel.app/admin/setup` dan isi form-nya.
     Halaman ini otomatis terkunci permanen setelah dipakai sekali — aman ditinggal setelahnya.

   Setelah itu langsung bisa login di `https://nama-project.vercel.app/admin/login`.

7. **Deploy berikutnya** otomatis jalan tiap kali Anda push ke branch yang tersambung ke Vercel.

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
