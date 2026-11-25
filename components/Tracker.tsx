'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/analytics/track';

/** Records one page view per page the shopper lands on. */
export default function Tracker() {
  const path = usePathname();
  const last = useRef('');
  useEffect(() => {
    if (last.current === path) return;
    last.current = path;
    track('page_view');
  }, [path]);
  return null;
}
