import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notificationService';
import { getUserToken } from '../../services/api';

function formatRelative(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

function NotificationBell() {
  const signedIn = Boolean(getUserToken());
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const panelRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!signedIn) return;
    try {
      const [count, data] = await Promise.all([
        fetchUnreadCount(),
        fetchNotifications({ limit: 8 }),
      ]);
      setUnread(count);
      setItems(data.notifications || []);
      setError('');
    } catch {
      setError('Unable to load notifications.');
    }
  }, [signedIn]);

  useEffect(() => {
    refresh();
    if (!signedIn) return undefined;
    const id = setInterval(refresh, 60000);
    return () => clearInterval(id);
  }, [refresh, signedIn]);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  if (!signedIn) return null;

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      await refresh();
      setLoading(false);
    }
  };

  const openItem = async (item) => {
    try {
      if (!item.isRead) {
        await markNotificationRead(item.id);
        setUnread((u) => Math.max(0, u - 1));
        setItems((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
        );
      }
    } catch {
      // navigation still proceeds
    }
    setOpen(false);
    if (item.link) navigate(item.link);
    else if (item.orderId) navigate(`/orders/${item.orderId}`);
  };

  const markAll = async () => {
    try {
      await markAllNotificationsRead();
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={toggle}
        className="relative rounded-lg p-2 text-[var(--muted)] transition hover:bg-white/5 hover:text-white"
      >
        <FiBell size={18} />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-[var(--accent)] px-1 text-center text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-white/10 bg-[rgb(14_14_18_/0.98)] shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="font-display text-sm font-bold">Notifications</p>
            <div className="flex gap-2 text-xs">
              {unread > 0 ? (
                <button
                  type="button"
                  className="text-[var(--accent-soft)] hover:underline"
                  onClick={markAll}
                >
                  Mark all read
                </button>
              ) : null}
              <Link
                to="/notifications"
                className="text-[var(--muted)] hover:text-white"
                onClick={() => setOpen(false)}
              >
                View all
              </Link>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-6 text-sm text-[var(--muted)]">
                Loading notifications…
              </p>
            ) : error ? (
              <p className="px-4 py-6 text-sm text-[var(--muted)]">{error}</p>
            ) : items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="font-medium">You&apos;re all caught up!</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  No new notifications.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openItem(item)}
                  className={`block w-full border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/5 ${
                    item.isRead ? 'opacity-70' : ''
                  }`}
                >
                  <div className="flex gap-2">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        item.isRead ? 'bg-white/20' : 'bg-[var(--accent)]'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {item.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-[var(--muted)]">
                        {item.message}
                      </p>
                      <p className="mt-1 text-[10px] text-[var(--muted)]">
                        {formatRelative(item.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default NotificationBell;
