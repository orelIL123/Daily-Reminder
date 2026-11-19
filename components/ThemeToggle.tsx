'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

import { THEME_KEY, type Theme } from '@/lib/theme';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
    // follow the OS while the shopper hasn't picked one
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      try { if (localStorage.getItem(THEME_KEY)) return; } catch { /* ignore */ }
      apply(e.matches ? 'dark' : 'light', false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  function apply(next: Theme, persist = true) {
    document.documentElement.dataset.theme = next;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#0c0d11' : '#f6f2ec');
    if (persist) { try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ } }
    setTheme(next);
  }

  const dark = theme === 'dark';
  return (
    <button className="theme-toggle" onClick={() => apply(dark ? 'light' : 'dark')}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Light mode' : 'Dark mode'}>
      {dark ? <Sun size={18} strokeWidth={1.6} /> : <Moon size={18} strokeWidth={1.6} />}
    </button>
  );
}
