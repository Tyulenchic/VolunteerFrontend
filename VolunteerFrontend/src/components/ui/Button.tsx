import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * primary — главное действие · secondary/outline — второстепенное (контур) · light — на тёмной или фото-секции ·
 * ghost — тихое (удалить, отмена в строке) · danger / success — подтверждение опасного / положительного действия.
 * info оставлен для совместимости: в кабинете это голубая кнопка, на публичных страницах — как primary.
 */
type Variant = 'primary' | 'secondary' | 'outline' | 'light' | 'ghost' | 'danger' | 'success' | 'info';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  variant?: Variant;
  /** sm — в строках и таблицах · md — формы, кабинеты · lg — публичные страницы (44px) */
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  /** внутренняя ссылка (react-router) */
  to?: string;
  /** внешняя ссылка, открывается в новой вкладке */
  href?: string;
  full?: boolean;
  onClick?: MouseEventHandler<HTMLElement>;
  children?: ReactNode;
}

/**
 * Одна кнопка для всего сайта. Вид — классы .btn* в src/index.css: светлые по умолчанию, тёмные внутри
 * .admin-shell / .admin-modal, поэтому <button className="btn btn-primary"> и <Button> выглядят одинаково.
 */
export function Button({ variant = 'primary', size = 'md', loading, disabled, full, to, href, className = '', children, onClick, ...rest }: Props) {
  const cls = `btn btn-${variant} ${size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''} ${full ? 'w-full' : ''} no-underline ${className}`;
  const inner = <>{loading && <span className="spinner !w-3.5 !h-3.5" aria-hidden />}{children}</>;
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={cls}>{inner}</a>;
  if (to) return <Link to={to} onClick={onClick} className={cls}>{inner}</Link>;
  return (
    <button {...rest} onClick={onClick} disabled={disabled || loading} className={cls}>
      {inner}
    </button>
  );
}
