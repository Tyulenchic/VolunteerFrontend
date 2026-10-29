import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '../Modal';
import { SecureImage } from '../SecureImage';
import { CroppedImage } from '../ImageCropper';
import { API_BASE_URL } from '../../config';
import { fileIcon, formatSize } from '../../utils/postFiles';
import type { OrganizationPost, OrganizationSummary, PostFile, PostImage } from '../../types/organization';

const fmtFull = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Как в ленте соцсетей: «5 мин», «3 ч», «2 дн.», дальше — дата (год — только если не текущий). */
function fmtAgo(iso: string) {
  const d = new Date(iso);
  const min = Math.floor((Date.now() - d.getTime()) / 60000);
  if (min < 1) return 'только что';
  if (min < 60) return `${min} мин`;
  if (min < 60 * 24) return `${Math.floor(min / 60)} ч`;
  if (min < 60 * 24 * 7) return `${Math.floor(min / 1440)} дн.`;
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('ru-RU', sameYear ? { day: 'numeric', month: 'long' } : { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Длинный текст сворачивается до трёх строк с «ещё» — как подпись к публикации. */
const isLong = (text: string | null) => !!text && (text.length > 220 || text.split('\n').length > 3);

/**
 * Публикация организации в духе ленты Instagram: шапка с логотипом и временем, фото листаются свайпом (точки и счётчик),
 * подпись под фото с «ещё». Нажатие на фото открывает просмотр во весь экран. Организатор передаёт панель действий (actions).
 * organization — логотип и ссылка в шапке; если её нет, показывается orgName (или только время).
 */
export function PostCard({ post, actions, orgName, organization, className = '' }: {
  post: OrganizationPost;
  actions?: React.ReactNode;
  orgName?: string;
  organization?: OrganizationSummary | null;
  className?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const name = organization?.name ?? orgName;
  const images = post.images;
  const long = isLong(post.text);

  return (
    <article className={`overflow-hidden rounded-panel border bg-vol-surface shadow-soft ${post.isHidden ? 'border-amber-300' : 'border-vol-line'} ${className}`}>
      <header className="flex items-center gap-3 px-4 py-3">
        {name && <OrgAvatar organization={organization} name={name} />}
        <div className="min-w-0 flex-1 leading-tight">
          {name && (organization
            ? <Link to={`/organizations/${organization.id}`} className="block truncate text-ctrl font-semibold text-vol-fg no-underline hover:text-vol-accent">{name}</Link>
            : <p className="truncate text-ctrl font-semibold text-vol-fg">{name}</p>)}
          <time dateTime={post.createdAt} title={fmtFull(post.createdAt)} className="text-meta text-vol-faint">
            {fmtAgo(post.createdAt)}{post.updatedAt ? ' · изменено' : ''}
          </time>
        </div>
        {actions}
      </header>

      {post.isHidden && (
        <p className="mx-4 mb-3 rounded-control border border-amber-200 bg-amber-50 px-3 py-2 text-meta text-amber-800">
          <i className="fas fa-eye-slash mr-1" aria-hidden /> Публикация скрыта администратором и не видна посетителям.
        </p>
      )}

      {images.length > 0 && <Carousel images={images} onOpen={setOpen} />}

      {(post.text || (post.eventId && post.eventTitle)) && (
        <div className="px-4 pb-4 pt-3">
          {post.text && (
            <div className="text-body-sm text-vol-fg">
              <p className={`whitespace-pre-line break-words ${long && !expanded ? 'line-clamp-3' : ''}`}>{post.text}</p>
              {long && (
                <button type="button" onClick={() => setExpanded(e => !e)} aria-expanded={expanded}
                  className="press-flat mt-0.5 text-body-sm font-medium text-vol-faint hover:text-vol-fg">
                  {expanded ? 'Свернуть' : 'ещё'}
                </button>
              )}
            </div>
          )}
          {post.eventId && post.eventTitle && (
            <Link to={`/events/${post.eventId}`}
              className="press-flat mt-3 inline-flex max-w-full items-center gap-2 rounded-full bg-vol-accent-soft px-3 py-1.5 text-meta font-medium text-primary-dark no-underline hover:bg-vol-accent hover:text-white">
              <i className="fas fa-calendar-check shrink-0" aria-hidden /><span className="truncate">{post.eventTitle}</span>
            </Link>
          )}
        </div>
      )}

      {(post.files ?? []).length > 0 && <Attachments files={post.files} />}

      {open !== null && <Viewer images={images} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </article>
  );
}

function OrgAvatar({ organization, name }: { organization?: OrganizationSummary | null; name: string }) {
  const inner = organization?.logoThumbnailUrl
    ? <CroppedImage src={organization.logoThumbnailUrl} crop={organization.logoCrop} aspect={1} round className="h-full w-full !rounded-none" />
    : <span className="font-display text-ctrl font-bold">{name.trim().charAt(0).toUpperCase()}</span>;
  // Кольцо в цветах палитры — узнаваемый «аватар автора» ленты.
  return (
    <span className="shrink-0 rounded-full bg-gradient-to-tr from-vol-green to-vol-accent p-[2px]" aria-hidden>
      <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border-2 border-vol-surface bg-vol-accent-soft text-primary-dark">{inner}</span>
    </span>
  );
}

/**
 * Фото листаются горизонтально (свайп на телефоне, стрелки при наведении на компьютере), каждое встаёт по центру.
 * Кадрирование из формы не применяется: у фото разные пропорции, поэтому все показываются в одном кадре 4:5 (на широком экране 1:1),
 * а целиком — при открытии.
 */
function Carousel({ images, onOpen }: { images: PostImage[]; onOpen: (i: number) => void }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const many = images.length > 1;

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: Math.max(0, Math.min(images.length - 1, i)) * el.clientWidth, behavior: 'smooth' });
  };
  const onScroll = () => {
    const el = track.current;
    if (el) setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
  };

  return (
    <div className="group/carousel relative" aria-roledescription="карусель" aria-label={`Фото: ${images.length}`}>
      <div ref={track} onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain bg-vol-bg"
        onKeyDown={e => { if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); } }}>
        {images.map((img, i) => (
          <button key={img.url} type="button" onClick={() => onOpen(i)}
            aria-label={`Открыть фото ${i + 1} из ${images.length}`}
            className="relative aspect-[4/5] w-full shrink-0 snap-center snap-always overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:aspect-square">
            <SecureImage src={i === 0 ? img.url : img.thumbnailUrl || img.url} alt="" loading={i === 0 ? undefined : 'lazy'} draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
              fallback={<span className="absolute inset-0 grid place-items-center text-vol-rule"><i className="fas fa-image text-3xl" aria-hidden /></span>} />
          </button>
        ))}
      </div>

      {many && (
        <>
          <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-meta font-semibold tabular-nums text-white backdrop-blur-sm" aria-live="polite">
            {index + 1}/{images.length}
          </span>
          <NavArrow dir="prev" hidden={index === 0} onClick={() => go(index - 1)} />
          <NavArrow dir="next" hidden={index === images.length - 1} onClick={() => go(index + 1)} />
          <div className="flex justify-center gap-1.5 pt-3" aria-hidden>
            {images.map((img, i) => (
              <span key={img.url} className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-4 bg-vol-accent' : 'w-1.5 bg-vol-rule'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function NavArrow({ dir, hidden, onClick }: { dir: 'prev' | 'next'; hidden: boolean; onClick: () => void }) {
  if (hidden) return null;
  return (
    <button type="button" onClick={onClick} aria-label={dir === 'prev' ? 'Предыдущее фото' : 'Следующее фото'}
      className={`press-flat absolute top-[calc(50%-0.75rem)] hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-vol-fg opacity-0 shadow-raise transition-opacity focus-visible:opacity-100 group-hover/carousel:opacity-100 sm:grid ${dir === 'prev' ? 'left-3' : 'right-3'}`}>
      <i className={`fas fa-chevron-${dir === 'prev' ? 'left' : 'right'} text-meta`} aria-hidden />
    </button>
  );
}

function Viewer({ images, index, onIndex, onClose }: { images: PostImage[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const img = images[index];
  return (
    <Modal isOpen onClose={onClose} title={`Фото ${index + 1} из ${images.length}`} maxWidth="max-w-5xl">
      <div className="relative">
        <SecureImage src={img.url} alt="" className="mx-auto h-auto max-h-[75vh] w-full object-contain" />
        {images.length > 1 && (
          <>
            <button type="button" aria-label="Предыдущее фото" onClick={() => onIndex((index - 1 + images.length) % images.length)}
              className="press-flat absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white hover:bg-black/70"><i className="fas fa-chevron-left" aria-hidden /></button>
            <button type="button" aria-label="Следующее фото" onClick={() => onIndex((index + 1) % images.length)}
              className="press-flat absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white hover:bg-black/70"><i className="fas fa-chevron-right" aria-hidden /></button>
          </>
        )}
      </div>
    </Modal>
  );
}

/** Вложения: видео смотрят на месте, документы скачивают (имя, тип и размер видны до нажатия). */
function Attachments({ files }: { files: PostFile[] }) {
  const href = (f: PostFile) => API_BASE_URL + f.url;
  return (
    <ul className="space-y-2 px-4 pb-4" aria-label="Вложения">
      {files.map(f => f.contentType === 'video/mp4' ? (
        <li key={f.id}>
          <video src={href(f)} controls preload="none" className="max-h-[28rem] w-full rounded-card bg-black" aria-label={f.fileName} />
          <p className="mt-1 truncate text-meta text-vol-faint">{f.fileName} · {formatSize(f.sizeBytes)}</p>
        </li>
      ) : (
        <li key={f.id}>
          <a href={href(f)} download={f.fileName} target="_blank" rel="noopener noreferrer"
            className="press-flat flex items-center gap-3 rounded-card border border-vol-line px-4 py-3 no-underline hover:border-vol-accent hover:bg-vol-bg">
            <i className={`fas ${fileIcon(f.fileName)} w-6 text-center text-xl text-primary`} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-ctrl font-medium text-vol-fg">{f.fileName}</span>
              <span className="block text-meta text-vol-faint">{formatSize(f.sizeBytes)} · скачать</span>
            </span>
            <i className="fas fa-download text-vol-faint" aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  );
}
