import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { systemApi, type SystemStatusDto } from '../../api/system';
import { useNotification } from '../../context/NotificationContext';
import { adminErrorMessage } from '../../utils/adminErrors';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { ErrorState } from '../../components/ui/PageStates';
import { Skeleton } from '../../components/ui/Skeleton';
import { StatusBadge, type Tone } from '../../components/ui/StatusBadge';

const REFRESH_MS = 60_000;

const TASKS_LABEL: Record<SystemStatusDto['tasks']['state'], { label: string; tone: Tone }> = {
  ok: { label: 'Работают', tone: 'success' },
  stale: { label: 'Давно не запускались', tone: 'error' },
  never: { label: 'Ещё не запускались', tone: 'warning' },
};

const MAIL_STATUS_LABEL: Record<string, string> = {
  Pending: 'Ждут отправки', Sending: 'Отправляются', Retrying: 'Повтор после ошибки', Sent: 'Отправлено', Failed: 'Не отправлено',
};

const dateTime = (value: string | null) => (value ? new Date(value).toLocaleString('ru-RU') : '—');
const megabytes = (value: number | null) => (value === null ? 'без ограничения' : `${value} МБ`);

function Row({ label, children, tone }: { label: string; children: ReactNode; tone?: Tone }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-2.5">
      <span className="text-sm text-ink-500">{label}</span>
      <span className="text-sm text-ink-900 text-right">{tone ? <StatusBadge tone={tone}>{children}</StatusBadge> : children}</span>
    </div>
  );
}

