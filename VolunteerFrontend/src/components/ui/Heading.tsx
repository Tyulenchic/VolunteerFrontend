import type { HTMLAttributes } from 'react';

/**
 * Заголовок по единой шкале. level — уровень в документе (h1–h4), look — как он выглядит; по умолчанию look = уровню.
 * Публичные страницы: h1 · h1-detail (страница записи) · h2 (секция) · compact (форма, CTA, пустое состояние) · h3 (карточка).
 * Кабинеты: ws-title · ws-section · ws-card. Размеры — fontSize в tailwind.config.js, цвет и шрифт — классы в index.css.
 */
export type HeadingLook = 'h1' | 'h1-detail' | 'h2' | 'compact' | 'h3' | 'ws-title' | 'ws-section' | 'ws-card';

const LOOK: Record<HeadingLook, string> = {
  h1: 'vol-h1',
  'h1-detail': 'vol-h1-detail',
  h2: 'vol-h2',
  compact: 'vol-compact',
  h3: 'vol-h3',
  'ws-title': 'page-title',
  'ws-section': 'section-title',
  'ws-card': 'card-title',
};

const BY_LEVEL: Record<1 | 2 | 3 | 4, HeadingLook> = { 1: 'h1', 2: 'h2', 3: 'h3', 4: 'h3' };

interface Props extends HTMLAttributes<HTMLHeadingElement> {
  level: 1 | 2 | 3 | 4;
  look?: HeadingLook;
}

export function Heading({ level, look = BY_LEVEL[level], className = '', children, ...rest }: Props) {
  const Tag = `h${level}` as const;
  return <Tag {...rest} className={`${LOOK[look]} ${className}`}>{children}</Tag>;
}
