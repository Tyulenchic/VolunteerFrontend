import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { Spinner } from '../../components/Spinner';
import type { AdminDashboardDto } from '../../types/admin';

export function AdminDashboard() {
  const [dashboard, setDashboard] = useState<AdminDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await adminApi.getDashboard();
        setDashboard(data);
      } catch (e) {
        console.error('Error loading dashboard:', e);
        setError('Ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Spinner />
          <p className="text-gray-500 mt-3">Загрузка дашборда...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 p-5">{error}</div>;
  }

  if (!dashboard) {
    return <div className="text-center text-gray-500">Нет данных</div>;
  }

  const stats = dashboard.statistics;
  const STATUS_BADGE: Record<string, string> = {
    Draft: 'bg-gray-700 text-gray-300',
    Published: 'bg-green-900/60 text-green-400',
    Cancelled: 'bg-red-900/60 text-red-400',
    Completed: 'bg-blue-900/60 text-blue-400',
  };

  const STATUS_LABEL: Record<string, string> = {
    Draft: 'Черновик',
    Published: 'Опубликован',
    Cancelled: 'Отменён',
    Completed: 'Завершён',
  };

  const fmtDate = (s: string) => new Date(s).toLocaleDateString('ru-RU');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Дашборд</h1>
        <p className="text-gray-500 text-sm mt-1">Общая статистика системы</p>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Всего пользователей', value: stats.totalUsers ?? 0, icon: 'fa-users', color: 'text-blue-400', bg: 'bg-blue-500/10', link: '/admin/users' },
          { label: 'Активных', value: stats.activeUsers ?? 0, icon: 'fa-user-check', color: 'text-green-400', bg: 'bg-green-500/10', link: '/admin/users' },
          { label: 'Заблокированных', value: stats.blockedUsers ?? 0, icon: 'fa-user-slash', color: 'text-red-400', bg: 'bg-red-500/10', link: '/admin/users' },
          { label: 'Всего мероприятий', value: stats.totalEvents ?? 0, icon: 'fa-calendar-alt', color: 'text-purple-400', bg: 'bg-purple-500/10', link: '/admin/events' },
        ].map((stat) => (
          <Link key={stat.label} to={stat.link} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 hover:border-gray-600 transition no-underline block group">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
                <i className={`fas ${stat.icon} ${stat.color}`} />
              </div>
              <i className="fas fa-arrow-right text-gray-700 group-hover:text-gray-400 transition" />
            </div>
            <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
            <div className="text-gray-500 text-sm">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Event Status Grid */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Мероприятия по статусу</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Черновики', value: stats.draftEvents ?? 0, icon: 'fa-pencil-alt', color: 'text-gray-400', bg: 'bg-gray-700/40', status: 'Draft' },
            { label: 'Опубликованы', value: stats.publishedEvents ?? 0, icon: 'fa-globe', color: 'text-green-400', bg: 'bg-green-900/30', status: 'Published' },
            { label: 'Завершены', value: stats.completedEvents ?? 0, icon: 'fa-check-circle', color: 'text-blue-400', bg: 'bg-blue-900/30', status: 'Completed' },
            { label: 'Отменены', value: stats.cancelledEvents ?? 0, icon: 'fa-times-circle', color: 'text-red-400', bg: 'bg-red-900/30', status: 'Cancelled' },
          ].map((item) => (
            <Link key={item.label} to={`/admin/events?status=${item.status}`} className="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-gray-600 transition no-underline block">
              <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center mb-2`}>
                <i className={`fas ${item.icon} ${item.color} text-sm`} />
              </div>
              <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
              <div className="text-gray-500 text-xs mt-1">{item.label}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Participations */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h3 className="font-semibold text-white text-sm">Последние заявки</h3>
            <Link to="/admin/participations" className="text-primary text-xs hover:underline">Все →</Link>
          </div>
          <div className="divide-y divide-gray-800">
            {dashboard.recentParticipations.length === 0 ? (
              <p className="text-gray-500 text-sm p-5">Нет данных</p>
            ) : (
              dashboard.recentParticipations.map((p) => {
                const statusColor =
                  p.status === 'Approved'
                    ? 'bg-green-900/60 text-green-400'
                    : p.status === 'Rejected'
                    ? 'bg-red-900/60 text-red-400'
                    : 'bg-yellow-900/60 text-yellow-400';
                const statusLabel = p.status === 'Approved' ? 'Одобрена' : p.status === 'Rejected' ? 'Отклонена' : 'Ожидает';

                return (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-800/50 transition">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 text-primary text-xs font-bold">
                      {p.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{p.userName}</p>
                      <p className="text-gray-500 text-xs truncate">{p.eventTitle}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h3 className="font-semibold text-white text-sm">Ближайшие мероприятия</h3>
            <Link to="/admin/events" className="text-primary text-xs hover:underline">Все →</Link>
          </div>
          <div className="divide-y divide-gray-800">
            {dashboard.upcomingEvents.length === 0 ? (
              <p className="text-gray-500 text-sm p-5">Нет данных</p>
            ) : (
              dashboard.upcomingEvents.map((ev) => (
                <div key={ev.id} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-800/50 transition">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{ev.title}</p>
                    <p className="text-gray-500 text-xs">{fmtDate(ev.startsAt)} · {ev.location}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_BADGE[ev.status] ?? 'bg-gray-700 text-gray-400'}`}>
                    {STATUS_LABEL[ev.status] ?? ev.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Быстрые действия</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { to: '/admin/participations', icon: 'fa-clipboard-check', label: 'Рассмотреть заявки', color: 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' },
            { to: '/admin/users', icon: 'fa-users-cog', label: 'Управление пользователями', color: 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' },
            { to: '/admin/events', icon: 'fa-calendar-check', label: 'Все мероприятия', color: 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20' },
            { to: '/admin/analytics', icon: 'fa-chart-bar', label: 'Аналитика', color: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' },
          ].map((action) => (
            <Link key={action.label} to={action.to} className={`${action.color} rounded-xl p-4 flex flex-col items-center text-center gap-2 transition no-underline`}>
              <i className={`fas ${action.icon} text-2xl`} />
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
