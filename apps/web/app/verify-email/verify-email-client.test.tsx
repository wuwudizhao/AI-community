import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VerifyEmailClient } from './verify-email-client';

let token = 'valid-token-value-that-is-long';
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams({ token }) }));

describe('VerifyEmailClient', () => {
  beforeEach(() => {
    token = 'valid-token-value-that-is-long';
  });

  it('shows a successful verification state', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ message: '邮箱验证成功' }),
    } as Response);
    render(<VerifyEmailClient />);
    await waitFor(() => expect(screen.getByText('邮箱验证成功')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: '返回登录' })).toHaveAttribute('href', '/login');
  });

  it('shows an invalid or expired token error', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: '验证链接已过期' }),
    } as Response);
    render(<VerifyEmailClient />);
    await waitFor(() => expect(screen.getByText('验证链接已过期')).toBeInTheDocument());
  });
});
