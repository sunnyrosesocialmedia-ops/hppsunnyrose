import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

/**
 * Signature untuk upload langsung dari browser admin ke Cloudinary.
 * File asli disimpan dengan delivery type "authenticated" (privat, tidak bisa
 * diakses publik tanpa URL bertanda tangan) supaya tidak bisa diunduh gratis.
 */
export function createOriginalUploadSignature(publicId: string) {
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = {
    timestamp,
    public_id: publicId,
    folder: "originals",
    type: "authenticated",
  };
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET as string
  );
  return {
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    publicId,
    folder: "originals",
  };
}

/**
 * Setelah original berhasil diupload (privat), buat versi preview publik
 * berwatermark + resolusi diperkecil. Cloudinary yang mengambil source-nya
 * langsung dari URL bertanda tangan (server-to-server), jadi tidak lewat
 * server kita.
 */
export async function generateWatermarkedPreview(
  originalPublicId: string,
  previewPublicId: string
) {
  const signedSourceUrl = cloudinary.url(originalPublicId, {
    type: "authenticated",
    sign_url: true,
    resource_type: "image",
    secure: true,
  });

  const result = await cloudinary.uploader.upload(signedSourceUrl, {
    public_id: previewPublicId,
    folder: "previews",
    type: "upload",
    overwrite: true,
    transformation: [
      { width: 1600, crop: "limit", quality: "auto:good" },
      {
        overlay: {
          font_family: "Arial",
          font_size: 60,
          font_weight: "bold",
          text: process.env.WATERMARK_TEXT || "PREVIEW - SUNNY ROSE",
        },
        gravity: "center",
        opacity: 40,
        color: "#ffffff",
      },
    ],
  });

  return {
    previewUrl: result.secure_url as string,
    width: result.width as number,
    height: result.height as number,
  };
}

/** URL bertanda tangan & sementara untuk file asli — dipakai setelah pembayaran lunas. */
export function getSignedOriginalDownloadUrl(
  originalPublicId: string,
  expiresInSeconds = 60 * 30
) {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  return cloudinary.url(originalPublicId, {
    type: "authenticated",
    sign_url: true,
    resource_type: "image",
    secure: true,
    expires_at: expiresAt,
    flags: "attachment",
  });
}

export function deleteOriginalAndPreview(originalPublicId: string, previewPublicId: string) {
  return Promise.allSettled([
    cloudinary.uploader.destroy(originalPublicId, { type: "authenticated" }),
    cloudinary.uploader.destroy(previewPublicId, { type: "upload" }),
  ]);
}
