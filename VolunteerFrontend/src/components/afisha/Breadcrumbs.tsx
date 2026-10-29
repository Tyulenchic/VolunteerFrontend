import { Link } from 'react-router-dom';

/** Путь до страницы над её заголовком: «Главная › Раздел › Текущая». Последний пункт — текущая страница, он сокращается первым. */
export function Breadcrumbs({ items, current }: { items: { to: string; label: string }[]; current: string }) {
  return (
    <div className="wrap py-0.5">
      <nav aria-label="Хлебные крошки" className="flex min-w-0 items-center gap-2 text-meta text-vol-faint">
        {items.map(it => (
          <span key={it.to} className="flex shrink-0 items-center gap-2">
            {/* min-h-10: the tap target is taller than the text, so the link is easy to hit on a phone */}
            <Link to={it.to} className="press-flat inline-flex min-h-10 items-center text-vol-faint no-underline hover:text-vol-accent">{it.label}</Link>
            <i className="fas fa-chevron-right text-[0.625rem]" aria-hidden />
          </span>
        ))}
        <span className="truncate font-medium text-vol-fg" aria-current="page">{current}</span>
      </nav>
    </div>
  );
}
