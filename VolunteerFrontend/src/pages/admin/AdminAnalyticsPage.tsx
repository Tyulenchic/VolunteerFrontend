import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { adminApi } from '../../api/admin';
import { useLatestRequest } from '../../hooks/useListHelpers';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState, ErrorState } from '../../components/ui/PageStates';
import { Skeleton } from '../../components/ui/Skeleton';
import type { AdminAnalyticsDto } from '../../types/admin';

const formatMonth = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' });
  } catch {
    return dateString;
  }
};

interface Col<T> { label: string; value: (row: T) => number; tone?: string; }

/** Month-by-month table; the first column also draws a thin bar scaled to the largest value shown. */
function TrendTable<T extends { month: string }>({ title, rows, cols }: { title: string; rows: T[]; cols: Col<T>[] }) {
  const max = Math.max(1, ...rows.map(r => cols[0].value(r)));
  return (
    <Card className="overflow-hidden">
      <CardHeader title={title} />
      {rows.length === 0 ? (
        <EmptyState icon="fa-chart-simple" title="За выбранный период данных нет" />
      ) : (
        <div className="relative overflow-x-auto scroll-soft">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 text-left">Месяц</th>
                {cols.map(c => <th key={c.label} className="px-4 text-right">{c.label}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(r => (
                <tr key={r.month}>
                  <td className="px-4 py-2.5 text-ink-700 whitespace-nowrap capitalize">{formatMonth(r.month)}</td>
                  {cols.map((c, i) => (
                    <td key={c.label} className={`px-4 py-2.5 text-right tabular-nums ${c.tone ?? 'text-ink-700'} ${i === 0 ? 'min-w-[8rem]' : ''}`}>
                      {i === 0 ? (
                        <div className="flex items-center justify-end gap-3">
                          <div className="h-1 w-16 rounded-full bg-surface-3 overflow-hidden" aria-hidden><div className="h-full bg-brand-500" style={{ width: `${(c.value(r) / max) * 100}%` }} /></div>
                          <span className="font-medium text-ink-900">{c.value(r)}</span>
                        </div>
                      ) : c.value(r)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function TopList({ title, items, empty }: { title: string; items: { id: string; name: string; meta: string }[]; empty: string }) {
  return (
    <Card>
      <CardHeader title={title} />
      {items.length === 0 ? (
        <p className="px-5 py-6 text-sm text-ink-400">{empty}</p>
      ) : (
        <ol className="divide-y divide-line">
          {items.map((it, i) => (
            <li key={it.id} className="flex items-center gap-3 px-5 py-2.5">
              <span className="w-5 text-center text-xs font-semibold text-ink-400 tabular-nums">{i + 1}</span>
              <Avatar name={it.name} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink-900 truncate">{it.name}</p>
                <p className="meta truncate">{it.meta}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

export function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AdminAnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [monthsBack, setMonthsBack] = useState(12);

  const beginRequest = useLatestRequest();
  const load = useCallback(async () => {
    const isCurrent = beginRequest();
    try {
      setLoading(true);
      setFailed(false);
      const data = await adminApi.getAnalytics(monthsBack);
      if (isCurrent()) setAnalytics(data);
    } catch (e) {
      if (!isCurrent()) return;
      console.error(e);
      setFailed(true);
    } finally {
      if (isCurrent()) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthsBack]);

  useEffect(() => { load(); }, [load]);

  const handleExportCSV = () => {
    if (!analytics) return;
    const header = 'Месяц,Всего регистраций,Волонтёров,Организаторов\n';
    const rows = analytics.registrationTrends
      .map((r) => `${formatMonth(r.month)},${r.totalRegistrations},${r.volunteerRegistrations},${r.organizerRegistrations}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const actions: ReactNode = (
    <>
      <select aria-label="Период" value={monthsBack} onChange={(e) => setMonthsBack(parseInt(e.target.value))} className="px-3 py-2 text-sm">
        <option value={3}>3 месяца</option>
        <option value={6}>6 месяцев</option>
        <option value={12}>12 месяцев</option>
        <option value={24}>24 месяца</option>
      </select>
      <Button variant="secondary" onClick={handleExportCSV} disabled={!analytics}><i className="fas fa-download" />CSV</Button>
    </>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Аналитика" description="Динамика регистраций, заявок и мероприятий за выбранный период." actions={actions} />

      {loading && !analytics ? (
        <div className="grid gap-6 lg:grid-cols-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-64 !rounded-card" />)}</div>
      ) : failed || !analytics ? (
        <Card><ErrorState message="Не удалось загрузить аналитику" onRetry={load} /></Card>
      ) : (
        <div className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <div className="grid gap-6 xl:grid-cols-3">
            <TopList title="Популярные мероприятия" empty="Данных пока нет"
              items={analytics.topEvents.map(e => ({ id: e.id, name: e.title, meta: `${e.participantsCount} участников` }))} />
            <TopList title="Активные волонтёры" empty="Данных пока нет"
              items={analytics.topVolunteers.map(v => ({ id: v.id, name: v.name, meta: `${v.eventsAttended} мероприятий · ${v.hoursVolunteered} ч` }))} />
            <TopList title="Активные организаторы" empty="Данных пока нет"
              items={analytics.topOrganizers.map(o => ({ id: o.id, name: o.name, meta: `${o.eventsCreated} мероприятий · ${o.totalParticipants} участников` }))} />
          </div>

          <p className="meta">
            В среднем {analytics.averageEventParticipants.toFixed(1)} участников на мероприятие · изменение числа пользователей за период: {analytics.userGrowthPercentage > 0 ? '+' : ''}{analytics.userGrowthPercentage}%
          </p>

          <div className="grid gap-6 xl:grid-cols-3">
            <TrendTable title="Регистрации" rows={analytics.registrationTrends}
              cols={[{ label: 'Всего', value: r => r.totalRegistrations }, { label: 'Волонтёры', value: r => r.volunteerRegistrations }, { label: 'Организаторы', value: r => r.organizerRegistrations }]} />
            <TrendTable title="Заявки" rows={analytics.participationTrends}
              cols={[{ label: 'Всего', value: r => r.totalApplications }, { label: 'Одобрено', value: r => r.approvedApplications, tone: 'text-success-700' }, { label: 'Отклонено', value: r => r.rejectedApplications, tone: 'text-danger-700' }]} />
            <TrendTable title="Мероприятия" rows={analytics.eventTrends}
              cols={[{ label: 'Всего', value: r => r.totalEvents }, { label: 'Опубл.', value: r => r.publishedEvents, tone: 'text-success-700' }, { label: 'Заверш.', value: r => r.completedEvents, tone: 'text-info-700' }, { label: 'Отмен.', value: r => r.cancelledEvents, tone: 'text-danger-700' }]} />
          </div>
        </div>
      )}
    </div>
  );
}
