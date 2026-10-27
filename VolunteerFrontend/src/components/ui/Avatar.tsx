import { useState } from 'react';

const SIZE = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' };

/** Renders the URL it is given, untouched. If that image fails to load, shows the initial instead. */
export function Avatar({ name, src, size = 'sm' }: { name: string; src?: string | null; size?: keyof typeof SIZE }) {
  const [failed, setFailed] = useState(false);
  const cls = `${SIZE[size]} rounded-full shrink-0`;
  if (src && !failed) return <img src={src} alt={name} className={`${cls} object-cover`} onError={() => setFailed(true)} />;
  return (
    <span className={`${cls} bg-brand-100 text-brand-700 font-semibold inline-flex items-center justify-center`} aria-hidden>
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}

/** Thumbnail for a stored image URL (used as-is). Broken or missing images fall back to a neutral placeholder. */
export function Thumb({ src, className = '' }: { src?: string | null; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) return <img src={src} alt="" className={`object-cover ${className}`} onError={() => setFailed(true)} />;
  return <span className={`bg-surface-3 text-ink-400 flex items-center justify-center ${className}`}><i className="far fa-image text-lg" /></span>;
}
