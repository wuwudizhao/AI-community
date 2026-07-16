import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { THEME_STORAGE_KEY, ThemeSwitcher } from './theme-switcher';

const matchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: query.includes('dark'),
  media: query,
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(window, 'matchMedia', { writable: true, value: matchMedia });
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-theme-preference');
  });

  it('uses the system preference by default', async () => {
    render(<ThemeSwitcher />);

    await waitFor(() => {
      expect(document.documentElement.dataset.themePreference).toBe('system');
      expect(document.documentElement.dataset.theme).toBe('dark');
    });
  });

  it('persists an explicit dark theme selection', () => {
    render(<ThemeSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: '深色主题' }));

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByRole('button', { name: '深色主题' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('can switch to the light theme', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    render(<ThemeSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: '浅色主题' }));

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
