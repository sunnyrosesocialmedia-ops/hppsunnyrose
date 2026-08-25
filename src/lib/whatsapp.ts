import { formatRupiah } from "./format";

/** Normalisasi nomor ke format internasional tanpa "+" (mis. 0812xxx -> 62812xxx). */
export function normalizeWhatsAppNumber(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("62")) return digits;
  return digits;
}

export function buildOrderWhatsAppLink(order: {
  id: string;
  buyerName: string;
  totalAmount: number;
  items: { title: string }[];
}) {
  const photographerNumber = process.env.WHATSAPP_NUMBER;
  if (!photographerNumber) return null;

  const lines = [
    `Halo, saya ${order.buyerName} ingin konfirmasi pembayaran foto.`,
    ``,
    `No. Pesanan: ${order.id}`,
    `Foto: ${order.items.map((i) => i.title).join(", ")}`,
    `Total: ${formatRupiah(order.totalAmount)}`,
    ``,
    `Mohon info rekening/QRIS untuk transfer. Terima kasih.`,
  ];

  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${normalizeWhatsAppNumber(photographerNumber)}?text=${text}`;
}
