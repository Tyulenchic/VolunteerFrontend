import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'success' | 'info' | 'ghost';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'md' | 'sm';
  loading?: boolean;
}

/** Visual rules for `.btn*` live in src/index.css so raw <button className="btn btn-primary"> stays in sync. */
export function Button({ variant = 'primary', size = 'md', loading, disabled, className = '', children, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${size === 'sm' ? 'btn-sm' : ''} ${className}`}
    >
      {loading && <span className="spinner !w-3.5 !h-3.5" aria-hidden />}
      {children}
    </button>
  );
}
