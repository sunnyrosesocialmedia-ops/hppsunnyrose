import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildOrderWhatsAppLink } from "@/lib/whatsapp";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: { include: { photo: true } } },
  });

  if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });

  const whatsappUrl =
    order.status === "PENDING"
      ? buildOrderWhatsAppLink({
          id: order.id,
          buyerName: order.buyerName,
          totalAmount: order.totalAmount,
          items: order.items.map((item) => ({ title: item.photo.title })),
        })
      : null;

  return NextResponse.json({
    id: order.id,
    status: order.status,
    totalAmount: order.totalAmount,
    buyerName: order.buyerName,
    whatsappUrl,
    items: order.items.map((item) => ({
      title: item.photo.title,
      previewUrl: item.photo.previewUrl,
      downloadUrl: order.status === "PAID" ? `/api/download/${item.downloadToken}` : null,
    })),
  });
}
