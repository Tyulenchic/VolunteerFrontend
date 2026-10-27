import { Button } from './Button';
import type { ReactNode } from 'react';

export function LoadingState({ label = 'Загрузка…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-ink-400" role="status">
      <span className="spinner text-brand-500" aria-hidden />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center" role="alert">
      <div className="w-12 h-12 rounded-full bg-danger-50 text-danger-700 flex items-center justify-center"><i className="fas fa-triangle-exclamation" /></div>
      <p className="text-ink-700">{message}</p>
      {onRetry && <Button onClick={onRetry}>Повторить</Button>}
    </div>
  );
}

export function EmptyState({ title, hint, icon = 'fa-inbox', action }: { title: string; hint?: string; icon?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-center">
      <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center"><i className={`fas ${icon}`} /></div>
      <p className="card-title mt-1">{title}</p>
      {hint && <p className="text-sm text-ink-400 max-w-sm">{hint}</p>}
      {action}
    </div>
  );
}
