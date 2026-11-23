'use client';

/*
 * Web push for shoppers: home-screen install + notifications from the admin.
 * iPhone: push works only after "Add to Home Screen" (iOS 16.4+), opened from the home-screen icon.
 */

export type PushState = 'unsupported' | 'needs-install' | 'default' | 'granted' | 'denied';

export const isIOS = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
export const isStandalone = () =>
  typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return Promise.resolve(null);
  return navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => null);
}

export function pushState(): PushState {
  if (typeof window === 'undefined') return 'unsupported';
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (!supported) return isIOS() && !isStandalone() ? 'needs-install' : 'unsupported';
  return Notification.permission as PushState;
}

function keyBytes(base64: string) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

/** Ask for permission, subscribe this device and save the subscription. Returns the new state. */
export async function enablePush(opts: { orderAlerts?: boolean; token?: string } = {}): Promise<PushState> {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key) throw new Error('push_not_configured');
  const reg = (await registerServiceWorker()) ?? (await navigator.serviceWorker.ready);
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission as PushState;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) }));
  const res = await fetch('/api/push/subscribe', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}) },
    body: JSON.stringify({ subscription: sub.toJSON(), standalone: isStandalone(), orderAlerts: !!opts.orderAlerts }),
  });
  if (!res.ok) throw new Error('save_failed');
  try { localStorage.setItem('dr-push', '1'); } catch { /* ignore */ }
  return 'granted';
}
