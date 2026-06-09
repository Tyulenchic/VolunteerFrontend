import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { useNotification } from '../../context/NotificationContext';
import { Spinner } from '../../components/Spinner';
import { EventFormModal } from './EventFormModal';
import type { AdminEventListDto, AdminEventStatisticsDto } from '../../types/admin';

const TAKE = 20;

const STATUS_LABEL: Record<string, string> = {
  Draft: 'Черновик',
  Published: 'Опубликован',
  Cancelled: 'Отменён',
  Completed: 'Завершён',
};

const STATUS_COLOR: Record<string, string> = {
  Draft: 'bg-gray-700 text-gray-300',
  Published: 'bg-green-900/60 text-green-400',
  Cancelled: 'bg-red-900/60 text-red-400',
  Completed: 'bg-blue-900/60 text-blue-400',
};

interface StatsModalProps {
  event: AdminEventListDto;
  onClose: () => void;
}

function StatsModal({ event, onClose }: StatsModalProps) {
  const [stats, setStats] = useState<AdminEventStatisticsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminApi.getEventStatistics(event.id);
        setStats(data);
      } catch (e) {
        console.error('Error loading event statistics:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [event.id]);

  if (loading) {
    return (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
    );
  }

  if (!stats) {
    return <div className="text-center text-gray-500">Ошибка загрузки статистики</div>;
  }

  return (
      <div className="space-y-4">
        <div>
          <h3 className="text-white font-medium mb-3">{event.title}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-800 rounded-lg">
              <p className="text-gray-400 text-xs">Всего заявок</p>
              <p className="text-white text-lg font-bold">{stats.totalApplications}</p>
            </div>
            <div className="p-3 bg-gray-800 rounded-lg">
              <p className="text-gray-400 text-xs">Одобрено</p>
              <p className="text-green-400 text-lg font-bold">{stats.approvedParticipants}</p>
            </div>
            <div className="p-3 bg-gray-800 rounded-lg">
              <p className="text-gray-400 text-xs">Отклонено</p>
              <p className="text-red-400 text-lg font-bold">{stats.rejectedParticipants}</p>
            </div>
            <div className="p-3 bg-gray-800 rounded-lg">
              <p className="text-gray-400 text-xs">Посещение подтверждено</p>
              <p className="text-blue-400 text-lg font-bold">{stats.attendanceConfirmed}</p>
            </div>
            <div className="p-3 bg-gray-800 rounded-lg col-span-2">
              <p className="text-gray-400 text-xs mb-1">Процент заполнения</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${Math.min(stats.fillPercentage, 100)}%` }}
                  />
                </div>
                <span className="text-white font-medium text-sm">{stats.fillPercentage.toFixed(1)}%</span>
              </div>
            </div>
            {stats.freeSlots > 0 && (
                <div className="p-3 bg-gray-800 rounded-lg col-span-2">
                  <p className="text-gray-400 text-xs">Свободных мест</p>
                  <p className="text-blue-400 text-lg font-bold">{stats.freeSlots}</p>
                </div>
            )}
          </div>
        </div>

        <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition"
        >
          Закрыть
        </button>
      </div>
  );
}

export function AdminEventsPage() {
  const { notify } = useNotification();
  const [events, setEvents] = useState<AdminEventListDto[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AdminEventListDto | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getEvents(skip, TAKE, search || undefined, status || undefined);
      console.log('RAW RESPONSE:', JSON.stringify(res));
      console.log('Items:', res.Items, 'Total:', res.Total);
      setEvents(res.Items || []);
      setTotal(res.Total || 0);
    } catch (e) {
      console.error('Error loading events:', e);
      setEvents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [skip, search, status]);

  useEffect(() => {
    setSkip(0);
  }, [search, status]);

  useEffect(() => {
    load();
  }, [load]);

  const pages = Math.ceil(total / TAKE) || 1;
  const currentPage = Math.floor(skip / TAKE) + 1;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Мероприятия</h1>
            <p className="text-gray-500 text-sm mt-1">Управление мероприятиями системы</p>
          </div>
          <button
            onClick={() => {
              setSelectedEvent(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition"
          >
            <i className="fas fa-plus mr-2" />
            Создать мероприятие
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Поиск</label>
            <input
                type="text"
                placeholder="Название мероприятия..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Статус</label>
            <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
            >
              <option value="">Все статусы</option>
              <option value="Draft">Черновики</option>
              <option value="Published">Опубликованы</option>
              <option value="Completed">Завершены</option>
              <option value="Cancelled">Отменены</option>
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
        )}

        {/* Events Table */}
        {!loading && (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800/50 border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-300">Название</th>
                    <th className="px-4 py-3 text-left text-gray-300">Дата</th>
                    <th className="px-4 py-3 text-left text-gray-300">Место</th>
                    <th className="px-4 py-3 text-center text-gray-300">Статус</th>
                    <th className="px-4 py-3 text-center text-gray-300">Участники</th>
                    <th className="px-4 py-3 text-center text-gray-300">Просмотры</th>
                    <th className="px-4 py-3 text-center text-gray-300">Действия</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                  {events.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          Мероприятия не найдены
                        </td>
                      </tr>
                  ) : (
                      events.map((event) => (
                          <tr key={event.id} className="hover:bg-gray-800/50 transition">
                            <td className="px-4 py-3">
                              <div className="text-white font-medium max-w-xs truncate">{event.title}</div>
                              <div className="text-gray-500 text-xs">Организатор: {event.createdBy}</div>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs">
                              {formatDate(event.startsAt)}
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{event.location}</td>
                            <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[event.status]}`}>
                          {STATUS_LABEL[event.status]}
                        </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="text-white font-medium">{event.approvedParticipations}</div>
                              <div className="text-gray-500 text-xs">/ {event.totalParticipations}</div>
                            </td>
                            <td className="px-4 py-3 text-center text-white font-medium">{event.views}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={() => {
                                      setSelectedEvent(event);
                                      setIsFormOpen(true);
                                    }}
                                    className="text-blue-400 hover:text-blue-300 text-xs"
                                    title="Редактировать"
                                >
                                  ✏️
                                </button>
                                {event.status === 'Draft' && (
                                    <button
                                        onClick={async () => {
                                          try {
                                            await adminApi.publishEvent(event.id);
                                            setEvents(events.map(e => e.id === event.id ? { ...e, status: 'Published' } : e));
                                            notify('Мероприятие опубликовано');
                                          } catch (e) {
                                            console.error(e);
                                            notify('Ошибка при публикации', 'error');
                                          }
                                        }}
                                        className="text-green-400 hover:text-green-300 text-xs"
                                        title="Опубликовать"
                                    >
                                      📤
                                    </button>
                                )}
                                {event.status === 'Published' && (
                                    <button
                                        onClick={async () => {
                                          try {
                                            await adminApi.completeEvent(event.id);
                                            setEvents(events.map(e => e.id === event.id ? { ...e, status: 'Completed' } : e));
                                            notify('Мероприятие завершено');
                                          } catch (e) {
                                            console.error(e);
                                            notify('Ошибка при завершении', 'error');
                                          }
                                        }}
                                        className="text-yellow-400 hover:text-yellow-300 text-xs"
                                        title="Завершить"
                                    >
                                      ✓
                                    </button>
                                )}
                                {event.status !== 'Cancelled' && event.status !== 'Completed' && (
                                    <button
                                        onClick={async () => {
                                          if (window.confirm('Вы уверены, что хотите отменить это мероприятие?')) {
                                            try {
                                              await adminApi.cancelEvent(event.id, 'Отменено администратором');
                                              setEvents(events.map(e => e.id === event.id ? { ...e, status: 'Cancelled' } : e));
                                              notify('Мероприятие отменено');
                                            } catch (e) {
                                              console.error(e);
                                              notify('Ошибка при отмене', 'error');
                                            }
                                          }
                                        }}
                                        className="text-red-400 hover:text-red-300 text-xs"
                                        title="Отменить"
                                    >
                                      ❌
                                    </button>
                                )}
                                <button
                                    onClick={async () => {
                                      if (window.confirm('Вы уверены? Это действие нельзя отменить.')) {
                                        try {
                                          await adminApi.deleteEvent(event.id);
                                          setEvents(events.filter(e => e.id !== event.id));
                                          notify('Мероприятие удалено');
                                        } catch (e) {
                                          console.error(e);
                                          notify('Ошибка при удалении', 'error');
                                        }
                                      }
                                    }}
                                    className="text-red-500 hover:text-red-400 text-xs"
                                    title="Удалить"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                      ))
                  )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-4 border-t border-gray-800 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Страница {currentPage} из {pages || 1} • Всего: {total}
                </div>
                <div className="flex items-center gap-2">
                  <button
                      onClick={() => setSkip(Math.max(0, skip - TAKE))}
                      disabled={skip === 0}
                      className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 text-white rounded text-sm transition"
                  >
                    ← Назад
                  </button>
                  <button
                      onClick={() => setSkip(skip + TAKE)}
                      disabled={currentPage >= pages}
                      className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 text-white rounded text-sm transition"
                  >
                    Далее →
                  </button>
                </div>
              </div>
            </div>
         )}

         {/* Event Form Modal */}
        <EventFormModal
            isOpen={isFormOpen}
            onClose={() => {
              setIsFormOpen(false);
              setSelectedEvent(null);
            }}
            onSuccess={() => {
              load();
              setSelectedEvent(null);
            }}
            event={selectedEvent}
        />
      </div>
  );
}