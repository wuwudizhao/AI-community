import type { Metadata } from 'next';
import { ForumHeader } from '@/components/layout/forum-header';
import { ForumShell } from '@/components/layout/forum-shell';
import { NotificationClient } from '@/components/notification/notification-client';
export const metadata: Metadata = {
  title: '站内通知 | Liftoff',
  robots: { index: false, follow: false },
};
export default function NotificationsPage() {
  return (
    <div className="liftoff-community">
      <ForumHeader />
      <ForumShell>
        <section className="community-route-page">
          <NotificationClient />
        </section>
      </ForumShell>
    </div>
  );
}
