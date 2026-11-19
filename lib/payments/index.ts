import 'server-only';

/*
 * Payment provider adapter.
 *
 * Stripe does not onboard Israeli businesses, so the real provider will be one of:
 *   - Shopify (headless): checkout, orders, inventory and Israeli gateways handled by Shopify
 *   - An Israeli processor with a hosted payment page: PayPlus, Grow (Meshulam), Cardcom, Tranzila
 *
 * Every option works the same way from the site's point of view:
 *   1. the server builds the order from trusted prices (never from the browser)
 *   2. the provider returns a hosted payment-page URL → we redirect the shopper there
 *   3. the provider calls our webhook when payment succeeds → we mark the order paid
 *
 * Only `demo` is implemented until the store picks its provider.
 */

export type OrderLine = { productId: string; name: string; size: string; color: string; qty: number; unitPrice: number };
export type Customer = { name: string; email: string; phone: string; address: string; city: string; zip: string };
export type Order = { id: string; lines: OrderLine[]; subtotal: number; shipping: number; total: number; currency: string; customer: Customer };
export type PaymentSession = { redirectUrl: string };

export async function createPaymentSession(order: Order, origin: string): Promise<PaymentSession> {
  const provider = process.env.PAYMENT_PROVIDER ?? 'demo';
  switch (provider) {
    case 'demo':
      return { redirectUrl: `${origin}/checkout/success?order=${encodeURIComponent(order.id)}&demo=1` };
    // case 'payplus': return payplus.createSession(order, origin);
    // case 'grow':    return grow.createSession(order, origin);
    // case 'cardcom': return cardcom.createSession(order, origin);
    default:
      throw new Error(`Payment provider "${provider}" is not configured yet`);
  }
}
