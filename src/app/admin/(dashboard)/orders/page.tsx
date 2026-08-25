import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";

const statusLabel: Record<string, string> = {
  PENDING: "Menunggu bayar",
  PAID: "Lunas",
  FAILED: "Gagal",
  EXPIRED: "Kedaluwarsa",
  CANCELLED: "Dibatalkan",
};

const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  EXPIRED: "bg-neutral-100 text-neutral-500",
  CANCELLED: "bg-neutral-100 text-neutral-500",
};

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: { include: { photo: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Pesanan</h1>

      {orders.length === 0 ? (
        <p className="text-neutral-500 text-sm">Belum ada pesanan.</p>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-2">Pesanan</th>
                <th className="px-4 py-2">Pembeli</th>
                <th className="px-4 py-2">Foto</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-2 font-mono text-xs">{order.id}</td>
                  <td className="px-4 py-2">
                    <div>{order.buyerName}</div>
                    <div className="text-neutral-500 text-xs">{order.buyerEmail}</div>
                  </td>
                  <td className="px-4 py-2">
                    {order.items.map((i) => i.photo.title).join(", ")}
                  </td>
                  <td className="px-4 py-2">{formatRupiah(order.totalAmount)}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${statusColor[order.status]}`}
                    >
                      {statusLabel[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-neutral-500 text-xs">
                    {order.createdAt.toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
