import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import RegisterPage from './page';

const push = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

describe('RegisterPage', () => {
  beforeEach(() => push.mockClear());

  it('validates password confirmation before calling the API', () => {
    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('用户名'), { target: { value: 'builder' } });
    fireEvent.change(screen.getByLabelText('显示名称'), { target: { value: 'Builder' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'StrongPass123' } });
    fireEvent.change(screen.getByLabelText('确认密码'), { target: { value: 'Different123' } });
    fireEvent.submit(screen.getByRole('button', { name: '注册' }).closest('form')!);
    expect(screen.getByRole('alert')).toHaveTextContent('两次输入的密码不一致');
  });

  it('redirects directly to login after successful registration', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: '注册成功，现在可以登录' }), { status: 201 }),
    );
    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('用户名'), { target: { value: 'builder' } });
    fireEvent.change(screen.getByLabelText('显示名称'), { target: { value: 'Builder' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'StrongPass123' } });
    fireEvent.change(screen.getByLabelText('确认密码'), { target: { value: 'StrongPass123' } });
    fireEvent.submit(screen.getByRole('button', { name: '注册' }).closest('form')!);

    await waitFor(() => expect(push).toHaveBeenCalledWith('/login'));
  });
});
