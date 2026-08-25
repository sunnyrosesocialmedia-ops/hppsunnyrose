import nodemailer from "nodemailer";

function getTransport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_PORT === "465",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

export async function sendDownloadEmail(params: {
  to: string;
  buyerName: string;
  orderId: string;
  items: { title: string; downloadUrl: string }[];
}) {
  const linksHtml = params.items
    .map((i) => `<li><a href="${i.downloadUrl}">${i.title}</a></li>`)
    .join("");

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:auto">
      <h2>Terima kasih, ${params.buyerName}!</h2>
      <p>Pembayaran untuk pesanan <b>#${params.orderId}</b> sudah kami terima.
      Berikut link download foto resolusi penuh (tanpa watermark) milik Anda:</p>
      <ul>${linksHtml}</ul>
      <p style="color:#888;font-size:12px">Link download berlaku terbatas dan bisa diunduh maksimal
      beberapa kali. Simpan file setelah diunduh. Anda juga bisa membuka kembali halaman
      pesanan: ${process.env.APP_URL}/order/${params.orderId}</p>
    </div>
  `;

  const transport = getTransport();
  if (!transport) {
    console.log("[mailer] SMTP belum dikonfigurasi. Isi email yang seharusnya dikirim:\n", html);
    return;
  }

  await transport.sendMail({
    from: process.env.MAIL_FROM || "no-reply@sunnyrose.local",
    to: params.to,
    subject: `Download foto pesanan #${params.orderId}`,
    html,
  });
}
