export const ORDER_STATUSES = ["PENDING", "PAID", "FAILED", "EXPIRED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
