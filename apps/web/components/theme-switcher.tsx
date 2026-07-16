'use client';

import { Laptop, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'liftoff-theme';

const options = [
  { value: 'light', label: '浅色主题', icon: Sun },
  { value: 'dark', label: '深色主题', icon: Moon },
  { value: 'system', label: '跟随系统', icon: Laptop },
] as const;

function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference !== 'system') return preference;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(preference: ThemePreference) {
  const root = document.documentElement;
  root.dataset.themePreference = preference;
  root.dataset.theme = resolveTheme(preference);
  root.style.colorScheme = root.dataset.theme;
}

export function ThemeSwitcher() {
  const [preference, setPreference] = useState<ThemePreference>('system');

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    const initial = options.some((option) => option.value === stored)
      ? (stored as ThemePreference)
      : 'system';
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (window.localStorage.getItem(THEME_STORAGE_KEY) === 'system') applyTheme('system');
    };

    applyTheme(initial);
    queueMicrotask(() => setPreference(initial));
    media.addEventListener('change', handleSystemChange);
    return () => media.removeEventListener('change', handleSystemChange);
  }, []);

  const selectTheme = (next: ThemePreference) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    setPreference(next);
    applyTheme(next);
  };

  return (
    <div className="theme-switcher" role="group" aria-label="主题选择">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          aria-pressed={preference === value}
          className={cn('theme-switcher__button', preference === value && 'is-active')}
          onClick={() => selectTheme(value)}
          title={label}
        >
          <Icon aria-hidden="true" size={16} strokeWidth={1.8} />
        </button>
      ))}
    </div>
  );
}
