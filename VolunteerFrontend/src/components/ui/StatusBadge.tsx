import type { ReactNode } from 'react';

/** One meaning per colour: green = good/active, amber = waiting for someone, red = rejected/problem,
 *  teal = finished/attended, blue = informational, grey = neutral/draft. */
export type Tone = 'success' | 'pending' | 'warning' | 'cancelled' | 'error' | 'draft' | 'completed' | 'neutral' | 'brand';

const TONE: Record<Tone, { cls: string; dot: string }> = {
  success:   { cls: 'bg-success-50 text-success-700 border-success-200', dot: 'bg-success-600' },
  pending:   { cls: 'bg-warning-50 text-warning-700 border-warning-200', dot: 'bg-warning-600' },
  warning:   { cls: 'bg-warning-50 text-warning-700 border-warning-200', dot: 'bg-warning-600' },
  cancelled: { cls: 'bg-danger-50 text-danger-700 border-danger-200',    dot: 'bg-danger-600' },
  error:     { cls: 'bg-danger-50 text-danger-700 border-danger-200',    dot: 'bg-danger-600' },
  draft:     { cls: 'bg-surface-3 text-ink-500 border-line-strong',      dot: 'bg-ink-300' },
  completed: { cls: 'bg-info-50 text-info-700 border-info-200',          dot: 'bg-info-600' },
  neutral:   { cls: 'bg-surface-3 text-ink-500 border-line-strong',      dot: 'bg-ink-300' },
  brand:     { cls: 'bg-brand-50 text-brand-700 border-brand-200',       dot: 'bg-brand-600' },
};

/** Domain status → tone, shared by every admin screen. */
export const STATUS_TONE: Record<string, Tone> = {
  Draft: 'draft', Published: 'success', Cancelled: 'cancelled', Completed: 'completed', Archived: 'neutral',
  Pending: 'pending', Approved: 'success', Rejected: 'cancelled', Withdrawn: 'neutral', ConfirmedAttendance: 'completed', AttendanceConfirmed: 'completed',
  Active: 'success', Blocked: 'error',
};

export function StatusBadge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  const t = TONE[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-medium whitespace-nowrap ${t.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} aria-hidden />
      {children}
    </span>
  );
}
