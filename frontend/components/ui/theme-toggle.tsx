'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const darkActive = document.documentElement.classList.contains('dark');
    setIsDark(darkActive);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  if (!mounted) {
    return <div className="w-9 h-9" />; // Spacer to avoid cumulative layout shifts
  }

  return (
    <button
      onClick={toggleTheme}
      className="h-9 w-9 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 text-zinc-600 hover:text-zinc-900 dark:text-zinc-450 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-850 active:scale-95 transition-all duration-200 shadow-sm focus:outline-none"
      aria-label="Toggle dark/light theme"
    >
      {isDark ? (
        <Sun className="h-4.5 w-4.5 text-amber-500 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="h-4.5 w-4.5 text-indigo-600 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
}
