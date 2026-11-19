'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/cart';
import { useI18n } from '@/lib/i18n/client';

function Success() {
  const params = useSearchParams();
  const { clear } = useCart();
  const { t, href } = useI18n();
  const demo = params.get('demo') === '1';
  useEffect(() => { clear(); }, [clear]);
  return (
    <div className="success">
      <span className="eyebrow-sm">{t.success.order(params.get('order') ?? '')}</span>
      <h1>{t.success.title}</h1>
      <p>{demo ? t.success.demo : t.success.paid}</p>
      <Link className="btn-primary" href={href('/')}>{t.success.back}</Link>
    </div>
  );
}

export default function SuccessPage() {
  return <Suspense><Success /></Suspense>;
}
