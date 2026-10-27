import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationsApi, type UserNotification } from '../../api/notifications';
import { useAuth } from '../../context/AuthContext';
import { notificationTarget } from '../../utils/notifications';
import { NotificationRow } from './NotificationRow';

const POLL_MS = 60_000;
const PREVIEW = 10;

/**
 * Колокольчик в шапке сайта для любого вошедшего пользователя (как в соцсетях): значок с числом непрочитанных и
 * выпадающий список последних уведомлений. Нажатие на уведомление отмечает его прочитанным и ведёт к предмету —
 * мероприятию, новости или организации. Число обновляется раз в минуту, пока вкладка открыта (сервер без WebSocket).
 */
export function UserNotificationBell() {
  const navigate = useNavigate();
  const { isAdmin, isOrganizer } = useAuth();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  const refreshCount = useCallback(async () => {
    try { setCount(await notificationsApi.unreadCount()); }
    catch { /* колокольчик молчит, если уведомления недоступны: сайт от этого работать не перестаёт */ }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true); setFailed(false);
    try {
      const page = await notificationsApi.list(0, PREVIEW);
      setItems(page.items);
    } catch (e) {
      console.warn('[notifications] не удалось загрузить список', e);
      setFailed(true);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void refreshCount();
    const timer = setInterval(() => { if (!document.hidden) void refreshCount(); }, POLL_MS);
    return () => clearInterval(timer);
  }, [refreshCount]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const toggle = () => {
    if (!open) { void loadList(); void refreshCount(); }
    setOpen(o => !o);
  };

  const openNotification = async (n: UserNotification) => {
    setOpen(false);
    if (!n.isRead) {
      setItems(list => list.map(i => (i.id === n.id ? { ...i, isRead: true } : i)));
      setCount(c => Math.max(0, c - 1));
      try { await notificationsApi.markRead(n.id); } catch { void refreshCount(); }
    }
    const target = notificationTarget(n, { isAdmin, isOrganizer });
    if (target) navigate(target);
  };

  const readAll = async () => {
    setItems(list => list.map(i => ({ ...i, isRead: true })));
    setCount(0);
    try { await notificationsApi.markAllRead(); } catch { void refreshCount(); }
  };

  return (
    <div className="relative" ref={root}>
      <button type="button" onClick={toggle} aria-expanded={open} aria-haspopup="true"
        aria-label={`Уведомления${count ? `: ${count} непрочитанных` : ''}`}
        className="relative grid h-8 w-8 place-items-center rounded-lg border-[1.5px] border-vol-rule text-vol-fg hover:border-vol-accent hover:text-vol-accent">
        <i className="fas fa-bell text-[13px]" aria-hidden />
        {count > 0 && (
          <span className="absolute -right-1.5 -top-1.5 min-w-[1.1rem] rounded-full bg-red-600 px-1 text-center text-[10px] font-bold leading-[1.1rem] text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div role="menu" className="absolute right-[-3.5rem] top-full z-50 mt-2 w-[min(24rem,92vw)] overflow-hidden rounded-2xl border border-vol-line bg-white shadow-xl sm:right-0">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="text-[14px] font-semibold text-gray-900">Уведомления</p>
            {count > 0 && <button type="button" onClick={readAll} className="text-[12.5px] text-blue-600 hover:underline">Прочитать все</button>}
          </div>

          {loading && items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400">Загрузка…</p>
          ) : failed ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              Не удалось загрузить уведомления. <button type="button" onClick={loadList} className="text-blue-600 hover:underline">Повторить</button>
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <i className="far fa-bell-slash text-2xl text-gray-300" aria-hidden />
              <p className="mt-2 text-sm text-gray-500">Пока ничего нового</p>
            </div>
          ) : (
            <ul className="max-h-[26rem] divide-y divide-gray-100 overflow-y-auto">
              {items.map(n => <li key={n.id}><NotificationRow n={n} onOpen={openNotification} compact /></li>)}
            </ul>
          )}

          <Link to="/notifications" onClick={() => setOpen(false)}
            className="block border-t border-gray-100 px-4 py-2.5 text-center text-[13px] font-medium text-blue-600 no-underline hover:bg-gray-50">
            Показать все уведомления
          </Link>
        </div>
      )}
    </div>
  );
}
