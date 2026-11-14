import { useEffect, useRef, useState } from 'react';
import { adminApi, type ImportIssueDto } from '../../api/admin';
import { useNotification } from '../../context/NotificationContext';
import { adminErrorMessage } from '../../utils/adminErrors';
import { Button } from '../ui/Button';
import { Card, CardHeader } from '../ui/Card';
import { useConfirm } from '../ui/ConfirmDialog';
import { StatusBadge } from '../ui/StatusBadge';
import { ImportIssueTable } from './ImportIssueTable';

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

const PREFIX_PATTERN = /^[A-Za-z0-9_]{1,40}$/;
/** Пользователей в одной порции: сервер оборачивает каждый пароль в bcrypt, порция должна уложиться в лимит времени хостинга. */
const CHUNK_SIZE = 25;

/**
 * Импорт пользователей прямо из таблиц WordPress, которые лежат в той же базе данных, что и сайт: выгружать CSV не нужно.
 * Сервер отдаёт пользователей порциями по ID, страница запрашивает следующую, пока порции не закончатся.
 */
export function WordPressDatabaseImport() {
  const { notify } = useNotification();
  const confirm = useConfirm();
  const cancelled = useRef(false);
  const [prefix, setPrefix] = useState('wp_');
  const [running, setRunning] = useState(false);
  const [totals, setTotals] = useState<Totals | null>(null);

  const prefixValid = PREFIX_PATTERN.test(prefix);

  useEffect(() => {
    if (!running) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [running]);

  const run = async (mode: Mode) => {
    if (mode === 'import' && !(await confirm({
      title: 'Импортировать пользователей из таблиц WordPress?',
      message: `Будут прочитаны таблицы ${prefix}users и ${prefix}usermeta. Уже импортированные пользователи обновятся, их пароли не изменятся. Аккаунты, созданные на сайте, не перезаписываются. Таблицы WordPress не изменяются.`,
      confirmLabel: 'Импортировать',
    }))) return;

    cancelled.current = false;
    setRunning(true);
    let acc: Totals = { mode, created: 0, updated: 0, skipped: [], warnings: [], processed: 0, total: 0, stoppedAt: null };
    setTotals(acc);
    let afterId = 0;
    for (;;) {
      if (cancelled.current) { acc = { ...acc, stoppedAt: `Остановлено после пользователя с ID ${afterId}.` }; break; }
      try {
        const report = await adminApi.importWordPressDatabase(prefix, afterId, CHUNK_SIZE, mode === 'check');
        acc = {
          ...acc,
          created: acc.created + report.created,
          updated: acc.updated + report.updated,
          skipped: [...acc.skipped, ...report.skipped],
          warnings: [...acc.warnings, ...report.warnings],
          processed: acc.processed + report.created + report.updated + report.skipped.length,
          total: report.total,
        };
        setTotals(acc);
        if (report.done || report.lastId <= afterId) break;
        afterId = report.lastId;
      } catch (e) {
        acc = { ...acc, stoppedAt: `Ошибка после пользователя с ID ${afterId}: ${adminErrorMessage(e, 'сервер не принял порцию.')}` };
        break;
      }
    }
    setTotals(acc);
    setRunning(false);
    if (acc.stoppedAt) notify(acc.stoppedAt, 'error');
    else notify(mode === 'check' ? 'Проверка завершена' : 'Импорт завершён');
  };

  const percent = totals && totals.total > 0 ? Math.min(100, Math.round((totals.processed / totals.total) * 100)) : 0;

  return (
    <>
      <Card className="p-5 space-y-4">
        <ul className="text-sm text-ink-500 list-disc pl-5 space-y-1">
          <li>Нужны таблицы WordPress в этой же базе данных: <code>wp_users</code> и <code>wp_usermeta</code> (префикс может быть другим). Они только читаются.</li>
          <li>Переносятся логин, e-mail, имя, роли, настройки и пароль: пользователи входят с прежним логином или e-mail и паролем.</li>
          <li>Повторный запуск безопасен: изменятся только данные WordPress, пароли — нет.</li>
        </ul>

        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="block text-ink-500 mb-1">Префикс таблиц WordPress</span>
            <input value={prefix} onChange={e => setPrefix(e.target.value.trim())} disabled={running} maxLength={40}
              aria-invalid={!prefixValid} spellCheck={false} autoCapitalize="none"
              className="w-40 rounded-control border border-ctrl bg-surface-2 px-3 py-2 text-ink-900" />
          </label>
          <Button variant="secondary" onClick={() => run('check')} disabled={running || !prefixValid}>
            <i className="fas fa-list-check" aria-hidden /> Проверить таблицы
          </Button>
          <Button onClick={() => run('import')} disabled={running || !prefixValid}>
            <i className="fas fa-database" aria-hidden /> Импортировать
          </Button>
          {running && <Button variant="ghost" onClick={() => { cancelled.current = true; }}>Остановить</Button>}
          {!running && totals && <Button variant="ghost" onClick={() => setTotals(null)}>Сбросить</Button>}
        </div>
        {!prefixValid && <p role="alert" className="text-sm text-danger-700">Префикс — до 40 латинских букв, цифр и знаков подчёркивания.</p>}

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
          <CardHeader title={totals.mode === 'check' ? 'Результат проверки таблиц (ничего не записано)' : 'Результат импорта из таблиц'} />
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="success">{totals.mode === 'check' ? 'Будет создано' : 'Создано'}: {totals.created}</StatusBadge>
              <StatusBadge tone="neutral">{totals.mode === 'check' ? 'Будет обновлено' : 'Обновлено'}: {totals.updated}</StatusBadge>
              <StatusBadge tone={totals.skipped.length > 0 ? 'error' : 'neutral'}>Пропущено: {totals.skipped.length}</StatusBadge>
              <StatusBadge tone={totals.warnings.length > 0 ? 'pending' : 'neutral'}>Предупреждений: {totals.warnings.length}</StatusBadge>
            </div>
            {totals.stoppedAt && <p role="alert" className="text-sm text-danger-700">{totals.stoppedAt} Обработанные записи сохранены; запуск можно повторить целиком.</p>}
            <ImportIssueTable title="Пропущенные пользователи" items={totals.skipped} lineLabel="ID в таблице" />
            <ImportIssueTable title="Предупреждения" items={totals.warnings} lineLabel="ID в таблице" />
          </div>
        </Card>
      )}
    </>
  );
}
