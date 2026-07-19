'use client';

import { useState } from 'react';
import { Check, MessageCircle, MoreHorizontal, Share2 } from 'lucide-react';
import { Dropdown } from '@/components/ui/dropdown';
import { PostDeleteControl } from './post-delete-control';

export function PostHeaderActions({
  title,
  commentCount,
  slug,
  canDelete,
}: {
  title: string;
  commentCount: number;
  slug: string;
  canDelete: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <div className="post-header-actions" aria-label="帖子操作">
      <button type="button" onClick={() => void share()}>
        {copied ? <Check size={16} aria-hidden="true" /> : <Share2 size={16} aria-hidden="true" />}
        {copied ? '已复制' : '分享'}
      </button>
      <a href="#comments">
        <MessageCircle size={16} aria-hidden="true" /> 评论 {commentCount}
      </a>
      {canDelete && (
        <Dropdown
          label={
            <span className="post-header-actions__more" aria-label="更多帖子操作">
              <MoreHorizontal size={18} aria-hidden="true" />
            </span>
          }
        >
          <PostDeleteControl slug={slug} />
        </Dropdown>
      )}
    </div>
  );
}
