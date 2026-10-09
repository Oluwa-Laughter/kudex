'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { FiSun, FiMoon } from 'react-icons/fi';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B]" />
    );
  }

  const isDark = (resolvedTheme || theme) === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="p-2.5 rounded-xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#161C2B] transition flex items-center justify-center shadow-sm"
      aria-label="Toggle theme"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? <FiSun className="w-4 h-4 text-[#00E599]" /> : <FiMoon className="w-4 h-4 text-slate-700" />}
    </button>
  );
}
