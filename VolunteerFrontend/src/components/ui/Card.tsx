import type { ReactNode } from 'react';

/**
 * Карточка. tone: workspace — тёмная карточка кабинета (по умолчанию, как раньше) · public — белая карточка публичных страниц.
 * padding: none (по умолчанию — содержимое само задаёт поля, как в списках с divide-y) · sm 16px · md 24px · lg 24→32px.
 * interactive — карточка-ссылка: приподнимается при наведении.
 */
type Tone = 'workspace' | 'public';
type Padding = 'none' | 'sm' | 'md' | 'lg';

const TONE: Record<Tone, string> = {
  workspace: 'bg-surface rounded-card border border-line shadow-card',
  public: 'bg-vol-surface rounded-panel border border-vol-line shadow-soft',
};
const PAD: Record<Padding, string> = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-6 sm:p-8' };
const HOVER: Record<Tone, string> = {
  workspace: 'transition hover:border-line-strong',
  public: 'transition duration-300 hover:shadow-raise hover:border-primary/30',
};

interface Props {
  children: ReactNode;
  className?: string;
  tone?: Tone;
  padding?: Padding;
  interactive?: boolean;
  as?: 'section' | 'article' | 'div' | 'li';
}

export function Card({ children, className = '', tone = 'workspace', padding = 'none', interactive, as: Tag = 'section' }: Props) {
  return <Tag className={`${TONE[tone]} ${PAD[padding]} ${interactive ? HOVER[tone] : ''} ${className}`}>{children}</Tag>;
}

export function CardHeader({ title, action }: { title: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-line">
      <h3 className="card-title">{title}</h3>
      {action}
    </div>
  );
}
