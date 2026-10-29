import { useState } from 'react';
import { CroppedImage } from '../ImageCropper';
import type { ImageCropDto } from '../../types/organization';

/**
 * Единый аватар сайта и админки. Размеры по назначению: xs/sm — компактный (списки, таблицы, меню),
 * md — стандартный (карточки), lg — карточка волонтёра, xl — шапка профиля.
 *
 * Источник выбирается так: квадратная миниатюра (сервер уже вырезал её по кадру) → полное фото с кадром → инициал.
 * Пустой адрес, ошибка загрузки и недоступный файл — один и тот же запасной вариант (инициал на фирменном фоне),
 * без «сломанной картинки». Какие адреса сюда попадают, решает сервер: в публичных ответах фото скрытого профиля
 * не приходит вовсе, поэтому компонент не обходит настройки приватности.
 */
const SIZE = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-20 h-20 text-2xl',
  xl: 'w-24 h-24 sm:w-28 sm:h-28 text-3xl',
} as const;

export type AvatarSize = keyof typeof SIZE;

interface Props {
  /** Имя для инициала и подписи; пустое — «?». */
  name: string;
  /** Квадратная миниатюра (предпочтительно). */
  thumb?: string | null;
  /** Полное фото; используется, если миниатюры нет или она не загрузилась. */
  src?: string | null;
  crop?: ImageCropDto | null;
  size?: AvatarSize;
  /** Квадрат со скруглением вместо круга (шапка профиля). */
  square?: boolean;
  className?: string;
  /** Подпись для скринридера; по умолчанию аватар декоративный (имя обычно написано рядом). */
  alt?: string;
}

export function Avatar({ name, thumb, src, crop, size = 'sm', square = false, className = '', alt }: Props) {
  // Сбой запоминается для конкретного адреса: новый адрес снова пробуется без эффекта-сброса.
  const [failedThumb, setFailedThumb] = useState<string | null>(null);
  const thumbFailed = !!thumb && failedThumb === thumb;

  const shape = square ? 'rounded-2xl' : 'rounded-full';
  const box = `${SIZE[size]} ${shape} shrink-0 overflow-hidden ${className}`;
  const initial = (
    <span className={`${box} vol-avatar-fallback font-semibold inline-flex items-center justify-center select-none`}
      role={alt ? 'img' : undefined} aria-label={alt} aria-hidden={alt ? undefined : true}>
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );

  if (thumb && !thumbFailed) {
    return <img src={thumb} alt={alt ?? ''} aria-hidden={alt ? undefined : true} loading="lazy"
      className={`${box} object-cover bg-gray-100`} onError={() => setFailedThumb(thumb)} />;
  }
  if (src) {
    return (
      <span className={`${box} relative inline-block`} role={alt ? 'img' : undefined} aria-label={alt} aria-hidden={alt ? undefined : true}>
        <CroppedImage src={src} crop={crop} fill round={!square} className={square ? '!rounded-2xl' : ''} placeholder={initial} />
      </span>
    );
  }
  return initial;
}

/** Thumbnail for a stored image URL (used as-is). Broken or missing images fall back to a neutral placeholder. */
export function Thumb({ src, className = '' }: { src?: string | null; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) return <img src={src} alt="" className={`object-cover ${className}`} onError={() => setFailed(true)} />;
  return <span className={`bg-surface-3 text-ink-400 flex items-center justify-center ${className}`}><i className="far fa-image text-lg" /></span>;
}
