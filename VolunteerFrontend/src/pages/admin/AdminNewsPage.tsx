import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { useNotification } from '../../context/NotificationContext';
import { Spinner } from '../../components/Spinner';
import { NewsFormModal } from './NewsFormModal';
import type { AdminNewsListDto } from '../../types/admin';

type NewsStatus = 'Draft' | 'Published' | 'Archived';

export function AdminNewsPage() {
  const { notify } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const [news, setNews] = useState<AdminNewsListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<'Draft' | 'Published' | 'Archived' | undefined>(
      (searchParams.get('status') as any) || undefined
  );
  const [selectedNews, setSelectedNews] = useState<AdminNewsListDto | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const skip = parseInt(searchParams.get('skip') || '0', 10);
  const take = 20;

  // Load news
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.getNews(skip, take, search || undefined, statusFilter);
      // ✅ Исправление: защита от undefined
      setNews(data.Items || []);
      setTotal(data.Total || 0);
    } catch (e) {
      console.error(e);
      setNews([]); // ✅ установить пустой массив при ошибке
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [skip, search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  // Update URL params
  const updateParams = (newSearch?: string, newStatus?: NewsStatus) => {
    const params = new URLSearchParams();
    if (newSearch) params.set('search', newSearch);
    if (newStatus) params.set('status', newStatus);
    setSearchParams(params);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    updateParams(value || undefined, statusFilter);
  };

  const handleStatusFilter = (status: NewsStatus | undefined) => {
    setStatusFilter(status);
    updateParams(search || undefined, status);
  };

  const handlePublish = async (newsId: string) => {
    try {
      await adminApi.publishNews(newsId);
      setNews(news.map(n => n.id === newsId ? { ...n, status: 'Published' as const } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnpublish = async (newsId: string) => {
    try {
      await adminApi.unpublishNews(newsId);
      setNews(news.map(n => n.id === newsId ? { ...n, status: 'Draft' as const } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const handleArchive = async (newsId: string) => {
    try {
      await adminApi.archiveNews(newsId);
      setNews(news.map(n => n.id === newsId ? { ...n, status: 'Archived' as const } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRestore = async (newsId: string) => {
    try {
      await adminApi.restoreNews(newsId);
      setNews(news.map(n => n.id === newsId ? { ...n, status: 'Draft' as const } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const STATUS_BADGE: Record<NewsStatus, string> = {
    Draft: 'bg-gray-700 text-gray-300',
    Published: 'bg-green-900/60 text-green-400',
    Archived: 'bg-red-900/60 text-red-400',
  };

  const STATUS_LABEL: Record<NewsStatus, string> = {
    Draft: 'Черновик',
    Published: 'Опубликована',
    Archived: 'Архивирована',
  };

  const fmtDate = (s: string) => new Date(s).toLocaleDateString('ru-RU');

  const pages = Math.ceil(total / take) || 1;
  const currentPage = skip / take + 1;

  if (loading && news.length === 0) {
    return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Spinner />
            <p className="text-gray-500 mt-3">Загрузка новостей...</p>
          </div>
        </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Новости</h1>
          <p className="text-gray-500 text-sm mt-1">Управление новостями</p>
        </div>

        {/* Filters */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Поиск</label>
              <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Название новости..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary transition"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Статус</label>
              <select
                  value={statusFilter || ''}
                  onChange={(e) => handleStatusFilter((e.target.value as NewsStatus) || undefined)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary transition"
              >
                <option value="">Все</option>
                <option value="Draft">Черновик</option>
                <option value="Published">Опубликована</option>
                <option value="Archived">Архивирована</option>
              </select>
            </div>

            {/* Create Button */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedNews(null);
                  setIsFormOpen(true);
                }}
                className="w-full px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition"
              >
                <i className="fas fa-plus mr-2" />
                Создать новость
              </button>
            </div>
          </div>
        </div>

        {/* News Table */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Обложка</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Название</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Автор</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Дата создания</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Статус</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Действия</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
              {news.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Новости не найдены
                    </td>
                  </tr>
              ) : (
                  news.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-800/50 transition">
                        <td className="px-6 py-4">
                          {item.coverImageUrl ? (
                              <img
                                  src={item.coverImageUrl}
                                  alt={item.title}
                                  className="w-12 h-12 rounded object-cover"
                              />
                          ) : (
                              <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
                                📷
                              </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-white font-medium truncate max-w-xs">{item.title}</p>
                          <p className="text-gray-500 text-xs">Просмотры: {item.views}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">{item.createdBy}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">{fmtDate(item.createdAt)}</td>
                        <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[item.status]}`}>
                        {STATUS_LABEL[item.status]}
                      </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                  setSelectedNews(item);
                                  setIsFormOpen(true);
                                }}
                                className="text-blue-400 hover:text-blue-300 text-xs"
                                title="Редактировать"
                            >
                              ✏️
                            </button>
                            <button
                                onClick={() => {
                                  if (item.status === 'Draft') {
                                    handlePublish(item.id);
                                  } else if (item.status === 'Published') {
                                    handleUnpublish(item.id);
                                  }
                                }}
                                className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded transition"
                                title={item.status === 'Draft' ? 'Опубликовать' : 'Снять с публикации'}
                            >
                              {item.status === 'Draft' ? '📤' : '📥'}
                            </button>
                            {item.status !== 'Archived' && (
                                <button
                                    onClick={() => handleArchive(item.id)}
                                    className="px-3 py-1 text-xs bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded transition"
                                    title="Архивировать"
                                >
                                  📦
                                </button>
                            )}
                            {item.status === 'Archived' && (
                                <button
                                    onClick={() => handleRestore(item.id)}
                                    className="px-3 py-1 text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded transition"
                                    title="Восстановить"
                                >
                                  ↩️
                                </button>
                            )}
                            <button
                                onClick={async () => {
                                  if (window.confirm('Вы уверены? Это действие нельзя отменить.')) {
                                    try {
                                      await adminApi.deleteNews(item.id);
                                      setNews(news.filter(n => n.id !== item.id));
                                      notify('Новость удалена');
                                    } catch (e) {
                                      console.error(e);
                                      notify('Ошибка при удалении', 'error');
                                    }
                                  }
                                }}
                                className="px-3 py-1 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded transition"
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
          {pages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
                <p className="text-sm text-gray-400">
                  Страница {currentPage} из {pages} • Всего: {total}
                </p>
                <div className="flex gap-2">
                  <button
                      onClick={() => {
                        const newParams = new URLSearchParams(searchParams);
                        newParams.set('skip', String(skip - take));
                        setSearchParams(newParams);
                      }}
                      disabled={skip === 0}
                      className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 rounded transition"
                  >
                    ← Назад
                  </button>
                  <button
                      onClick={() => {
                        const newParams = new URLSearchParams(searchParams);
                        newParams.set('skip', String(skip + take));
                        setSearchParams(newParams);
                      }}
                      disabled={currentPage >= pages}
                      className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 rounded transition"
                  >
                    Далее →
                  </button>
                 </div>
               </div>
           )}
         </div>

         {/* News Form Modal */}
        <NewsFormModal
            isOpen={isFormOpen}
            onClose={() => {
              setIsFormOpen(false);
              setSelectedNews(null);
            }}
            onSuccess={() => {
              load();
              setSelectedNews(null);
            }}
            news={selectedNews}
        />
      </div>
  );
}