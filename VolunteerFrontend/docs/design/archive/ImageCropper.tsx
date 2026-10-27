import { useRef, type KeyboardEvent, type PointerEvent } from 'react';

/*
  Рамка выбора области показа.

  Значение наружу — CropRect в долях 0..1 от размеров ОРИГИНАЛА.
  Оригинал не режется: эти четыре числа уходят на сервер и хранятся рядом с файлом.

  Поддержка: мышь, палец (pointer events), клавиатура (стрелки двигают, +/- меняют размер).
  Зависимости: только React и Tailwind.
*/

export type CropRect = { x: number; y: number; w: number; h: number };

export type ImagePurpose = 'avatar' | 'news' | 'event' | 'orgLogo' | 'gallery';

export type PurposeConfig = {
  label: string;
  aspect: number;           // ширина / высота области показа
  min: [number, number];    // минимальный размер ОРИГИНАЛА в пикселях
  outputs: number[];        // ширины производных, которые делает бэкенд
  round?: boolean;          // круглая рамка (аватар, логотип)
  note: string;
};

export const PURPOSES: Record<ImagePurpose, PurposeConfig> = {
  avatar:  { label: 'Аватар',            aspect: 1,       min: [184, 184],   outputs: [184, 64, 32],          round: true,  note: 'Фото профиля: шапка, карточка волонтёра, комментарии' },
  news:    { label: 'Новость',           aspect: 16 / 10, min: [1200, 750],  outputs: [1600, 1200, 800, 400],               note: 'Обложка новости в списке и на главной' },
  event:   { label: 'Мероприятие',       aspect: 16 / 10, min: [1200, 750],  outputs: [1600, 1200, 800, 400],               note: 'Фото на карточке мероприятия' },
  orgLogo: { label: 'Логотип организации', aspect: 1,     min: [256, 256],   outputs: [256, 96, 48],          round: true,  note: 'Логотип в карточке организации' },
  gallery: { label: 'Галерея',           aspect: 3 / 2,   min: [1400, 933],  outputs: [1600, 1000, 600],                    note: 'Плитка в блоке «Как это было»' },
};

export const MAX_BYTES = 10 * 1024 * 1024;
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
      className={`absolute z-10 h-5 w-5 rounded-[5px] border-2 border-accent bg-white shadow-sm ${pos}`}
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

/*
  CSS для .crop-frame — положить в src/index.css:

  .crop-frame {
    box-shadow: 0 0 0 9999px rgba(10, 20, 39, .62);
    background-image:
      linear-gradient(to right, transparent calc(33.33% - .5px), rgba(255,255,255,.55) calc(33.33% - .5px), rgba(255,255,255,.55) calc(33.33% + .5px), transparent calc(33.33% + .5px), transparent calc(66.66% - .5px), rgba(255,255,255,.55) calc(66.66% - .5px), rgba(255,255,255,.55) calc(66.66% + .5px), transparent calc(66.66% + .5px)),
      linear-gradient(to bottom, transparent calc(33.33% - .5px), rgba(255,255,255,.55) calc(33.33% - .5px), rgba(255,255,255,.55) calc(33.33% + .5px), transparent calc(33.33% + .5px), transparent calc(66.66% - .5px), rgba(255,255,255,.55) calc(66.66% - .5px), rgba(255,255,255,.55) calc(66.66% + .5px), transparent calc(66.66% + .5px));
  }
  .crop-frame:focus-visible { outline: 3px solid #fff; outline-offset: 0; }
*/

/* ------------------------------------------------------------------
   Предпросмотр: показывает ровно тот фрагмент, который увидит посетитель.
   Оригинал не режется — он сдвигается и масштабируется внутри окна.
   ------------------------------------------------------------------ */
export function CropPreview({
  src, rect, aspect, className = '', round = false, alt = '',
}: { src: string; rect: CropRect; aspect: number; className?: string; round?: boolean; alt?: string }) {
  return (
    <div className={`relative overflow-hidden ${round ? 'rounded-full' : 'rounded-xl'} ${className}`} style={{ aspectRatio: aspect }}>
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="absolute max-w-none select-none"
        style={{
          width: `${100 / rect.w}%`,
          left: `${-(rect.x / rect.w) * 100}%`,
          top: `${-(rect.y / rect.h) * 100}%`,
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------
   Проверка файла до отправки на сервер.
   Те же правила обязательно повторить на бэкенде — фронту доверять нельзя.
   ------------------------------------------------------------------ */
export type FileCheck = { ok: true; width: number; height: number; src: string } | { ok: false; error: string };

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
      resolve({ ok: false, error: `Файл ${mb} МБ больше допустимых 10 МБ.` });
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
        if (img.naturalWidth < minW || img.naturalHeight < minH) {
          resolve({
            ok: false,
            error: `Фото ${fmt(img.naturalWidth)} × ${fmt(img.naturalHeight)} px слишком маленькое. Для «${p.label}» нужно минимум ${fmt(minW)} × ${fmt(minH)} px.`,
          });
          return;
        }
        resolve({ ok: true, width: img.naturalWidth, height: img.naturalHeight, src });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

/** Хватает ли выбранной области на самую большую производную. Не ошибка, а предупреждение о мягкой картинке. */
export function qualityWarning(rect: CropRect, naturalWidth: number, purpose: ImagePurpose): string | null {
  const need = PURPOSES[purpose].outputs[0];
  const areaW = rect.w * naturalWidth;
  if (areaW >= need) return null;
  const fmt = (n: number) => Math.round(n).toLocaleString('ru-RU');
  return `Выбрано ${fmt(areaW)} px по ширине, а для показа нужно ${fmt(need)} px. Фото будет растянуто и станет мягким — увеличьте область.`;
}
