import { useRef, useState } from 'react';
import { Modal } from './Modal';
import { useSecureSrc } from './SecureImage';

interface Props {
  src?: string | null;
  alt: string;
  /** card: uniform 16:10 frame for grids · hero: full width, natural proportions, height capped to the viewport */
  variant: 'card' | 'hero';
}

/**
 * Shows an event photo whole: never cropped, never stretched (`object-contain`).
 * The frame has a neutral background so tall / wide / square photos sit in it quietly instead of breaking the layout.
 * The hero photo opens in a viewer on click so a very tall or very wide picture can be looked at in full size.
 */
/**
 * Height cap of the detail photo. It depends on the orientation (a portrait photo needs more height to stay readable)
 * and on the viewport height, but is clamped so a big monitor never makes the photo bigger than ~400–540px.
 */
function heroMaxHeight(ratio: number | null) {
  if (ratio === null || ratio >= 1.3) return 'clamp(15rem, 42vh, 26.25rem)'; // landscape
  if (ratio >= 0.85) return 'clamp(15rem, 44vh, 27.5rem)';                  // roughly square
  return 'clamp(16.25rem, 52vh, 33.75rem)';                                      // portrait
}

export function EventImage({ src, alt, variant }: Props) {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const close = () => { setOpen(false); opener.current?.focus(); };
  const [ratio, setRatio] = useState<number | null>(null); // natural width / height, known after load
  // Фото черновика публично не открывается (404) — useSecureSrc подставляет его запросом с токеном для автора и администратора.
  const secure = useSecureSrc(src);
  const shown = secure.src;
  const ok = !!shown && !secure.failed;

  const placeholder = (
    <div className="w-full h-full min-h-[10rem] flex items-center justify-center text-gray-300" role="img" aria-label="Фото не добавлено">
      <i className="fas fa-image text-4xl" aria-hidden />
    </div>
  );

  if (variant === 'card') {
    return (
      <div className="aspect-[16/10] bg-gray-100 flex items-center justify-center overflow-hidden">
        {ok
          ? <img src={shown!} alt={alt} loading="lazy" onError={secure.onError} className="w-full h-full object-contain" />
          : placeholder}
      </div>
    );
  }

  if (!ok) return <div className="rounded-2xl bg-gray-100 aspect-[16/9] max-h-[clamp(12.5rem,32vh,20rem)] overflow-hidden">{placeholder}</div>;

  return (
    <>
      <button ref={opener} type="button" onClick={() => setOpen(true)} aria-label="Открыть фото на весь экран"
        className="block w-full rounded-2xl bg-gray-100 overflow-hidden cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        <img src={shown!} alt={alt} onError={secure.onError}
          onLoad={(e) => setRatio(e.currentTarget.naturalWidth / (e.currentTarget.naturalHeight || 1))}
          style={{ maxHeight: heroMaxHeight(ratio) }} className="w-full h-auto object-contain mx-auto" />
      </button>
      <Modal isOpen={open} onClose={close} title={alt} maxWidth="max-w-5xl">
        <img src={shown!} alt={alt} className="w-full h-auto max-h-[75vh] object-contain mx-auto" />
      </Modal>
    </>
  );
}
