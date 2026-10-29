import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { newsApi, type NewsResponseDto } from '../../api/news';
import { Spinner } from '../../components/Spinner';
import { EventImage } from '../../components/EventImage';
import { Breadcrumbs } from '../../components/afisha/Breadcrumbs';
import { NotFoundState } from '../../components/afisha/NotFoundState';
import { Heading } from '../../components/ui/Heading';

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

// Цвета категорий — из палитры: синий (бренд), зелёный (природа), золотой (обучение). Смысл несёт подпись, цвет вторичен.
const CATEGORY_COLORS: Record<string, string> = {
  events: 'bg-vol-accent-soft text-primary-dark',
  social: 'bg-vol-accent-soft text-primary-dark',
  eco: 'bg-vol-green-soft text-vol-green',
  education: 'bg-pal-gold/40 text-vol-head',
};

const CATEGORY_LABELS: Record<string, string> = {
  events: 'Мероприятия',
  social: 'Соц. помощь',
  eco: 'Экология',
  education: 'Обучение',
};

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
      .catch(() => { setError('Новость не найдена'); })
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
    return <NotFoundState title="Новость не найдена" hint="Возможно, она была удалена или перемещена." to="/news" action="Вернуться к новостям" />;
  }

  const catColor = news.category ? (CATEGORY_COLORS[news.category] ?? 'bg-vol-bg text-vol-muted') : 'bg-vol-bg text-vol-muted';
  const catLabel = news.category ? (CATEGORY_LABELS[news.category] ?? news.category) : null;
  const paragraphs = news.content?.split(/\r?\n\r?\n/).filter(Boolean) ?? [news.content];
  const url = encodeURIComponent(window.location.href);

  return (
    <>
      <Breadcrumbs items={[{ to: '/', label: 'Главная' }, { to: '/news', label: 'Новости' }]} current={news.title} />

      <article className="wrap pb-section pt-4 sm:pt-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-meta text-vol-faint">
            {catLabel && <span className={`rounded-full px-3 py-1 font-semibold ${catColor}`}>{catLabel}</span>}
            <time dateTime={news.createdAt} className="flex items-center gap-1.5">
              <i className="far fa-calendar-alt text-primary" aria-hidden />{fmtDate(news.createdAt)}
            </time>
            {news.authorName && (
              <span className="flex items-center gap-1.5"><i className="far fa-user text-primary" aria-hidden />{news.authorName}</span>
            )}
          </div>

          <Heading level={1} look="h1-detail" className="mb-block">{news.title}</Heading>

          {/* Обложка целиком, без обрезки — как фото мероприятия (рамка по ориентации снимка, просмотр по нажатию). */}
          {news.imageUrl && <div className="mb-block"><EventImage src={news.imageUrl} alt={news.title} variant="hero" /></div>}

          <div className="vol-text max-w-[68ch] space-y-5 break-words text-[1.0625rem] leading-[1.75]">
            {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
          </div>

          <footer className="mt-block flex flex-col items-start justify-between gap-4 border-t border-vol-line pt-6 sm:flex-row sm:items-center">
            <Link to="/news" className="press-flat inline-flex min-h-11 items-center gap-2 font-semibold text-vol-accent no-underline hover:text-primary-dark">
              <i className="fas fa-arrow-left" aria-hidden />Все новости
            </Link>
            <div className="flex items-center gap-2">
              <span className="vol-meta mr-1">Поделиться</span>
              <a href={`https://vk.com/share.php?url=${url}`} target="_blank" rel="noopener noreferrer" aria-label="Поделиться во ВКонтакте"
                className="press grid h-11 w-11 place-items-center rounded-control border-[1.5px] border-vol-ctrl text-vol-fg no-underline hover:border-vol-accent hover:text-vol-accent">
                <i className="fab fa-vk" aria-hidden />
              </a>
              <a href={`https://t.me/share/url?url=${url}&text=${encodeURIComponent(news.title)}`} target="_blank" rel="noopener noreferrer" aria-label="Поделиться в Telegram"
                className="press grid h-11 w-11 place-items-center rounded-control border-[1.5px] border-vol-ctrl text-vol-fg no-underline hover:border-vol-accent hover:text-vol-accent">
                <i className="fab fa-telegram-plane" aria-hidden />
              </a>
            </div>
          </footer>
        </div>
      </article>
    </>
  );
}
