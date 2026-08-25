"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/navbar";
import { useCart } from "@/lib/cart-context";
import { formatRupiah } from "@/lib/format";

export default function CartPage() {
  const { items, removeItem, total, clear } = useCart();
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName,
          buyerEmail,
          photoIds: items.map((i) => i.photoId),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal checkout");

      clear();
      window.location.href = data.redirectUrl;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  }

  return (
    <div>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-semibold">Keranjang</h1>

        {items.length === 0 ? (
          <div className="text-neutral-500 text-sm">
            Keranjang masih kosong.{" "}
            <Link href="/" className="text-brand-600 hover:underline">
              Lihat galeri
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white border rounded-xl divide-y">
              {items.map((item) => (
                <div key={item.photoId} className="flex items-center gap-3 p-3">
                  <div className="relative w-16 h-16 rounded-md overflow-hidden bg-neutral-100 shrink-0">
                    <Image src={item.previewUrl} alt={item.title} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.title}</div>
                    <div className="text-sm text-neutral-600">{formatRupiah(item.price)}</div>
                  </div>
                  <button
                    onClick={() => removeItem(item.photoId)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{formatRupiah(total)}</span>
            </div>

            <form onSubmit={handleCheckout} className="bg-white border rounded-xl p-6 space-y-4">
              <h2 className="font-medium">Data Pembeli</h2>
              {error && (
                <div className="text-sm bg-red-50 text-red-600 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-sm font-medium">Nama</label>
                <input
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  required
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
                <p className="text-xs text-neutral-400">
                  Link download foto akan dikirim ke email ini setelah pembayaran berhasil.
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-md py-2 text-sm font-medium disabled:opacity-50"
              >
                {loading ? "Memproses..." : `Bayar ${formatRupiah(total)}`}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
