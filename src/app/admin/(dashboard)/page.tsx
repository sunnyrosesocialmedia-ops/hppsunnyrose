import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";

export default async function AdminDashboardPage() {
  const [photoCount, paidOrders, pendingOrders] = await Promise.all([
    prisma.photo.count(),
    prisma.order.findMany({ where: { status: "PAID" } }),
    prisma.order.count({ where: { status: "PENDING" } }),
  ]);

  const revenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const stats = [
    { label: "Total foto", value: photoCount },
    { label: "Pesanan lunas", value: paidOrders.length },
    { label: "Pesanan pending", value: pendingOrders },
    { label: "Total pendapatan", value: formatRupiah(revenue) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border rounded-xl p-4">
            <div className="text-sm text-neutral-500">{s.label}</div>
            <div className="text-2xl font-semibold mt-1">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
