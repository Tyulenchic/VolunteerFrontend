import { useCallback, useEffect, useState } from 'react';
import { bookletAdminApi } from '../../api/booklet';
import { BookletModal } from '../../components/admin/booklets/BookletModal';
import { CreateBookletModal } from '../../components/admin/booklets/CreateBookletModal';
import { ImportModal } from '../../components/admin/booklets/ImportModal';
import { RequestModal } from '../../components/admin/booklets/RequestModal';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState, ErrorState } from '../../components/ui/PageStates';
import { Segmented } from '../../components/ui/Segmented';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { StatusBadge, type Tone } from '../../components/ui/StatusBadge';
import { SearchInput } from '../../components/ui/Input';
import { useNotification } from '../../context/NotificationContext';
import { useDebounced, useLatestRequest, usePaging } from '../../hooks/useListHelpers';
import { adminErrorMessage } from '../../utils/adminErrors';
import type { BookletDto, BookletDuplicates, BookletRequestDto, BookletRequestStatus } from '../../types/booklet';

const TAKE = 20;
type Tab = 'requests' | 'booklets' | 'duplicates';
type StatusFilter = BookletRequestStatus | '';

const STATUS: Record<BookletRequestStatus, { label: string; tone: Tone }> = {
  Pending: { label: 'Ждёт решения', tone: 'pending' },
  Issued: { label: 'Книжка выдана', tone: 'success' },
  Rejected: { label: 'Отклонена', tone: 'cancelled' },
};
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ru-RU') : '—');
const fullName = (p: { lastName: string; firstName: string; middleName: string | null }) => [p.lastName, p.firstName, p.middleName].filter(Boolean).join(' ');

/**
 * Добровольческие книжки: заявки волонтёров, выданные книжки с поиском по номеру и ФИО, выгрузка и загрузка CSV,
 * дубли аккаунтов. Печать PDF и смена данных — в карточке книжки.
 */
