import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";
import Navbar from "@/components/navbar";
import AddToCartButtons from "./add-to-cart-buttons";

export default async function PhotoDetailPage({ params }: { params: { id: string } }) {
  const photo = await prisma.photo.findUnique({ where: { id: params.id } });
  if (!photo || !photo.published) notFound();

  return (
    <div>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="relative aspect-[4/3] bg-neutral-100 rounded-xl overflow-hidden">
          <Image
            src={photo.previewUrl}
            alt={photo.title}
            fill
            className="object-contain"
            sizes="(min-width: 768px) 60vw, 100vw"
            priority
          />
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-semibold">{photo.title}</h1>
          {photo.description && <p className="text-neutral-600">{photo.description}</p>}
          <div className="text-xl font-semibold text-brand-600">{formatRupiah(photo.price)}</div>
          <p className="text-xs text-neutral-400">
            Preview di atas menggunakan watermark. Setelah pembayaran berhasil, Anda akan
            mendapat link download foto resolusi penuh tanpa watermark via email.
          </p>
          <AddToCartButtons
            id={photo.id}
            title={photo.title}
            price={photo.price}
            previewUrl={photo.previewUrl}
          />
        </div>
      </main>
    </div>
  );
}
