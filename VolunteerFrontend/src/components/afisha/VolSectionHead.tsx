import type { ReactNode } from 'react';

/** Section heading: title (.vol-h2) and a smaller description under it. Left on desktop, centred below 768px. */
export function VolSectionHead({ title, sub, className = 'mb-10' }: { title: string; sub?: ReactNode; className?: string }) {
  return (
    <div className={`max-w-2xl max-md:mx-auto max-md:text-center ${className}`}>
      <h2 className="vol-h2">{title}</h2>
      {sub && <p className="mt-3 text-[14.5px] leading-relaxed text-vol-muted">{sub}</p>}
    </div>
  );
}
