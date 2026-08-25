import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import sharp from "sharp";

const STORAGE_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), "storage");
const ORIGINALS_DIR = path.join(STORAGE_DIR, "originals");
const PREVIEWS_DIR = path.join(STORAGE_DIR, "previews");

for (const dir of [ORIGINALS_DIR, PREVIEWS_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function extFromFilename(filename: string) {
  const ext = path.extname(filename).slice(1).toLowerCase();
  return ext in MIME_BY_EXT ? ext : "jpg";
}

export function mimeFromExt(ext: string) {
  return MIME_BY_EXT[ext] || "application/octet-stream";
}

export function originalFilePath(id: string, ext: string) {
  return path.join(ORIGINALS_DIR, `${id}.${ext}`);
}

export function previewFilePath(id: string) {
  return path.join(PREVIEWS_DIR, `${id}.jpg`);
}

function escapeXml(text: string) {
  return text.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] as string
  );
}

/** SVG watermark berupa teks yang diulang (tile) miring di seluruh permukaan foto. */
function buildWatermarkSvg(width: number, height: number, text: string) {
  const tileW = 260;
  const tileH = 160;
  const safeText = escapeXml(text);
  let tiles = "";
  for (let y = -tileH; y < height + tileH; y += tileH) {
    for (let x = -tileW; x < width + tileW; x += tileW) {
      tiles += `<text x="${x}" y="${y}" transform="rotate(-30 ${x} ${y})" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" fill-opacity="0.35">${safeText}</text>`;
    }
  }
  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${tiles}</svg>`
  );
}

/** Simpan file asli (privat) dan buat preview berwatermark (publik) dari buffer upload. */
export async function saveOriginalAndPreview(id: string, ext: string, buffer: Buffer) {
  await fsp.writeFile(originalFilePath(id, ext), buffer);

  const watermarkText = process.env.WATERMARK_TEXT || "PREVIEW - SUNNY ROSE";

  const resized = sharp(buffer).rotate().resize({ width: 1600, withoutEnlargement: true });
  const { data: resizedBuffer, info } = await resized
    .jpeg({ quality: 85 })
    .toBuffer({ resolveWithObject: true });

  const watermarked = await sharp(resizedBuffer)
    .composite([{ input: buildWatermarkSvg(info.width, info.height, watermarkText) }])
    .jpeg({ quality: 82 })
    .toBuffer();

  await fsp.writeFile(previewFilePath(id), watermarked);

  return { width: info.width, height: info.height };
}

export async function deletePhotoFiles(id: string, ext: string) {
  await Promise.allSettled([
    fsp.unlink(originalFilePath(id, ext)),
    fsp.unlink(previewFilePath(id)),
  ]);
}
