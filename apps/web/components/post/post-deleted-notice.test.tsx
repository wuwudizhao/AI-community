import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PostDeletedNotice } from './post-deleted-notice';

describe('PostDeletedNotice', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  afterEach(() => {
    vi.useRealTimers();
    window.history.replaceState(null, '', '/');
  });

  it('stays hidden without the deletion flash parameter', () => {
    render(<PostDeletedNotice />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows once and consumes only the deletion flash parameter', async () => {
    window.history.replaceState({ preserved: true }, '', '/?page=2&postDeleted=1#top');

    const { unmount } = render(<PostDeletedNotice />);

    expect(await screen.findByRole('status')).toHaveTextContent('帖子已删除');
    expect(`${window.location.pathname}${window.location.search}${window.location.hash}`).toBe(
      '/?page=2#top',
    );
    expect(window.history.state).toEqual({ preserved: true });

    unmount();
    render(<PostDeletedNotice />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('automatically hides after three seconds', async () => {
    vi.useFakeTimers();
    window.history.replaceState(null, '', '/?postDeleted=1');
    render(<PostDeletedNotice />);

    await act(async () => undefined);
    expect(screen.getByRole('status')).toHaveTextContent('帖子已删除');
    act(() => vi.advanceTimersByTime(2_999));
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
