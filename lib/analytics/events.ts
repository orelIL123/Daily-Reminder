/* Shared between the browser tracker and /api/track. Must match the check constraint in migration 0008. */
export const EVENT_TYPES = [
  'page_view', 'product_view', 'add_to_cart', 'checkout_start',
  'checkout_field', 'checkout_submit', 'checkout_error', 'order_placed',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];
export type EventData = { productId?: string; detail?: string };
