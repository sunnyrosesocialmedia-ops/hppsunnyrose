import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import { previewFilePath } from "@/lib/storage";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const buffer = await fs.readFile(previewFilePath(params.id));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Preview tidak ditemukan" }, { status: 404 });
  }
}
