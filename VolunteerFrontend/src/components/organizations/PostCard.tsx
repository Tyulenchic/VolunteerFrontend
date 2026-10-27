import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '../Modal';
import { SecureImage } from '../SecureImage';
import { API_BASE_URL } from '../../config';
import { fileIcon, formatSize } from '../../utils/postFiles';
import type { OrganizationPost, PostFile, PostImage } from '../../types/organization';

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Публикация организации в духе ленты: фото (одно крупно или сеткой) и текст любой длины.
 * Нажатие на фото открывает просмотр во весь экран. Для организатора можно передать панель действий (actions).
 */
export function PostCard({ post, actions, orgName }: { post: OrganizationPost; actions?: React.ReactNode; orgName?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const long = (post.text?.length ?? 0) > 400;
  const images = post.images;

  return (
    <article className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${post.isHidden ? 'border-amber-300 opacity-80' : 'border-gray-100'}`}>
      {(orgName || actions) && (
        <header className="flex items-center justify-between gap-3 px-5 pt-4">
          <div className="min-w-0">
            {orgName && <p className="font-semibold text-gray-900 truncate">{orgName}</p>}
            <p className="text-xs text-gray-500">{fmt(post.createdAt)}{post.updatedAt ? ' · изменено' : ''}</p>
          </div>
          {actions}
        </header>
      )}
      {!orgName && !actions && <p className="px-5 pt-4 text-xs text-gray-500">{fmt(post.createdAt)}</p>}

      {post.isHidden && (
        <p className="mx-5 mt-3 text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-3 py-2">
          <i className="fas fa-eye-slash mr-1" aria-hidden /> Публикация скрыта администратором и не видна посетителям.
        </p>
      )}

      {images.length > 0 && <Collage images={images} onOpen={setOpen} />}

      <div className="px-5 py-4">
        {post.text && (
          <p className={`text-gray-800 whitespace-pre-line leading-relaxed ${long && !expanded ? 'line-clamp-6' : ''}`}>{post.text}</p>
        )}
        {long && (
          <button type="button" onClick={() => setExpanded(e => !e)} className="text-sm text-primary mt-1 hover:underline">
            {expanded ? 'Свернуть' : 'Читать полностью'}
          </button>
        )}
        {post.eventId && post.eventTitle && (
          <Link to={`/events/${post.eventId}`} className="inline-flex items-center gap-2 mt-3 text-sm text-primary hover:underline no-underline">
            <i className="fas fa-calendar-check" aria-hidden /> Мероприятие: {post.eventTitle}
          </Link>
        )}
      </div>

      {(post.files ?? []).length > 0 && <Attachments files={post.files} />}

      {open !== null && <Viewer images={images} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </article>
  );
}

function Viewer({ images, index, onIndex, onClose }: { images: PostImage[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const img = images[index];
  return (
    <Modal isOpen onClose={onClose} title={`Фото ${index + 1} из ${images.length}`} maxWidth="max-w-5xl">
      <div className="relative">
        <img src={img.url} alt="" className="w-full h-auto max-h-[75vh] object-contain mx-auto" />
        {images.length > 1 && (
          <>
            <button type="button" aria-label="Предыдущее фото" onClick={() => onIndex((index - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white hover:bg-black/70"><i className="fas fa-chevron-left" /></button>
            <button type="button" aria-label="Следующее фото" onClick={() => onIndex((index + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white hover:bg-black/70"><i className="fas fa-chevron-right" /></button>
          </>
        )}
      </div>
    </Modal>
  );
}

/**
 * Раскладка фото публикации. Кадрирование из формы к ленте не применяется: у разных фото разные пропорции, и общий кадр
 * искажал бы плитки, поэтому каждое фото заполняет свою ячейку (object-cover), а полностью его видно при открытии.
 *  1 фото — одно широкое; 2 — две квадратные рядом; 3 — одно широкое сверху и два квадрата; 4+ — сетка 2×2 с «+N».
 */
function Collage({ images, onOpen }: { images: PostImage[]; onOpen: (i: number) => void }) {
  const shown = images.slice(0, 4);
  const n = shown.length;
  const extra = images.length - 4;

  const cell = (img: PostImage, i: number, ratio: string, span = '') => (
    <button key={img.url} type="button" onClick={() => onOpen(i)}
      aria-label={`Открыть фото ${i + 1} из ${images.length}`}
      className={`relative block w-full overflow-hidden bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${ratio} ${span}`}>
      <SecureImage src={n === 1 || (n === 3 && i === 0) ? img.url : img.thumbnailUrl} alt="" loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
        fallback={<span className="absolute inset-0 flex items-center justify-center text-gray-300"><i className="fas fa-image text-3xl" aria-hidden /></span>} />
      {i === 3 && extra > 0 && (
        <span className="absolute inset-0 bg-black/55 text-white text-2xl font-bold flex items-center justify-center">+{extra}</span>
      )}
    </button>
  );

  return (
    <div className={`mt-3 grid gap-0.5 ${n === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
      {shown.map((img, i) => cell(img, i, n === 1 ? 'aspect-[4/3]' : n === 3 && i === 0 ? 'aspect-[16/9]' : 'aspect-square', n === 3 && i === 0 ? 'col-span-2' : ''))}
    </div>
  );
}

/** Вложения: видео смотрят на месте, документы скачивают (имя, тип и размер видны до нажатия). */
function Attachments({ files }: { files: PostFile[] }) {
  const href = (f: PostFile) => API_BASE_URL + f.url;
  return (
    <ul className="px-5 pb-4 space-y-2" aria-label="Вложения">
      {files.map(f => f.contentType === 'video/mp4' ? (
        <li key={f.id}>
          <video src={href(f)} controls preload="none" className="w-full max-h-[28rem] rounded-xl bg-black" aria-label={f.fileName} />
          <p className="mt-1 text-xs text-gray-500 truncate">{f.fileName} · {formatSize(f.sizeBytes)}</p>
        </li>
      ) : (
        <li key={f.id}>
          <a href={href(f)} download={f.fileName} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 no-underline hover:border-primary hover:bg-gray-50">
            <i className={`fas ${fileIcon(f.fileName)} text-primary text-xl w-6 text-center`} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-gray-900">{f.fileName}</span>
              <span className="block text-xs text-gray-500">{formatSize(f.sizeBytes)} · скачать</span>
            </span>
            <i className="fas fa-download text-gray-400" aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  );
}
