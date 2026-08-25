"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";

type Props = { id: string; title: string; price: number; previewUrl: string };

export default function AddToCartButtons({ id, title, price, previewUrl }: Props) {
  const router = useRouter();
  const { items, addItem } = useCart();
  const inCart = items.some((i) => i.photoId === id);

  return (
    <div className="flex gap-3">
      <button
        onClick={() => addItem({ photoId: id, title, price, previewUrl })}
        disabled={inCart}
        className="flex-1 border border-brand-600 text-brand-600 hover:bg-brand-50 rounded-md py-2 text-sm font-medium disabled:opacity-50"
      >
        {inCart ? "Sudah di keranjang" : "+ Keranjang"}
      </button>
      <button
        onClick={() => {
          addItem({ photoId: id, title, price, previewUrl });
          router.push("/cart");
        }}
        className="flex-1 bg-brand-600 hover:bg-brand-700 text-white rounded-md py-2 text-sm font-medium"
      >
        Beli Sekarang
      </button>
    </div>
  );
}
