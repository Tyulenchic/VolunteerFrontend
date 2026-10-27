import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { organizationsApi } from '../../api/organizations';
import { PostCard } from '../../components/organizations/PostCard';
import { OrganizationBadge } from '../../components/organizations/OrganizationBadge';
import { Spinner } from '../../components/Spinner';
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

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-2xl">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-gray-900 mb-2">Лента организаций</h1>
        <p className="text-gray-600">Новости и фотографии от волонтёрских организаций. Все организации — в <Link to="/organizations" className="text-primary hover:underline">каталоге</Link>.</p>
      </header>

      {error && <p className="text-center text-gray-600">{error} <button className="text-primary underline" onClick={() => void load(0)}>Повторить</button></p>}
      {!error && !loading && items.length === 0 && <p className="text-center text-gray-600 py-12">Публикаций пока нет.</p>}

      <div className="space-y-6">
        {items.map(({ post, organization }) => (
          <div key={post.id}>
            <OrganizationBadge organization={organization} size="md" className="mb-2" />
            <PostCard post={post} />
          </div>
        ))}
      </div>

      {loading && <div className="flex justify-center py-8"><Spinner /></div>}
      {!loading && items.length < total && (
        <div className="text-center mt-8">
          <button onClick={() => void load(items.length)} className="px-8 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition">Показать ещё</button>
        </div>
      )}
    </div>
  );
}
