import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi, type UserNotification } from '../../api/notifications';
import { NotificationRow } from '../../components/notifications/NotificationRow';
import { Spinner } from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';
import { notificationTarget } from '../../utils/notifications';

const PAGE = 20;
type Filter = 'all' | 'unread';

/** Все уведомления пользователя: полный список с подгрузкой, фильтр «Непрочитанные», «Прочитать все». */
export function NotificationsPage() {
  const navigate = useNavigate();
  const { isAdmin, isOrganizer } = useAuth();
  const [filter, setFilter] = useState<Filter>('all');
  const [items, setItems] = useState<UserNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async (skip: number, replace: boolean) => {
    setLoading(true); setFailed(false);
    try {
      const page = await notificationsApi.list(skip, PAGE, filter === 'unread' ? false : undefined);
      setItems(prev => (replace ? page.items : [...prev, ...page.items]));
      setTotal(page.totalCount);
    } catch (e) {
      console.warn('[notifications] не удалось загрузить страницу', e);
      setFailed(true);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { void load(0, true); }, [load]);

  const open = async (n: UserNotification) => {
    if (!n.isRead) {
      setItems(list => list.map(i => (i.id === n.id ? { ...i, isRead: true } : i)));
      try { await notificationsApi.markRead(n.id); } catch { /* отметка не критична: при следующей загрузке всё выровняется */ }
    }
    const target = notificationTarget(n, { isAdmin, isOrganizer });
    if (target) navigate(target);
  };

  const readAll = async () => {
    try { await notificationsApi.markAllRead(); await load(0, true); }
    catch (e) { console.warn('[notifications] не удалось отметить все прочитанными', e); }
  };

  const tab = (value: Filter, label: string) => (
    <button type="button" onClick={() => setFilter(value)} aria-pressed={filter === value}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${filter === value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
      {label}
    </button>
  );

  return (
    <div>
      <div className="wrap max-w-2xl py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="vol-compact">Уведомления</h1>
          <button type="button" onClick={readAll} className="text-sm text-blue-600 hover:underline">Прочитать все</button>
        </div>
        <div className="mb-4 flex gap-2">{tab('all', 'Все')}{tab('unread', 'Непрочитанные')}</div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {failed ? (
            <div className="p-10 text-center text-sm text-gray-500">
              Не удалось загрузить уведомления. <button type="button" onClick={() => load(0, true)} className="text-blue-600 hover:underline">Повторить</button>
            </div>
          ) : loading && items.length === 0 ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <i className="far fa-bell-slash text-3xl text-gray-300" aria-hidden />
              <p className="mt-3 text-gray-500">{filter === 'unread' ? 'Непрочитанных уведомлений нет' : 'Пока ничего нового'}</p>
              <p className="mt-1 text-sm text-gray-400">Здесь появятся решения по заявкам и новости ваших организаций.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map(n => <li key={n.id}><NotificationRow n={n} onOpen={open} /></li>)}
            </ul>
          )}
        </div>

        {items.length < total && !failed && (
          <div className="mt-4 text-center">
            <button type="button" disabled={loading} onClick={() => load(items.length, false)}
              className="rounded-xl border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
              {loading ? 'Загрузка…' : 'Показать ещё'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
