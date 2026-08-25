import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import { prisma } from "@/lib/prisma";
import { mimeFromExt, originalFilePath } from "@/lib/storage";

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

  const { photo } = item;
  let buffer: Buffer;
  try {
    buffer = await fs.readFile(originalFilePath(photo.id, photo.originalExt));
  } catch {
    return errorPage("File foto tidak ditemukan di server. Hubungi fotografer.", 500);
  }

  await prisma.orderItem.update({
    where: { id: item.id },
    data: { downloadCount: { increment: 1 } },
  });

  const filename = `${photo.title.replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "")}.${photo.originalExt}`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": mimeFromExt(photo.originalExt),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(buffer.length),
    },
  });
}
