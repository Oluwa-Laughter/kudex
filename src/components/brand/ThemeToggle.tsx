'use client';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { FiSun, FiMoon } from 'react-icons/fi';
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = resolvedTheme === 'dark';
  return (
    <button
      type="button"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-secondary"
      disabled={!mounted}
      aria-label={
        mounted ? (dark ? 'Use light theme' : 'Use dark theme') : 'Toggle color theme'
      }
      onClick={() => setTheme(dark ? 'light' : 'dark')}
    >
      {mounted && (dark ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />)}
    </button>
  );
}
