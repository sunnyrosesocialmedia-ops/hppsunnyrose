import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extFromFilename, saveOriginalAndPreview } from "@/lib/storage";

export async function GET() {
  const photos = await prisma.photo.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ photos });
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Form data tidak valid" }, { status: 400 });
  }

  const file = form.get("file");
  const title = form.get("title");
  const description = form.get("description");
  const priceRaw = form.get("price");
  const category = form.get("category");

  if (!(file instanceof File) || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "File dan judul wajib diisi" }, { status: 400 });
  }

  const price = Number(priceRaw);
  if (!Number.isInteger(price) || price <= 0) {
    return NextResponse.json({ error: "Harga tidak valid" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File harus berupa gambar" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const ext = extFromFilename(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const { width, height } = await saveOriginalAndPreview(id, ext, buffer);

    const photo = await prisma.photo.create({
      data: {
        id,
        title: title.trim(),
        description: typeof description === "string" && description ? description : undefined,
        price,
        category: typeof category === "string" && category ? category : undefined,
        originalExt: ext,
        previewUrl: `/api/preview/${id}`,
        width,
        height,
      },
    });

    return NextResponse.json({ photo });
  } catch (err) {
    console.error("Gagal memproses foto:", err);
    return NextResponse.json({ error: "Gagal memproses foto" }, { status: 500 });
  }
}
