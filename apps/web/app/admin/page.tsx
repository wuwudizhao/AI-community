'use client';

import { FileText, UserPlus, Users, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

import { AdminPageState } from '@/components/admin/admin-page-state';
import { apiRequest } from '@/lib/api';

interface DashboardData {
  users: number;
  posts: number;
  usersToday: number;
  postsToday: number;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void apiRequest<DashboardData>('/admin/dashboard')
      .then(setData)
      .catch((reason: Error) => setError(reason.message));
  }, []);

  if (error) return <AdminPageState error>{error}</AdminPageState>;
  if (!data) return <AdminPageState>正在加载概览…</AdminPageState>;

  const cards = [
    { label: '用户总数', value: data.users, icon: Users },
    { label: '帖子总数', value: data.posts, icon: FileText },
    { label: '今日新增用户', value: data.usersToday, icon: UserPlus },
    { label: '今日新增帖子', value: data.postsToday, icon: Zap },
  ];

  return (
    <section>
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">Dashboard</span>
          <h1>社区概览</h1>
          <p>快速了解 Liftoff 今天的社区动态。</p>
        </div>
      </div>
      <div className="admin-stat-grid">
        {cards.map(({ label, value, icon: Icon }) => (
          <article key={label} className="admin-stat-card">
            <span>
              <Icon size={18} aria-hidden="true" />
            </span>
            <p>{label}</p>
            <strong>{value.toLocaleString('zh-CN')}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
