import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMidtransSignature } from "@/lib/midtrans";
import { sendDownloadEmail } from "@/lib/mailer";
import type { OrderStatus } from "@/lib/types";

const DOWNLOAD_VALID_DAYS = 7;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.order_id || !body?.signature_key) {
    return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  const validSignature = verifyMidtransSignature({
    orderId: body.order_id,
    statusCode: String(body.status_code),
    grossAmount: String(body.gross_amount),
    signatureKey: body.signature_key,
  });

  if (!validSignature) {
    return NextResponse.json({ error: "Signature tidak valid" }, { status: 403 });
  }

  const order = await prisma.order.findUnique({
    where: { id: body.order_id },
    include: { items: { include: { photo: true } } },
  });

  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
  }

  const transactionStatus = body.transaction_status as string;
  const fraudStatus = body.fraud_status as string | undefined;

  let nextStatus: OrderStatus | null = null;

  if (transactionStatus === "capture") {
    nextStatus = fraudStatus === "accept" ? "PAID" : "FAILED";
  } else if (transactionStatus === "settlement") {
    nextStatus = "PAID";
  } else if (transactionStatus === "pending") {
    nextStatus = "PENDING";
  } else if (transactionStatus === "deny" || transactionStatus === "failure") {
    nextStatus = "FAILED";
  } else if (transactionStatus === "cancel") {
    nextStatus = "CANCELLED";
  } else if (transactionStatus === "expire") {
    nextStatus = "EXPIRED";
  }

  if (!nextStatus) {
    return NextResponse.json({ ok: true });
  }

  const wasAlreadyPaid = order.status === "PAID";

  if (nextStatus === "PAID" && !wasAlreadyPaid) {
    const expiresAt = new Date(Date.now() + DOWNLOAD_VALID_DAYS * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { status: "PAID", paidAt: new Date() },
      }),
      ...order.items.map((item) =>
        prisma.orderItem.update({
          where: { id: item.id },
          data: { expiresAt },
        })
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
  } else if (nextStatus !== order.status) {
    await prisma.order.update({ where: { id: order.id }, data: { status: nextStatus } });
  }

  return NextResponse.json({ ok: true });
}
