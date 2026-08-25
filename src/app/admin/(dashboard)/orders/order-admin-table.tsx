"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/format";

type Order = {
  id: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: { photo: { title: string } }[];
};

const statusLabel: Record<string, string> = {
  PENDING: "Menunggu konfirmasi",
  PAID: "Lunas",
  CANCELLED: "Dibatalkan",
};

const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  CANCELLED: "bg-neutral-100 text-neutral-500",
};

export default function OrderAdminTable({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function updateStatus(id: string, status: "PAID" | "CANCELLED") {
    if (status === "PAID" && !confirm("Tandai pesanan ini lunas? Email link download akan dikirim ke pembeli.")) {
      return;
    }
    if (status === "CANCELLED" && !confirm("Batalkan pesanan ini?")) return;

    setBusyId(id);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);

    if (!res.ok) {
      alert(data.error || "Gagal memperbarui pesanan");
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  if (orders.length === 0) {
    return <p className="text-neutral-500 text-sm">Belum ada pesanan.</p>;
  }

  return (
    <div className="bg-white border rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-left text-neutral-500">
          <tr>
            <th className="px-4 py-2">Pesanan</th>
            <th className="px-4 py-2">Pembeli</th>
            <th className="px-4 py-2">Foto</th>
            <th className="px-4 py-2">Total</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Tanggal</th>
            <th className="px-4 py-2">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="px-4 py-2 font-mono text-xs">{order.id}</td>
              <td className="px-4 py-2">
                <div>{order.buyerName}</div>
                <div className="text-neutral-500 text-xs">{order.buyerEmail}</div>
                <div className="text-neutral-500 text-xs">{order.buyerPhone}</div>
              </td>
              <td className="px-4 py-2">{order.items.map((i) => i.photo.title).join(", ")}</td>
              <td className="px-4 py-2 whitespace-nowrap">{formatRupiah(order.totalAmount)}</td>
              <td className="px-4 py-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[order.status]}`}>
                  {statusLabel[order.status]}
                </span>
              </td>
              <td className="px-4 py-2 text-neutral-500 text-xs whitespace-nowrap">
                {new Date(order.createdAt).toLocaleString("id-ID")}
              </td>
              <td className="px-4 py-2">
                {order.status === "PENDING" && (
                  <div className="flex gap-2 text-xs whitespace-nowrap">
                    <button
                      disabled={busyId === order.id}
                      onClick={() => updateStatus(order.id, "PAID")}
                      className="text-green-700 hover:underline disabled:opacity-50"
                    >
                      Tandai Lunas
                    </button>
                    <button
                      disabled={busyId === order.id}
                      onClick={() => updateStatus(order.id, "CANCELLED")}
                      className="text-red-600 hover:underline disabled:opacity-50"
                    >
                      Batalkan
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
