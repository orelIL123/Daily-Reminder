'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/cart';

function Success() {
  const params = useSearchParams();
  const cart = useCart();
  const demo = params.get('demo') === '1';
  const { clear } = cart;
  useEffect(() => { clear(); }, [clear]);
  return (
    <div className="success">
      <span className="eyebrow-sm">Order #{params.get('order')}</span>
      <h1>Thank you.</h1>
      <p>{demo ? 'Your order is saved. Demo mode — no payment was taken yet; the payment page (Hyp) will appear here once it is connected.' : 'Your order is confirmed. A receipt is on its way to your inbox.'}</p>
      <Link className="btn-primary" href="/">Back to the store</Link>
    </div>
  );
}

export default function SuccessPage() {
  return <Suspense><Success /></Suspense>;
}
