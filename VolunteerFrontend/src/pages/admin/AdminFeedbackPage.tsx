import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { feedbackApi, type FeedbackItem } from '../../api/feedback';
import { REPLY_FROM_EMAIL } from '../../config';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { PageHeader } from '../../components/ui/PageHeader';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState, ErrorState } from '../../components/ui/PageStates';
import { Segmented } from '../../components/ui/Segmented';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { useLatestRequest, usePaging } from '../../hooks/useListHelpers';
import { adminErrorMessage } from '../../utils/adminErrors';

const TAKE = 15;
type Filter = 'unread' | 'all';

const fmt = (iso: string) => new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const REPLY_SUBJECT = 'Ответ на ваше обращение — ВолонтёрыПМР';
// Текст письма: приветствие, место для ответа и цитата обращения (обрезана, чтобы ссылка не вышла за предел длины URL)
const replyBody = (item: FeedbackItem) => {
  const quote = item.message.length > 1500 ? `${item.message.slice(0, 1500)}…` : item.message;
  const quoted = quote.split('\n').map(l => `> ${l}`).join('\n');
  return `Здравствуйте, ${item.name}!\n\n\n\n— — —\nВаше обращение от ${fmt(item.createdAt)}:\n${quoted}`;
};
// Окно нового письма Gmail в аккаунте REPLY_FROM_EMAIL (работает в браузере, почтовый клиент не нужен)
const gmailReplyUrl = (item: FeedbackItem) => {
  const q = new URLSearchParams({ authuser: REPLY_FROM_EMAIL, view: 'cm', fs: '1', to: item.email, su: REPLY_SUBJECT, body: replyBody(item) });
  return `https://mail.google.com/mail/?${q}`;
};

/**
 * Обращения с формы «Написать нам». Новое обращение приходит в колокольчик и (если задан App:AdminEmail) на почту;
 * здесь их читают, отвечают (окно письма Gmail с ящика REPLY_FROM_EMAIL; адрес автора можно скопировать), отмечают прочитанными и удаляют.
 * Ссылка из письма открывает страницу с нужным обращением (?open=…).
 */
