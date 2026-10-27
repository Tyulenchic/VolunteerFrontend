import { useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { useSecureSrc } from './SecureImage';
import type { ImageCropDto } from '../types/organization';

/*
  Рамка выбора области показа.

  Значение наружу — CropRect в долях 0..1 от размеров ОРИГИНАЛА. Оригинал не режется: четыре числа уходят на сервер
  и хранятся рядом с файлом (на сервере — x, y, width, height). Рамка сохраняет пропорции назначения (aspect), поэтому
  область всегда нужной формы: для аватара и логотипа — квадрат (этого требует и сервер).

  Поддержка: мышь, палец (pointer events), клавиатура (стрелки двигают, +/- меняют размер).
*/

export type CropRect = { x: number; y: number; w: number; h: number };

export type ImagePurpose = 'avatar' | 'news' | 'event' | 'orgLogo' | 'orgCover' | 'post' | 'video';

export type PurposeConfig = {
  label: string;
  aspect: number;           // ширина / высота области показа
  min: [number, number];    // рекомендуемый минимальный размер ОРИГИНАЛА в пикселях (предупреждение, не запрет)
  round?: boolean;          // круглая рамка (аватар, логотип)
  note: string;
};

export const PURPOSES: Record<ImagePurpose, PurposeConfig> = {
  avatar:   { label: 'Аватар',              aspect: 1,       min: [256, 256],   round: true,  note: 'Фото профиля: шапка, карточка волонтёра' },
  news:     { label: 'Новость',             aspect: 16 / 10, min: [800, 500],                  note: 'Обложка новости в списке и на главной' },
  event:    { label: 'Мероприятие',         aspect: 16 / 10, min: [800, 500],                  note: 'Фото на карточке мероприятия' },
  orgLogo:  { label: 'Логотип организации', aspect: 1,       min: [256, 256],   round: true,  note: 'Логотип в карточке организации' },
  orgCover: { label: 'Обложка организации', aspect: 16 / 5,  min: [1200, 375],                 note: 'Широкая обложка страницы организации' },
  video:    { label: 'Обложка видео',      aspect: 16 / 9,  min: [640, 360],                  note: 'Обложка видео на главной странице' },
  post:     { label: 'Фото публикации',     aspect: 4 / 3,   min: [600, 450],                  note: 'Фото в ленте организации' },
};

/** Максимальный размер загружаемого файла — как на сервере (Images:MaxUploadBytes). */
export const MAX_BYTES = 15 * 1024 * 1024;
export const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'] as const;
/** Минимальная сторона рамки в долях от оригинала. */
export const MIN_FRAME = 0.08;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Область по умолчанию: максимальный прямоугольник нужных пропорций. focusY сдвигает её по вертикали (0 — вверх, 1 — вниз). */
export function defaultRect(nw: number, nh: number, aspect: number, focusY = 0.5): CropRect {
  const hr = nw / (aspect * nh);
  let w = 1;
  let h = hr;
  if (h > 1) { h = 1; w = 1 / hr; }
  return { x: (1 - w) / 2, y: (1 - h) * focusY, w, h };
}

/** Масштабирование рамки от её центра. */
export function scaleRect(rect: CropRect, delta: number, hr: number, maxW: number): CropRect {
  const w = clamp(rect.w + delta, MIN_FRAME, maxW);
  const h = w * hr;
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  return { x: clamp(cx - w / 2, 0, 1 - w), y: clamp(cy - h / 2, 0, 1 - h), w, h };
}

/** Рамка → формат API (x, y, width, height). */
export const toApiCrop = (r: CropRect): ImageCropDto => ({ x: r.x, y: r.y, width: r.w, height: r.h });
/** Формат API → рамка. */
export const fromApiCrop = (c: ImageCropDto): CropRect => ({ x: c.x, y: c.y, w: c.width, h: c.height });

type DragState = {
  mode: 'move' | 'nw' | 'ne' | 'sw' | 'se';
  box: DOMRect;
  rect: CropRect;
  px: number;
  py: number;
};

type Props = {
  src: string;
  /** Натуральные размеры оригинала. */
  naturalWidth: number;
  naturalHeight: number;
  aspect: number;
  rect: CropRect;
  onChange: (rect: CropRect) => void;
  round?: boolean;
};

export function ImageCropper({ src, naturalWidth, naturalHeight, aspect, rect, onChange, round }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);

  // высота рамки относительно её ширины, в долях картинки
  const hr = naturalWidth / (aspect * naturalHeight);
  const maxW = Math.min(1, 1 / hr);

  const start = (mode: DragState['mode']) => (ev: PointerEvent<HTMLElement>) => {
    if (!wrap.current) return;
    ev.preventDefault();
    ev.stopPropagation();
    drag.current = { mode, box: wrap.current.getBoundingClientRect(), rect: { ...rect }, px: ev.clientX, py: ev.clientY };
    ev.currentTarget.setPointerCapture(ev.pointerId);
  };

  const move = (ev: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;

    if (d.mode === 'move') {
      const dx = (ev.clientX - d.px) / d.box.width;
      const dy = (ev.clientY - d.py) / d.box.height;
      onChange({ ...d.rect, x: clamp(d.rect.x + dx, 0, 1 - d.rect.w), y: clamp(d.rect.y + dy, 0, 1 - d.rect.h) });
      return;
    }

    // тянем угол: противоположный угол остаётся на месте, пропорции сохраняются
    const left = d.mode[1] === 'w';
    const top = d.mode[0] === 'n';
    const ax = left ? d.rect.x + d.rect.w : d.rect.x;
    const ay = top ? d.rect.y + d.rect.h : d.rect.y;
    const px = clamp((ev.clientX - d.box.left) / d.box.width, 0, 1);
    const py = clamp((ev.clientY - d.box.top) / d.box.height, 0, 1);
    const sx = left ? -1 : 1;
    const sy = top ? -1 : 1;

    let w = Math.max((px - ax) * sx, ((py - ay) * sy) / hr);
    w = clamp(w, MIN_FRAME, Math.min(left ? ax : 1 - ax, (top ? ay : 1 - ay) / hr));
    const h = w * hr;
    onChange({ x: left ? ax - w : ax, y: top ? ay - h : ay, w, h });
  };

  const end = () => { drag.current = null; };

  const onKeyDown = (ev: KeyboardEvent<HTMLDivElement>) => {
    const step = ev.shiftKey ? 0.08 : 0.02;
    let next = { ...rect };
    let used = true;
    switch (ev.key) {
      case 'ArrowLeft':  next.x = clamp(next.x - step, 0, 1 - next.w); break;
      case 'ArrowRight': next.x = clamp(next.x + step, 0, 1 - next.w); break;
      case 'ArrowUp':    next.y = clamp(next.y - step, 0, 1 - next.h); break;
      case 'ArrowDown':  next.y = clamp(next.y + step, 0, 1 - next.h); break;
      case '+': case '=': next = scaleRect(rect, step, hr, maxW); break;
      case '-': case '_': next = scaleRect(rect, -step, hr, maxW); break;
      default: used = false;
    }
    if (used) { ev.preventDefault(); onChange(next); }
  };

  const corner = (mode: DragState['mode'], pos: string, cursor: string) => (
    <span
      key={mode}
      role="presentation"
      onPointerDown={start(mode)}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      className={`absolute z-10 h-5 w-5 rounded-[5px] border-2 border-white bg-brand-500 shadow-sm ${pos}`}
      style={{ touchAction: 'none', cursor }}
    />
  );

  return (
    <div ref={wrap} className="relative inline-block max-w-full select-none align-top" style={{ touchAction: 'none' }}>
      <img src={src} alt="Загруженное фото целиком" draggable={false} className="block max-h-[52vh] max-w-full rounded-lg" />
      <div
        tabIndex={0}
        role="application"
        aria-label="Область показа. Стрелки — переместить, плюс и минус — изменить размер"
        onKeyDown={onKeyDown}
        onPointerDown={start('move')}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        className={`crop-frame absolute cursor-move ${round ? 'rounded-full' : 'rounded-[2px]'}`}
        style={{
          left: `${rect.x * 100}%`,
          top: `${rect.y * 100}%`,
          width: `${rect.w * 100}%`,
          height: `${rect.h * 100}%`,
          touchAction: 'none',
          outline: '2px solid #fff',
        }}
      >
        {corner('nw', '-left-2 -top-2', 'nwse-resize')}
        {corner('ne', '-right-2 -top-2', 'nesw-resize')}
        {corner('sw', '-bottom-2 -left-2', 'nesw-resize')}
        {corner('se', '-bottom-2 -right-2', 'nwse-resize')}
      </div>
    </div>
  );
}

