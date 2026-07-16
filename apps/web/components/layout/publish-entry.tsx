'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import { useFeatureFlags } from '@/components/feature-flags-provider';
import { cn } from '@/lib/utils';

export function PublishEntry({
  children,
  className,
  href = '/posts/new',
}: {
  children: ReactNode;
  className?: string;
  href?: string;
}) {
  const { user } = useAuth();
  const { allowGuestPosting } = useFeatureFlags();
  return (
    <Link className={cn(className)} href={user || allowGuestPosting ? href : '/login'}>
      {children}
    </Link>
  );
}
