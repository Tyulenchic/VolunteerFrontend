import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { newsApi, type NewsResponseDto } from '../../../api/news';
import { CroppedImage } from '../../../components/ImageCropper';
import { MediaPlaceholder } from '../../../components/ui/MediaPlaceholder';
import { Spinner } from '../../../components/Spinner';
import { BlockAction, VolButton } from '../../../components/afisha/VolButton';
import { VolSectionHead } from '../../../components/afisha/VolSectionHead';
import { VolIcon } from '../../../components/afisha/VolIcon';

const fmtDate = (s: string) => new Date(s).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

/** Анонс: краткое описание, иначе начало текста (без разметки переносов). */
const lead = (n: NewsResponseDto) => (n.summary || n.content || '').replace(/\s+/g, ' ').trim();

export function News() {
  const [items, setItems] = useState<NewsResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    newsApi.getActual(0, 3)
      .then(res => { if (alive) setItems(res.items); })
      .catch(() => { if (alive) setItems([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const [first, ...rest] = items;

  return (
    <section className="wrap relative z-10 pb-[var(--section-y)]">
      <VolSectionHead title="Последние новости" />
      {loading ? (
        <div className="flex justify-center py-10 text-vol-accent"><Spinner /></div>
      ) : !first ? (
        <p className="py-6 text-center text-[14px] text-vol-muted">Новостей пока нет</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr] lg:gap-x-16 lg:gap-y-5">
          <article className="group lg:contents">
            <Link to={`/news/${first.id}`} tabIndex={-1} aria-hidden="true" className="block lg:col-start-1 lg:row-start-1">
              {first.imageUrl ? (
                <div className="overflow-hidden rounded-2xl border border-vol-line">
                  <CroppedImage src={first.imageUrl} crop={first.imageCrop} aspect={16 / 10} alt="" className="w-full !rounded-none"
                    placeholder={<MediaPlaceholder kind="news" />} />
                </div>
              ) : (
                // Без фото — не пустой прямоугольник 16:10, а тематическая плашка с анонсом: высота по содержимому.
                <div className="vol-media-empty relative overflow-hidden rounded-2xl border border-vol-line p-6 sm:p-8">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/80 text-vol-accent"><VolIcon n="news" size={24} /></span>
                  {lead(first) && <p className="vol-text mt-5 line-clamp-4 max-w-[52ch]">{lead(first)}</p>}
                </div>
              )}
            </Link>
            <Link to={`/news/${first.id}`} className="block no-underline lg:col-start-1 lg:row-start-2">
              <p className="vol-label text-vol-faint max-md:text-center">{fmtDate(first.createdAt)}</p>
              <h3 className="font-display mt-2 text-[1.3rem] font-bold leading-snug text-vol-head group-hover:text-vol-accent max-md:text-center">{first.title}</h3>
            </Link>
          </article>

          {rest.length > 0 && (
            <div className="mt-6 grid gap-4 sm:gap-9 lg:col-start-2 lg:row-start-1 lg:mt-0 lg:grid-rows-2 lg:gap-5">
              {rest.map(n => (
                <Link key={n.id} to={`/news/${n.id}`}
                  className="press group grid grid-cols-[7.5rem_1fr] items-center gap-3.5 rounded-panel no-underline sm:grid-cols-[1.15fr_1fr] sm:items-stretch sm:gap-6">
                  <div className="relative aspect-square overflow-hidden rounded-card border border-vol-line sm:aspect-auto sm:min-h-[11rem] sm:rounded-panel lg:min-h-0">
                    <CroppedImage src={n.imageThumbnailUrl ?? n.imageUrl} crop={n.imageCrop} fill alt="" className="!rounded-none"
                      placeholder={<MediaPlaceholder kind="news" />} />
                  </div>
                  <div className="flex min-w-0 flex-col justify-center gap-1.5 sm:gap-2.5">
                    <p className="vol-label text-vol-faint">{fmtDate(n.createdAt)}</p>
                    <h3 className="font-display line-clamp-3 text-body-sm font-bold leading-snug text-vol-head group-hover:text-vol-accent sm:text-h3">{n.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
      <BlockAction className="mt-10"><VolButton kind="outline" icon="arrow" to="/news">Все новости</VolButton></BlockAction>
    </section>
  );
}
