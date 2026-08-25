export const ORDER_STATUSES = ["PENDING", "PAID", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
