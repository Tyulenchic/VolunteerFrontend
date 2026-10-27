import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { newsApi, type NewsResponseDto } from '../../../api/news';
import { cropFocus, CroppedImage } from '../../../components/ImageCropper';
import { SecureImage } from '../../../components/SecureImage';
import { Spinner } from '../../../components/Spinner';
import { BlockAction, VolButton } from '../../../components/afisha/VolButton';
import { VolSectionHead } from '../../../components/afisha/VolSectionHead';
import { VolIcon } from '../../../components/afisha/VolIcon';

const fmtDate = (s: string) => new Date(s).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

const NoPhoto = () => (
  <div className="absolute inset-0 grid place-items-center bg-vol-accent-soft text-vol-accent"><VolIcon n="image" size={28} /></div>
);

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
    <section className="relative z-10 mx-auto max-w-[76rem] px-4 pb-32 sm:px-6">
      <VolSectionHead title="Последние новости" />
      {loading ? (
        <div className="flex justify-center py-10 text-vol-accent"><Spinner /></div>
      ) : !first ? (
        <p className="py-6 text-center text-[14px] text-vol-muted">Новостей пока нет</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr] lg:gap-x-16 lg:gap-y-5">
          <article className="group lg:contents">
            <Link to={`/news/${first.id}`} tabIndex={-1} aria-hidden="true" className="block lg:col-start-1 lg:row-start-1">
              <div className="overflow-hidden rounded-2xl border border-vol-line">
                <CroppedImage src={first.imageUrl} crop={first.imageCrop} aspect={16 / 10} alt="" className="w-full !rounded-none" />
              </div>
            </Link>
            <Link to={`/news/${first.id}`} className="block no-underline lg:col-start-1 lg:row-start-2">
              <p className="vol-label text-vol-faint max-md:text-center">{fmtDate(first.createdAt)}</p>
              <h3 className="font-display mt-2 text-[1.3rem] font-bold leading-snug text-vol-head group-hover:text-vol-accent max-md:text-center">{first.title}</h3>
            </Link>
          </article>

          {rest.length > 0 && (
            <div className="mt-7 grid gap-9 lg:col-start-2 lg:row-start-1 lg:mt-0 lg:grid-rows-2 lg:gap-5">
              {rest.map(n => (
                <Link key={n.id} to={`/news/${n.id}`}
                  className="group grid grid-cols-1 items-stretch gap-4 no-underline max-sm:text-center sm:grid-cols-[1.15fr_1fr] sm:gap-6">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-vol-line sm:aspect-auto sm:min-h-[11rem] lg:min-h-0">
                    <SecureImage src={n.imageUrl} alt="" draggable={false} fallback={<NoPhoto />}
                      className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: cropFocus(n.imageCrop) }} />
                  </div>
                  <div className="flex flex-col justify-center gap-2.5">
                    <p className="vol-label text-vol-faint">{fmtDate(n.createdAt)}</p>
                    <h3 className="font-display text-[1.05rem] font-bold leading-snug text-vol-head group-hover:text-vol-accent sm:text-[1.1rem]">{n.title}</h3>
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
