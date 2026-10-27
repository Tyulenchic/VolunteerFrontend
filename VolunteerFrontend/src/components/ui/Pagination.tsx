import { Button } from './Button';

export function Pagination({ skip, take, total, onChange }: { skip: number; take: number; total: number; onChange: (skip: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / take));
  const page = Math.floor(skip / take) + 1;
  if (total === 0) return null;
  return (
    <nav aria-label="Страницы" className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-line">
      <p className="text-[13px] text-ink-500">
        {skip + 1}–{Math.min(skip + take, total)} из {total}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={skip === 0} onClick={() => onChange(Math.max(0, skip - take))}><i className="fas fa-chevron-left text-[10px]" />Назад</Button>
        <span className="text-[13px] text-ink-500 px-1" aria-current="page">{page} / {pages}</span>
        <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onChange(skip + take)}>Далее<i className="fas fa-chevron-right text-[10px]" /></Button>
      </div>
    </nav>
  );
}