/** Точка фокуса кадра для object-position: плитки с object-cover подстраиваются под выбранную область. */
export function cropFocus(crop: ImageCropDto | null | undefined): string {
  if (!crop) return '50% 50%';
  const pct = (v: number) => `${Math.round(Math.min(1, Math.max(0, v)) * 100)}%`;
  return `${pct(crop.x + crop.width / 2)} ${pct(crop.y + crop.height / 2)}`;
}

/* ------------------------------------------------------------------
   Показ изображения с сохранённым кадром: сервер отдаёт картинку целиком, а показывается ровно выбранная область.
   Оригинал не режется — он сдвигается и масштабируется внутри окна нужных пропорций (aspect).
   Без кадра картинка заполняет окно (object-cover).
   ------------------------------------------------------------------ */
export function CroppedImage({
  src, crop, aspect, className = '', round = false, alt = '', placeholder,
}: {
  src: string | null | undefined; crop?: ImageCropDto | null; aspect: number; className?: string; round?: boolean; alt?: string;
  placeholder?: React.ReactNode;
}) {
  const resolved = useSecureSrc(src);
  const shape = round ? 'rounded-full' : 'rounded-xl';

  if (!resolved.src || resolved.failed) {
    return (
      <div className={`relative overflow-hidden bg-gray-100 flex items-center justify-center text-gray-300 ${shape} ${className}`} style={{ aspectRatio: aspect }}>
        {placeholder ?? <i className="fas fa-image text-3xl" aria-hidden />}
      </div>
    );
  }

  if (!crop) {
    return (
      <div className={`relative overflow-hidden bg-gray-100 ${shape} ${className}`} style={{ aspectRatio: aspect }}>
        <img src={resolved.src} alt={alt} loading="lazy" onError={resolved.onError} className="absolute inset-0 w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${shape} ${className}`} style={{ aspectRatio: aspect }}>
      <img
        src={resolved.src}
        alt={alt}
        loading="lazy"
        draggable={false}
        onError={resolved.onError}
        className="absolute max-w-none select-none"
        style={{
          width: `${100 / crop.width}%`,
          left: `${-(crop.x / crop.width) * 100}%`,
          top: `${-(crop.y / crop.height) * 100}%`,
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------
   Проверка файла до отправки на сервер. Те же правила сервер проверяет сам (по содержимому файла) — это лишь
   быстрый отказ без лишней передачи. Слишком маленькое фото — предупреждение, а не запрет.
   ------------------------------------------------------------------ */
export type FileCheck =
  | { ok: true; width: number; height: number; src: string; warning: string | null }
  | { ok: false; error: string };

export function readAndCheck(file: File, purpose: ImagePurpose): Promise<FileCheck> {
  const p = PURPOSES[purpose];
  const fmt = (n: number) => Math.round(n).toLocaleString('ru-RU');

  return new Promise((resolve) => {
    if (!ACCEPTED.includes(file.type as typeof ACCEPTED[number])) {
      resolve({ ok: false, error: 'Поддерживаются только JPEG, PNG и WebP.' });
      return;
    }
    if (file.size > MAX_BYTES) {
      const mb = (file.size / 1024 / 1024).toFixed(1).replace('.', ',');
      resolve({ ok: false, error: `Файл ${mb} МБ больше допустимых 15 МБ.` });
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => resolve({ ok: false, error: 'Не удалось прочитать файл. Попробуйте другой.' });
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onerror = () => resolve({ ok: false, error: 'Файл не похож на изображение.' });
      img.onload = () => {
        const [minW, minH] = p.min;
        const small = img.naturalWidth < minW || img.naturalHeight < minH;
        resolve({
          ok: true, width: img.naturalWidth, height: img.naturalHeight, src,
          warning: small
            ? `Фото ${fmt(img.naturalWidth)} × ${fmt(img.naturalHeight)} px маленькое: для «${p.label}» лучше от ${fmt(minW)} × ${fmt(minH)} px, иначе картинка будет мягкой.`
            : null,
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}
