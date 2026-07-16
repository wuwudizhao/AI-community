import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Inbox aria-hidden="true" size={24} />
      <strong>{title}</strong>
      <p>{description}</p>
      {action}
    </div>
  );
}
