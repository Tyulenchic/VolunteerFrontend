import { useCallback, useEffect, useMemo, useState } from 'react';
import { systemApi, type RequestLogEntryDto, type RequestLogParams } from '../../api/system';
import { useDebounced, useLatestRequest, usePaging } from '../../hooks/useListHelpers';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState, ErrorState } from '../../components/ui/PageStates';
import { Segmented } from '../../components/ui/Segmented';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SearchInput } from '../../components/ui/Input';
import { REQUEST_SORTS, STATUS_HINTS, countByClass, statusTone, type RequestSortKey } from '../../utils/requestLog';

const TAKE = 50;
const SLOW_MS = 1000;
const METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

type ClassFilter = '' | '2' | '3' | '4' | '5';

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('ru-RU');
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

/**
 * Журнал запросов к API: каждый ответ с его номером (200, 201, 404, 500…), адресом, временем и пользователем.
 * Сверху — кнопки по классам ответов и список точных номеров с числом записей, ниже — метод, адрес, даты,
 * «только медленные» и сортировка. Записи хранятся две недели; строки запроса и тела в журнал не попадают.
 */
export function AdminRequestLogPage() {
  const [items, setItems] = useState<RequestLogEntryDto[]>([]);
  const [total, setTotal] = useState(0);
  const [statuses, setStatuses] = useState<Record<string, number>>({});
  const [statusClass, setStatusClass] = useState<ClassFilter>('');
  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');
  const [pathInput, setPathInput] = useState('');
  const path = useDebounced(pathInput);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [slowOnly, setSlowOnly] = useState(false);
  const [sortKey, setSortKey] = useState<RequestSortKey>('time-desc');
  const [skip, setSkip] = usePaging(`${statusClass}|${status}|${method}|${path}|${from}|${to}|${slowOnly}|${sortKey}`);
  const beginRequest = useLatestRequest();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    const isCurrent = beginRequest();
    setLoading(true);
    setFailed(false);
    const sort = REQUEST_SORTS.find(s => s.value === sortKey)!;
    const params: RequestLogParams = {
      skip, take: TAKE, sort: sort.sort, order: sort.order,
      ...(status && { status: Number(status) }),
      ...(!status && statusClass && { statusClass: Number(statusClass) }),
      ...(method && { method }),
      ...(path.trim() && { path: path.trim() }),
      ...(from && { from }),
      ...(to && { to }),
      ...(slowOnly && { slowerThanMs: SLOW_MS }),
    };
    try {
      const page = await systemApi.getRequests(params);
      if (!isCurrent()) return;
      setItems(page.items);
      setTotal(page.total);
      setStatuses(page.statuses);
    } catch (e) {
      if (!isCurrent()) return;
      console.error('Error loading request log:', e);
      setItems([]);
      setTotal(0);
      setFailed(true);
    } finally {
      if (isCurrent()) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, statusClass, status, method, path, from, to, slowOnly, sortKey]);

  useEffect(() => { void load(); }, [load]);

  const classes = useMemo(() => countByClass(statuses), [statuses]);
  const codes = useMemo(() => Object.keys(statuses).map(Number).sort((a, b) => a - b), [statuses]);
  const filtered = !!(statusClass || status || method || path.trim() || from || to || slowOnly);
  const reset = () => { setStatusClass(''); setStatus(''); setMethod(''); setPathInput(''); setFrom(''); setTo(''); setSlowOnly(false); };
  const chooseClass = (value: ClassFilter) => { setStatusClass(value); setStatus(''); };

  return (
    <div className="space-y-5">
      <PageHeader title="Журнал запросов" description="Ответы сайта с номерами: 200 и 201 — успешно, 4xx — ошибка запроса, 5xx — ошибка сервера. Хранится 14 дней."
        actions={<Button variant="secondary" size="sm" onClick={() => void load()} loading={loading}><i className="fas fa-rotate" aria-hidden />Обновить</Button>} />

      <div className="flex flex-wrap items-center gap-3">
        <Segmented<ClassFilter> label="Класс ответа" value={statusClass} onChange={chooseClass} options={[
          { value: '', label: `Все (${Object.values(statuses).reduce((a, b) => a + b, 0)})` },
          { value: '2', label: `Успешные 2xx (${classes[2]})` },
          { value: '3', label: `3xx (${classes[3]})` },
          { value: '4', label: `Ошибки запроса 4xx (${classes[4]})` },
          { value: '5', label: `Ошибки сервера 5xx (${classes[5]})` },
        ]} />
        <label className="flex items-center gap-2 text-[13px] text-ink-500">
          Номер
          <select value={status} onChange={e => { setStatus(e.target.value); setStatusClass(''); }} className="px-3 py-2 text-sm min-w-[12rem]" aria-label="Точный номер ответа">
            <option value="">Любой</option>
            {codes.map(c => <option key={c} value={c}>{c}{STATUS_HINTS[c] ? ` — ${STATUS_HINTS[c]}` : ''} ({statuses[c]})</option>)}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <SearchInput value={pathInput} onChange={setPathInput} label="Часть адреса" placeholder="Часть адреса, например /api/events" />
        <label className="text-[13px] text-ink-500 flex flex-col gap-1">Метод
          <select value={method} onChange={e => setMethod(e.target.value)} className="px-3 py-2 text-sm">
            <option value="">Любой</option>
            {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label className="text-[13px] text-ink-500 flex flex-col gap-1">С даты
          <input type="date" value={from} max={to || undefined} onChange={e => setFrom(e.target.value)} className="px-3 py-2 text-sm" />
        </label>
        <label className="text-[13px] text-ink-500 flex flex-col gap-1">По дату
          <input type="date" value={to} min={from || undefined} onChange={e => setTo(e.target.value)} className="px-3 py-2 text-sm" />
        </label>
        <label className="flex items-center gap-2 text-[13px] text-ink-700 pb-2">
          <input type="checkbox" checked={slowOnly} onChange={e => setSlowOnly(e.target.checked)} />
          Только медленные (от {SLOW_MS / 1000} с)
        </label>
        <label className="text-[13px] text-ink-500 flex flex-col gap-1 ml-auto">Порядок
          <select value={sortKey} onChange={e => setSortKey(e.target.value as RequestSortKey)} className="px-3 py-2 text-sm">
            {REQUEST_SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
        {filtered && <Button variant="ghost" size="sm" onClick={reset}>Сбросить</Button>}
      </div>

      <Card className="overflow-hidden">
        {loading && items.length === 0 ? (
          <ListSkeleton rows={10} />
        ) : failed ? (
          <ErrorState message="Не удалось загрузить журнал запросов" onRetry={() => void load()} />
        ) : items.length === 0 ? (
          <EmptyState icon="fa-list-check" title={filtered ? 'Под эти условия записей нет' : 'Журнал запросов пока пуст'}
            hint={filtered ? 'Измените фильтры или сбросьте их.' : 'Запросы к сайту будут появляться здесь сами.'}
            action={filtered ? <Button variant="secondary" size="sm" onClick={reset}>Показать все</Button> : undefined} />
        ) : (
          <div className={`relative overflow-x-auto scroll-soft transition-opacity ${loading ? 'opacity-60' : ''}`}>
            <table className="rtable w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="px-4 text-left w-[10.5rem]">Время</th>
                  <th className="px-4 text-left w-[6rem]">Ответ</th>
                  <th className="px-4 text-left w-[5rem]">Метод</th>
                  <th className="px-4 text-left">Адрес</th>
                  <th className="px-4 text-right w-[6rem]">Время, мс</th>
                  <th className="px-4 text-left hidden lg:table-cell">Пользователь</th>
                  <th className="px-4 text-left hidden 2xl:table-cell">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map(r => (
                  <tr key={r.id}>
                    <td className="px-4 py-2.5 whitespace-nowrap rt-full">
                      <time dateTime={r.createdAt} className="mono text-ink-700">{fmtDate(r.createdAt)} <span className="text-ink-400">{fmtTime(r.createdAt)}</span></time>
                    </td>
                    <td className="px-4 py-2.5" title={STATUS_HINTS[r.status]}><StatusBadge tone={statusTone(r.status)}>{r.status}</StatusBadge></td>
                    <td className="px-4 py-2.5 mono text-ink-700">{r.method}</td>
                    <td className="px-4 py-2.5 mono text-ink-900 break-all">{r.path}</td>
                    <td className={`px-4 py-2.5 mono text-right ${r.durationMs >= SLOW_MS ? 'text-warning-700 font-semibold' : 'text-ink-700'}`}>{r.durationMs}</td>
                    <td className="px-4 py-2.5 hidden lg:table-cell mono text-ink-500" title={r.userId ?? undefined}>{r.userId ? r.userId.slice(0, 8) : 'гость'}</td>
                    <td className="px-4 py-2.5 hidden 2xl:table-cell mono text-ink-500">{r.ip ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!failed && <Pagination skip={skip} take={TAKE} total={total} onChange={setSkip} />}
      </Card>
    </div>
  );
}
