import type { MouseEventHandler, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { VolIcon, type IconName } from './VolIcon';

/** One button for the whole public site: 44px high, 8px radius, Inter 14/600. The three kinds differ only in colour. */
export const BTN_BASE =
  'group inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-5 text-[14px] font-semibold no-underline sm:px-6';

export const BTN_KIND = {
  primary: 'bg-vol-accent text-vol-accent-fg hover:opacity-90',
  outline: 'border-[1.5px] border-vol-rule bg-vol-surface text-vol-fg hover:border-vol-accent hover:text-vol-accent',
  light: 'bg-vol-surface text-vol-accent shadow-[0_10px_26px_rgba(2,12,32,.3)] hover:bg-vol-accent-soft',
} as const;

export type BtnKind = keyof typeof BTN_KIND;

interface Props {
  kind?: BtnKind;
  /** arrow on the right, nudges 2px on hover */
  icon?: IconName;
  /** icon on the left, only where it names the action type (envelope for "write to us") */
  iconLeft?: IconName;
  to?: string;
  /** Внешняя ссылка (открывается в новой вкладке). */
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  full?: boolean;
  className?: string;
  children: ReactNode;
  'aria-haspopup'?: 'dialog';
}

export function VolButton({ kind = 'primary', icon, iconLeft, to, href, onClick, full, className = '', children, ...rest }: Props) {
  const cls = `${BTN_BASE} ${BTN_KIND[kind]} ${full ? 'w-full' : ''} ${className}`;
  const inner = (
    <>
      {iconLeft && <VolIcon n={iconLeft} size={16} className="shrink-0" />}
      <span className="truncate">{children}</span>
      {icon && <VolIcon n={icon} size={16} className="shrink-0 transition-transform group-hover:translate-x-0.5" />}
    </>
  );
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={cls}>{inner}</a>;
  return to
    ? <Link to={to} onClick={onClick} className={cls}>{inner}</Link>
    : <button type="button" onClick={onClick} className={cls} {...rest}>{inner}</button>;
}

/** Closing button of a block: bottom right on desktop, centred on tablet and phone (full width below 640px). */
export function BlockAction({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex justify-end max-md:justify-center max-sm:[&>*]:w-full ${className}`}>{children}</div>;
}
