import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { useNotification } from '../../context/NotificationContext';
import { adminErrorMessage } from '../../utils/adminErrors';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { STATUS_TONE, StatusBadge } from '../../components/ui/StatusBadge';
import { Thumb } from '../../components/ui/Avatar';
import { ActionMenu, type MenuAction } from '../../components/ui/ActionMenu';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState, ErrorState } from '../../components/ui/PageStates';
import { useDebounced, useLatestRequest } from '../../hooks/useListHelpers';
import { Segmented } from '../../components/ui/Segmented';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { NewsFormModal } from './NewsFormModal';
import type { AdminNewsListDto } from '../../types/admin';

type NewsStatus = 'Draft' | 'Published' | 'Archived';

export function AdminNewsPage() {
  const { notify } = useNotification();
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  const [news, setNews] = useState<AdminNewsListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [total, setTotal] = useState(0);
  const beginRequest = useLatestRequest();

  // The URL is the single source of truth for status / search / page, so sidebar links, the dashboard
  // and the browser Back button all stay in sync with what is shown.
  const search = searchParams.get('search') ?? '';
  const rawStatus = searchParams.get('status');
  const statusFilter: NewsStatus | undefined =
      rawStatus === 'Draft' || rawStatus === 'Published' || rawStatus === 'Archived' ? rawStatus : undefined;
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounced(searchInput);
  const written = useRef(search);
  const [selectedNews, setSelectedNews] = useState<AdminNewsListDto | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const skip = parseInt(searchParams.get('skip') || '0', 10);
  const take = 20;

  // Load news
  const load = useCallback(async () => {
    const isCurrent = beginRequest();
    try {
      setLoading(true);
      setFailed(false);
      const data = await adminApi.getNews(skip, take, search || undefined, statusFilter);
      if (!isCurrent()) return;
      setNews(data.Items || []);
      setTotal(data.Total || 0);
    } catch (e) {
      if (!isCurrent()) return;
      console.error(e);
      setNews([]);
      setTotal(0);
      setFailed(true);
    } finally {
      if (isCurrent()) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Typing is debounced; the URL (and so the request) changes once per pause and the page resets to the first.
  useEffect(() => {
    if (debouncedSearch !== written.current) {
      written.current = debouncedSearch;
      updateParams(debouncedSearch || undefined, statusFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // The URL changed from outside (sidebar link, Back): reflect it in the input.
  useEffect(() => {
    if (search !== written.current) {
      written.current = search;
      setSearchInput(search);
    }
  }, [search]);

  const handleStatusFilter = (status: NewsStatus | undefined) => {
    updateParams(search || undefined, status);
  };

  const handlePublish = async (newsId: string) => {
    try {
      await adminApi.publishNews(newsId);
      setNews(news.map(n => n.id === newsId ? { ...n, status: 'Published' as const } : n));
    } catch (e) {
      console.error(e);
      notify(adminErrorMessage(e, 'Не удалось опубликовать новость'), 'error');
    }
  };

  const handleUnpublish = async (newsId: string) => {
    try {
      await adminApi.unpublishNews(newsId);
      setNews(news.map(n => n.id === newsId ? { ...n, status: 'Draft' as const } : n));
    } catch (e) {
      console.error(e);
      notify(adminErrorMessage(e, 'Не удалось снять новость с публикации'), 'error');
    }
  };

  const handleArchive = async (newsId: string) => {
    try {
      await adminApi.archiveNews(newsId);
      setNews(news.map(n => n.id === newsId ? { ...n, status: 'Archived' as const } : n));
    } catch (e) {
      console.error(e);
      notify(adminErrorMessage(e, 'Не удалось отправить новость в архив'), 'error');
    }
  };

  const handleRestore = async (newsId: string) => {
    try {
      await adminApi.restoreNews(newsId);
      setNews(news.map(n => n.id === newsId ? { ...n, status: 'Draft' as const } : n));
    } catch (e) {
      console.error(e);
      notify(adminErrorMessage(e, 'Не удалось восстановить новость'), 'error');
    }
  };

  const STATUS_LABEL: Record<NewsStatus, string> = {
    Draft: 'Черновик',
    Published: 'Опубликована',
    Archived: 'В архиве',
  };

  const fmtDate = (s: string) => new Date(s).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });

  const setSkip = (n: number) => {
    const params = new URLSearchParams(searchParams);
    if (n > 0) params.set('skip', String(n)); else params.delete('skip');
    setSearchParams(params);
  };

  const remove = async (item: AdminNewsListDto) => {
    if (!(await confirm({ title: 'Удалить новость?', message: `«${item.title}» будет удалена без возможности восстановления.`, confirmLabel: 'Удалить' }))) return;
    try {
      await adminApi.deleteNews(item.id);
      notify('Новость удалена');
      if (news.length === 1 && skip > 0) setSkip(Math.max(0, skip - take)); else load();
    } catch (e) {
      console.error(e);
      notify(adminErrorMessage(e, 'Не удалось удалить новость'), 'error');
    }
  };

  const menuFor = (item: AdminNewsListDto): MenuAction[] => [
    { label: 'Редактировать', icon: 'fa-pen', onSelect: () => { setSelectedNews(item); setIsFormOpen(true); }, hidden: item.status === 'Archived' },
    { label: 'Опубликовать', icon: 'fa-upload', onSelect: () => handlePublish(item.id), hidden: item.status !== 'Draft' },
    { label: 'Снять с публикации', icon: 'fa-eye-slash', onSelect: () => handleUnpublish(item.id), hidden: item.status !== 'Published' },
    { label: 'В архив', icon: 'fa-box-archive', onSelect: () => handleArchive(item.id), hidden: item.status !== 'Published' },
    { label: 'Восстановить', icon: 'fa-rotate-left', onSelect: () => handleRestore(item.id), hidden: item.status !== 'Archived' },
    { label: 'Удалить', icon: 'fa-trash', onSelect: () => remove(item), danger: true },
  ];

  const filtered = !!(searchInput || statusFilter);

  return (
    <div className="space-y-5">
      <PageHeader title="Новости" description="Публикации платформы: черновики, опубликованные и архив."
        actions={<Button onClick={() => { setSelectedNews(null); setIsFormOpen(true); }}><i className="fas fa-plus" />Создать новость</Button>} />

      <div className="flex flex-wrap items-center gap-3">
        <Segmented label="Статус новости" value={statusFilter ?? ''} onChange={v => handleStatusFilter((v as NewsStatus) || undefined)}
          options={[{ value: '', label: 'Все' }, { value: 'Draft', label: 'Черновики' }, { value: 'Published', label: 'Опубликованы' }, { value: 'Archived', label: 'Архив' }]} />
        <SearchInput label="Поиск по названию" placeholder="Поиск по названию…" value={searchInput} onChange={setSearchInput} />
      </div>

      <Card className="overflow-hidden">
        {loading && news.length === 0 ? (
          <ListSkeleton rows={6} />
        ) : failed ? (
          <ErrorState message="Не удалось загрузить новости" onRetry={load} />
        ) : news.length === 0 ? (
          <EmptyState icon="fa-newspaper"
            title={filtered ? 'Новости не найдены' : 'Новостей пока нет'}
            hint={filtered ? 'Измените поиск или статус.' : 'Создайте первую новость — она сохранится как черновик.'}
            action={filtered
              ? <Button variant="secondary" size="sm" onClick={() => { written.current = ''; setSearchInput(''); updateParams(); }}>Сбросить фильтры</Button>
              : <Button size="sm" onClick={() => { setSelectedNews(null); setIsFormOpen(true); }}><i className="fas fa-plus" />Создать новость</Button>} />
        ) : (
          <ul className={`divide-y divide-line transition-opacity ${loading ? 'opacity-60' : ''}`}>
            {news.map(item => (
              <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 hover:bg-surface-2 transition-colors">
                <button type="button" className="shrink-0 disabled:cursor-default disabled:opacity-100" disabled={item.status === 'Archived'} onClick={() => { setSelectedNews(item); setIsFormOpen(true); }} aria-label={`Редактировать: ${item.title}`}>
                  <Thumb src={item.coverImageUrl} className="w-28 h-[72px] rounded-control" />
                </button>
                <div className="min-w-0 flex-1 basis-60">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-ink-900 line-clamp-1">{item.title}</h3>
                    <StatusBadge tone={STATUS_TONE[item.status] ?? 'neutral'}>{STATUS_LABEL[item.status]}</StatusBadge>
                  </div>
                  <p className="meta mt-1.5">
                    <i className="far fa-user mr-1.5" />{item.createdBy}
                    <span className="mx-2">·</span>
                    {item.publishedAt ? <>опубликована {fmtDate(item.publishedAt)}</> : <>создана {fmtDate(item.createdAt)}</>}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-auto">
                  {item.status === 'Draft' && <Button size="sm" onClick={() => handlePublish(item.id)}><i className="fas fa-upload" />Опубликовать</Button>}
                  <ActionMenu actions={menuFor(item)} label={`Действия: ${item.title}`} />
                </div>
              </li>
            ))}
          </ul>
        )}
        <Pagination skip={skip} take={take} total={total} onChange={setSkip} />
      </Card>

      <NewsFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setSelectedNews(null); }}
        onSuccess={() => { load(); setSelectedNews(null); }}
        news={selectedNews}
      />
    </div>
  );
}
