import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSnapTransaction } from "@/lib/midtrans";
import { generateDownloadToken } from "@/lib/tokens";

const schema = z.object({
  buyerName: z.string().min(1),
  buyerEmail: z.string().email(),
  photoIds: z.array(z.string().min(1)).min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const { buyerName, buyerEmail, photoIds } = parsed.data;

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

  try {
    const transaction = await createSnapTransaction({
      orderId: order.id,
      grossAmount: totalAmount,
      buyerName,
      buyerEmail,
      items: photos.map((p) => ({ id: p.id, name: p.title, price: p.price, quantity: 1 })),
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { snapToken: transaction.token, snapRedirectUrl: transaction.redirect_url },
    });

    return NextResponse.json({
      orderId: order.id,
      redirectUrl: transaction.redirect_url,
    });
  } catch (err) {
    console.error("Gagal membuat transaksi Midtrans:", err);
    await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
    return NextResponse.json({ error: "Gagal membuat transaksi pembayaran" }, { status: 500 });
  }
}
