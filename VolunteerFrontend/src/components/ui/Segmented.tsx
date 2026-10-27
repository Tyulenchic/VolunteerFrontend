export interface SegOption<T extends string> { value: T; label: string; icon?: string; count?: number; }

/** Compact single-choice switcher (tabs / view toggle). Scrolls sideways instead of overflowing narrow screens. */
export function Segmented<T extends string>({ options, value, onChange, label }: {
  options: SegOption<T>[]; value: T; onChange: (v: T) => void; label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex max-w-full overflow-x-auto no-scrollbar p-0.5 rounded-control bg-surface-2 border border-line">
      {options.map(o => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}
          className={`shrink-0 px-3 py-1.5 rounded-[6px] text-[13px] font-medium flex items-center gap-1.5 whitespace-nowrap ${value === o.value ? 'bg-surface-3 text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-900'}`}>
          {o.icon && <i className={`fas ${o.icon} text-xs`} />}{o.label}
          {o.count != null && o.count > 0 && <span className="min-w-[1.25rem] px-1 rounded-full bg-warning-100 text-warning-700 text-[11px] text-center">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}
