"use client";

import { useState } from "react";
import Image from "next/image";
import { formatRupiah } from "@/lib/format";

type Photo = {
  id: string;
  title: string;
  price: number;
  previewUrl: string;
  published: boolean;
  category: string | null;
};

export default function PhotoAdminList({ initialPhotos }: { initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function togglePublish(photo: Photo) {
    setBusyId(photo.id);
    const res = await fetch(`/api/admin/photos/${photo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !photo.published }),
    });
    setBusyId(null);
    if (res.ok) {
      setPhotos((prev) =>
        prev.map((p) => (p.id === photo.id ? { ...p, published: !p.published } : p))
      );
    }
  }

  async function handleDelete(photo: Photo) {
    if (!confirm(`Hapus foto "${photo.title}"?`)) return;
    setBusyId(photo.id);
    const res = await fetch(`/api/admin/photos/${photo.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (res.ok) {
      if (data.warning) {
        alert(data.warning);
        setPhotos((prev) =>
          prev.map((p) => (p.id === photo.id ? { ...p, published: false } : p))
        );
      } else {
        setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      }
    }
  }

  if (photos.length === 0) {
    return <p className="text-neutral-500 text-sm">Belum ada foto. Upload foto pertama Anda.</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {photos.map((photo) => (
        <div key={photo.id} className="bg-white border rounded-xl overflow-hidden">
          <div className="relative aspect-[4/3] bg-neutral-100">
            <Image src={photo.previewUrl} alt={photo.title} fill className="object-cover" />
          </div>
          <div className="p-3 space-y-1">
            <div className="font-medium text-sm truncate">{photo.title}</div>
            <div className="text-sm text-neutral-600">{formatRupiah(photo.price)}</div>
            <div className="flex items-center justify-between pt-2">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  photo.published
                    ? "bg-green-100 text-green-700"
                    : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {photo.published ? "Tayang" : "Disembunyikan"}
              </span>
              <div className="flex gap-2 text-xs">
                <button
                  disabled={busyId === photo.id}
                  onClick={() => togglePublish(photo)}
                  className="text-brand-600 hover:underline disabled:opacity-50"
                >
                  {photo.published ? "Sembunyikan" : "Tayangkan"}
                </button>
                <button
                  disabled={busyId === photo.id}
                  onClick={() => handleDelete(photo)}
                  className="text-red-600 hover:underline disabled:opacity-50"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