export function AdminBookletsPage() {
  const { notify } = useNotification();
  const [tab, setTab] = useState<Tab>('requests');
  const [pending, setPending] = useState(0);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [reload, setReload] = useState(0);
  const refresh = () => setReload(n => n + 1);

  const exportCsv = async () => {
    try { await bookletAdminApi.exportCsv(); }
    catch (e) { notify(adminErrorMessage(e, 'Не удалось выгрузить файл.'), 'error'); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Добровольческие книжки" description="Заявки волонтёров на бумажную книжку, выданные номера и печать титульного листа."
        actions={<>
          <Button variant="secondary" size="sm" onClick={() => void exportCsv()}><i className="fas fa-file-arrow-down" aria-hidden />Выгрузить CSV</Button>
          <Button variant="secondary" size="sm" onClick={() => setImporting(true)}><i className="fas fa-file-arrow-up" aria-hidden />Загрузить CSV</Button>
          <Button size="sm" onClick={() => setCreating(true)}><i className="fas fa-plus" aria-hidden />Выдать без заявки</Button>
        </>} />

      <Segmented<Tab> label="Раздел" value={tab} onChange={setTab} options={[
        { value: 'requests', label: 'Заявки', icon: 'fa-inbox', count: pending },
        { value: 'booklets', label: 'Книжки', icon: 'fa-id-card' },
        { value: 'duplicates', label: 'Дубли', icon: 'fa-clone' },
      ]} />

      {tab === 'requests' && <RequestsTab reload={reload} onPending={setPending} onChanged={refresh} />}
      {tab === 'booklets' && <BookletsTab reload={reload} onChanged={refresh} />}
      {tab === 'duplicates' && <DuplicatesTab reload={reload} onChanged={refresh} />}

      {creating && <CreateBookletModal onClose={() => setCreating(false)} onCreated={() => { setCreating(false); refresh(); }} />}
      {importing && <ImportModal onClose={() => setImporting(false)} onLoaded={refresh} />}
    </div>
  );
}

function RequestsTab({ reload, onPending, onChanged }: { reload: number; onPending: (n: number) => void; onChanged: () => void }) {
  const [status, setStatus] = useState<StatusFilter>('Pending');
  const [skip, setSkip] = usePaging(status);
  const [items, setItems] = useState<BookletRequestDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const begin = useLatestRequest();

  const load = useCallback(async () => {
    const current = begin();
    setLoading(true);
    setFailed(false);
    try {
      const page = await bookletAdminApi.requests(status, skip, TAKE);
      if (!current()) return;
      setItems(page.items); setTotal(page.total); onPending(page.pending);
    } catch { if (current()) { setItems([]); setTotal(0); setFailed(true); } }
    finally { if (current()) setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, skip, reload]);
  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-3">
      <Segmented<StatusFilter> label="Состояние заявок" value={status} onChange={setStatus} options={[
        { value: 'Pending', label: 'Ждут решения' }, { value: 'Issued', label: 'Выданные' }, { value: 'Rejected', label: 'Отклонённые' }, { value: '', label: 'Все' },
      ]} />
      <Card className="overflow-hidden">
        {loading && items.length === 0 ? <ListSkeleton rows={6} /> : failed ? <ErrorState message="Не удалось загрузить заявки" onRetry={() => void load()} />
          : items.length === 0 ? <EmptyState icon="fa-inbox" title="Заявок нет" hint="Когда волонтёр заполнит форму в профиле, заявка появится здесь и в колокольчике." />
          : (
            <div className={`overflow-x-auto scroll-soft ${loading ? 'opacity-60' : ''}`}>
              <table className="rtable w-full text-sm">
                <thead><tr><th className="px-4 text-left">Подана</th><th className="px-4 text-left">ФИО</th><th className="px-4 text-left">Год</th><th className="px-4 text-left hidden md:table-cell">Телефон</th><th className="px-4 text-left">Состояние</th><th className="w-28" /></tr></thead>
                <tbody className="divide-y divide-line">
                  {items.map(r => (
                    <tr key={r.id}>
                      <td className="px-4 py-2.5 whitespace-nowrap rt-full">{day(r.createdAt)}</td>
                      <td className="px-4 py-2.5 font-medium text-ink-900">{fullName(r)}</td>
                      <td className="px-4 py-2.5">{r.birthYear}</td>
                      <td className="px-4 py-2.5 hidden md:table-cell">{r.phone}</td>
                      <td className="px-4 py-2.5"><StatusBadge tone={STATUS[r.status].tone}>{STATUS[r.status].label}{r.bookletLabel ? ` ${r.bookletLabel}` : ''}</StatusBadge></td>
                      <td className="px-4 py-2.5 text-right"><Button size="sm" variant={r.status === 'Pending' ? 'primary' : 'secondary'} onClick={() => setOpen(r.id)}>{r.status === 'Pending' ? 'Рассмотреть' : 'Открыть'}</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        {!failed && <Pagination skip={skip} take={TAKE} total={total} onChange={setSkip} />}
      </Card>
      {open && <RequestModal requestId={open} onClose={() => setOpen(null)} onDone={() => { setOpen(null); onChanged(); }} />}
    </div>
  );
}

function BookletsTab({ reload, onChanged }: { reload: number; onChanged: () => void }) {
  const [queryInput, setQueryInput] = useState('');
  const query = useDebounced(queryInput);
  const [orphans, setOrphans] = useState(false);
  const [skip, setSkip] = usePaging(`${query}|${orphans}`);
  const [items, setItems] = useState<BookletDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const begin = useLatestRequest();

  const load = useCallback(async () => {
    const current = begin();
    setLoading(true);
    setFailed(false);
    try {
      const page = await bookletAdminApi.search(query, orphans ? true : null, skip, TAKE);
      if (!current()) return;
      setItems(page.items); setTotal(page.total);
    } catch { if (current()) { setItems([]); setTotal(0); setFailed(true); } }
    finally { if (current()) setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, orphans, skip, reload]);
  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={queryInput} onChange={setQueryInput} label="Поиск по номеру или ФИО" placeholder="V-00414, 414 или фамилия" />
        <label className="flex items-center gap-2 text-[13px] text-ink-700">
          <input type="checkbox" checked={orphans} onChange={e => setOrphans(e.target.checked)} />Только без аккаунта
        </label>
      </div>
      <Card className="overflow-hidden">
        {loading && items.length === 0 ? <ListSkeleton rows={8} /> : failed ? <ErrorState message="Не удалось загрузить книжки" onRetry={() => void load()} />
          : items.length === 0 ? <EmptyState icon="fa-id-card" title={query || orphans ? 'Ничего не найдено' : 'Книжек пока нет'} hint={query || orphans ? 'Измените поиск.' : 'Выдайте книжку по заявке или загрузите файл CSV.'} />
          : (
            <div className={`overflow-x-auto scroll-soft ${loading ? 'opacity-60' : ''}`}>
              <table className="rtable w-full text-sm">
                <thead><tr><th className="px-4 text-left">Номер</th><th className="px-4 text-left">ФИО</th><th className="px-4 text-left">Год</th><th className="px-4 text-left hidden md:table-cell">Выдана</th><th className="px-4 text-left hidden lg:table-cell">Аккаунт</th><th className="w-24" /></tr></thead>
                <tbody className="divide-y divide-line">
                  {items.map(b => (
                    <tr key={b.id}>
                      <td className="px-4 py-2.5 mono font-semibold text-ink-900 whitespace-nowrap rt-full">{b.label}</td>
                      <td className="px-4 py-2.5">{fullName(b)}</td>
                      <td className="px-4 py-2.5">{b.birthYear}</td>
                      <td className="px-4 py-2.5 hidden md:table-cell">{day(b.issuedAt)}</td>
                      <td className="px-4 py-2.5 hidden lg:table-cell text-ink-500">{b.accountEmail ?? (b.accountDeleted ? 'аккаунт удалён' : 'нет')}</td>
                      <td className="px-4 py-2.5 text-right"><Button size="sm" variant="secondary" onClick={() => setOpen(b.id)}>Открыть</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        {!failed && <Pagination skip={skip} take={TAKE} total={total} onChange={setSkip} />}
      </Card>
      {open && <BookletModal bookletId={open} onClose={() => setOpen(null)} onChanged={onChanged} />}
    </div>
  );
}

function DuplicatesTab({ reload, onChanged }: { reload: number; onChanged: () => void }) {
  const { notify } = useNotification();
  const [data, setData] = useState<BookletDuplicates | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setFailed(false);
    try { setData(await bookletAdminApi.duplicates()); } catch { setFailed(true); }
  }, []);
  useEffect(() => { void load(); }, [load, reload]);

  const give = async (bookletId: string, userId: string) => {
    try { await bookletAdminApi.reassign(bookletId, userId); notify('Книжка передана аккаунту'); onChanged(); }
    catch (e) { notify(adminErrorMessage(e, 'Не удалось передать книжку.'), 'error'); }
  };

  if (failed) return <Card><ErrorState message="Не удалось загрузить дубли" onRetry={() => void load()} /></Card>;
  if (!data) return <Card><ListSkeleton rows={4} /></Card>;

  return (
    <div className="space-y-5">
      <Card className="p-5 space-y-3">
        <h2 className="font-semibold text-ink-900">Книжки без аккаунта</h2>
        <p className="text-sm text-ink-500">Аккаунт удалён или его нет. Номер и данные сохранены. Если человек зарегистрировался заново, передайте книжку на его новый аккаунт: номер останется прежним.</p>
        {data.orphans.length === 0 ? <p className="text-sm text-ink-400">Таких книжек нет.</p> : (
          <ul className="divide-y divide-line">
            {data.orphans.map(b => (
              <li key={b.id} className="py-2.5 flex flex-wrap items-center gap-3 text-sm">
                <span className="mono font-semibold">{b.label}</span>
                <span>{fullName(b)}, {b.birthYear} г.р.</span>
                {b.candidates.length === 0 ? <span className="text-ink-400">подходящих аккаунтов пока нет</span>
                  : b.candidates.map(c => <Button key={c.id} size="sm" variant="secondary" onClick={() => void give(b.id, c.id)}>Передать {c.email}</Button>)}
                <Button size="sm" variant="ghost" onClick={() => setOpen(b.id)}>Открыть</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card className="p-5 space-y-3">
        <h2 className="font-semibold text-ink-900">Аккаунты, похожие на одного человека</h2>
        <p className="text-sm text-ink-500">Одинаковые фамилия, имя и год рождения в профиле. На человека приходится одна книжка: проверьте группу и решите, какой аккаунт основной.</p>
        {data.accounts.length === 0 ? <p className="text-sm text-ink-400">Похожих аккаунтов нет.</p> : data.accounts.map(group => (
          <ul key={group.map(a => a.id).join()} className="rounded-lg border border-line divide-y divide-line">
            {group.map(a => (
              <li key={a.id} className="px-3 py-2 text-sm flex flex-wrap items-center gap-3">
                <span className="font-medium text-ink-900">{a.name}</span><span className="text-ink-500">{a.email}</span>
                {a.bookletLabel ? <StatusBadge tone="success">{a.bookletLabel}</StatusBadge> : <span className="text-ink-400">без книжки</span>}
              </li>
            ))}
          </ul>
        ))}
      </Card>
      {open && <BookletModal bookletId={open} onClose={() => setOpen(null)} onChanged={onChanged} />}
    </div>
  );
}
