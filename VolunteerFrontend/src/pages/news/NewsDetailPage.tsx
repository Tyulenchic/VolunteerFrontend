import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { newsApi, type NewsResponseDto } from '../../api/news';
import { Spinner } from '../../components/Spinner';

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

const CATEGORY_COLORS: Record<string, string> = {
  events: 'bg-blue-100 text-blue-700',
  social: 'bg-purple-100 text-purple-700',
  eco: 'bg-teal-100 text-teal-700',
  education: 'bg-amber-100 text-amber-700',
};

const CATEGORY_LABELS: Record<string, string> = {
  events: 'Мероприятия',
  social: 'Соц. помощь',
  eco: 'Экология',
  education: 'Обучение',
};

// Fallback mock detail for when API is unavailable
import { MOCK_NEWS } from '../../data/mockNews';

export function NewsDetailPage() {
  const { id } = useParams<{ id: string }>();
  
  const [news, setNews] = useState<NewsResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    newsApi.getById(id)
      .then(setNews)
      .catch(() => {
        // Try fallback to mock data (numeric id)
        const numId = parseInt(id, 10);
        const mock = MOCK_NEWS.find(n => n.id === numId);
        if (mock) {
          setNews({
            id: String(mock.id),
            title: mock.title,
            content: mock.excerpt + '\n\n' +
              'Волонтёры нашего движения каждый день делают мир чуть лучше. Это мероприятие стало важным событием для всего сообщества. Участники работали с энтузиазмом и преданностью общему делу.\n\n' +
              'Организаторы выражают огромную благодарность всем, кто принял участие. Благодаря вашей поддержке мы смогли достичь намеченных целей и даже превзойти их.\n\n' +
              'Следите за нашими новостями, чтобы узнавать о предстоящих событиях и присоединяться к нашим акциям. Вместе мы сила!',
            imageUrl: mock.image,
            status: 'Published',
            createdByUserId: '0',
            authorName: mock.author,
            createdAt: mock.date,
            category: mock.category,
          });
        } else {
          setError('Новость не найдена');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-8xl font-bold text-primary/20 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Новость не найдена</h1>
        <p className="text-gray-600 mb-8">Возможно, она была удалена или перемещена.</p>
        <Link to="/news" className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition shadow-lg no-underline">
          ← Вернуться к новостям
        </Link>
      </div>
    );
  }

  const catColor = news.category ? (CATEGORY_COLORS[news.category] ?? 'bg-gray-100 text-gray-700') : 'bg-gray-100 text-gray-700';
  const catLabel = news.category ? (CATEGORY_LABELS[news.category] ?? news.category) : null;
  const paragraphs = news.content?.split('\n\n').filter(Boolean) ?? [news.content];

  return (
    <>
      {/* BREADCRUMB */}
      <div className="bg-gray-50 border-b border-gray-200 py-3">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-primary transition no-underline text-gray-500">Главная</Link>
            <i className="fas fa-chevron-right text-xs" />
            <Link to="/news" className="hover:text-primary transition no-underline text-gray-500">Новости</Link>
            <i className="fas fa-chevron-right text-xs" />
            <span className="text-gray-900 font-medium line-clamp-1 max-w-xs">{news.title}</span>
          </nav>
        </div>
      </div>

      {/* ARTICLE */}
      <article className="py-10 sm:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {catLabel && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${catColor}`}>{catLabel}</span>
            )}
            <time className="flex items-center gap-1 text-sm text-gray-500">
              <i className="far fa-calendar-alt text-primary" />
              {fmtDate(news.createdAt)}
            </time>
            {news.authorName && (
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <i className="far fa-user text-primary" />
                {news.authorName}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-gray-900 leading-tight mb-8">
            {news.title}
          </h1>

          {/* Cover image */}
          {news.imageUrl && (
            <div className="rounded-2xl overflow-hidden mb-10 shadow-lg">
              <img
                src={news.imageUrl}
                alt={news.title}
                className="w-full max-h-[480px] object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-5">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {/* Share / back */}
          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Link
              to="/news"
              className="inline-flex items-center gap-2 text-primary font-semibold hover:text-primary-dark transition no-underline"
            >
              <i className="fas fa-arrow-left" />
              Все новости
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 mr-1">Поделиться:</span>
              <a href={`https://vk.com/share.php?url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:opacity-80 transition no-underline">
                <i className="fab fa-vk" />
              </a>
              <a href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(news.title)}`} target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 bg-sky-500 text-white rounded-lg flex items-center justify-center hover:opacity-80 transition no-underline">
                <i className="fab fa-telegram-plane" />
              </a>
            </div>
          </div>
        </div>
      </article>

      {/* RELATED stub */}
      <section className="py-12 bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Другие новости</h2>
          <div className="flex gap-4">
            <Link to="/news" className="inline-flex items-center px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition shadow no-underline text-sm">
              <i className="fas fa-newspaper mr-2" />Перейти в раздел новостей
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
