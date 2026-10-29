import { useEffect, useRef, type ReactNode } from 'react';
import { Skeleton } from '../ui/Skeleton';

/** На телефоне публикация во всю ширину экрана, без боковых рамок и скруглений — как в ленте соцсетей. */
export const FEED_BLEED = 'max-sm:-mx-[var(--gutter)] max-sm:rounded-none max-sm:border-x-0';

/**
 * Лента публикаций с бесконечной прокруткой: следующая страница подгружается, когда до конца ленты остаётся около экрана.
 * Кнопка «Показать ещё» остаётся на случай, если наблюдатель недоступен или пользователь листает с клавиатуры.
 */
export function PostFeed({ children, count, total, loading, onMore }: {
  children: ReactNode;
  count: number;
  total: number;
  loading: boolean;
  onMore: () => void;
}) {
  const sentinel = useRef<HTMLDivElement>(null);
  const hasMore = count < total;

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || loading || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(entries => { if (entries[0].isIntersecting) onMore(); }, { rootMargin: '0px 0px 100% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, onMore]);

  return (
    <div className="mx-auto w-full max-w-[36rem]">
      <div className="space-y-4 sm:space-y-6">{children}</div>
      {loading && <div className={count ? 'mt-4 sm:mt-6' : ''}><PostSkeleton /></div>}
      <div ref={sentinel} aria-hidden />
      {!loading && hasMore && (
        <div className="mt-6 text-center">
          <button type="button" onClick={onMore}
            className="press h-11 rounded-control border-[1.5px] border-vol-ctrl bg-vol-surface px-6 text-ctrl font-semibold text-vol-fg hover:border-vol-accent hover:text-vol-accent">
            Показать ещё
          </button>
        </div>
      )}
      {!loading && !hasMore && count > 3 && <p className="vol-meta mt-8 text-center">Вы посмотрели все публикации</p>}
    </div>
  );
}

function PostSkeleton() {
  return (
    <div className={`overflow-hidden rounded-panel border border-vol-line bg-vol-surface ${FEED_BLEED}`} role="status" aria-label="Загрузка публикаций">
      <div className="flex items-center gap-3 px-4 py-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-1.5"><Skeleton className="h-3 w-1/3 rounded" /><Skeleton className="h-2.5 w-1/5 rounded" /></div>
      </div>
      <Skeleton className="aspect-[4/5] w-full sm:aspect-square" />
      <div className="space-y-2 px-4 py-4"><Skeleton className="h-3 w-11/12 rounded" /><Skeleton className="h-3 w-2/3 rounded" /></div>
    </div>
  );
}