/** Состояние сайта для администратора без доступа к серверу: что сломано, что с этим делать и рычаги на случай нагрузки. */
export function AdminSystemPage() {
  const { notify } = useNotification();
  const [status, setStatus] = useState<SystemStatusDto | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<'retry' | 'tasks' | null>(null);

  const load = useCallback(async () => {
    try {
      setStatus(await systemApi.getStatus());
      setFailed(false);
    } catch (e) {
      console.error('Error loading system status:', e);
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const retryFailed = async () => {
    if (busy) return;
    setBusy('retry');
    try {
      const count = await systemApi.retryFailedEmails();
      notify(count > 0 ? `Возвращено в очередь писем: ${count}` : 'Нет уведомлений для повторной отправки');
      await load();
    } catch (e) {
      notify(adminErrorMessage(e, 'Не удалось повторить отправку'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const runTasks = async () => {
    if (busy) return;
    setBusy('tasks');
    try {
      const result = await systemApi.runTasks();
      notify(result.ran ? `Фоновые задачи выполнены, писем обработано: ${result.emails}` : 'Задачи уже выполняются, подождите минуту');
      await load();
    } catch (e) {
      notify(adminErrorMessage(e, 'Не удалось запустить задачи'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const actions = <Button variant="secondary" onClick={load}><i className="fas fa-rotate" aria-hidden />Обновить</Button>;

  if (!status) {
    return (
      <div className="space-y-6">
        <PageHeader title="Состояние системы" description="Почта, фоновые задачи, сервер и журнал ошибок." actions={actions} />
        {failed
          ? <Card><ErrorState message="Не удалось получить состояние системы" onRetry={load} /></Card>
          : <div className="grid gap-6 lg:grid-cols-2">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-48 !rounded-card" />)}</div>}
      </div>
    );
  }

  const tasks = TASKS_LABEL[status.tasks.state];
  const php = status.php;

  return (
    <div className="space-y-6">
      <PageHeader title="Состояние системы" description={`Почта, фоновые задачи, сервер и журнал ошибок. Проверено: ${dateTime(status.checkedAt)}`} actions={actions} />

      {status.advice.length === 0 ? (
        <div className="p-4 bg-success-50 text-success-700 border border-success-200 rounded-xl text-sm">
          <i className="fas fa-circle-check mr-2" aria-hidden />Всё в порядке: действий не требуется.
        </div>
      ) : (
        <div role="alert" className="p-4 bg-warning-50 text-warning-700 border border-warning-200 rounded-xl text-sm space-y-2">
          <p className="font-semibold"><i className="fas fa-triangle-exclamation mr-2" aria-hidden />Требует внимания</p>
          <ul className="list-disc pl-5 space-y-1">{status.advice.map(item => <li key={item}>{item}</li>)}</ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Фоновые задачи (cron)" action={<Button size="sm" variant="secondary" loading={busy === 'tasks'} onClick={runTasks}>Запустить сейчас</Button>} />
          <div className="divide-y divide-line">
            <Row label="Состояние" tone={tasks.tone}>{tasks.label}</Row>
            <Row label="Последний запуск">{dateTime(status.tasks.lastRunAt)}{status.tasks.minutesSinceLastRun !== null && ` (${status.tasks.minutesSinceLastRun} мин назад)`}</Row>
          </div>
          <p className="meta px-5 py-3">Отправляют очередь писем, завершают прошедшие мероприятия, чистят устаревшие данные. Должны запускаться каждые 5 минут.</p>
        </Card>

        <Card>
          <CardHeader title="Почта" action={<Button size="sm" variant="secondary" loading={busy === 'retry'} disabled={status.mail.failed === 0} onClick={retryFailed}>Повторить отправку</Button>} />
          <div className="divide-y divide-line">
            <Row label="Ждут отправки" tone={status.mail.waiting > 0 && (status.mail.oldestWaitingMinutes ?? 0) >= 30 ? 'error' : undefined}>
              {status.mail.waiting}{status.mail.oldestWaitingMinutes !== null && status.mail.waiting > 0 && `, самое старое — ${status.mail.oldestWaitingMinutes} мин`}
            </Row>
            <Row label="Не отправлено" tone={status.mail.failed > 0 ? 'error' : 'success'}>{status.mail.failed}</Row>
            {Object.entries(status.mail.byStatus).filter(([key]) => key === 'Sent' || key === 'Retrying').map(([key, count]) => (
              <Row key={key} label={MAIL_STATUS_LABEL[key] ?? key}>{count}</Row>
            ))}
          </div>
          {status.mail.recentFailures.length > 0 && (
            <ul className="divide-y divide-line border-t border-line">
              {status.mail.recentFailures.map((failure, i) => (
                <li key={i} className="px-5 py-2.5 text-sm">
                  <p className="text-ink-900">{failure.recipient} · {failure.subject}</p>
                  <p className="meta break-words">{dateTime(failure.updatedAt)} · {failure.lastError ?? 'причина не записана'}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Сервер" />
          <div className="divide-y divide-line">
            <Row label="OPcache (ускоритель PHP)" tone={php.opcache ? 'success' : 'error'}>{php.opcache ? 'Включён' : 'Выключен'}</Row>
            <Row label="PHP">{php.version} ({php.sapi})</Row>
            <Row label="Память на запрос" tone={php.memoryLimitMb !== null && php.memoryLimitMb < 256 ? 'warning' : undefined}>{megabytes(php.memoryLimitMb)}</Row>
            <Row label="Размер загружаемого файла" tone={php.uploadMaxFilesizeMb !== null && php.uploadMaxFilesizeMb < 52 ? 'warning' : undefined}>{megabytes(php.uploadMaxFilesizeMb)}</Row>
            <Row label="Время на запрос">{php.maxExecutionTime === 0 ? 'без ограничения' : `${php.maxExecutionTime} с`}</Row>
            <Row label="Свободно на диске" tone={status.disk.freeMb !== null && status.disk.freeMb < 500 ? 'error' : undefined}>{status.disk.freeMb === null ? 'неизвестно' : `${status.disk.freeMb} МБ`}</Row>
          </div>
        </Card>

        <Card>
          <CardHeader title="База данных" />
          <div className="divide-y divide-line">
            <Row label="Версия">{status.database.version}</Row>
            <Row label="Размер">{status.database.sizeMb} МБ</Row>
            <Row label="Наибольший размер одной записи" tone={status.database.maxAllowedPacketMb !== null && status.database.maxAllowedPacketMb < 64 ? 'warning' : undefined}>
              {status.database.maxAllowedPacketMb === null ? 'неизвестно' : `${status.database.maxAllowedPacketMb} МБ`}
            </Row>
            {status.database.largestTables.map(table => (
              <Row key={table.name} label={table.name}>{table.sizeMb} МБ · {table.rows.toLocaleString('ru-RU')} строк</Row>
            ))}
          </div>
          <p className="meta px-5 py-3">Фотографии и файлы хранятся в базе: резервная копия базы — это копия всего сайта.</p>
        </Card>

        <Card>
          <CardHeader title="Защита от нагрузки" />
          <div className="divide-y divide-line">
            <Row label="Кэш публичных списков">{status.load.publicCacheSeconds > 0 ? `${status.load.publicCacheSeconds} с` : 'выключен'}</Row>
            <Row label="Ограничение запросов с одного адреса">{status.load.floodLimitPerMinute > 0 ? `${status.load.floodLimitPerMinute} в минуту` : 'выключено'}</Row>
            <Row label="Медленных запросов сегодня" tone={status.log.slowRequestsToday > 20 ? 'warning' : undefined}>{status.log.slowRequestsToday}</Row>
          </div>
          <p className="meta px-5 py-3">
            Если сайт тормозит: увеличьте PUBLIC_CACHE_SECONDS до 120–300 и включите RATE_GLOBAL_PER_IP_PER_MINUTE (240) в backend/.env.local.php.
            Крайняя мера — переименовать maintenance.off в maintenance.on в корне сайта. Подробно — README, раздел 14.
          </p>
        </Card>

        <Card>
          <CardHeader title="Журнал ошибок за сегодня" />
          <div className="divide-y divide-line">
            <Row label="Ошибок" tone={status.log.errorsToday > 0 ? 'error' : 'success'}>{status.log.errorsToday}</Row>
          </div>
          {status.log.recentErrors.length > 0 && (
            <ul className="divide-y divide-line border-t border-line">
              {status.log.recentErrors.map((entry, i) => (
                <li key={i} className="px-5 py-2.5 text-sm">
                  <p className="text-ink-900 break-words">{entry.message}</p>
                  <p className="meta">{dateTime(entry.at)} · {entry.level}{entry.traceId && ` · код ${entry.traceId}`}</p>
                </li>
              ))}
            </ul>
          )}
          <p className="meta px-5 py-3">Полный журнал — файлы в backend/var/log. Код из сообщения об ошибке у пользователя ищите в журнале за тот же день.</p>
        </Card>
      </div>
    </div>
  );
}
