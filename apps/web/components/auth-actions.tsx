'use client';

import { Bell, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Avatar } from '@/components/ui/avatar';
import { apiRequest } from '@/lib/api';

export function AuthActions() {
  const { user, loading, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    void apiRequest<{ count: number }>('/notifications/unread-count')
      .then((value) => setUnread(value.count))
      .catch(() => setUnread(0));
  }, [user]);

  if (loading) return <div className="auth-skeleton" aria-label="正在检查登录状态" />;

  return (
    <>
      <Link
        className="header-icon-button notification-link"
        href={user ? '/notifications' : '/login'}
        aria-label={user && unread > 0 ? `通知，${unread} 条未读` : '通知'}
      >
        <Bell size={18} aria-hidden="true" />
        {user && unread > 0 && (
          <span className="notification-badge">{unread > 99 ? '99+' : unread}</span>
        )}
      </Link>
      {!user ? (
        <div className="header-auth-links">
          <Link href="/login">登录</Link>
          <Link className="header-register" href="/register">
            注册
          </Link>
        </div>
      ) : (
        <details className="header-profile">
          <summary aria-label="打开用户菜单">
            <Avatar name={user.displayName || user.username} />
          </summary>
          <div className="header-profile__menu">
            <strong>{user.displayName || user.username}</strong>
            <span>@{user.username}</span>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void logout().finally(() => setBusy(false));
              }}
            >
              <LogOut size={15} aria-hidden="true" /> {busy ? '退出中…' : '退出登录'}
            </button>
          </div>
        </details>
      )}
    </>
  );
}
