import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import GlassCard from '../components/ui/GlassCard';
import {
  deleteNotification,
  fetchNotificationPreferences,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
} from '../services/notificationService';
import { getUserToken } from '../services/api';

function NotificationsPage() {
  const signedIn = Boolean(getUserToken());
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState(null);

  const load = useCallback(async () => {
    if (!signedIn) return;
    setLoading(true);
    try {
      const params =
        filter === 'unread'
          ? { isRead: false }
          : filter === 'read'
            ? { isRead: true }
            : {};
      const data = await fetchNotifications({ ...params, limit: 40 });
      setItems(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to load notifications');
    } finally {
      setLoading(false);
    }
  }, [filter, signedIn]);

  useEffect(() => {
    if (!signedIn) {
      navigate('/login', { replace: true, state: { from: '/notifications' } });
      return;
    }
    load();
    fetchNotificationPreferences()
      .then(setPrefs)
      .catch(() => {});
  }, [signedIn, load, navigate]);

  const openItem = async (item) => {
    try {
      if (!item.isRead) await markNotificationRead(item.id);
    } catch {
      // continue
    }
    if (item.link) navigate(item.link);
    else if (item.orderId) navigate(`/orders/${item.orderId}`);
    else load();
  };

  const removeItem = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      await deleteNotification(id);
      toast.success('Notification deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const savePrefs = async (next) => {
    try {
      const updated = await updateNotificationPreferences(next);
      setPrefs(updated);
      toast.success('Preferences saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save preferences');
    }
  };

  if (!signedIn) return null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Notifications</h1>
          <p className="mt-2 text-[var(--muted)]">
            {unreadCount} unread · order updates and account alerts
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              await markAllNotificationsRead();
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

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'All' },
          { id: 'unread', label: 'Unread' },
          { id: 'read', label: 'Read' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
              filter === tab.id
                ? 'border-[var(--accent)]/50 bg-[var(--accent)]/15'
                : 'border-white/10 bg-white/5 text-[var(--muted)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {prefs ? (
        <GlassCard className="space-y-3 p-5">
          <h2 className="font-display text-lg font-bold">Email preferences</h2>
          <p className="text-xs text-[var(--muted)]">
            Security emails (password reset / verification) are always sent.
          </p>
          {[
            { key: 'orderEmails', label: 'Order & payment emails' },
            { key: 'reviewEmails', label: 'Review confirmation emails' },
            { key: 'promoEmails', label: 'Promotional emails' },
          ].map((row) => (
            <label
              key={row.key}
              className="flex items-center gap-2 text-sm text-[var(--muted)]"
            >
              <input
                type="checkbox"
                className="accent-[var(--accent)]"
                checked={Boolean(prefs[row.key])}
                onChange={(e) =>
                  savePrefs({ ...prefs, [row.key]: e.target.checked })
                }
              />
              {row.label}
            </label>
          ))}
        </GlassCard>
      ) : null}

      {loading ? (
        <GlassCard className="p-8 text-[var(--muted)]">
          Loading notifications…
        </GlassCard>
      ) : items.length === 0 ? (
        <EmptyState
          title="You're all caught up!"
          description="No notifications in this filter."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <GlassCard
              key={item.id}
              className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between ${
                item.isRead ? '' : 'border-[var(--accent)]/25'
              }`}
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => openItem(item)}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{item.title}</p>
                  <Badge tone={item.isRead ? 'muted' : 'ember'}>
                    {item.isRead ? 'Read' : 'Unread'}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">{item.message}</p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {new Date(item.createdAt).toLocaleString()}
                  {item.orderId ? (
                    <>
                      {' · '}
                      <Link
                        to={`/orders/${item.orderId}`}
                        className="text-[var(--accent-soft)] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View order
                      </Link>
                    </>
                  ) : null}
                </p>
              </button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => removeItem(item.id)}
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

export default NotificationsPage;
