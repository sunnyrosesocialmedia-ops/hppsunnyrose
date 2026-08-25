import { prisma } from "@/lib/prisma";
import Navbar from "@/components/navbar";
import PhotoCard from "@/components/photo-card";

export default async function HomePage() {
  const photos = await prisma.photo.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Galeri Foto</h1>
          <p className="text-neutral-500 text-sm">
            Lihat semua foto gratis. Untuk download resolusi penuh tanpa watermark, silakan beli.
          </p>
        </div>

        {photos.length === 0 ? (
          <p className="text-neutral-500 text-sm">Belum ada foto yang ditayangkan.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                id={photo.id}
                title={photo.title}
                price={photo.price}
                previewUrl={photo.previewUrl}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
