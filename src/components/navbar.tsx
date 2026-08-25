"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export default function Navbar() {
  const { items } = useCart();

  return (
    <header className="border-b bg-white sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold">
          Sunny Rose Photo
        </Link>
        <Link
          href="/cart"
          className="text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-1.5 rounded-full"
        >
          Keranjang ({items.length})
        </Link>
      </div>
    </header>
  );
}
