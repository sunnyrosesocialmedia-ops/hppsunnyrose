"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadPhotoPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Pilih file foto terlebih dahulu");
      return;
    }
    setError(null);

    try {
      setProgress("Menyiapkan upload...");
      const sigRes = await fetch("/api/admin/upload-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!sigRes.ok) throw new Error("Gagal menyiapkan upload");
      const sig = await sigRes.json();

      setProgress("Mengunggah foto ke Cloudinary...");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sig.apiKey);
      formData.append("timestamp", String(sig.timestamp));
      formData.append("signature", sig.signature);
      formData.append("public_id", sig.publicId);
      formData.append("folder", sig.folder);
      formData.append("type", "authenticated");

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
        { method: "POST", body: formData }
      );
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData?.error?.message || "Upload gagal");

      setProgress("Membuat preview berwatermark...");
      const createRes = await fetch("/api/admin/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          price: Number(price),
          category: category || undefined,
          originalPublicId: uploadData.public_id,
        }),
      });
      if (!createRes.ok) {
        const data = await createRes.json().catch(() => ({}));
        throw new Error(data.error ? JSON.stringify(data.error) : "Gagal menyimpan foto");
      }

      setProgress(null);
      router.push("/admin/photos");
      router.refresh();
    } catch (err) {
      setProgress(null);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-semibold">Upload Foto</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white border rounded-xl p-6">
        {error && (
          <div className="text-sm bg-red-50 text-red-600 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium">File foto</label>
          <input
            type="file"
            accept="image/*"
            required
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Judul</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Deskripsi (opsional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Harga (Rp)</label>
            <input
              type="number"
              min={1}
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Kategori (opsional)</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!!progress}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-md py-2 text-sm font-medium disabled:opacity-50"
        >
          {progress || "Upload"}
        </button>
      </form>
    </div>
  );
}
