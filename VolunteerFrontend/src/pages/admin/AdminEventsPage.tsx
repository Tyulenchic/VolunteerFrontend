import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { useNotification } from '../../context/NotificationContext';
import { adminErrorMessage } from '../../utils/adminErrors';
import { ActionMenu, type MenuAction } from '../../components/ui/ActionMenu';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { Occupancy, capacityFromFreeSlots } from '../../components/ui/Occupancy';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState, ErrorState } from '../../components/ui/PageStates';
import { useDebounced, useLatestRequest, usePaging } from '../../hooks/useListHelpers';
import { Segmented } from '../../components/ui/Segmented';
import { CardGridSkeleton, ListSkeleton } from '../../components/ui/Skeleton';
import { STATUS_TONE, StatusBadge } from '../../components/ui/StatusBadge';
import { EventFormModal } from './EventFormModal';
import type { AdminEventListDto } from '../../types/admin';

const TAKE = 20;
type View = 'grid' | 'list';
const VIEW_KEY = 'admin.events.view';

const STATUS_LABEL: Record<string, string> = { Draft: 'Черновик', Published: 'Опубликовано', Cancelled: 'Отменено', Completed: 'Завершено', Archived: 'В архиве' };
const STATUS_FILTERS = [
  { value: '', label: 'Все' },
  { value: 'Draft', label: 'Черновики' },
  { value: 'Published', label: 'Опубликованы' },
  { value: 'Completed', label: 'Завершены' },
  { value: 'Cancelled', label: 'Отменены' },
  { value: 'Archived', label: 'Архив' },
];

