import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendDownloadEmail } from "@/lib/mailer";

const DOWNLOAD_VALID_DAYS = 7;

const schema = z.object({
  status: z.enum(["PAID", "CANCELLED"]),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: { include: { photo: true } } },
  });
  if (!order) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
  }
  if (order.status !== "PENDING") {
    return NextResponse.json({ error: "Pesanan ini sudah diproses sebelumnya" }, { status: 409 });
  }

  if (parsed.data.status === "PAID") {
    const expiresAt = new Date(Date.now() + DOWNLOAD_VALID_DAYS * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { status: "PAID", paidAt: new Date() },
      }),
      ...order.items.map((item) =>
        prisma.orderItem.update({ where: { id: item.id }, data: { expiresAt } })
      ),
    ]);

    await sendDownloadEmail({
      to: order.buyerEmail,
      buyerName: order.buyerName,
      orderId: order.id,
      items: order.items.map((item) => ({
        title: item.photo.title,
        downloadUrl: `${process.env.APP_URL}/api/download/${item.downloadToken}`,
      })),
    });
  } else {
    await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
  }

  return NextResponse.json({ ok: true });
}
