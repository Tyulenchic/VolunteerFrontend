import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { organizerApi } from '../../api/organizer';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Pagination } from '../../components/ui/Pagination';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState, ErrorState } from '../../components/ui/PageStates';
import { Segmented } from '../../components/ui/Segmented';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { STATUS_TONE, StatusBadge } from '../../components/ui/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { useLatestRequest } from '../../hooks/useListHelpers';
import { adminErrorMessage } from '../../utils/adminErrors';
import type { OrganizerParticipation, OrganizerParticipationStatus } from '../../types/organization';

const TAKE = 20;
const STATUS_LABEL: Record<OrganizerParticipationStatus, string> = {
  Pending: 'Ожидают', Approved: 'Одобрены', Rejected: 'Отклонены', AttendanceConfirmed: 'Присутствовали', Withdrawn: 'Отозваны',
};
type Action = 'approve' | 'reject' | 'confirm';
const ACTIONS: Record<Action, { title: string; button: string; variant: 'success' | 'danger' | 'info'; done: string }> = {
  approve: { title: 'Одобрить заявку', button: 'Одобрить', variant: 'success', done: 'Заявка одобрена' },
  reject: { title: 'Отклонить заявку', button: 'Отклонить', variant: 'danger', done: 'Заявка отклонена' },
  confirm: { title: 'Подтвердить присутствие', button: 'Подтвердить', variant: 'info', done: 'Присутствие подтверждено' },
};
const fmt = (iso: string) => new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

/** Заявки волонтёров на мероприятия организаций, которые ведёт организатор. Решения те же, что в панели администратора. */
export function OrganizerParticipationsPage() {
  const { notify } = useNotification();
  const begin = useLatestRequest();
  const [params] = useSearchParams();
  const eventId = params.get('eventId') ?? undefined;

  const [status, setStatus] = useState<OrganizerParticipationStatus>('Pending');
  const [skip, setSkip] = useState(0);
  const [items, setItems] = useState<OrganizerParticipation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<{ item: OrganizerParticipation; action: Action } | null>(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const isCurrent = begin();
    setLoading(true); setError(null);
    try {
      const page = await organizerApi.participations({ status, eventId, skip, take: TAKE });
      if (!isCurrent()) return;
      setItems(page.items); setTotal(page.totalCount);
    } catch (err) {
      if (isCurrent()) setError(adminErrorMessage(err, 'Не удалось загрузить заявки.'));
    } finally { if (isCurrent()) setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, eventId, skip]);

  useEffect(() => { void load(); }, [load]);

  const run = async () => {
    if (!acting) return;
    setBusy(true);
    try {
      const { item, action } = acting;
      if (action === 'approve') await organizerApi.approveParticipation(item.id, comment);
      else if (action === 'reject') await organizerApi.rejectParticipation(item.id, comment);
      else await organizerApi.confirmAttendance(item.id, comment);
      notify(ACTIONS[action].done);
      setActing(null); setComment('');
      await load();
    } catch (err) {
      notify(adminErrorMessage(err, 'Не удалось выполнить действие.'), 'error');
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Заявки на мероприятия" description="Волонтёры, которые хотят участвовать в мероприятиях ваших организаций." />

      <div className="flex flex-wrap items-center gap-3">
        <Segmented<OrganizerParticipationStatus> label="Статус заявки" value={status} onChange={v => { setStatus(v); setSkip(0); }}
          options={(Object.keys(STATUS_LABEL) as OrganizerParticipationStatus[]).map(v => ({ value: v, label: STATUS_LABEL[v] }))} />
        {eventId && <Link to="/organizer/participations" className="text-[13px] text-brand-700 hover:underline">Показать заявки на все мероприятия</Link>}
      </div>

      {error ? <ErrorState message={error} onRetry={load} />
        : loading ? <ListSkeleton />
        : items.length === 0 ? <EmptyState icon="fa-clipboard-list" title="Заявок нет" hint={status === 'Pending' ? 'Новые заявки появятся здесь, а в колокольчике — уведомление.' : undefined} />
        : (
          <Card>
            <ul className="divide-y divide-line">
              {items.map(p => (
                <li key={p.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/users/${p.userId}`} className="font-semibold text-ink-900 hover:underline no-underline">{p.userName}</Link>
                      <StatusBadge tone={STATUS_TONE[p.status] ?? 'neutral'}>{STATUS_LABEL[p.status]}</StatusBadge>
                    </div>
                    <p className="text-[14px] text-ink-700 mt-1">
                      <Link to={`/events/${p.eventId}`} className="hover:underline no-underline text-ink-700">{p.eventTitle}</Link>
                      <span className="text-ink-400"> · {fmt(p.eventStartsAt)}</span>
                    </p>
                    <p className="meta mt-0.5">
                      {p.organizationName && <>{p.organizationName} · </>}
                      <a href={`mailto:${p.userEmail}`} className="hover:underline">{p.userEmail}</a>
                      {p.userPhone && <> · {p.userPhone}</>} · подана {fmt(p.createdAt)}
                    </p>
                    {p.adminComment && <p className="mt-1.5 text-[13px] text-ink-400">Комментарий: {p.adminComment}</p>}
                    {p.status === 'Withdrawn' && <p className="mt-1.5 text-[13px] text-ink-400">Отозвана волонтёром{p.withdrawalReason ? <>: {p.withdrawalReason}</> : ' без комментария'}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {p.status === 'Pending' && <>
                      <Button size="sm" variant="success" onClick={() => { setActing({ item: p, action: 'approve' }); setComment(''); }}><i className="fas fa-check" aria-hidden /> Одобрить</Button>
                      <Button size="sm" variant="danger" onClick={() => { setActing({ item: p, action: 'reject' }); setComment(''); }}><i className="fas fa-xmark" aria-hidden /> Отклонить</Button>
                    </>}
                    {p.status === 'Approved' && <>
                      <Button size="sm" variant="info" onClick={() => { setActing({ item: p, action: 'confirm' }); setComment(''); }}><i className="fas fa-user-check" aria-hidden /> Был на мероприятии</Button>
                    </>}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

      {total > TAKE && <Pagination skip={skip} take={TAKE} total={total} onChange={setSkip} />}

      {acting && (
        <Modal isOpen onClose={() => setActing(null)} title={ACTIONS[acting.action].title} maxWidth="max-w-md">
          <div className="space-y-4">
            <p className="text-[14px] text-ink-500">{acting.item.userName} — «{acting.item.eventTitle}»</p>
            {acting.action === 'confirm' && <p className="text-xs text-ink-400">Подтвердить присутствие можно после того, как мероприятие завершено.</p>}
            <label className="block">
              <span className="block text-[13px] font-medium text-ink-700 mb-1.5">Комментарий (необязательно)</span>
              <textarea value={comment} onChange={e => setComment(e.target.value)} maxLength={1000} rows={3} className="w-full px-3 py-2 text-sm bg-surface-2 border border-line-strong rounded-lg" />
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setActing(null)} disabled={busy}>Отмена</Button>
              <Button variant={ACTIONS[acting.action].variant} onClick={run} loading={busy}>{ACTIONS[acting.action].button}</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
