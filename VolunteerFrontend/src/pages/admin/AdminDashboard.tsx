import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { useNotification } from '../../context/NotificationContext';
import { adminErrorMessage } from '../../utils/adminErrors';
import { auditAction } from '../../utils/auditActions';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { Occupancy } from '../../components/ui/Occupancy';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState, ErrorState } from '../../components/ui/PageStates';
import { Skeleton } from '../../components/ui/Skeleton';
import { STATUS_TONE, StatusBadge } from '../../components/ui/StatusBadge';
import type { AdminDashboardDto, AdminParticipationDto } from '../../types/admin';
import type { AuditLogEntryDto } from '../../types/audit';

const EVENT_STATUS: Record<string, string> = { Draft: 'Черновик', Published: 'Опубликовано', Cancelled: 'Отменено', Completed: 'Завершено', Archived: 'В архиве' };
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

const fmtShort = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

interface Section<T> { data: T; loading: boolean; failed: boolean; }
const initial = <T,>(data: T): Section<T> => ({ data, loading: true, failed: false });

export function AdminDashboard() {
  const { notify } = useNotification();
  const confirm = useConfirm();

  const [dashboard, setDashboard] = useState<AdminDashboardDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Section<{ items: AdminParticipationDto[]; total: number }>>(initial({ items: [], total: 0 }));
  const [audit, setAudit] = useState<Section<AuditLogEntryDto[]>>(initial([]));
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setError(null);
    try { setDashboard(await adminApi.getDashboard()); }
    catch (e) { console.error('Error loading dashboard:', e); setError('Не удалось загрузить данные дашборда'); }
  }, []);

  const loadPending = useCallback(async () => {
    try {
      const r = await adminApi.getParticipations(0, 6, undefined, 'Pending');
      setPending({ data: { items: r.Items ?? [], total: r.Total ?? 0 }, loading: false, failed: false });
    } catch { setPending(p => ({ ...p, loading: false, failed: true })); }
  }, []);

  useEffect(() => {
    loadDashboard();
    loadPending();
    adminApi.getAuditLog(0, 6)
      .then(r => setAudit({ data: r.Items ?? [], loading: false, failed: false }))
      .catch(() => setAudit(p => ({ ...p, loading: false, failed: true })));
  }, [loadDashboard, loadPending]);

  const decide = async (p: AdminParticipationDto, approve: boolean) => {
    if (!approve && !(await confirm({ title: 'Отклонить заявку?', message: `Заявка «${p.userName}» на «${p.eventTitle}» будет отклонена.`, confirmLabel: 'Отклонить' }))) return;
    setBusyId(p.id);
    try {
      if (approve) await adminApi.approveParticipation(p.id); else await adminApi.rejectParticipation(p.id);
      notify(approve ? 'Заявка одобрена' : 'Заявка отклонена');
      await Promise.all([loadPending(), loadDashboard()]);
    } catch (e) {
      console.error(e);
      notify(adminErrorMessage(e, 'Не удалось выполнить действие'), 'error');
    } finally { setBusyId(null); }
  };

  const stats = dashboard?.statistics;
  const attention = useMemo(() => {
    if (!stats) return [];
    const list = [
      { n: stats.pendingParticipations ?? 0, text: (n: number) => `${plural(n, 'заявка ожидает', 'заявки ожидают', 'заявок ожидают')} решения`, to: '/admin/participations?status=Pending', cta: 'Рассмотреть', icon: 'fa-clipboard-check', hot: true },
      { n: stats.unreadFeedbacks ?? 0, text: (n: number) => `${plural(n, 'новое обращение', 'новых обращения', 'новых обращений')} от посетителей`, to: '/admin/feedback', cta: 'Прочитать', icon: 'fa-envelope', hot: true },
      { n: stats.draftEvents ?? 0, text: (n: number) => `${plural(n, 'мероприятие в черновиках', 'мероприятия в черновиках', 'мероприятий в черновиках')}`, to: '/admin/events?status=Draft', cta: 'Открыть', icon: 'fa-pen-ruler', hot: false },
      { n: stats.draftNews ?? 0, text: (n: number) => `${plural(n, 'новость ждёт публикации', 'новости ждут публикации', 'новостей ждут публикации')}`, to: '/admin/news?status=Draft', cta: 'Открыть', icon: 'fa-newspaper', hot: false },
    ];
    return list.filter(a => a.n > 0);
  }, [stats]);

  if (error) return <div className="space-y-6"><PageHeader title="Дашборд" /><ErrorState message={error} onRetry={loadDashboard} /></div>;

  const upcoming = dashboard?.upcomingEvents ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Что нужно сделать сейчас" description="Заявки, мероприятия и действия, которые ждут администратора." />

      {/* 1. Needs attention */}
      <Card>
        <CardHeader title="Требует внимания" />
        {!dashboard ? (
          <div className="p-5 space-y-3"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-5 w-1/2" /></div>
        ) : attention.length === 0 ? (
          <div className="px-5 py-6 flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-success-50 text-success-700 flex items-center justify-center"><i className="fas fa-check" /></span>
            <div>
              <p className="text-sm font-medium text-ink-900">Всё под контролем</p>
              <p className="meta">Нет заявок и задач, ожидающих решения.</p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {attention.map(a => (
              <li key={a.to}>
                <Link to={a.to} className="flex items-center gap-3 px-5 py-3 no-underline hover:bg-surface-2 group">
                  <span className={`w-8 h-8 rounded-control flex items-center justify-center shrink-0 ${a.hot ? 'bg-warning-50 text-warning-700' : 'bg-surface-3 text-ink-500'}`}><i className={`fas ${a.icon} text-[13px]`} /></span>
                  <span className="flex-1 text-sm text-ink-900"><strong className="font-semibold">{a.n}</strong> {a.text(a.n)}</span>
                  <span className="text-[13px] font-medium text-brand-700 group-hover:underline whitespace-nowrap">{a.cta} <i className="fas fa-arrow-right text-[10px]" /></span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-6 2xl:grid-cols-5">
        {/* 2. Applications to decide */}
        <Card className="2xl:col-span-3">
          <CardHeader
            title={<>Заявки на рассмотрении{pending.data.total > 0 && <span className="ml-2 px-1.5 rounded-full bg-warning-100 text-warning-700 text-[11px]">{pending.data.total}</span>}</>}
            action={<Link to="/admin/participations?status=Pending" className="text-[13px] font-medium text-brand-700 hover:underline">Все заявки →</Link>}
          />
          {pending.loading ? (
            <div className="p-5 space-y-4">{[0, 1, 2].map(i => <Skeleton key={i} className="h-10" />)}</div>
          ) : pending.failed ? (
            <ErrorState message="Не удалось загрузить заявки" onRetry={loadPending} />
          ) : pending.data.items.length === 0 ? (
            <EmptyState icon="fa-clipboard-check" title="Заявок на рассмотрении нет" hint="Новые заявки волонтёров появятся здесь сразу после подачи." />
          ) : (
            <ul className="divide-y divide-line">
              {pending.data.items.map(p => (
                <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 shadow-[inset_3px_0_0_0_#d9962a] hover:bg-surface-2">
                  <Avatar name={p.userName} />
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="text-sm font-medium text-ink-900 truncate">{p.userName}</p>
                    <p className="meta truncate">{p.eventTitle} · {fmtShort(p.createdAt)}</p>
                  </div>
                  <div className="flex gap-2 ml-auto">
                    <Button size="sm" variant="success" disabled={busyId === p.id} onClick={() => decide(p, true)}><i className="fas fa-check" />Одобрить</Button>
                    <Button size="sm" variant="secondary" disabled={busyId === p.id} onClick={() => decide(p, false)}>Отклонить</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* 3. Recent actions */}
        <Card className="2xl:col-span-2">
          <CardHeader title="Последние действия" action={<Link to="/admin/audit-log" className="text-[13px] font-medium text-brand-700 hover:underline">Журнал →</Link>} />
          {audit.loading ? (
            <div className="p-5 space-y-3">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-8" />)}</div>
          ) : audit.failed ? (
            <ErrorState message="Не удалось загрузить журнал" />
          ) : audit.data.length === 0 ? (
            <EmptyState icon="fa-clock-rotate-left" title="Действий пока не было" hint="Здесь появятся изменения, сделанные администраторами." />
          ) : (
            <ul className="divide-y divide-line">
              {audit.data.map(l => {
                const a = auditAction(l.actionType);
                return (
                  <li key={l.id} className="flex items-start gap-3 px-5 py-2.5">
                    <i className={`fas ${a.icon} w-4 text-center text-xs text-ink-400 mt-1`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-ink-900">{a.label}</p>
                      <p className="meta truncate">{l.adminName}{l.details ? ` · ${l.details}` : ''}</p>
                    </div>
                    <time className="mono text-ink-400 shrink-0" dateTime={l.createdAt}>{fmtShort(l.createdAt)}</time>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* 4. Upcoming events */}
      <section aria-labelledby="upcoming-title">
        <div className="flex items-center justify-between mb-3">
          <h2 id="upcoming-title" className="section-title">Ближайшие мероприятия</h2>
          <Link to="/admin/events" className="text-[13px] font-medium text-brand-700 hover:underline">Все мероприятия →</Link>
        </div>
        {!dashboard ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-60 !rounded-card" />)}</div>
        ) : upcoming.length === 0 ? (
          <Card>
            <EmptyState icon="fa-calendar-days" title="Ближайших мероприятий нет"
              hint="Опубликованные мероприятия с будущей датой появятся здесь."
              action={<Link to="/admin/events" className="btn btn-primary btn-sm mt-2 no-underline">Перейти к мероприятиям</Link>} />
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {upcoming.map(ev => {
              const d = new Date(ev.startsAt);
              return (
                <Link key={ev.id} to={`/admin/events?status=${ev.status}`}
                  className="group rounded-card border border-line bg-surface no-underline shadow-card transition-colors hover:border-line-strong p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 shrink-0 rounded-control bg-brand-50 text-brand-700 text-center py-1.5 leading-none">
                      <div className="text-lg font-bold font-heading">{d.getDate()}</div>
                      <div className="text-[10px] font-semibold uppercase tracking-wide mt-1">{MONTHS[d.getMonth()]}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink-900 line-clamp-2 group-hover:text-brand-700">{ev.title}</p>
                      <p className="meta mt-1"><i className="far fa-clock mr-1" />{d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <p className="meta truncate"><i className="fas fa-location-dot mr-1.5" />{ev.location}</p>
                  <Occupancy approved={ev.approvedParticipantsCount} max={ev.maxParticipants} />
                  <div><StatusBadge tone={STATUS_TONE[ev.status] ?? 'neutral'}>{EVENT_STATUS[ev.status] ?? ev.status}</StatusBadge></div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
