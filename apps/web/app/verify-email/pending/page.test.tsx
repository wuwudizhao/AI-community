import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import PendingPage from './page';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams({ email: 'bu***@example.com' }),
}));

describe('PendingPage', () => {
  it('shows the masked email and resend action', () => {
    render(<PendingPage />);
    expect(screen.getByText(/bu\*\*\*@example.com/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重新发送验证邮件' })).toBeInTheDocument();
  });
});
