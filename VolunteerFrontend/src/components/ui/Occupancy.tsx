/** Participant count; with a known capacity it also draws a fill bar. */
export function Occupancy({ approved, max }: { approved: number; max?: number | null }) {
  if (!max || max <= 0) return <span className="meta"><i className="fas fa-user-group mr-1" />{approved} участников</span>;
  const pct = Math.min(100, Math.round((approved / max) * 100));
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="h-1.5 flex-1 min-w-[60px] rounded-full bg-surface-3 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Заполненность">
        <div className={`h-full rounded-full ${pct >= 100 ? 'bg-success-600' : 'bg-brand-500'}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="meta whitespace-nowrap">{approved} / {max}</span>
    </div>
  );
}

/** AdminEventListDto.freeSlots = maxParticipants - approved, or -1 when capacity is unlimited. */
export const capacityFromFreeSlots = (approved: number, freeSlots?: number | null) =>
  freeSlots != null && freeSlots >= 0 ? approved + freeSlots : null;
