"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { formatRupiah } from "@/lib/format";

type OrderData = {
  id: string;
  status: string;
  totalAmount: number;
  buyerName: string;
  whatsappUrl: string | null;
  items: { title: string; previewUrl: string; downloadUrl: string | null }[];
};

const statusText: Record<string, string> = {
  PENDING: "Menunggu konfirmasi pembayaran dari fotografer.",
  PAID: "Pembayaran dikonfirmasi! Silakan download foto Anda di bawah.",
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
    interval = setInterval(fetchOrder, 15000);
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
      <div className="bg-white border rounded-xl p-6 space-y-3">
        <div className="text-sm text-neutral-500">Pesanan #{order.id}</div>
        <div className="text-lg font-semibold">{formatRupiah(order.totalAmount)}</div>
        <div className="text-sm">{statusText[order.status] || order.status}</div>

        {order.status === "PENDING" && order.whatsappUrl && (
          <a
            href={order.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded-md px-4 py-2 text-sm font-medium"
          >
            Chat WhatsApp untuk Konfirmasi Pembayaran
          </a>
        )}
        {order.status === "PENDING" && !order.whatsappUrl && (
          <p className="text-xs text-amber-600">
            Nomor WhatsApp fotografer belum diatur. Hubungi fotografer secara langsung.
          </p>
        )}
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
