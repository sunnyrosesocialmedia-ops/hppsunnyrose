import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/email";

const schema = z.object({
  secret: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

/**
 * Endpoint untuk membuat atau mereset akun admin tanpa akses terminal/DB langsung
 * (dipakai saat deploy ke platform serverless seperti Vercel, atau kalau lupa
 * kombinasi email/password yang tersimpan). Selalu dijaga oleh SETUP_SECRET —
 * siapa pun yang tahu secret ini bisa membuat/reset akun admin, jadi perlakukan
 * SETUP_SECRET sama rahasianya dengan password admin itu sendiri.
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

  const email = normalizeEmail(parsed.data.email);
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.admin.upsert({
    where: { email },
    update: { passwordHash, name: parsed.data.name || undefined },
    create: {
      email,
      passwordHash,
      name: parsed.data.name || "Fotografer",
    },
  });

  return NextResponse.json({ ok: true });
}

/** Cek diagnostik: daftar email admin yang tersimpan (tanpa password). Dijaga SETUP_SECRET. */
export async function GET(req: NextRequest) {
  const setupSecret = process.env.SETUP_SECRET;
  if (!setupSecret) {
    return NextResponse.json({ error: "Setup tidak diaktifkan" }, { status: 404 });
  }

  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== setupSecret) {
    return NextResponse.json({ error: "Setup secret salah" }, { status: 403 });
  }

  const admins = await prisma.admin.findMany({
    select: { email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ admins });
}
