import { Clock3 } from 'lucide-react';

export function TimeLabel({ value }: { value: string | null }) {
  const label = value
    ? new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(new Date(value))
    : '待发布';
  return (
    <time className="time-label" dateTime={value ?? undefined}>
      <Clock3 size={13} aria-hidden="true" />
      {label}
    </time>
  );
}
