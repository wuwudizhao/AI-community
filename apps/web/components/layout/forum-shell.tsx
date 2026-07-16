import type { ReactNode } from 'react';
import { ForumSidebar } from './forum-sidebar';

export function ForumShell({ children }: { children: ReactNode }) {
  return (
    <div className="community-shell">
      <ForumSidebar />
      <main className="community-content">{children}</main>
    </div>
  );
}
