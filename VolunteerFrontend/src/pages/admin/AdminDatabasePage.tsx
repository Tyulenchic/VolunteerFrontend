import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { databaseApi, dbAccess, isDbAccessRequired, type DbAccessChallenge, type DbTableInfo, type DbTablePage } from '../../api/databaseBrowser';
import { useDebounced, useLatestRequest, usePaging } from '../../hooks/useListHelpers';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Field, SearchInput, Select } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState, ErrorState } from '../../components/ui/PageStates';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { DOSSIER_FORMATS, type DossierFormat } from '../../utils/downloadFile';
import { mapApiError } from '../../utils/apiError';

const TAKE = 50;

const fmtTime = (ms: number) => new Date(ms).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

/**
 * Просмотр таблиц базы данных. Кроме входа администратора нужна повторная проверка: пароль учётной записи и код из письма.
 * Все проверки выполняет сервер; эта страница только показывает шаги. Без действующего ключа сервер не отдаёт ни одной строки.
 */
export function AdminDatabasePage() {
  const { user } = useAuth();
  const { notify } = useNotification();
  const [expiresAt, setExpiresAt] = useState<number | null>(() => dbAccess.expiresAt(user?.id));

  // Ключ кончился: возвращаемся к вводу пароля. Сервер к этому моменту и так отказывает.
  useEffect(() => {
    if (!expiresAt) return;
    const t = window.setTimeout(() => { dbAccess.clear(); setExpiresAt(null); }, Math.max(0, expiresAt - Date.now()));
    return () => window.clearTimeout(t);
  }, [expiresAt]);

  const lockAgain = useCallback(() => {
    dbAccess.clear();
    setExpiresAt(null);
    notify('Доступ к базе истёк. Подтвердите его снова.', 'info');
  }, [notify]);

  const end = async () => {
    await databaseApi.endSession();
    setExpiresAt(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="База данных"
        description="Таблицы подключённой базы только для чтения. Секретные поля (пароли, токены, тексты писем со ссылками) скрыты."
        actions={expiresAt ? (
          <div className="flex items-center gap-3">
            <span className="meta"><i className="fas fa-lock-open mr-1.5" aria-hidden />Доступ до {fmtTime(expiresAt)}</span>
            <Button variant="secondary" size="sm" onClick={end}><i className="fas fa-lock" aria-hidden />Закрыть доступ</Button>
          </div>
        ) : undefined}
      />
      {expiresAt && user
        ? <DatabaseBrowser onAccessLost={lockAgain} />
        : <AccessGate userId={user?.id ?? ''} onGranted={() => setExpiresAt(dbAccess.expiresAt(user?.id))} />}
    </div>
  );
}

// ─── Проверка: пароль → код ──────────────────────────────────────────────────

function AccessGate({ userId, onGranted }: { userId: string; onGranted: () => void }) {
  const [challenge, setChallenge] = useState<DbAccessChallenge | null>(null);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendPassword = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setChallenge(await databaseApi.challenge(password));
      setCode('');
    } catch (err) {
      setError(mapApiError(err));
    } finally {
      setPassword(''); // пароль не держим в памяти страницы дольше, чем нужно
      setBusy(false);
    }
  };

  const sendCode = async (e: FormEvent) => {
    e.preventDefault();
    if (!challenge) return;
    setBusy(true);
    setError(null);
    try {
      await databaseApi.verify(userId, challenge.challengeId, code);
      onGranted();
    } catch (err) {
      setError(mapApiError(err));
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const restart = () => { setChallenge(null); setCode(''); setError(null); };

  return (
    <Card padding="md" className="max-w-md">
      <div className="flex items-start gap-3 mb-5">
        <span className="grid place-items-center w-10 h-10 rounded-full bg-surface-2 text-brand-500 shrink-0"><i className="fas fa-shield-halved" aria-hidden /></span>
        <div>
          <h2 className="text-base font-semibold text-ink-900">{challenge ? 'Введите код из письма' : 'Подтвердите, что это вы'}</h2>
          <p className="meta mt-1">
            {challenge
              ? <>Код отправлен на {challenge.maskedEmail}. Он действует 10 минут и подходит один раз.</>
              : <>База содержит все данные платформы. Введите пароль своей учётной записи — на вашу почту придёт код.</>}
          </p>
        </div>
      </div>

      {!challenge ? (
        <form onSubmit={sendPassword} className="space-y-4">
          <Field label="Пароль администратора">
            <input type="password" autoComplete="current-password" required value={password}
              onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 text-sm" autoFocus />
          </Field>
          {error && <p role="alert" className="text-[13px] text-red-500">{error}</p>}
          <Button type="submit" full loading={busy} disabled={!password}>Получить код</Button>
        </form>
      ) : (
        <form onSubmit={sendCode} className="space-y-4">
          <Field label="Код из письма">
            <input inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-2 text-lg tracking-[0.5em] mono text-center" autoFocus aria-describedby="db-code-hint" />
          </Field>
          <p id="db-code-hint" className="meta">Письма нет? Проверьте «Спам» или запросите новый код — старый перестанет действовать.</p>
          {error && <p role="alert" className="text-[13px] text-red-500">{error}</p>}
          <Button type="submit" full loading={busy} disabled={code.length !== 6}>Открыть базу</Button>
          <Button type="button" variant="ghost" full onClick={restart}>Запросить новый код</Button>
        </form>
      )}
    </Card>
  );
}

// ─── Таблицы ─────────────────────────────────────────────────────────────────

function DatabaseBrowser({ onAccessLost }: { onAccessLost: () => void }) {
  const { notify } = useNotification();
  const [tables, setTables] = useState<DbTableInfo[] | null>(null);
  const [tablesFailed, setTablesFailed] = useState(false);
  const [table, setTable] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounced(searchInput);
  const [sort, setSort] = useState<{ column: string; desc: boolean } | null>(null);
  const [skip, setSkip] = usePaging(`${table}|${search}|${sort?.column}|${sort?.desc}`);
  const [page, setPage] = useState<DbTablePage | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [exporting, setExporting] = useState<DossierFormat | null>(null);
  const beginRequest = useLatestRequest();

  const handleError = useCallback((err: unknown) => {
    if (isDbAccessRequired(err)) { onAccessLost(); return true; }
    return false;
  }, [onAccessLost]);

  const loadTables = useCallback(async () => {
    setTablesFailed(false);
    try {
      const list = await databaseApi.getTables();
      setTables(list);
      setTable(t => t || list[0]?.name || '');
    } catch (err) {
      if (!handleError(err)) setTablesFailed(true);
    }
  }, [handleError]);

  useEffect(() => { void loadTables(); }, [loadTables]);

  const load = useCallback(async () => {
    if (!table) return;
    const isCurrent = beginRequest();
    setLoading(true);
    setFailed(false);
    try {
      const res = await databaseApi.getTable(table, { skip, take: TAKE, search, sort: sort?.column, desc: sort?.desc });
      if (isCurrent()) setPage(res);
    } catch (err) {
      if (!isCurrent() || handleError(err)) return;
      setFailed(true);
    } finally {
      if (isCurrent()) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, skip, search, sort]);

  useEffect(() => { void load(); }, [load]);

  const pickTable = (name: string) => { setTable(name); setSearchInput(''); setSort(null); setPage(null); };

  const toggleSort = (column: string) =>
    setSort(s => (s?.column !== column ? { column, desc: false } : s.desc ? null : { column, desc: true }));

  const exportAs = async (format: DossierFormat) => {
    setExporting(format);
    try {
      await databaseApi.exportTable(table, format, { search, sort: sort?.column, desc: sort?.desc });
    } catch (err) {
      if (!handleError(err)) notify(mapApiError(err), 'error');
    } finally {
      setExporting(null);
    }
  };

  if (tablesFailed) return <Card><ErrorState message="Не удалось загрузить список таблиц" onRetry={loadTables} /></Card>;
  if (!tables) return <Card><ListSkeleton rows={8} /></Card>;
  if (tables.length === 0) return <Card><EmptyState icon="fa-database" title="Таблиц нет" hint="В схеме public подключённой базы нет таблиц." /></Card>;

  return (
    <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
      {/* Список таблиц: на телефоне — выпадающий список */}
      <div className="lg:hidden">
        <Select label="Таблица" value={table} onChange={e => pickTable(e.target.value)} className="w-full">
          {tables.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
        </Select>
      </div>
      <Card as="div" className="hidden lg:block self-start overflow-hidden">
        <nav aria-label="Таблицы базы данных" className="max-h-[70vh] overflow-y-auto scroll-soft py-1">
          {tables.map(t => (
            <button key={t.name} type="button" onClick={() => pickTable(t.name)} aria-current={t.name === table ? 'true' : undefined}
              className={`flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-[13px] transition ${
                t.name === table ? 'bg-surface-2 text-ink-900 font-semibold' : 'text-ink-500 hover:bg-surface-2 hover:text-ink-900'}`}>
              <span className="mono truncate">{t.name}</span>
              <span className="meta shrink-0">{t.columnCount}</span>
            </button>
          ))}
        </nav>
      </Card>

      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput label="Поиск по таблице" placeholder="Поиск по всем открытым полям…" value={searchInput} onChange={setSearchInput} />
          <div className="flex flex-wrap gap-2 ml-auto" role="group" aria-label="Скачать таблицу">
            {DOSSIER_FORMATS.map(f => (
              <Button key={f.key} variant="secondary" size="sm" loading={exporting === f.key} disabled={!!exporting || !page}
                onClick={() => exportAs(f.key)}>
                <i className={`fas ${f.icon}`} aria-hidden />{f.label}
              </Button>
            ))}
          </div>
        </div>

        <Card className="overflow-hidden">
          {!page && loading ? (
            <ListSkeleton rows={10} />
          ) : failed ? (
            <ErrorState message="Не удалось загрузить таблицу" onRetry={load} />
          ) : !page ? null : page.rows.length === 0 ? (
            <EmptyState icon="fa-table" title={search ? 'Ничего не найдено' : 'В таблице нет строк'}
              hint={search ? 'Поиск идёт только по открытым полям.' : undefined} />
          ) : (
            <div className={`overflow-auto scroll-soft max-h-[70vh] transition-opacity ${loading ? 'opacity-60' : ''}`}>
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr>
                    {page.columns.map(c => {
                      const sorted = sort?.column === c.name;
                      const sortable = c.kind === 'Value';
                      return (
                        <th key={c.name} scope="col" className="px-3 text-left !normal-case !tracking-normal"
                          aria-sort={sorted ? (sort.desc ? 'descending' : 'ascending') : undefined}>
                          {sortable ? (
                            <button type="button" onClick={() => toggleSort(c.name)} title={c.dataType}
                              className="inline-flex items-center gap-1.5 mono hover:text-ink-900">
                              {c.name}
                              <i className={`fas ${sorted ? (sort.desc ? 'fa-arrow-down-wide-short' : 'fa-arrow-up-short-wide') : 'fa-sort opacity-30'} text-[10px]`} aria-hidden />
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 mono" title={c.kind === 'Secret' ? 'Секретное поле: значение не передаётся' : c.dataType}>
                              {c.name}{c.kind === 'Secret' && <i className="fas fa-lock text-[10px]" aria-label="скрыто" />}
                            </span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {page.rows.map((row, i) => (
                    <tr key={skip + i}>
                      {row.map((v, j) => (
                        <td key={j} className="px-3 py-2 align-top">
                          <Cell value={v} secret={page.columns[j].kind === 'Secret'} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {page && <Pagination skip={skip} take={TAKE} total={page.total} onChange={setSkip} />}
        </Card>
        {page && <p className="meta">Строк: {page.total.toLocaleString('ru-RU')}. В файл выгружается до 5000 строк с текущими поиском и сортировкой.</p>}
      </div>
    </div>
  );
}

function Cell({ value, secret }: { value: string | null; secret: boolean }) {
  if (secret) return <span className="meta italic"><i className="fas fa-lock mr-1" aria-hidden />скрыто</span>;
  if (value === null) return <span className="meta italic">NULL</span>;
  return <span className="mono block max-w-[22rem] truncate text-ink-700" title={value}>{value}</span>;
}
