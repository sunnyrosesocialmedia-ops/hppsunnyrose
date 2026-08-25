import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSignedOriginalDownloadUrl } from "@/lib/cloudinary";

function errorPage(message: string, status: number) {
  return new NextResponse(
    `<!doctype html><html lang="id"><body style="font-family:sans-serif;max-width:480px;margin:60px auto;text-align:center">
      <h2>Tidak bisa download</h2><p>${message}</p></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const item = await prisma.orderItem.findUnique({
    where: { downloadToken: params.token },
    include: { order: true, photo: true },
  });

  if (!item) return errorPage("Link download tidak ditemukan.", 404);
  if (item.order.status !== "PAID") return errorPage("Pesanan ini belum lunas.", 402);
  if (item.expiresAt && item.expiresAt < new Date()) {
    return errorPage("Link download sudah kedaluwarsa. Hubungi fotografer untuk bantuan.", 410);
  }
  if (item.downloadCount >= item.maxDownloads) {
    return errorPage(
      "Batas jumlah download untuk foto ini sudah tercapai. Hubungi fotografer untuk bantuan.",
      429
    );
  }

  await prisma.orderItem.update({
    where: { id: item.id },
    data: { downloadCount: { increment: 1 } },
  });

  const url = getSignedOriginalDownloadUrl(item.photo.originalPublicId, 300);
  return NextResponse.redirect(url);
}
