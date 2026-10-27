import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`bg-surface rounded-card border border-line shadow-card ${className}`}>{children}</section>;
}

export function CardHeader({ title, action }: { title: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-line">
      <h3 className="card-title">{title}</h3>
      {action}
    </div>
  );
}
