import { useEffect, useState } from 'react';
import { videoLinksApi } from '../../../api/VideoLink';
import type { VideoLinkResponseDto } from '../../../types/VideoLink';
import { cropFocus } from '../../../components/ImageCropper';
import { SecureImage } from '../../../components/SecureImage';
import { Spinner } from '../../../components/Spinner';
import { BlockAction, VolButton } from '../../../components/afisha/VolButton';
import { VolSectionHead } from '../../../components/afisha/VolSectionHead';
import { VolIcon } from '../../../components/afisha/VolIcon';
import { VideoDialog } from '../../../components/afisha/VideoDialog';

const PER_PAGE = 4;

/* Collage layouts by number of tiles on the page. Full page (4): big on the left, two in the middle, tall on the right.
   Tablet/phone: two columns, wide tiles take both. A short last page keeps the same language instead of leaving holes. */
const WIDE_L = 'col-span-2 aspect-[16/10] md:aspect-[2/1] lg:aspect-auto lg:col-span-1 lg:row-span-2 lg:row-start-1';
const SQUARE = 'aspect-square md:aspect-[4/3] lg:aspect-auto';
const TILES: Record<number, string[]> = {
  4: [
    `${WIDE_L} lg:col-start-1`,
    `${SQUARE} lg:col-start-2 lg:row-start-1`,
    `${SQUARE} lg:col-start-2 lg:row-start-2`,
    'col-span-2 aspect-[16/9] md:aspect-[21/9] lg:aspect-auto lg:col-span-1 lg:col-start-3 lg:row-span-2 lg:row-start-1',
  ],
  3: [
    `${WIDE_L} lg:col-start-1`,
    `${SQUARE} lg:col-start-2 lg:row-start-1`,
    `${SQUARE} lg:col-start-2 lg:row-start-2`,
  ],
  2: [`${WIDE_L} lg:col-start-1`, `${WIDE_L} lg:col-start-2`],
  1: ['col-span-2 aspect-[16/9] lg:aspect-auto lg:row-span-2'],
};
const COLS: Record<number, string> = {
  4: 'lg:grid-cols-[1.7fr_1fr_.8fr]', 3: 'lg:grid-cols-[1.7fr_1fr]', 2: 'lg:grid-cols-2', 1: 'lg:grid-cols-1',
};

export function Gallery() {
  const [items, setItems] = useState<VideoLinkResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [playing, setPlaying] = useState<VideoLinkResponseDto | null>(null);

  useEffect(() => {
    let alive = true;
    videoLinksApi.getAll(0, 50)
      .then(res => { if (alive) setItems(res.items); })
      .catch(() => { if (alive) setItems([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const current = Math.min(page, pages - 1);
  const go = (d: number) => setPage(v => (Math.min(v, pages - 1) + d + pages) % pages);
  const shown = items.slice(current * PER_PAGE, current * PER_PAGE + PER_PAGE);

  return (
    <section className="relative z-10 mx-auto max-w-[76rem] px-4 pb-32 sm:px-6">
      <VolSectionHead title="Как это было" sub="Фото и видео с прошедших событий" />

      {loading ? (
        <div className="flex justify-center py-10 text-vol-accent"><Spinner /></div>
      ) : shown.length === 0 ? (
        <p className="py-6 text-center text-[14px] text-vol-muted">Материалы пока не добавлены</p>
      ) : (
        <>
          <ul className={`grid grid-cols-2 gap-3 sm:gap-4 lg:h-[27rem] lg:grid-rows-2 ${COLS[shown.length]}`}
            aria-live="polite" aria-label={`Материалы, страница ${current + 1} из ${pages}`}>
            {shown.map((m, i) => (
              <li key={m.id} className={`min-h-0 ${TILES[shown.length][i]}`}>
                <button type="button" onClick={() => setPlaying(m)} aria-haspopup="dialog" aria-label={`Смотреть видео: ${m.title}`}
                  className="on-dark group relative block h-full w-full overflow-hidden rounded-2xl border border-vol-line bg-vol-head text-left">
                  <SecureImage src={m.thumbnailUrl} alt="" draggable={false}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    style={{ objectPosition: cropFocus(m.hasCustomCover ? m.coverCrop : null) }} />
                  <span aria-hidden="true" className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-vol-surface text-vol-accent shadow-lg transition-transform group-hover:scale-110 sm:h-14 sm:w-14">
                    <VolIcon n="play" size={22} className="ml-0.5" />
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
            {pages > 1 && (
              <div className="flex items-center gap-2.5 max-sm:justify-center">
                <button type="button" onClick={() => go(-1)} aria-label="Предыдущие материалы"
                  className="vol-tap relative grid h-11 w-11 place-items-center rounded-lg border-[1.5px] border-vol-rule bg-vol-surface hover:border-vol-accent hover:text-vol-accent">
                  <VolIcon n="chevron" size={17} className="rotate-90" />
                </button>
                <button type="button" onClick={() => go(1)} aria-label="Следующие материалы"
                  className="vol-tap relative grid h-11 w-11 place-items-center rounded-lg border-[1.5px] border-vol-rule bg-vol-surface hover:border-vol-accent hover:text-vol-accent">
                  <VolIcon n="chevron" size={17} className="-rotate-90" />
                </button>
                <div className="ml-1 flex items-center">
                  {Array.from({ length: pages }, (_, i) => (
                    <button key={i} type="button" onClick={() => setPage(i)} aria-label={`Страница ${i + 1} из ${pages}`}
                      aria-current={i === current ? 'true' : undefined} className="grid h-11 place-items-center px-1.5">
                      <span aria-hidden="true" className={`block h-2.5 rounded-full transition-all ${i === current ? 'w-7 bg-vol-accent' : 'w-2.5 bg-vol-rule'}`} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <BlockAction className="flex-1"><VolButton kind="outline" icon="arrow" to="/videos">Смотреть все</VolButton></BlockAction>
          </div>
        </>
      )}

      {playing && <VideoDialog item={playing} onClose={() => setPlaying(null)} />}
    </section>
  );
}
