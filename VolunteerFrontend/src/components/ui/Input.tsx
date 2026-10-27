import type { SelectHTMLAttributes } from 'react';

/** Search field with leading icon. Control look (border, focus ring) comes from the admin form CSS in index.css. */
export function SearchInput({ value, onChange, label, placeholder }: { value: string; onChange: (v: string) => void; label: string; placeholder?: string }) {
  return (
    <div className="relative flex-1 min-w-[220px] max-w-md">
      <i className="fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink-400 pointer-events-none" aria-hidden />
      <input type="search" aria-label={label} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm" />
    </div>
  );
}

export function Select({ label, className = '', children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return <select aria-label={label} {...rest} className={`px-3 py-2 text-sm ${className}`}>{children}</select>;
}

/** Labelled form row used inside modals. */
export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[13px] font-medium text-ink-700 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block meta mt-1">{hint}</span>}
    </label>
  );
}
