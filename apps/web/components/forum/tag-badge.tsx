import { Badge } from '@/components/ui/badge';

export function TagBadge({ children }: { children: string }) {
  return <Badge>#{children}</Badge>;
}
