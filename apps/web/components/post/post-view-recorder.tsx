'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth-provider';
import { apiRequest } from '@/lib/api';

export function PostViewRecorder({ slug }: { slug: string }) {
  const { user, loading } = useSafeAuth();
  const recorded = useRef('');
  useEffect(() => {
    if (loading || !user || recorded.current === slug) return;
    recorded.current = slug;
    void apiRequest(`/posts/${encodeURIComponent(slug)}/view-history`, { method: 'POST' }).catch(
      () => {
        recorded.current = '';
      },
    );
  }, [loading, slug, user]);
  return null;
}

function useSafeAuth() {
  try {
    return useAuth();
  } catch {
    return { user: null, loading: false };
  }
}
