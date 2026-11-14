import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reportsApi, REPORT_TEXT_MAX, type ContentReport, type ReportResolution, type ReportStatus } from '../../api/moderation';
import { useNotification } from '../../context/NotificationContext';
import { adminErrorMessage } from '../../utils/adminErrors';
import { REPORT_REASONS, REPORT_RESOLUTIONS, REPORT_STATUSES } from '../../utils/moderationLabels';
import { Modal } from '../Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState, ErrorState } from '../ui/PageStates';
import { Pagination } from '../ui/Pagination';
import { Segmented } from '../ui/Segmented';
import { ListSkeleton } from '../ui/Skeleton';
import { StatusBadge } from '../ui/StatusBadge';

const TAKE = 20;
type Filter = ReportStatus | 'All';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'Open', label: 'Открытые' },
  { value: 'Resolved', label: 'С мерами' },
  { value: 'Dismissed', label: 'Отклонённые' },
  { value: 'All', label: 'Все' },
];

const when = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Жалобы пользователей на профили: открытые первыми, решение — через модальное окно с выбором меры. */
export function ReportsQueue({ onOpenCountChange }: { onOpenCountChange?: (count: number) => void }) {
  const [filter, setFilter] = useState<Filter>('Open');
  const [skip, setSkip] = useState(0);
  const [items, setItems] = useState<ContentReport[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState<ContentReport | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const page = await reportsApi.list(filter === 'All' ? null : filter, skip, TAKE);
      if (page.items.length === 0 && skip > 0) { setSkip(Math.max(0, skip - TAKE)); return; }
      setItems(page.items); setTotal(page.totalCount);
      if (filter === 'Open') onOpenCountChange?.(page.totalCount);
    } catch (err) { setError(adminErrorMessage(err, 'Не удалось загрузить жалобы.')); }
    finally { setLoading(false); }
  }, [filter, skip, onOpenCountChange]);
  useEffect(() => { void load(); }, [load]);

  const changeFilter = (f: Filter) => { setFilter(f); setSkip(0); };

  return (
    <div className="space-y-4">
      <Segmented label="Статус жалоб" options={FILTERS} value={filter} onChange={changeFilter} />

      {error ? <ErrorState message={error} onRetry={load} />
        : loading && items.length === 0 ? <ListSkeleton />
        : items.length === 0 ? <EmptyState icon="fa-flag-checkered" title={filter === 'Open' ? 'Открытых жалоб нет' : 'Жалоб нет'} hint="Новые жалобы появятся здесь и в уведомлениях." />
        : (
          <ul className="space-y-3">
            {items.map(r => (
              <li key={r.id}>
                <Card className="p-4 flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/users/${r.targetUserId}`} className="font-semibold text-ink-900 hover:underline truncate">{r.targetDisplayName}</Link>
                      <StatusBadge tone={REPORT_STATUSES[r.status].tone}>{REPORT_STATUSES[r.status].label}</StatusBadge>
                      <StatusBadge tone="brand">{REPORT_REASONS[r.reason]}</StatusBadge>
                    </div>
                    {r.comment && <p className="text-sm text-ink-700 whitespace-pre-line break-words">«{r.comment}»</p>}
                    <p className="meta">Поступила {when(r.createdAt)}</p>
                    {r.resolution && (
                      <p className="meta">
                        Решение: {REPORT_RESOLUTIONS[r.resolution].label}{r.resolvedAt ? `, ${when(r.resolvedAt)}` : ''}
                        {r.resolutionNote ? ` — ${r.resolutionNote}` : ''}
                      </p>
                    )}
                  </div>
                  {r.status === 'Open' && (
                    <Button size="sm" onClick={() => setResolving(r)}>
                      <i className="fas fa-gavel" aria-hidden /> Рассмотреть
                    </Button>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}

      {total > TAKE && <Pagination skip={skip} take={TAKE} total={total} onChange={setSkip} />}

      {resolving && (
        <ResolveReportModal report={resolving} onClose={() => setResolving(null)}
          onResolved={() => { setResolving(null); void load(); }} />
      )}
    </div>
  );
}

function ResolveReportModal({ report, onClose, onResolved }: { report: ContentReport; onClose: () => void; onResolved: () => void }) {
  const { notify } = useNotification();
  const [resolution, setResolution] = useState<ReportResolution>('Dismiss');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      await reportsApi.resolve(report.id, resolution, note.trim() || null);
      notify(resolution === 'Dismiss' ? 'Жалоба закрыта без мер' : `Жалоба закрыта: ${REPORT_RESOLUTIONS[resolution].label.toLowerCase()}`);
      onResolved();
    } catch (err) {
      setError(adminErrorMessage(err, 'Не удалось закрыть жалобу.'));
    } finally { setBusy(false); }
  };

  return (
    <Modal isOpen onClose={() => (busy ? undefined : onClose())} title={`Жалоба на «${report.targetDisplayName}»`}>
      <div className="space-y-4">
        <div className="rounded-control border border-line bg-surface-3 p-3 space-y-1 text-sm">
          <p><span className="text-ink-500">Причина:</span> <span className="text-ink-900">{REPORT_REASONS[report.reason]}</span></p>
          {report.comment && <p className="text-ink-700 whitespace-pre-line break-words">«{report.comment}»</p>}
          <p className="meta">
            <Link to={`/users/${report.targetUserId}`} target="_blank" rel="noopener" className="hover:underline">
              Открыть профиль <i className="fas fa-arrow-up-right-from-square text-[10px]" aria-hidden />
            </Link>
          </p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm text-ink-700 mb-1">Мера</legend>
          {(Object.keys(REPORT_RESOLUTIONS) as ReportResolution[]).map(key => {
            const r = REPORT_RESOLUTIONS[key];
            return (
              <label key={key} className={`flex gap-3 items-start rounded-control border p-3 cursor-pointer ${resolution === key ? 'border-brand-500 bg-brand-50/10' : 'border-line'}`}>
                <input type="radio" name="resolution" value={key} checked={resolution === key} onChange={() => setResolution(key)} className="mt-1" />
                <span>
                  <span className={`font-medium ${r.danger ? 'text-danger-700' : 'text-ink-900'}`}><i className={`fas ${r.icon} mr-1.5`} aria-hidden />{r.label}</span>
                  <span className="block meta">{r.hint}</span>
                </span>
              </label>
            );
          })}
        </fieldset>

        <label className="block text-sm text-ink-700">
          Заметка модератора (необязательно, видна только администраторам)
          <textarea value={note} onChange={e => setNote(e.target.value.slice(0, REPORT_TEXT_MAX))} rows={3}
            className="mt-1.5 w-full rounded-control border border-line-strong bg-surface-3 p-3 text-ink-900" />
        </label>
        <p className="meta text-right">{note.length}/{REPORT_TEXT_MAX}</p>

        {error && <p role="alert" className="text-sm text-danger-700">{error}</p>}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={busy}>Отмена</Button>
          <Button variant={REPORT_RESOLUTIONS[resolution].danger ? 'danger' : 'primary'} loading={busy} onClick={submit}>
            {resolution === 'Dismiss' ? 'Закрыть без мер' : 'Применить меру и закрыть'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
