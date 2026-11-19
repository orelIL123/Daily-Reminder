import 'server-only';

/*
 * Payment provider adapter.
 *
 * Flow for every provider:
 *   1. place_order() in Supabase creates the order and reserves stock (30 min)
 *   2. createPaymentSession() returns the provider's hosted payment page → redirect the shopper
 *   3. the provider calls back → the server VERIFIES the transaction with the provider,
 *      then calls mark_order_paid(). Unpaid orders release their stock automatically.
 *
 * Chosen provider: Hyp (credentials HYP_MASOF / HYP_API_KEY / HYP_PASSP, server only).
 * Until it is connected, `demo` skips the payment page.
 */

export type PaymentRequest = { orderId: string; orderNumber: number; total: number; currency: string; email: string; name: string; phone: string };
export type PaymentSession = { redirectUrl: string };

export async function createPaymentSession(req: PaymentRequest, origin: string): Promise<PaymentSession> {
  const provider = process.env.PAYMENT_PROVIDER ?? 'demo';
  switch (provider) {
    case 'demo':
      return { redirectUrl: `${origin}/checkout/success?order=${req.orderNumber}&demo=1` };
    // case 'hyp': return hyp.createSession(req, origin);
    default:
      throw new Error(`Payment provider "${provider}" is not configured yet`);
  }
}