export function AdminFeedbackPage() {
  const { notify } = useNotification();
  const confirm = useConfirm();
  const [params, setParams] = useSearchParams();
  const openId = params.get('open');
  const beginRequest = useLatestRequest();

  const [filter, setFilter] = useState<Filter>(openId ? 'all' : 'unread');
  const [skip, setSkip] = usePaging(filter);
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(openId);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const isCurrent = beginRequest();
    setLoading(true); setFailed(false);
    try {
      const page = await feedbackApi.list(skip, TAKE, filter === 'unread' ? false : undefined);
      if (!isCurrent()) return;
      let rows = page.items;
      // Обращение из письма может оказаться не на этой странице списка — подгружаем его отдельно и показываем первым.
      if (openId && skip === 0 && !rows.some(r => r.id === openId)) {
        try { rows = [await feedbackApi.get(openId), ...rows]; } catch { /* удалено — просто нет в списке */ }
      }
      setItems(rows); setTotal(page.totalCount);
    } catch (e) {
      console.error('Error loading feedback:', e);
      if (isCurrent()) { setFailed(true); setItems([]); setTotal(0); }
    } finally { if (isCurrent()) setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, filter, openId]);
  useEffect(() => { void load(); }, [load]);

  const copyEmail = async (email: string) => {
    try { await navigator.clipboard.writeText(email); notify(`Адрес ${email} скопирован`); }
    catch { notify(`Не удалось скопировать. Адрес: ${email}`, 'error'); }
  };
  const patch = (id: string, change: Partial<FeedbackItem>) => setItems(list => list.map(i => (i.id === id ? { ...i, ...change } : i)));

  const markRead = async (item: FeedbackItem) => {
    if (item.isRead) return;
    setBusy(item.id);
    try { await feedbackApi.markRead(item.id); patch(item.id, { isRead: true, readAt: new Date().toISOString() }); }
    catch (e) { notify(adminErrorMessage(e, 'Не удалось отметить обращение.'), 'error'); }
    finally { setBusy(null); }
  };

  const toggle = (item: FeedbackItem) => {
    const next = expanded === item.id ? null : item.id;
    setExpanded(next);
    if (next) void markRead(item);   // открыли — значит прочитали
    if (openId) setParams({}, { replace: true });
  };

  const readAll = async () => {
    try { await feedbackApi.markAllRead(); notify('Все обращения отмечены прочитанными'); await load(); }
    catch (e) { notify(adminErrorMessage(e, 'Не удалось отметить обращения.'), 'error'); }
  };

  const remove = async (item: FeedbackItem) => {
    if (!(await confirm({ title: 'Удалить обращение?', message: `Обращение от ${item.name} будет удалено без возможности восстановления.`, confirmLabel: 'Удалить' }))) return;
    setBusy(item.id);
    try {
      await feedbackApi.remove(item.id);
      notify('Обращение удалено');
      if (items.length === 1 && skip > 0) setSkip(Math.max(0, skip - TAKE)); else await load();
    } catch (e) { notify(adminErrorMessage(e, 'Не удалось удалить обращение.'), 'error'); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Обращения" description="Сообщения, отправленные посетителями через форму «Написать нам»."
        actions={<Button variant="secondary" onClick={readAll}><i className="fas fa-check-double" aria-hidden /> Прочитать все</Button>} />

      <Segmented<Filter> label="Показывать" value={filter} onChange={setFilter}
        options={[{ value: 'unread', label: 'Непрочитанные' }, { value: 'all', label: 'Все' }]} />

      {failed ? <Card><ErrorState message="Не удалось загрузить обращения." onRetry={load} /></Card>
        : loading && items.length === 0 ? <Card><ListSkeleton /></Card>
        : items.length === 0 ? <Card><EmptyState icon="fa-envelope-open" title={filter === 'unread' ? 'Непрочитанных обращений нет' : 'Обращений пока нет'} hint="Новые сообщения появятся здесь и в уведомлениях." /></Card>
        : (
          <Card>
            <ul className="divide-y divide-line">
              {items.map(item => {
                const open = expanded === item.id;
                return (
                  <li key={item.id} id={`feedback-${item.id}`} className={`px-5 py-4 ${open ? 'bg-surface-3/40' : ''}`}>
                    <button type="button" onClick={() => toggle(item)} className="w-full text-left flex items-start gap-3" aria-expanded={open}>
                      <span className={`mt-2 w-2 h-2 rounded-full shrink-0 ${item.isRead ? 'bg-transparent border border-line' : 'bg-brand-500'}`} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className={`text-ink-900 ${item.isRead ? 'font-medium' : 'font-semibold'}`}>{item.name}</span>
                          <span className="meta">{item.email}</span>
                          {!item.isRead && <StatusBadge tone="brand">Новое</StatusBadge>}
                        </span>
                        <span className={`block text-sm text-ink-500 mt-0.5 ${open ? 'whitespace-pre-line' : 'truncate'}`}>{item.message}</span>
                        <span className="block meta mt-1">{fmt(item.createdAt)}</span>
                      </span>
                      <i className={`fas fa-chevron-down text-xs text-ink-400 mt-2 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
                    </button>
                    {open && (
                      <div className="flex flex-wrap gap-2 mt-3 pl-5">
                        <a className="btn btn-primary btn-sm no-underline" href={gmailReplyUrl(item)} target="_blank" rel="noopener noreferrer"
                          title={`Откроется письмо в Gmail от ${REPLY_FROM_EMAIL}`}>
                          <i className="fas fa-reply" aria-hidden /> Ответить в Gmail
                        </a>
                        {/* вместо mailto: без назначенного в системе почтового приложения ссылка не открывается */}
                        <Button size="sm" variant="secondary" onClick={() => copyEmail(item.email)}>
                          <i className="fas fa-copy" aria-hidden /> Скопировать адрес
                        </Button>
                        {!item.isRead && <Button size="sm" variant="secondary" loading={busy === item.id} onClick={() => markRead(item)}>Отметить прочитанным</Button>}
                        <Button size="sm" variant="ghost" loading={busy === item.id} onClick={() => remove(item)}><i className="fas fa-trash" aria-hidden /> Удалить</Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <Pagination skip={skip} take={TAKE} total={total} onChange={setSkip} />
          </Card>
        )}
    </div>
  );
}
