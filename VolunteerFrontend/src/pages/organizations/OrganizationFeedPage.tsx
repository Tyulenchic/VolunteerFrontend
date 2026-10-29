import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { organizationsApi } from '../../api/organizations';
import { PostCard } from '../../components/organizations/PostCard';
import { FEED_BLEED, PostFeed } from '../../components/organizations/PostFeed';
import { mapApiError } from '../../utils/apiError';
import type { OrganizationFeedItem } from '../../types/organization';

const PAGE = 10;

/** Общая лента: свежие публикации всех организаций (фото и рассказы о том, чем они занимаются). */
export function OrganizationFeedPage() {
  const [items, setItems] = useState<OrganizationFeedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);

  const load = useCallback(async (skip: number) => {
    const id = ++request.current;
    setLoading(true); setError(null);
    try {
      const page = await organizationsApi.feed(skip, PAGE);
      if (id !== request.current) return;
      setItems(prev => (skip === 0 ? page.items : [...prev, ...page.items]));
      setTotal(page.totalCount);
    } catch (e) {
      console.error('Error loading organization feed:', e);
      if (id === request.current) setError(mapApiError(e));
    } finally { if (id === request.current) setLoading(false); }
  }, []);
  useEffect(() => { void load(0); }, [load]);
  const more = useCallback(() => { void load(items.length); }, [load, items.length]);

  return (
    <div className="wrap py-8 sm:py-10">
      <header className="mx-auto mb-6 max-w-[36rem] sm:mb-8">
        <h1 className="vol-h1 mb-3">Лента организаций</h1>
        <p className="vol-lead">Новости и фотографии от волонтёрских организаций. Все организации — в <Link to="/organizations" className="text-primary hover:underline">каталоге</Link>.</p>
      </header>

      {error && (
        <p className="vol-text-sm text-center">{error} <button className="press-flat font-semibold text-primary underline" onClick={() => void load(0)}>Повторить</button></p>
      )}
      {!error && !loading && items.length === 0 && <p className="vol-text-sm py-12 text-center">Публикаций пока нет.</p>}

      {!error && (
        <PostFeed count={items.length} total={total} loading={loading} onMore={more}>
          {items.map(({ post, organization }) => (
            <PostCard key={post.id} post={post} organization={organization} className={FEED_BLEED} />
          ))}
        </PostFeed>
      )}
    </div>
  );
}
