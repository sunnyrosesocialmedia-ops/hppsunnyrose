import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { deleteOriginalAndPreview } from "@/lib/cloudinary";

const schema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().int().positive().optional(),
  category: z.string().optional(),
  published: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const photo = await prisma.photo.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json({ photo });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const photo = await prisma.photo.findUnique({ where: { id: params.id } });
  if (!photo) {
    return NextResponse.json({ error: "Foto tidak ditemukan" }, { status: 404 });
  }

  const orderItemCount = await prisma.orderItem.count({ where: { photoId: photo.id } });
  if (orderItemCount > 0) {
    await prisma.photo.update({ where: { id: photo.id }, data: { published: false } });
    return NextResponse.json({
      warning: "Foto sudah pernah dibeli, disembunyikan (unpublish) alih-alih dihapus permanen.",
    });
  }

  await deleteOriginalAndPreview(photo.originalPublicId, photo.previewPublicId);
  await prisma.photo.delete({ where: { id: photo.id } });

  return NextResponse.json({ ok: true });
}
