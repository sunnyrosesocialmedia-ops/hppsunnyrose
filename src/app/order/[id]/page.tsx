import Navbar from "@/components/navbar";
import OrderStatus from "./order-status";

export default function OrderPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-semibold">Status Pesanan</h1>
        <OrderStatus orderId={params.id} />
      </main>
    </div>
  );
}
