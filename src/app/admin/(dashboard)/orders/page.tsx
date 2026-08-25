import { prisma } from "@/lib/prisma";
import OrderAdminTable from "./order-admin-table";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: { include: { photo: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Pesanan</h1>
        <p className="text-sm text-neutral-500">
          Pembeli konfirmasi transfer lewat WhatsApp. Setelah dana diterima, klik{" "}
          <b>Tandai Lunas</b> — link download otomatis dikirim ke email pembeli.
        </p>
      </div>
      <OrderAdminTable
        initialOrders={orders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() }))}
      />
    </div>
  );
}
