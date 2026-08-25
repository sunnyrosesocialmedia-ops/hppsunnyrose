import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  secret: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

/**
 * Endpoint sekali pakai untuk membuat akun admin pertama tanpa akses terminal/DB
 * langsung (dipakai saat deploy ke platform serverless seperti Vercel). Terkunci
 * permanen begitu sudah ada satu Admin di database, dan hanya aktif kalau
 * SETUP_SECRET diisi di environment variable.
 */
export async function POST(req: NextRequest) {
  const setupSecret = process.env.SETUP_SECRET;
  if (!setupSecret) {
    return NextResponse.json({ error: "Setup tidak diaktifkan" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  if (parsed.data.secret !== setupSecret) {
    return NextResponse.json({ error: "Setup secret salah" }, { status: 403 });
  }

  const existingCount = await prisma.admin.count();
  if (existingCount > 0) {
    return NextResponse.json(
      { error: "Sudah ada akun admin. Endpoint ini terkunci permanen." },
      { status: 403 }
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.admin.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      name: parsed.data.name || "Fotografer",
    },
  });

  return NextResponse.json({ ok: true });
}
