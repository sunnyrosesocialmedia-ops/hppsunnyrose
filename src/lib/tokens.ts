import crypto from "crypto";

export function generateDownloadToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function generateSlug(text: string) {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base || "photo"}-${crypto.randomBytes(4).toString("hex")}`;
}
