import { cn } from '@/lib/utils';

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('ui-avatar', className)} aria-hidden="true">
      {name.trim().slice(0, 1).toUpperCase() || 'L'}
    </span>
  );
}
