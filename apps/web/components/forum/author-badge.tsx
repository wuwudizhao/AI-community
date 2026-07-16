import { Avatar } from '@/components/ui/avatar';

export function AuthorBadge({ name, handle }: { name: string; handle?: string }) {
  return (
    <span className="author-badge">
      <Avatar name={name} />
      <span>
        <strong>{name}</strong>
        {handle && <small>@{handle}</small>}
      </span>
    </span>
  );
}
