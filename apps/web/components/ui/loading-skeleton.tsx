import { cn } from '@/lib/utils';

export function LoadingSkeleton({ className }: { className?: string }) {
  return <span className={cn('ui-skeleton', className)} aria-hidden="true" />;
}
