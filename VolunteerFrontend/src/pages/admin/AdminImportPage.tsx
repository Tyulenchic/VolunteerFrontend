import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { adminApi, type ImportIssueDto } from '../../api/admin';
import { ImportIssueTable } from '../../components/admin/ImportIssueTable';
import { WordPressDatabaseImport } from '../../components/admin/WordPressDatabaseImport';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { adminErrorMessage } from '../../utils/adminErrors';
import { chunkCsv, readUtf8, type CsvChunk } from '../../utils/csvChunks';

/** Записей в одной порции: сервер оборачивает каждый пароль в bcrypt, порция должна уложиться в лимит времени хостинга. */
const CHUNK_SIZE = 25;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const REQUIRED_COLUMNS = ['ID', 'user_login', 'user_pass', 'user_email', 'user_registered'];

type Mode = 'check' | 'import';

interface Totals {
  mode: Mode;
  created: number;
  updated: number;
  skipped: ImportIssueDto[];
  warnings: ImportIssueDto[];
  processed: number;
  total: number;
  stoppedAt: string | null;
}

const emptyTotals = (mode: Mode, total: number): Totals =>
  ({ mode, created: 0, updated: 0, skipped: [], warnings: [], processed: 0, total, stoppedAt: null });

export function AdminImportPage() {
  const { notify } = useNotification();
  const confirm = useConfirm();
  const input = useRef<HTMLInputElement>(null);
  const cancelled = useRef(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [chunks, setChunks] = useState<CsvChunk[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [totals, setTotals] = useState<Totals | null>(null);

  const records = chunks.reduce((sum, c) => sum + c.rows, 0);

  useEffect(() => {
    if (!running) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [running]);

  const pick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setTotals(null);
    setChunks([]);
    setFileError(null);
    setFileName(file?.name ?? null);
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) { setFileError('Файл больше 50 МБ. Разбейте выгрузку на несколько файлов.'); return; }
    let text: string;
    try { text = await readUtf8(file); }
    catch { setFileError('Файл не в кодировке UTF-8. Сохраните его как «CSV UTF-8» и выберите снова.'); return; }
    const header = text.split(/\r?\n/, 1)[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
    const missing = REQUIRED_COLUMNS.filter(c => !header.includes(c.toLowerCase()));
    if (missing.length > 0) { setFileError(`Не хватает столбцов: ${missing.join(', ')}.`); return; }
    const parts = chunkCsv(text, CHUNK_SIZE);
    if (parts.length === 0) { setFileError('В файле нет записей, кроме строки заголовков.'); return; }
    setChunks(parts);
  };

  const run = async (mode: Mode) => {
    if (mode === 'import' && !(await confirm({
      title: 'Импортировать пользователей?',
      message: `Будет обработано записей: ${records}. Уже импортированные пользователи обновятся, их пароли не изменятся. Аккаунты, созданные на сайте, не перезаписываются.`,
      confirmLabel: 'Импортировать',
    }))) return;

    cancelled.current = false;
    setRunning(true);
    let acc = emptyTotals(mode, records);
    setTotals(acc);
    for (const chunk of chunks) {
      if (cancelled.current) { acc = { ...acc, stoppedAt: `Остановлено перед записью ${chunk.firstLine}.` }; break; }
      try {
        const report = await adminApi.importWordPressUsers(chunk.csv, chunk.firstLine, mode === 'check');
        acc = {
          ...acc,
          created: acc.created + report.created,
          updated: acc.updated + report.updated,
          skipped: [...acc.skipped, ...report.skipped],
          warnings: [...acc.warnings, ...report.warnings],
          processed: acc.processed + chunk.rows,
        };
      } catch (e) {
        const last = chunk.firstLine + chunk.rows - 1;
        acc = { ...acc, stoppedAt: `Ошибка на записях ${chunk.firstLine}–${last}: ${adminErrorMessage(e, 'сервер не принял порцию.')}` };
        break;
      }
      setTotals(acc);
    }
    setTotals(acc);
    setRunning(false);
    if (acc.stoppedAt) notify(acc.stoppedAt, 'error');
    else notify(mode === 'check' ? 'Проверка завершена' : 'Импорт завершён');
  };

  const reset = () => {
    setChunks([]); setTotals(null); setFileName(null); setFileError(null);
    if (input.current) input.current.value = '';
  };

  const percent = totals && totals.total > 0 ? Math.round((totals.processed / totals.total) * 100) : 0;

  return (
    <div className="space-y-5">
      <PageHeader title="Импорт пользователей"
        description="Перенос аккаунтов из WordPress: из выгрузки CSV или прямо из таблиц WordPress на сервере. Пользователи входят на сайт со своим прежним логином или e-mail и паролем." />

      <h2 className="section-title">Из таблиц WordPress на сервере</h2>
      <WordPressDatabaseImport />

      <h2 className="section-title pt-2">Из выгрузки CSV</h2>
      <Card className="p-5 space-y-4">
        <ul className="text-sm text-ink-500 list-disc pl-5 space-y-1">
          <li>Обязательные столбцы: {REQUIRED_COLUMNS.join(', ')}. Остальные поля выгрузки WordPress переносятся, если присутствуют.</li>
          <li>Кодировка — UTF-8. Сессии WordPress (session_tokens) не переносятся.</li>
          <li>Повторный импорт того же файла безопасен: изменятся только данные WordPress, пароли — нет.</li>
          <li>Аккаунты, уже созданные на сайте с тем же e-mail, не перезаписываются — такие записи попадут в отчёт.</li>
        </ul>

        <div className="flex flex-wrap items-center gap-3">
          <input ref={input} type="file" accept=".csv,text/csv" onChange={pick} disabled={running}
            aria-label="CSV-файл с пользователями" className="text-sm" />
          {fileName && !fileError && records > 0 && <StatusBadge tone="brand">{records} записей</StatusBadge>}
        </div>
        {fileError && <p role="alert" className="text-sm text-danger-700">{fileError}</p>}

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => run('check')} disabled={running || chunks.length === 0}>
            <i className="fas fa-list-check" aria-hidden /> Проверить файл
          </Button>
          <Button onClick={() => run('import')} disabled={running || chunks.length === 0}>
            <i className="fas fa-file-import" aria-hidden /> Импортировать
          </Button>
          {running && <Button variant="ghost" onClick={() => { cancelled.current = true; }}>Остановить</Button>}
          {!running && (fileName || totals) && <Button variant="ghost" onClick={reset}>Сбросить</Button>}
        </div>

        {totals && (
          <div className="space-y-2" aria-live="polite">
            <div className="h-2 rounded-full bg-surface-3 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
              <div className="h-full bg-brand-500 transition-all" style={{ width: `${percent}%` }} />
            </div>
            <p className="meta">
              {totals.mode === 'check' ? 'Проверка' : 'Импорт'}: {totals.processed} из {totals.total}
              {running ? ' — не закрывайте страницу.' : ''}
            </p>
          </div>
        )}
      </Card>

      {totals && !running && (
        <Card>
          <CardHeader title={totals.mode === 'check' ? 'Результат проверки (ничего не записано)' : 'Результат импорта'} />
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="success">{totals.mode === 'check' ? 'Будет создано' : 'Создано'}: {totals.created}</StatusBadge>
              <StatusBadge tone="neutral">{totals.mode === 'check' ? 'Будет обновлено' : 'Обновлено'}: {totals.updated}</StatusBadge>
              <StatusBadge tone={totals.skipped.length > 0 ? 'error' : 'neutral'}>Пропущено: {totals.skipped.length}</StatusBadge>
              <StatusBadge tone={totals.warnings.length > 0 ? 'pending' : 'neutral'}>Предупреждений: {totals.warnings.length}</StatusBadge>
            </div>
            {totals.stoppedAt && <p role="alert" className="text-sm text-danger-700">{totals.stoppedAt} Обработанные записи сохранены; файл можно загрузить повторно целиком.</p>}
            <ImportIssueTable title="Пропущенные записи" items={totals.skipped} />
            <ImportIssueTable title="Предупреждения" items={totals.warnings} />
          </div>
        </Card>
      )}
    </div>
  );
}
