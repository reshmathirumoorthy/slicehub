import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import GlassCard from '../../components/ui/GlassCard';
import {
  deleteAdminNotification,
  fetchAdminNotifications,
  markAllAdminNotificationsRead,
  markAdminNotificationRead,
} from '../../services/notificationService';

function AdminNotifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminNotifications({
        isRead: filter === '' ? undefined : filter,
        limit: 40,
      });
      setItems(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load notifications');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const openItem = async (item) => {
    try {
      if (!item.isRead) await markAdminNotificationRead(item.id);
    } catch {
      // continue
    }
    if (item.link) navigate(item.link);
    else load();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Notifications</h1>
          <p className="mt-2 text-[var(--muted)]">
            Operational alerts · {unreadCount} unread
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              await markAllAdminNotificationsRead();
              toast.success('All marked as read');
              load();
            }}
          >
            Mark all read
          </Button>
          <Button size="sm" variant="secondary" onClick={load}>
            Refresh
          </Button>
        </div>
      </header>

      <GlassCard className="flex flex-wrap gap-3 p-4">
        <label className="text-sm text-[var(--muted)]">
          Filter{' '}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="ml-2 rounded-xl border border-[var(--glass-border)] bg-white/5 px-3 py-2"
          >
            <option value="">All</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
        </label>
      </GlassCard>

      {loading ? (
        <p className="text-[var(--muted)]">Loading notifications…</p>
      ) : items.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="Operational alerts will appear here."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <GlassCard
              key={item.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => openItem(item)}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{item.title}</p>
                  <Badge tone={item.isRead ? 'muted' : 'gold'}>
                    {item.isRead ? 'Read' : 'Unread'}
                  </Badge>
                  <Badge tone="muted">{item.type}</Badge>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">{item.message}</p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </button>
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  if (!window.confirm('Delete this notification?')) return;
                  await deleteAdminNotification(item.id);
                  toast.success('Deleted');
                  load();
                }}
              >
                Delete
              </Button>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminNotifications;
