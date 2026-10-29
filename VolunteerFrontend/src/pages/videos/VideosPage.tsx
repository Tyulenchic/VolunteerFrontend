import { useCallback, useEffect, useMemo, useState } from 'react';
import { videoLinksApi } from '../../api/VideoLink';
import type { VideoLinkResponseDto } from '../../types/VideoLink';
import { cropFocus } from '../../components/ImageCropper';
import { SecureImage } from '../../components/SecureImage';
import { Spinner } from '../../components/Spinner';
import { VideoDialog } from '../../components/afisha/VideoDialog';
import { VolIcon } from '../../components/afisha/VolIcon';
import { VolButton } from '../../components/afisha/VolButton';

const ALL = 'all';
const ADMIN = 'admin';

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Видео: всё, что загрузили администраторы и организации (ссылка на любой сервис и своя обложка).
 * Отбор по автору — «Все», «Администрация» или конкретная организация. Нажатие открывает плеер.
 */
export function VideosPage() {
  const [items, setItems] = useState<VideoLinkResponseDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [source, setSource] = useState(ALL);
  const [playing, setPlaying] = useState<VideoLinkResponseDto | null>(null);

  const load = useCallback(async (skip: number) => {
    if (skip === 0) setLoading(true); else setLoadingMore(true);
    setFailed(false);
    try {
      const res = await videoLinksApi.getAll(skip, 100);
      setItems(prev => (skip === 0 ? res.items : [...prev, ...res.items]));
      setTotal(res.totalCount);
    } catch { setFailed(true); }
    finally { setLoading(false); setLoadingMore(false); }
  }, []);
  useEffect(() => { void load(0); }, [load]);

  // Авторы, у которых есть видео, — для кнопок отбора.
  const sources = useMemo(() => {
    const orgs = new Map<string, string>();
    let hasAdmin = false;
    for (const v of items) {
      if (v.organizationId) orgs.set(v.organizationId, v.organizationName ?? 'Организация');
      else hasAdmin = true;
    }
    return { orgs: [...orgs.entries()].sort((a, b) => a[1].localeCompare(b[1], 'ru')), hasAdmin };
  }, [items]);

  const shown = items.filter(v => source === ALL || (source === ADMIN ? !v.organizationId : v.organizationId === source));
  const chips = [
    { id: ALL, label: 'Все' },
    ...(sources.hasAdmin ? [{ id: ADMIN, label: 'Администрация' }] : []),
    ...sources.orgs.map(([id, name]) => ({ id, label: name })),
  ];

  return (
    <>
      <section className="relative">
        <div className="wrap relative z-10 grid items-end gap-8 pb-10 pt-14 md:grid-cols-[1.25fr_1fr] md:gap-16 md:pb-12 md:pt-20 max-md:text-center">
          <h1 className="vol-h1" style={{ textWrap: 'balance' }}>
            Видео <span className="text-vol-accent">волонтёров</span>
          </h1>
          <p className="vol-lead">
            Ролики с событий и акций: их загружают администраторы портала и организации Приднестровья.
          </p>
        </div>
      </section>

      {chips.length > 2 && (
        <section className="wrap" aria-label="Автор видео">
          <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto border-y border-vol-line px-4 py-6 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="group">
            {chips.map(c => (
              <button key={c.id} type="button" onClick={() => setSource(c.id)} aria-pressed={source === c.id}
                className={`inline-flex h-9 shrink-0 items-center rounded-lg border-[1.5px] px-3.5 text-[13.5px] font-medium ${source === c.id
                  ? 'border-vol-accent bg-vol-accent text-vol-accent-fg' : 'border-vol-ctrl bg-vol-surface text-vol-fg hover:border-vol-accent hover:text-vol-accent'}`}>
                {c.label}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="wrap pb-32 pt-10">
        {loading ? (
          <div className="flex justify-center py-16 text-vol-accent"><Spinner /></div>
        ) : failed ? (
          <div className="py-16 text-center">
            <p className="text-[14.5px] text-vol-muted">Не удалось загрузить видео.</p>
            <div className="mt-4 flex justify-center"><VolButton kind="outline" onClick={() => load(0)}>Повторить</VolButton></div>
          </div>
        ) : shown.length === 0 ? (
          <p className="py-16 text-center text-[14.5px] text-vol-muted">Видео пока нет.</p>
        ) : (
          <>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-x-6 gap-y-9">
              {shown.map(v => (
                <li key={v.id}>
                  <button type="button" onClick={() => setPlaying(v)} aria-haspopup="dialog" aria-label={`Смотреть видео: ${v.title}`}
                    className="on-dark group relative block aspect-video w-full overflow-hidden rounded-2xl border border-vol-line bg-vol-head text-left">
                    <SecureImage src={v.thumbnailUrl} alt="" draggable={false}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      style={{ objectPosition: cropFocus(v.hasCustomCover ? v.coverCrop : null) }} />
                    <span aria-hidden="true" className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-vol-surface text-vol-accent shadow-lg transition-transform group-hover:scale-110 sm:h-14 sm:w-14">
                      <VolIcon n="play" size={22} className="ml-0.5" />
                    </span>
                  </button>
                  <div className="mt-3 max-md:text-center">
                    <p className="vol-label text-vol-faint">{v.organizationName ?? 'Администрация'} · {fmtDate(v.createdAt)}</p>
                    <h2 className="font-display mt-1.5 text-[1.05rem] font-bold leading-snug text-vol-head break-words">{v.title}</h2>
                    {v.description && <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-vol-muted">{v.description}</p>}
                  </div>
                </li>
              ))}
            </ul>
            {items.length < total && (
              <div className="mt-10 flex justify-center">
                <VolButton kind="outline" onClick={() => load(items.length)}>{loadingMore ? 'Загрузка…' : 'Показать ещё'}</VolButton>
              </div>
            )}
          </>
        )}
      </section>

      {playing && <VideoDialog item={playing} onClose={() => setPlaying(null)} />}
    </>
  );
}
