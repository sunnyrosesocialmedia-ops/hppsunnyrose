import { NextRequest, NextResponse } from "next/server";
import { createOriginalUploadSignature } from "@/lib/cloudinary";
import { generateSlug } from "@/lib/tokens";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const title = typeof body?.title === "string" ? body.title : "photo";
  const publicId = generateSlug(title);
  const signature = createOriginalUploadSignature(publicId);
  return NextResponse.json(signature);
}
