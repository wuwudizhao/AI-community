import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LoginPage from './page';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/components/auth-provider', () => ({ useAuth: () => ({ refresh }) }));

describe('LoginPage', () => {
  beforeEach(() =>
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: '请先完成邮箱验证' }),
    } as Response),
  );

  it('shows API errors and an unverified-email action', async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'pending@example.com' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'StrongPass123' } });
    fireEvent.click(screen.getByRole('button', { name: '登录' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('请先完成邮箱验证'));
    expect(screen.getByRole('link', { name: '重新发送验证邮件' })).toBeInTheDocument();
  });
});
