import { Fragment, useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { AUDIT_ACTIONS, auditAction } from '../../utils/auditActions';
import { useLatestRequest, usePaging } from '../../hooks/useListHelpers';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState, ErrorState } from '../../components/ui/PageStates';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { AuditLogEntryDto } from '../../types/audit';

const TAKE = 20;

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('ru-RU');
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntryDto[]>([]);
  const [total, setTotal] = useState(0);
  const [actionType, setActionType] = useState('');
  const [skip, setSkip] = usePaging(actionType);
  const beginRequest = useLatestRequest();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    const isCurrent = beginRequest();
    setLoading(true);
    setFailed(false);
    try {
      const res = await adminApi.getAuditLog(skip, TAKE, undefined, actionType || undefined);
      if (!isCurrent()) return;
      setLogs(res.Items || []);
      setTotal(res.Total || 0);
    } catch (e) {
      if (!isCurrent()) return;
      console.error('Error loading audit log:', e);
      setLogs([]);
      setTotal(0);
      setFailed(true);
    } finally {
      if (isCurrent()) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, actionType]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <PageHeader title="Журнал действий" description="Что и когда делали администраторы. Новые записи сверху." />

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-[13px] text-ink-500">
          Действие
          <select value={actionType} onChange={e => setActionType(e.target.value)} className="px-3 py-2 text-sm min-w-[16rem]">
            <option value="">Все действия</option>
            {Object.entries(AUDIT_ACTIONS).map(([key, a]) => <option key={key} value={key}>{a.label}</option>)}
          </select>
        </label>
        {actionType && <Button variant="ghost" size="sm" onClick={() => setActionType('')}>Сбросить</Button>}
        <span className="meta ml-auto">Поиск по тексту журнал не поддерживает</span>
      </div>

      <Card className="overflow-hidden">
        {loading && logs.length === 0 ? (
          <ListSkeleton rows={10} />
        ) : failed ? (
          <ErrorState message="Не удалось загрузить журнал" onRetry={load} />
        ) : logs.length === 0 ? (
          <EmptyState icon="fa-clock-rotate-left"
            title={actionType ? 'Записей с таким действием нет' : 'Журнал пока пуст'}
            hint={actionType ? 'Выберите другой тип действия.' : 'Действия администраторов будут фиксироваться здесь автоматически.'}
            action={actionType ? <Button variant="secondary" size="sm" onClick={() => setActionType('')}>Показать все</Button> : undefined} />
        ) : (
          <div className={`relative overflow-x-auto scroll-soft transition-opacity ${loading ? 'opacity-60' : ''}`}>
            <table className="rtable w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="px-4 text-left w-[10.5rem]">Время</th>
                  <th className="px-4 text-left">Администратор</th>
                  <th className="px-4 text-left">Действие</th>
                  <th className="px-4 text-left hidden lg:table-cell">Подробности</th>
                  <th className="px-4 text-left hidden 2xl:table-cell">IP</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {logs.map(l => {
                  const a = auditAction(l.actionType);
                  const expanded = open === l.id;
                  return (
                    <Fragment key={l.id}>
                      <tr className="cursor-pointer" onClick={() => setOpen(expanded ? null : l.id)}>
                        <td className="px-4 py-2.5 whitespace-nowrap rt-full">
                          <time dateTime={l.createdAt} className="mono text-ink-700">{fmtDate(l.createdAt)} <span className="text-ink-400">{fmtTime(l.createdAt)}</span></time>
                        </td>
                        <td className="px-4 py-2.5 text-ink-900 whitespace-nowrap">{l.adminName}</td>
                        <td className="px-4 py-2.5"><StatusBadge tone={a.tone}>{a.label}</StatusBadge></td>
                        <td className="px-4 py-2.5 hidden lg:table-cell text-ink-500 max-w-[28rem] truncate">{l.details}</td>
                        <td className="px-4 py-2.5 hidden 2xl:table-cell mono text-ink-400">{l.ipAddress ?? '—'}</td>
                        <td className="px-2 py-2.5 rt-end">
                          <button type="button" className="icon-btn !w-7 !h-7" aria-expanded={expanded} aria-label={expanded ? 'Скрыть подробности' : 'Показать подробности'}
                            onClick={e => { e.stopPropagation(); setOpen(expanded ? null : l.id); }}>
                            <i className={`fas fa-chevron-down text-[10px] transition-transform ${expanded ? 'rotate-180' : ''}`} />
                          </button>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="!bg-surface-2">
                          <td colSpan={6} className="px-4 py-3">
                            <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-[auto_1fr] text-[13px]">
                              <dt className="text-ink-400">Тип</dt><dd className="mono text-ink-700">{l.actionType}</dd>
                              <dt className="text-ink-400">Подробности</dt><dd className="text-ink-700 whitespace-pre-wrap break-words">{l.details || '—'}</dd>
                              <dt className="text-ink-400">IP-адрес</dt><dd className="mono text-ink-700">{l.ipAddress ?? '—'}</dd>
                            </dl>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination skip={skip} take={TAKE} total={total} onChange={setSkip} />
      </Card>
    </div>
  );
}
