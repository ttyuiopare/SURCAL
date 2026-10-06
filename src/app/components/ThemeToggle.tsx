'use client';

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

/**
 * Light/dark theme toggle. The `dark` class on <html> is the source of truth
 * (globals.css keys off it); localStorage persists the explicit choice and an
 * inline script in layout.tsx applies it before first paint, so this component
 * only reads the current state after mount (avoids a hydration mismatch) and
 * flips the class + preference on click.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    try {
      localStorage.setItem('surcal-theme', next);
    } catch {
      /* private mode — theme just won't persist */
    }
    setTheme(next);
  };

  // Fixed-size placeholder until mounted so the nav doesn't shift when the
  // real icon renders (and so server/client HTML match).
  if (theme === null) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        style={{ width: '34px', height: '34px', border: 'none', background: 'none' }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '34px',
        height: '34px',
        borderRadius: '999px',
        border: '1px solid var(--border-light)',
        background: 'var(--bg-surface)',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'color 0.2s ease, border-color 0.2s ease',
      }}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
