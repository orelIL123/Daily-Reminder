export type OrderStatus = 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type ProductStatus = 'draft' | 'active' | 'archived';
export type View = 'front' | 'side' | 'back';

export type Category = { id: string; slug: string; name_he: string; name_en: string };
export type VariantRow = { id: string; product_id: string; size: string; color: string; sku: string | null; stock: number; sort_order: number; is_active: boolean };
export type ImageRow = { id: string; product_id: string; view: View | 'detail'; url: string };
export type ProductRow = {
  id: string; slug: string; category_id: string | null; name_he: string; name_en: string;
  description_he: string; description_en: string; status: ProductStatus; price: number;
  compare_at_price: number | null; sort_order: number; updated_at: string;
  images: ImageRow[]; variants: VariantRow[];
};

export type OrderItem = { id: string; name: string; size: string; color: string; sku: string | null; unit_price: number; quantity: number; line_total: number; product_id: string | null };
export type OrderEvent = { id: number; type: string; data: Record<string, unknown>; created_at: string };
export type OrderRow = {
  id: string; order_number: number; email: string; name: string; phone: string;
  shipping_address: { street?: string; city?: string; zip?: string };
  locale: string; status: OrderStatus; subtotal: number; discount_total: number; shipping_total: number; total: number;
  discount_code: string | null; paid_at: string | null; reserved_until: string | null;
  customer_note: string; admin_note: string; tracking_number?: string; created_at: string;
  order_items: OrderItem[]; order_events?: OrderEvent[];
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: 'ממתין לתשלום', paid: 'שולם', processing: 'בהכנה', shipped: 'נשלח',
  delivered: 'נמסר', cancelled: 'בוטל', refunded: 'הוחזר',
};
export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = { draft: 'טיוטה', active: 'פעיל באתר', archived: 'בארכיון' };
export const VIEW_LABEL: Record<View, string> = { front: 'חזית', side: 'צד', back: 'גב' };

export const LOW_STOCK = 3;
export const ils = (n: number) => new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(Number(n));
export const when = (iso: string) => new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
