"use client";

import Image from "next/image";
import Link from "next/link";
import { formatRupiah } from "@/lib/format";
import { useCart } from "@/lib/cart-context";

type Props = {
  id: string;
  title: string;
  price: number;
  previewUrl: string;
};

export default function PhotoCard({ id, title, price, previewUrl }: Props) {
  const { items, addItem } = useCart();
  const inCart = items.some((i) => i.photoId === id);

  return (
    <div className="bg-white border rounded-xl overflow-hidden group">
      <Link href={`/photo/${id}`} className="block relative aspect-[4/3] bg-neutral-100">
        <Image
          src={previewUrl}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform"
          sizes="(min-width: 768px) 25vw, 50vw"
        />
      </Link>
      <div className="p-3 space-y-2">
        <Link href={`/photo/${id}`} className="font-medium text-sm block truncate">
          {title}
        </Link>
        <div className="text-sm text-neutral-600">{formatRupiah(price)}</div>
        <button
          onClick={() => addItem({ photoId: id, title, price, previewUrl })}
          disabled={inCart}
          className="w-full text-xs bg-brand-600 hover:bg-brand-700 text-white rounded-md py-1.5 disabled:opacity-50"
        >
          {inCart ? "Sudah di keranjang" : "+ Keranjang"}
        </button>
      </div>
    </div>
  );
}
