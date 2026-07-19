'use client';

import { Shield, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';

import { AdminPageState } from '@/components/admin/admin-page-state';
import { apiRequest } from '@/lib/api';

interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  status: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    void apiRequest<AdminUser[]>('/admin/users')
      .then(setUsers)
      .catch((reason: Error) => setError(reason.message));
  }, []);

  async function changeRole(user: AdminUser) {
    const role = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!window.confirm(`确认将 ${user.displayName || user.username} 的角色修改为 ${role} 吗？`))
      return;
    setBusyId(user.id);
    try {
      await apiRequest(`/admin/users/${user.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      setUsers(
        (current) => current?.map((item) => (item.id === user.id ? { ...item, role } : item)) ?? [],
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '角色修改失败');
    } finally {
      setBusyId('');
    }
  }

  if (!users && !error) return <AdminPageState>正在加载用户…</AdminPageState>;

  return (
    <section>
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">Members</span>
          <h1>用户管理</h1>
          <p>查看社区成员并管理管理员权限。</p>
        </div>
        <span className="admin-count">{users?.length ?? 0} 位用户</span>
      </div>
      {error && <AdminPageState error>{error}</AdminPageState>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>用户</th>
              <th>邮箱</th>
              <th>注册时间</th>
              <th>角色</th>
              <th>状态</th>
              <th>
                <span className="sr-only">操作</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {users?.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="admin-user-cell">
                    <span>{user.displayName.slice(0, 1).toUpperCase()}</span>
                    <div>
                      <strong>{user.displayName}</strong>
                      <small>@{user.username}</small>
                    </div>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  {new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(
                    new Date(user.createdAt),
                  )}
                </td>
                <td>
                  <span className={user.role === 'ADMIN' ? 'admin-role is-admin' : 'admin-role'}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className="admin-status">{statusLabel(user.status)}</span>
                </td>
                <td>
                  <button
                    className="admin-role-button"
                    disabled={busyId === user.id}
                    onClick={() => void changeRole(user)}
                  >
                    {user.role === 'ADMIN' ? <UserRound size={14} /> : <Shield size={14} />}
                    {user.role === 'ADMIN' ? '降为用户' : '设为管理员'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function statusLabel(status: string) {
  return (
    (
      {
        ACTIVE: '正常',
        PENDING_VERIFICATION: '待验证',
        SUSPENDED: '已暂停',
        BANNED: '已封禁',
      } as Record<string, string>
    )[status] ?? status
  );
}
