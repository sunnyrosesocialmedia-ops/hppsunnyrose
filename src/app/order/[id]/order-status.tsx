"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { formatRupiah } from "@/lib/format";

type OrderData = {
  id: string;
  status: string;
  totalAmount: number;
  buyerName: string;
  items: { title: string; previewUrl: string; downloadUrl: string | null }[];
};

const statusText: Record<string, string> = {
  PENDING: "Menunggu pembayaran. Halaman ini akan otomatis diperbarui.",
  PAID: "Pembayaran berhasil! Silakan download foto Anda di bawah.",
  FAILED: "Pembayaran gagal.",
  EXPIRED: "Waktu pembayaran sudah habis.",
  CANCELLED: "Pesanan dibatalkan.",
};

export default function OrderStatus({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderData | null>(null);

  useEffect(() => {
    let active = true;
    let interval: ReturnType<typeof setInterval>;

    async function fetchOrder() {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok || !active) return;
      const data = await res.json();
      setOrder(data);
      if (data.status !== "PENDING") clearInterval(interval);
    }

    fetchOrder();
    interval = setInterval(fetchOrder, 4000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [orderId]);

  if (!order) {
    return <p className="text-neutral-500 text-sm">Memuat status pesanan...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-xl p-6 space-y-2">
        <div className="text-sm text-neutral-500">Pesanan #{order.id}</div>
        <div className="text-lg font-semibold">{formatRupiah(order.totalAmount)}</div>
        <div className="text-sm">{statusText[order.status] || order.status}</div>
      </div>

      {order.status === "PAID" && (
        <div className="bg-white border rounded-xl divide-y">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3">
              <div className="relative w-16 h-16 rounded-md overflow-hidden bg-neutral-100 shrink-0">
                <Image src={item.previewUrl} alt={item.title} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0 text-sm font-medium truncate">{item.title}</div>
              {item.downloadUrl && (
                <a
                  href={item.downloadUrl}
                  className="text-xs bg-brand-600 hover:bg-brand-700 text-white rounded-md px-3 py-1.5"
                >
                  Download
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