const readView = (): View => { try { return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid'; } catch { return 'grid'; } };

export function AdminEventsPage() {
  const { notify } = useNotification();
  const confirm = useConfirm();
  const [params, setParams] = useSearchParams();

  const [events, setEvents] = useState<AdminEventListDto[]>([]);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounced(searchInput);
  const status = params.get('status') ?? '';
  const [skip, setSkip] = usePaging(`${search}|${status}`);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const beginRequest = useLatestRequest();
  const [view, setView] = useState<View>(readView);
  const [selectedEvent, setSelectedEvent] = useState<AdminEventListDto | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const setStatus = (s: string) => { setParams(s ? { status: s } : {}, { replace: true }); };
  const changeView = (v: View) => { setView(v); try { localStorage.setItem(VIEW_KEY, v); } catch { /* not remembered */ } };

  const load = useCallback(async () => {
    const isCurrent = beginRequest();
    setLoading(true);
    setFailed(false);
    try {
      const res = await adminApi.getEvents(skip, TAKE, search || undefined, status || undefined);
      if (!isCurrent()) return;
      setEvents(res.Items || []);
      setTotal(res.Total || 0);
    } catch (e) {
      if (!isCurrent()) return;
      console.error('Error loading events:', e);
      setEvents([]);
      setTotal(0);
      setFailed(true);
    } finally {
      if (isCurrent()) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, search, status]);

  useEffect(() => { load(); }, [load]);

  const edit = (ev: AdminEventListDto) => { setSelectedEvent(ev); setIsFormOpen(true); };

  const setLocalStatus = (id: string, st: AdminEventListDto['status']) =>
    setEvents(list => list.map(e => (e.id === id ? { ...e, status: st } : e)));

  const publish = async (ev: AdminEventListDto) => {
    try { await adminApi.publishEvent(ev.id); setLocalStatus(ev.id, 'Published'); notify('Мероприятие опубликовано'); }
    catch (e) { console.error(e); notify(adminErrorMessage(e, 'Не удалось опубликовать мероприятие'), 'error'); }
  };
  const complete = async (ev: AdminEventListDto) => {
    try { await adminApi.completeEvent(ev.id); setLocalStatus(ev.id, 'Completed'); notify('Мероприятие завершено'); }
    catch (e) { console.error(e); notify(adminErrorMessage(e, 'Не удалось завершить мероприятие'), 'error'); }
  };
  const cancel = async (ev: AdminEventListDto) => {
    if (!(await confirm({ title: 'Отменить мероприятие?', message: `«${ev.title}» будет отменено. Участники увидят новый статус.`, confirmLabel: 'Отменить мероприятие' }))) return;
    try { await adminApi.cancelEvent(ev.id, 'Отменено администратором'); setLocalStatus(ev.id, 'Cancelled'); notify('Мероприятие отменено'); }
    catch (e) { console.error(e); notify(adminErrorMessage(e, 'Не удалось отменить мероприятие'), 'error'); }
  };
  const archive = async (ev: AdminEventListDto) => {
    if (!(await confirm({ title: 'Отправить в архив?', message: `«${ev.title}» исчезнет из публичного показа. Запись сохранится и останется видна здесь.`, confirmLabel: 'В архив' }))) return;
    try { await adminApi.archiveEvent(ev.id); setLocalStatus(ev.id, 'Archived'); notify('Мероприятие отправлено в архив'); }
    catch (e) { console.error(e); notify(adminErrorMessage(e, 'Не удалось отправить в архив'), 'error'); }
  };
  const remove = async (ev: AdminEventListDto) => {
    if (!(await confirm({ title: 'Удалить мероприятие?', message: `«${ev.title}» будет удалено без возможности восстановления${ev.status === 'Completed' || ev.status === 'Archived' ? ', вместе с историей участия' : ''}.`, confirmLabel: 'Удалить' }))) return;
    try { await adminApi.deleteEvent(ev.id); notify('Мероприятие удалено'); if (events.length === 1 && skip > 0) setSkip(Math.max(0, skip - TAKE)); else load(); }
    catch (e) { console.error(e); notify(adminErrorMessage(e, 'Не удалось удалить мероприятие'), 'error'); }
  };

  const menuFor = (ev: AdminEventListDto): MenuAction[] => [
    { label: 'Редактировать', icon: 'fa-pen', onSelect: () => edit(ev) },
    { label: 'Опубликовать', icon: 'fa-upload', onSelect: () => publish(ev), hidden: ev.status !== 'Draft' },
    { label: 'Завершить', icon: 'fa-flag-checkered', onSelect: () => complete(ev), hidden: ev.status !== 'Published' },
    { label: 'В архив', icon: 'fa-box-archive', onSelect: () => archive(ev), hidden: ev.status !== 'Completed' },
    // Rules: only a published event can be cancelled; any event except a published one can be deleted by hand.
    { label: 'Отменить', icon: 'fa-ban', onSelect: () => cancel(ev), hidden: ev.status !== 'Published', danger: true },
    { label: 'Удалить', icon: 'fa-trash', onSelect: () => remove(ev), hidden: ev.status === 'Published', danger: true },
  ];

  const quickAction = (ev: AdminEventListDto) =>
    ev.status === 'Draft' ? <Button size="sm" onClick={() => publish(ev)}><i className="fas fa-upload" />Опубликовать</Button>
    : ev.status === 'Published' && new Date(ev.startsAt).getTime() < Date.now() ? <Button size="sm" variant="secondary" onClick={() => complete(ev)}><i className="fas fa-flag-checkered" />Завершить</Button>
    : null;

  const filtered = !!(searchInput || status);
  const empty = !loading && !failed && events.length === 0;

  return (
    <div className="space-y-5">
      <PageHeader title="Мероприятия" description="Создание, публикация и ведение мероприятий платформы."
        actions={<Button onClick={() => { setSelectedEvent(null); setIsFormOpen(true); }}><i className="fas fa-plus" />Создать мероприятие</Button>} />

      <div className="flex flex-wrap items-center gap-3">
        <Segmented label="Статус" options={STATUS_FILTERS} value={status} onChange={setStatus} />
        <SearchInput label="Поиск по названию" placeholder="Поиск по названию…" value={searchInput} onChange={setSearchInput} />
        <div className="ml-auto">
          <Segmented<View> label="Вид" value={view} onChange={changeView}
            options={[{ value: 'grid', label: 'Сетка', icon: 'fa-table-cells-large' }, { value: 'list', label: 'Список', icon: 'fa-list' }]} />
        </div>
      </div>

      {loading && events.length === 0 ? (
        view === 'grid' ? <CardGridSkeleton /> : <Card><ListSkeleton /></Card>
      ) : failed ? (
        <Card><ErrorState message="Не удалось загрузить мероприятия" onRetry={load} /></Card>
      ) : empty ? (
        <Card>
          <EmptyState
            icon="fa-calendar-days"
            title={filtered ? 'Мероприятия не найдены' : 'Мероприятий пока нет'}
            hint={filtered ? 'Измените поиск или сбросьте фильтр статуса.' : 'Создайте первое мероприятие — после публикации волонтёры смогут подать заявку.'}
            action={filtered
              ? <Button variant="secondary" size="sm" onClick={() => { setSearchInput(''); setStatus(''); }}>Сбросить фильтры</Button>
              : <Button size="sm" onClick={() => { setSelectedEvent(null); setIsFormOpen(true); }}><i className="fas fa-plus" />Создать мероприятие</Button>}
          />
        </Card>
      ) : view === 'grid' ? (
        <>
          <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 transition-opacity ${loading ? 'opacity-60' : ''}`}>
            {events.map(ev => <EventCard key={ev.id} ev={ev} menu={menuFor(ev)} quick={quickAction(ev)} onOpen={() => edit(ev)} />)}
          </div>
          <Card><Pagination skip={skip} take={TAKE} total={total} onChange={setSkip} /></Card>
        </>
      ) : (
        <Card className={`overflow-hidden transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <ul className="divide-y divide-line">
            {events.map(ev => <EventRow key={ev.id} ev={ev} menu={menuFor(ev)} quick={quickAction(ev)} onOpen={() => edit(ev)} />)}
          </ul>
          <Pagination skip={skip} take={TAKE} total={total} onChange={setSkip} />
        </Card>
      )}

      <EventFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setSelectedEvent(null); }}
        onSuccess={() => { load(); setSelectedEvent(null); }}
        event={selectedEvent}
      />
    </div>
  );
}

interface ItemProps { ev: AdminEventListDto; menu: MenuAction[]; quick: React.ReactNode; onOpen: () => void; }

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

function DateBlock({ iso }: { iso: string }) {
  const d = new Date(iso);
  return (
    <div className="w-14 shrink-0 rounded-control bg-brand-50 text-brand-700 text-center py-2 leading-none">
      <div className="text-xl font-bold font-heading">{d.getDate()}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wide mt-1">{MONTHS[d.getMonth()]}</div>
    </div>
  );
}

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

function EventCard({ ev, menu, quick, onOpen }: ItemProps) {
  return (
    <article className="flex flex-col rounded-card border border-line bg-surface shadow-card hover:border-line-strong transition-colors">
      <div className="flex items-start gap-3 p-4">
        <DateBlock iso={ev.startsAt} />
        <div className="min-w-0 flex-1">
          <button type="button" onClick={onOpen} className="text-left" aria-label={`Редактировать: ${ev.title}`}>
            <h3 className="text-[15px] font-semibold text-ink-900 leading-snug line-clamp-2 hover:text-brand-700">{ev.title}</h3>
          </button>
          <p className="meta mt-1"><i className="far fa-clock mr-1.5" />{timeOf(ev.startsAt)}</p>
        </div>
        <StatusBadge tone={STATUS_TONE[ev.status] ?? 'neutral'}>{STATUS_LABEL[ev.status] ?? ev.status}</StatusBadge>
      </div>
      <div className="flex-1 px-4 pb-4 space-y-2">
        <p className="meta truncate"><i className="fas fa-location-dot mr-1.5" />{ev.location}</p>
        <p className="meta truncate"><i className="far fa-user mr-1.5" />{ev.createdBy}</p>
        <Occupancy approved={ev.approvedParticipations} max={capacityFromFreeSlots(ev.approvedParticipations, ev.freeSlots)} />
      </div>
      <div className="flex items-center justify-end gap-1 px-4 py-2.5 border-t border-line min-h-[3.25rem]">
        {quick}<ActionMenu actions={menu} label={`Действия: ${ev.title}`} />
      </div>
    </article>
  );
}

function EventRow({ ev, menu, quick, onOpen }: ItemProps) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 hover:bg-surface-2 transition-colors">
      <DateBlock iso={ev.startsAt} />
      <div className="min-w-0 flex-1 basis-56">
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={onOpen} className="text-left" aria-label={`Редактировать: ${ev.title}`}>
            <h3 className="text-sm font-semibold text-ink-900 truncate hover:text-brand-700">{ev.title}</h3>
          </button>
          <StatusBadge tone={STATUS_TONE[ev.status] ?? 'neutral'}>{STATUS_LABEL[ev.status] ?? ev.status}</StatusBadge>
        </div>
        <p className="meta mt-1"><i className="far fa-clock mr-1.5" />{timeOf(ev.startsAt)}<i className="fas fa-location-dot mx-1.5 ml-3" />{ev.location}</p>
        <p className="meta mt-0.5"><i className="far fa-user mr-1.5" />{ev.createdBy}</p>
      </div>
      <div className="w-44 hidden md:block"><Occupancy approved={ev.approvedParticipations} max={capacityFromFreeSlots(ev.approvedParticipations, ev.freeSlots)} /></div>
      <div className="flex items-center gap-1 ml-auto">{quick}<ActionMenu actions={menu} label={`Действия: ${ev.title}`} /></div>
    </li>
  );
}
