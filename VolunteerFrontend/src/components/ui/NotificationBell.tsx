import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { organizerApi } from '../../api/organizer';
import type { AdminNotificationDto } from '../../types/admin';

const fmt = (iso: string) => new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Куда вести по нажатию на уведомление организатора. */
const ORGANIZER_LINKS: Record<string, string> = {
  NewOrganizationApplication: '/organizer/applications',
  NewParticipationApplication: '/organizer/participations',
};

/** Куда вести по нажатию на уведомление администратора. */
const ADMIN_LINKS: Record<string, string> = {
  AvatarPendingModeration: '/admin/moderation',
  FeedbackReceived: '/admin/feedback',
};

/**
 * Уведомления. source="admin": GET /api/admin/notifications/unread …; source="organizer": GET /api/organizer/notifications …
 * (у организатора — только его собственные: новые заявки волонтёров на вступление и на мероприятия).
 */
export function NotificationBell({ source = 'admin' }: { source?: 'admin' | 'organizer' }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNotificationDto[]>([]);
  const [count, setCount] = useState(0);
  const root = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      if (source === 'organizer') {
        const [list, unread] = await Promise.all([organizerApi.notifications(0, 10, false), organizerApi.unreadCount()]);
        setItems(list.items as AdminNotificationDto[]);
        setCount(unread);
      } else {
        const r = await adminApi.getUnreadNotifications();
        setItems(r.notifications ?? []);
        setCount(r.unreadCount ?? 0);
      }
    } catch { /* bell stays quiet if notifications are unavailable */ }
  }, [source]);

  useEffect(() => { load(); }, [load]);
  // Новые заявки приходят, пока организатор сидит в кабинете, — опрашиваем раз в минуту (без WebSocket на сервере).
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) void load(); }, 60_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', down); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
  }, [open]);

  const read = async (id: string) => {
    try { await (source === 'organizer' ? organizerApi.markRead(id) : adminApi.markNotificationAsRead(id)); } finally { load(); }
  };
  const readAll = async () => {
    try { await (source === 'organizer' ? organizerApi.markAllRead() : adminApi.markAllNotificationsAsRead()); } finally { load(); }
  };
  const open_ = (n: AdminNotificationDto) => {
    const link = (source === 'organizer' ? ORGANIZER_LINKS : ADMIN_LINKS)[n.type];
    if (!link) return;
    void read(n.id);
    setOpen(false);
    navigate(link);
  };

  return (
    <div className="relative" ref={root}>
      <button className="icon-btn relative" aria-label={`Уведомления${count ? `: ${count} непрочитанных` : ''}`} aria-expanded={open} onClick={() => { if (!open) load(); setOpen(o => !o); }}>
        <i className="fas fa-bell" />
        {count > 0 && <span className="absolute top-1 right-1 min-w-[1rem] h-4 px-1 rounded-full bg-brand-600 text-white text-[10px] leading-4 text-center font-semibold">{count > 99 ? '99+' : count}</span>}
      </button>
      {open && (
        <div className="glass absolute right-0 top-full mt-2 w-[min(22rem,92vw)] rounded-card border border-line-strong shadow-pop z-40 anim-pop">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <p className="card-title">Уведомления</p>
            {count > 0 && <button className="text-xs text-brand-700 hover:underline" onClick={readAll}>Прочитать все</button>}
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-ink-400">Новых уведомлений нет</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto scroll-soft divide-y divide-line">
              {items.map(n => (
                <li key={n.id} className="px-4 py-3 flex gap-3 hover:bg-surface-3/60">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-brand-500 shrink-0" aria-hidden />
                  <div className={`min-w-0 flex-1 ${(source === 'organizer' ? ORGANIZER_LINKS : ADMIN_LINKS)[n.type] ? 'cursor-pointer' : ''}`} onClick={() => open_(n)}>
                    <p className="text-[13px] font-medium text-ink-900">{n.title}</p>
                    {n.message && <p className="text-xs text-ink-500 mt-0.5 line-clamp-2">{n.message}</p>}
                    <p className="meta mt-1">{fmt(n.createdAt)}</p>
                  </div>
                  <button className="icon-btn !w-7 !h-7 shrink-0" aria-label="Отметить прочитанным" onClick={() => read(n.id)}><i className="fas fa-check" /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
