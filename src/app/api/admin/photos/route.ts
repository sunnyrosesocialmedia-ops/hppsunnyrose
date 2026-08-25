import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateWatermarkedPreview } from "@/lib/cloudinary";

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.number().int().positive(),
  category: z.string().optional(),
  originalPublicId: z.string().min(1),
});

export async function GET() {
  const photos = await prisma.photo.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ photos });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, description, price, category, originalPublicId } = parsed.data;
  const previewPublicId = originalPublicId.replace(/^originals\//, "previews/");

  try {
    const preview = await generateWatermarkedPreview(originalPublicId, previewPublicId);

    const photo = await prisma.photo.create({
      data: {
        title,
        description,
        price,
        category,
        originalPublicId,
        previewPublicId,
        previewUrl: preview.previewUrl,
        width: preview.width,
        height: preview.height,
      },
    });

    return NextResponse.json({ photo });
  } catch (err) {
    console.error("Gagal membuat preview foto:", err);
    return NextResponse.json({ error: "Gagal memproses foto di Cloudinary" }, { status: 500 });
  }
}
