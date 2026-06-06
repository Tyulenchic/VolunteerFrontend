import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { Spinner } from '../../components/Spinner';
import type {
  AdminAnalyticsDto,
} from '../../types/admin';

export function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AdminAnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthsBack, setMonthsBack] = useState(12);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await adminApi.getAnalytics(monthsBack);
        setAnalytics(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [monthsBack]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Spinner />
          <p className="text-gray-500 mt-3">Загрузка аналитики...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return <div className="text-center text-gray-500">Ошибка загрузки данных</div>;
  }

  const handleExportCSV = () => {
    // Export registrations to CSV
    const header = 'Месяц,Всего регистраций,Волонтёров,Организаторов\n';
    const rows = analytics.registrationTrends
      .map(
        (r) =>
          `${formatMonth(r.month)},${r.totalRegistrations},${r.volunteerRegistrations},${r.organizerRegistrations}`
      )
      .join('\n');
    const csv = header + rows;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatMonth = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Аналитика</h1>
          <p className="text-gray-500 text-sm mt-1">Статистика и тренды системы</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={monthsBack}
            onChange={(e) => setMonthsBack(parseInt(e.target.value))}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
          >
            <option value={3}>Последние 3 месяца</option>
            <option value={6}>Последние 6 месяцев</option>
            <option value={12}>Последние 12 месяцев</option>
            <option value={24}>Последние 24 месяца</option>
          </select>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition whitespace-nowrap"
          >
            <i className="fas fa-download mr-2" /> CSV
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <p className="text-gray-400 text-sm mb-1">Рост пользователей</p>
          <p className="text-3xl font-bold text-green-400">+{analytics.userGrowthPercentage}%</p>
        </div>
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <p className="text-gray-400 text-sm mb-1">Средне участников на мероприятие</p>
          <p className="text-3xl font-bold text-blue-400">{analytics.averageEventParticipants.toFixed(1)}</p>
        </div>
      </div>

      {/* Top Events */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white text-sm">Топ мероприятий</h2>
        </div>
        <div className="divide-y divide-gray-800">
          {analytics.topEvents.length === 0 ? (
            <p className="text-gray-500 text-sm p-5">Нет данных</p>
          ) : (
            analytics.topEvents.map((event, idx) => (
              <div key={event.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-800/50 transition">
                <div className="flex items-center justify-center w-8 h-8 bg-primary/20 rounded text-primary text-sm font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{event.title}</p>
                  <p className="text-gray-500 text-xs">
                    {event.participantsCount} участников · {event.views} просмотров
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Top Volunteers */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white text-sm">Топ волонтёров</h2>
        </div>
        <div className="divide-y divide-gray-800">
          {analytics.topVolunteers.length === 0 ? (
            <p className="text-gray-500 text-sm p-5">Нет данных</p>
          ) : (
            analytics.topVolunteers.map((vol, idx) => (
              <div key={vol.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-800/50 transition">
                <div className="flex items-center justify-center w-8 h-8 bg-green-500/20 rounded text-green-400 text-sm font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{vol.name}</p>
                  <p className="text-gray-500 text-xs">
                    {vol.eventsAttended} мероприятий · {vol.hoursVolunteered} часов
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Top Organizers */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white text-sm">Топ организаторов</h2>
        </div>
        <div className="divide-y divide-gray-800">
          {analytics.topOrganizers.length === 0 ? (
            <p className="text-gray-500 text-sm p-5">Нет данных</p>
          ) : (
            analytics.topOrganizers.map((org, idx) => (
              <div key={org.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-800/50 transition">
                <div className="flex items-center justify-center w-8 h-8 bg-purple-500/20 rounded text-purple-400 text-sm font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{org.name}</p>
                  <p className="text-gray-500 text-xs">
                    {org.eventsCreated} мероприятий · {org.totalParticipants} участников
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Trends Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registrations */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h2 className="font-semibold text-white text-sm">Тренд регистраций</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-300">Месяц</th>
                  <th className="px-4 py-2 text-right text-gray-300">Всего</th>
                  <th className="px-4 py-2 text-right text-gray-300">Вол.</th>
                  <th className="px-4 py-2 text-right text-gray-300">Орг.</th>
                </tr>
              </thead>
               <tbody className="divide-y divide-gray-800">
                 {analytics.registrationTrends.map((r) => (
                   <tr key={r.month} className="hover:bg-gray-800/50">
                     <td className="px-4 py-2 text-gray-300">{formatMonth(r.month)}</td>
                     <td className="px-4 py-2 text-right text-white font-medium">{r.totalRegistrations}</td>
                     <td className="px-4 py-2 text-right text-green-400">{r.volunteerRegistrations}</td>
                     <td className="px-4 py-2 text-right text-blue-400">{r.organizerRegistrations}</td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </div>

        {/* Participations */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h2 className="font-semibold text-white text-sm">Тренд заявок</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-300">Месяц</th>
                  <th className="px-4 py-2 text-right text-gray-300">Всего</th>
                  <th className="px-4 py-2 text-right text-gray-300">Одоб.</th>
                  <th className="px-4 py-2 text-right text-gray-300">Откл.</th>
                </tr>
              </thead>
               <tbody className="divide-y divide-gray-800">
                 {analytics.participationTrends.map((p) => (
                   <tr key={p.month} className="hover:bg-gray-800/50">
                     <td className="px-4 py-2 text-gray-300">{formatMonth(p.month)}</td>
                     <td className="px-4 py-2 text-right text-white font-medium">{p.totalApplications}</td>
                     <td className="px-4 py-2 text-right text-green-400">{p.approvedApplications}</td>
                     <td className="px-4 py-2 text-right text-red-400">{p.rejectedApplications}</td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Events Trend */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white text-sm">Тренд мероприятий</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-4 py-2 text-left text-gray-300">Месяц</th>
                <th className="px-4 py-2 text-right text-gray-300">Всего</th>
                <th className="px-4 py-2 text-right text-gray-300">Опубл.</th>
                <th className="px-4 py-2 text-right text-gray-300">Завершено</th>
                <th className="px-4 py-2 text-right text-gray-300">Отменено</th>
              </tr>
            </thead>
             <tbody className="divide-y divide-gray-800">
               {analytics.eventTrends.map((e) => (
                 <tr key={e.month} className="hover:bg-gray-800/50">
                   <td className="px-4 py-2 text-gray-300">{formatMonth(e.month)}</td>
                   <td className="px-4 py-2 text-right text-white font-medium">{e.totalEvents}</td>
                   <td className="px-4 py-2 text-right text-green-400">{e.publishedEvents}</td>
                   <td className="px-4 py-2 text-right text-blue-400">{e.completedEvents}</td>
                   <td className="px-4 py-2 text-right text-red-400">{e.cancelledEvents}</td>
                 </tr>
               ))}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}