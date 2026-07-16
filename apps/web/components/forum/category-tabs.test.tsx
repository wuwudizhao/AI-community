import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CategoryTabs } from './category-tabs';

describe('CategoryTabs', () => {
  it('renders every top channel as an enabled category link', () => {
    render(<CategoryTabs active="latest" />);

    expect(screen.getByRole('link', { name: '最新' })).toHaveAttribute('href', '/#feed');
    expect(screen.getByRole('link', { name: '赚钱机会' })).toHaveAttribute(
      'href',
      '/categories/money-opportunities',
    );
    expect(screen.queryByRole('link', { name: '副业项目' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '收入案例' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '技术讨论' })).toHaveAttribute(
      'href',
      '/categories/technical-discussions',
    );
    expect(screen.getAllByRole('link')).toHaveLength(4);
    expect(screen.queryByText(/待开放|整理中/)).not.toBeInTheDocument();
  });
});
