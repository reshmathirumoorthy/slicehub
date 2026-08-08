import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import GlassCard from '../../components/ui/GlassCard';
import Input from '../../components/ui/Input';
import {
  fetchAdminUsers,
  setAdminUserStatus,
} from '../../services/adminDashboardService';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminUsers({
        search: search || undefined,
        isActive: status === '' ? undefined : status,
        limit: 30,
      });
      setUsers(data.users || []);
      setPagination(data.pagination || null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load users');
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (user) => {
    const next = !user.isActive;
    const label = next ? 'activate' : 'deactivate';
    if (!window.confirm(`Really ${label} ${user.email}?`)) return;
    try {
      const updated = await setAdminUserStatus(user.id, next);
      toast.success(next ? 'User activated' : 'User deactivated');
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u)),
      );
      if (selected?.id === updated.id) setSelected(updated);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold">Users</h1>
        <p className="mt-2 text-[var(--muted)]">
          Customer accounts only. Passwords and tokens are never returned.
        </p>
      </header>

      <GlassCard className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <Input
          label="Search"
          placeholder="Name, email, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <label className="block space-y-2 sm:w-40">
          <span className="text-sm font-medium text-[var(--muted)]">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border border-[var(--glass-border)] bg-white/5 px-4 py-3 outline-none"
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </label>
        <Button type="button" onClick={load} disabled={loading}>
          {loading ? 'Loading…' : 'Apply'}
        </Button>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3 overflow-x-auto">
          {!loading && users.length === 0 ? (
            <EmptyState
              title="No users"
              description="Registered customers will appear here."
            />
          ) : (
            <GlassCard className="overflow-x-auto p-0">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-white/10 text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Orders</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-white/5">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {user.email}
                        </p>
                      </td>
                      <td className="px-4 py-3">{user.orderCount}</td>
                      <td className="px-4 py-3">
                        <Badge tone={user.isActive ? 'success' : 'danger'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setSelected(user)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant={user.isActive ? 'danger' : 'primary'}
                            onClick={() => toggleActive(user)}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          )}
          {pagination ? (
            <p className="text-center text-xs text-[var(--muted)]">
              {pagination.total} user{pagination.total === 1 ? '' : 's'}
            </p>
          ) : null}
        </div>

        <GlassCard className="h-fit space-y-3 p-5 lg:sticky lg:top-24">
          {!selected ? (
            <p className="text-sm text-[var(--muted)]">
              Select a user to view safe profile details.
            </p>
          ) : (
            <>
              <h2 className="font-display text-xl font-bold">{selected.name}</h2>
              <p className="text-sm text-[var(--muted)]">{selected.email}</p>
              <p className="text-sm text-[var(--muted)]">
                Phone: {selected.phone || '—'}
              </p>
              <p className="text-sm text-[var(--muted)]">
                Orders: {selected.orderCount}
              </p>
              <p className="text-sm text-[var(--muted)]">
                Email verified:{' '}
                {selected.isEmailVerified ? 'Yes' : 'No'}
              </p>
              <p className="text-sm text-[var(--muted)]">
                Joined:{' '}
                {new Date(selected.createdAt).toLocaleDateString('en-IN')}
              </p>
              <Badge tone={selected.isActive ? 'success' : 'danger'}>
                {selected.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

export default AdminUsers;
