import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OpportunityShortcuts } from './opportunity-shortcuts';

describe('OpportunityShortcuts', () => {
  it('links every homepage shortcut to an enabled category route', () => {
    const { container } = render(<OpportunityShortcuts />);

    expect(screen.getByRole('link', { name: /最新/ })).toHaveAttribute('href', '#feed');
    expect(screen.getByRole('link', { name: /赚钱机会/ })).toHaveAttribute(
      'href',
      '/categories/money-opportunities',
    );
    expect(screen.queryByRole('link', { name: /副业项目/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /收入案例/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /技术讨论/ })).toHaveAttribute(
      'href',
      '/categories/technical-discussions',
    );
    expect(screen.queryByText(/整理中|待开放/)).not.toBeInTheDocument();
    expect(screen.queryByText(/个讨论/)).not.toBeInTheDocument();
    const coin = screen
      .getByRole('link', { name: /赚钱机会/ })
      .querySelector<HTMLImageElement>('.shortcut-pixel-coin');
    expect(coin).toBeInTheDocument();
    expect(decodeURIComponent(coin!.src)).toContain('/icons/pixel/coin.png');
    const latest = screen
      .getByRole('link', { name: /最新/ })
      .querySelector<HTMLImageElement>('.shortcut-pixel-latest');
    expect(latest).toBeInTheDocument();
    expect(decodeURIComponent(latest!.src)).toContain('/icons/pixel/latest.png');
    const breakdown = screen
      .getByRole('link', { name: /项目拆解/ })
      .querySelector<HTMLImageElement>('.shortcut-pixel-project-analysis');
    expect(breakdown).toBeInTheDocument();
    expect(decodeURIComponent(breakdown!.src)).toContain('/icons/project-analysis.png');
    const tech = screen
      .getByRole('link', { name: /技术讨论/ })
      .querySelector<HTMLImageElement>('.shortcut-pixel-technical-discussion');
    expect(tech).toBeInTheDocument();
    expect(decodeURIComponent(tech!.src)).toContain('/icons/technical-discussion-v2.png');
    expect(container.querySelectorAll('.shortcut-pixel-coin')).toHaveLength(1);
    expect(container.querySelectorAll('.shortcut-pixel-latest')).toHaveLength(1);
    expect(container.querySelectorAll('.shortcut-pixel-project-analysis')).toHaveLength(1);
    expect(container.querySelectorAll('.shortcut-pixel-technical-discussion')).toHaveLength(1);
  });
});
