import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Pagination } from './pagination';

describe('Pagination', () => {
  const hrefForPage = (page: number) => `/search?q=agent&page=${page}`;

  it('disables previous on the first page and next on the last page', () => {
    const { rerender } = render(<Pagination page={1} totalPages={3} hrefForPage={hrefForPage} />);
    expect(screen.getByText('上一页').closest('[aria-disabled=true]')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '下一页' })).toHaveAttribute(
      'href',
      '/search?q=agent&page=2',
    );

    rerender(<Pagination page={3} totalPages={3} hrefForPage={hrefForPage} />);
    expect(screen.getByText('下一页').closest('[aria-disabled=true]')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '3' })).toHaveAttribute('aria-current', 'page');
  });

  it('collapses long page ranges with accessible real links', () => {
    render(<Pagination page={6} totalPages={12} hrefForPage={hrefForPage} />);
    expect(screen.getByRole('link', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '12' })).toBeInTheDocument();
    expect(screen.getAllByText('…')).toHaveLength(2);
  });
});
