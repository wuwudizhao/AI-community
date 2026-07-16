import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LiftoffHero } from './liftoff-hero';

describe('LiftoffHero', () => {
  it('renders the Liftoff earning mission while preserving simple navigation actions', () => {
    render(<LiftoffHero />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: '发现 AI 赚钱机会把想法变成收入',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('AI 赚钱机会')).toHaveClass('hero-highlight--opportunity');
    expect(screen.getByText('收入')).toHaveClass('hero-highlight--income');
    expect(screen.getByRole('link', { name: /发现赚钱机会/ })).toHaveAttribute(
      'href',
      '/opportunities',
    );
    expect(screen.getByRole('link', { name: /发布项目想法/ })).toHaveAttribute(
      'href',
      '/posts/new',
    );
  });
});
