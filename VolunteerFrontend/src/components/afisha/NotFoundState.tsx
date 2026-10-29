import { VolButton } from './VolButton';

/** Пустая страница «не найдено» — одна для сайта: крупное 404, что случилось и куда идти дальше. */
export function NotFoundState({ title, hint, to, action }: { title: string; hint?: string; to: string; action: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-display mb-4 text-[clamp(4rem,3rem+5vw,6rem)] font-extrabold leading-none text-primary/20" aria-hidden>404</p>
      <h1 className="vol-compact mb-3">{title}</h1>
      {hint && <p className="vol-text-sm mb-8 max-w-md">{hint}</p>}
      <VolButton to={to} className={hint ? '' : 'mt-5'}>{action}</VolButton>
    </div>
  );
}
