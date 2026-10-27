import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { eventsApi } from '../../api/events';
import { CroppedImage } from '../../components/ImageCropper';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { PageHeader } from '../../components/ui/PageHeader';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState, ErrorState } from '../../components/ui/PageStates';
import { Segmented } from '../../components/ui/Segmented';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { STATUS_TONE, StatusBadge } from '../../components/ui/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { useLatestRequest } from '../../hooks/useListHelpers';
import { adminErrorMessage } from '../../utils/adminErrors';
import { EventFormModal } from '../admin/EventFormModal';
import type { AdminEventListDto } from '../../types/admin';
import type { EventResponseDto, EventStatus } from '../../types/event';

const TAKE = 12;
const STATUS_LABEL: Record<string, string> = { Draft: 'Черновик', Published: 'Опубликовано', Cancelled: 'Отменено', Completed: 'Завершено', Archived: 'В архиве' };
const FILTERS: Array<{ value: EventStatus | ''; label: string }> = [
  { value: '', label: 'Все' }, { value: 'Draft', label: 'Черновики' }, { value: 'Published', label: 'Опубликованы' },
  { value: 'Completed', label: 'Завершены' }, { value: 'Cancelled', label: 'Отменены' }, { value: 'Archived', label: 'Архив' },
];
const fmt = (iso: string) => new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

/** Форма редактирования рассчитана на запись списка администратора — собираем её из ответа API мероприятий. */
const toFormEvent = (e: EventResponseDto): AdminEventListDto => ({
  id: e.id, title: e.title, startsAt: e.startsAt, location: e.location, totalParticipations: e.approvedCount,
  approvedParticipations: e.approvedCount, createdAt: e.createdAt, createdBy: e.createdByUserId, status: e.status,
});

/**
 * Мероприятия организатора: все мероприятия его организаций (а не только созданные лично). Новое мероприятие создаётся
 * от имени организации, и оно же показывается на странице организации и во всём списке мероприятий.
 */
export function OrganizerEventsPage() {
  const { notify } = useNotification();
  const confirm = useConfirm();
  const begin = useLatestRequest();
  const [status, setStatus] = useState<EventStatus | ''>('');
  const [skip, setSkip] = useState(0);
  const [items, setItems] = useState<EventResponseDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{ open: boolean; event: AdminEventListDto | null }>({ open: false, event: null });
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const isCurrent = begin();
    setLoading(true); setError(null);
    try {
      const page = await eventsApi.getAll(skip, TAKE, status || undefined);
      if (!isCurrent()) return;
      setItems(page.items); setTotal(page.totalCount);
    } catch (err) {
      if (isCurrent()) setError(adminErrorMessage(err, 'Не удалось загрузить мероприятия.'));
    } finally { if (isCurrent()) setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, status]);

  useEffect(() => { void load(); }, [load]);

  const act = async (e: EventResponseDto, kind: 'publish' | 'cancel' | 'complete' | 'delete') => {
    const texts = {
      publish: { msg: `Опубликовать «${e.title}»? Мероприятие станет видно всем, заявки начнут приходить.`, ok: 'Мероприятие опубликовано', btn: 'Опубликовать' },
      cancel: { msg: `Отменить «${e.title}»? Волонтёры с заявками получат письмо. Отмену нельзя вернуть.`, ok: 'Мероприятие отменено', btn: 'Отменить мероприятие' },
      complete: { msg: `Завершить «${e.title}»? После этого можно подтверждать присутствие волонтёров.`, ok: 'Мероприятие завершено', btn: 'Завершить' },
      delete: { msg: `Удалить «${e.title}» вместе с заявками и фото? Это нельзя отменить.`, ok: 'Мероприятие удалено', btn: 'Удалить' },
    }[kind];
    if (!(await confirm({ message: texts.msg, confirmLabel: texts.btn, danger: kind === 'cancel' || kind === 'delete' }))) return;
    setBusyId(e.id);
    try {
      if (kind === 'publish') await eventsApi.publish(e.id);
      else if (kind === 'cancel') await eventsApi.cancel(e.id);
      else if (kind === 'complete') await eventsApi.complete(e.id);
      else await adminApi.deleteEvent(e.id);
      notify(texts.ok);
      await load();
    } catch (err) {
      notify(adminErrorMessage(err, 'Не удалось выполнить действие.'), 'error');
    } finally { setBusyId(null); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Мероприятия" description="Мероприятия ваших организаций. Опубликованные видны на странице организации и в общем списке."
        actions={<Button onClick={() => setForm({ open: true, event: null })}><i className="fas fa-plus" aria-hidden /> Создать мероприятие</Button>} />

      <Segmented<EventStatus | ''> label="Статус мероприятия" value={status} onChange={v => { setStatus(v); setSkip(0); }}
        options={FILTERS.map(f => ({ value: f.value, label: f.label }))} />

      {error ? <ErrorState message={error} onRetry={load} />
        : loading ? <ListSkeleton />
        : items.length === 0 ? <EmptyState icon="fa-calendar-days" title="Мероприятий нет" hint="Создайте первое — фото можно выбрать сразу, не сохраняя мероприятие заранее."
            action={<Button onClick={() => setForm({ open: true, event: null })}>Создать мероприятие</Button>} />
        : (
          <Card>
            <ul className="divide-y divide-line">
              {items.map(e => (
                <li key={e.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="w-28 shrink-0 overflow-hidden rounded-lg border border-line">
                    <CroppedImage src={e.imageThumbnailUrl ?? e.imageUrl} crop={e.imageCrop} aspect={16 / 10} className="!rounded-none w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/events/${e.id}`} className="font-semibold text-ink-900 hover:underline no-underline">{e.title}</Link>
                      <StatusBadge tone={STATUS_TONE[e.status] ?? 'neutral'}>{STATUS_LABEL[e.status] ?? e.status}</StatusBadge>
                    </div>
                    <p className="meta mt-0.5">
                      {e.organization ? e.organization.name : 'От платформы'} · {fmt(e.startsAt)} · {e.location}
                    </p>
                    <p className="meta">Участников: {e.approvedCount}{e.maxParticipants != null ? ` из ${e.maxParticipants}` : ''}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Link to={`/organizer/participations?eventId=${e.id}`} className="btn btn-secondary btn-sm no-underline"><i className="fas fa-clipboard-list" aria-hidden /> Заявки</Link>
                    {(e.status === 'Draft' || e.status === 'Published') &&
                      <Button size="sm" variant="secondary" onClick={() => setForm({ open: true, event: toFormEvent(e) })}><i className="fas fa-pen" aria-hidden /> Изменить</Button>}
                    {e.status === 'Draft' && <Button size="sm" variant="success" loading={busyId === e.id} onClick={() => act(e, 'publish')}>Опубликовать</Button>}
                    {e.status === 'Published' && <>
                      <Button size="sm" variant="info" loading={busyId === e.id} onClick={() => act(e, 'complete')}>Завершить</Button>
                      <Button size="sm" variant="danger" loading={busyId === e.id} onClick={() => act(e, 'cancel')}>Отменить</Button>
                    </>}
                    {(e.status === 'Draft' || e.status === 'Cancelled') &&
                      <Button size="sm" variant="ghost" loading={busyId === e.id} onClick={() => act(e, 'delete')} aria-label="Удалить мероприятие"><i className="fas fa-trash" aria-hidden /></Button>}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

      {total > TAKE && <Pagination skip={skip} take={TAKE} total={total} onChange={setSkip} />}

      <EventFormModal isOpen={form.open} event={form.event} onClose={() => setForm({ open: false, event: null })} onSuccess={() => { void load(); }} />
    </div>
  );
}
