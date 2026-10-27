import { useState } from 'react';
import type { EventResponseDto } from '../../types/event';
import { MONTH_NOM, MONTH_SHORT, WD_SHORT, dayKey, pad, parseDay, plural, timeOf } from '../../utils/afisha';
import { VolIcon } from './VolIcon';

interface Props {
  /** Local day keys ("YYYY-MM-DD") that have events */
  days: Set<string>;
  onPick: (key: string) => void;
  /** The nearest event */
  next: EventResponseDto;
}

export function MiniCalendar({ days, onPick, next }: Props) {
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const offset = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
  const dim = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);
  const shift = (k: number) => setView(v => { const dt = new Date(v.y, v.m + k, 1); return { y: dt.getFullYear(), m: dt.getMonth() }; });
  const keyOf = (d: number) => `${view.y}-${pad(view.m + 1)}-${pad(d)}`;
  const isToday = (d: number) => view.y === today.getFullYear() && view.m === today.getMonth() && d === today.getDate();

  const nextKey = dayKey(next.startsAt);
  const nextDay = parseDay(nextKey);
  const diff = Math.round((nextDay.date.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000);
  const when = diff <= 0 ? 'сегодня' : diff === 1 ? 'завтра' : `через ${diff} ${plural(diff, ['день', 'дня', 'дней'])}`;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-vol-line bg-vol-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-[14px] font-bold capitalize">{MONTH_NOM[view.m]} {view.y}</p>
          <div className="flex gap-1">
            <button type="button" onClick={() => shift(-1)} aria-label="Предыдущий месяц"
              className="grid h-7 w-7 place-items-center rounded-md border border-vol-line text-vol-muted hover:border-vol-accent hover:text-vol-accent"><VolIcon n="chevron" size={14} className="rotate-90" /></button>
            <button type="button" onClick={() => shift(1)} aria-label="Следующий месяц"
              className="grid h-7 w-7 place-items-center rounded-md border border-vol-line text-vol-muted hover:border-vol-accent hover:text-vol-accent"><VolIcon n="chevron" size={14} className="-rotate-90" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 text-center">
          {WD_SHORT.map(w => <span key={w} className="pb-1.5 text-[11px] font-medium text-vol-faint">{w}</span>)}
          {cells.map((d, i) => {
            if (d == null) return <span key={'e' + i} />;
            const has = days.has(keyOf(d));
            const base = 'relative grid h-8 place-items-center rounded-lg text-[12.5px] tabular-nums';
            return has ? (
              <button key={d} type="button" onClick={() => onPick(keyOf(d))} title="Есть мероприятия" aria-label={`${d} ${MONTH_NOM[view.m]}: есть мероприятия`}
                className={`${base} bg-vol-accent-soft font-semibold text-vol-accent hover:bg-vol-accent hover:text-vol-accent-fg ${isToday(d) ? 'ring-[1.5px] ring-vol-fg' : ''}`}>
                {d}<span className="absolute bottom-1 h-1 w-1 rounded-full bg-vol-green" />
              </button>
            ) : (
              <span key={d} className={`${base} ${isToday(d) ? 'font-semibold text-vol-fg ring-[1.5px] ring-vol-fg' : 'text-vol-muted'}`}>{d}</span>
            );
          })}
        </div>
        <p className="mt-3 flex items-center gap-2 text-[11.5px] text-vol-faint"><span className="h-1.5 w-1.5 rounded-full bg-vol-green" />Дни с мероприятиями</p>
      </div>

      <button type="button" onClick={() => onPick(nextKey)}
        className="rounded-2xl border border-vol-line bg-vol-surface p-5 text-left hover:border-vol-accent">
        <p className="vol-label text-vol-faint">Ближайшее</p>
        <p className="mt-1.5 text-[14px] font-semibold leading-snug">{next.title}</p>
        <p className="mt-1 text-[13px] text-vol-muted"><span className="vol-mark font-medium text-vol-fg">{when}</span>, {nextDay.d} {MONTH_SHORT[nextDay.m - 1]} в {timeOf(next.startsAt)}</p>
      </button>
    </div>
  );
}
