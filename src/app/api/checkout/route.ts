import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateDownloadToken } from "@/lib/tokens";
import { buildOrderWhatsAppLink } from "@/lib/whatsapp";

const schema = z.object({
  buyerName: z.string().min(1),
  buyerEmail: z.string().email(),
  buyerPhone: z.string().min(6),
  photoIds: z.array(z.string().min(1)).min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const { buyerName, buyerEmail, buyerPhone, photoIds } = parsed.data;

  const photos = await prisma.photo.findMany({
    where: { id: { in: photoIds }, published: true },
  });

  if (photos.length === 0) {
    return NextResponse.json({ error: "Foto tidak ditemukan" }, { status: 404 });
  }

  const totalAmount = photos.reduce((sum, p) => sum + p.price, 0);

  const order = await prisma.order.create({
    data: {
      buyerName,
      buyerEmail,
      buyerPhone,
      totalAmount,
      status: "PENDING",
      items: {
        create: photos.map((p) => ({
          photoId: p.id,
          price: p.price,
          downloadToken: generateDownloadToken(),
        })),
      },
    },
  });

  const whatsappUrl = buildOrderWhatsAppLink({
    id: order.id,
    buyerName,
    totalAmount,
    items: photos.map((p) => ({ title: p.title })),
  });

  return NextResponse.json({ orderId: order.id, whatsappUrl });
}
