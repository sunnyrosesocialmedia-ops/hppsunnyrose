import midtransClient from "midtrans-client";
import crypto from "crypto";

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

export function getSnapClient() {
  return new midtransClient.Snap({
    isProduction,
    serverKey: process.env.MIDTRANS_SERVER_KEY as string,
    clientKey: process.env.MIDTRANS_CLIENT_KEY as string,
  });
}

export async function createSnapTransaction(params: {
  orderId: string;
  grossAmount: number;
  buyerName: string;
  buyerEmail: string;
  items: { id: string; name: string; price: number; quantity: number }[];
}) {
  const snap = getSnapClient();
  const parameter = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.grossAmount,
    },
    customer_details: {
      first_name: params.buyerName,
      email: params.buyerEmail,
    },
    item_details: params.items.map((item) => ({
      id: item.id,
      name: item.name.slice(0, 50),
      price: item.price,
      quantity: item.quantity,
    })),
    callbacks: {
      finish: `${process.env.APP_URL}/order/${params.orderId}`,
    },
  };
  return snap.createTransaction(parameter);
}

/** Verifikasi signature notifikasi webhook Midtrans (mencegah pemalsuan status bayar). */
export function verifyMidtransSignature(params: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
}) {
  const raw =
    params.orderId +
    params.statusCode +
    params.grossAmount +
    process.env.MIDTRANS_SERVER_KEY;
  const expected = crypto.createHash("sha512").update(raw).digest("hex");
  return expected === params.signatureKey;
}
