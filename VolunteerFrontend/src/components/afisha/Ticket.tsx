import { Link } from 'react-router-dom';
import type { EventResponseDto, ParticipationResponseDto } from '../../types/event';
import { CAT, plural, seatsLeft, timeOf } from '../../utils/afisha';
import { VolIcon } from './VolIcon';
import { OrganizationBadge } from '../organizations/OrganizationBadge';
import { CroppedImage } from '../ImageCropper';
import { MediaPlaceholder } from '../ui/MediaPlaceholder';

interface Props {
  e: EventResponseDto;
  /** The current user's application for this event, if any */
  mine?: ParticipationResponseDto;
  busy?: boolean;
  onToggle: (e: EventResponseDto) => void;
  /** Клик по тегу (афиша подставляет его в строку поиска). */
  onTag?: (tag: string) => void;
}

export function Ticket({ e, mine, busy = false, onToggle, onTag }: Props) {
  const cat = e.category ? CAT[e.category] : undefined;
  const left = seatsLeft(e);
  const closed = left === 0;
  const low = left != null && left > 0 && left <= 5;
  const pct = e.maxParticipants ? Math.min(100, Math.round((e.approvedCount / e.maxParticipants) * 100)) : 0;

  // Button state: the user's own application wins over "set closed".
  let btnClass = 'bg-vol-accent text-vol-accent-fg hover:opacity-90';
  let btnText = 'Подать заявку';
  let disabled = busy;
  let title: string | undefined;
  let checked = false;
  if (mine) {
    checked = mine.status !== 'Rejected';
    if (mine.status === 'Pending') { btnClass = 'border-[1.5px] border-vol-accent bg-vol-accent-soft text-vol-accent'; btnText = 'Заявка подана'; title = 'Нажмите, чтобы отозвать заявку'; }
    else if (mine.status === 'Approved') { btnClass = 'border-[1.5px] border-vol-accent bg-vol-accent-soft text-vol-accent'; btnText = 'Вы идёте'; title = 'Нажмите, чтобы отказаться от участия'; }
    else if (mine.status === 'AttendanceConfirmed') { btnClass = 'border-[1.5px] border-vol-accent bg-vol-accent-soft text-vol-accent'; btnText = 'Вы участвовали'; disabled = true; }
    else { btnClass = 'cursor-not-allowed bg-vol-line text-vol-faint'; btnText = 'Заявка отклонена'; disabled = true; }
  } else if (closed) {
    btnClass = 'cursor-not-allowed bg-vol-line text-vol-faint'; btnText = 'Набор закрыт'; disabled = true;
  }

  const label = closed ? 'Набор закрыт' : e.maxParticipants == null ? 'Мест' : 'Осталось';
  const num = e.maxParticipants == null ? '∞' : left;
  const word = e.maxParticipants == null ? 'без лимита' : plural(left ?? 0, ['место', 'места', 'мест']);

  return (
    <div id={'ev-' + e.id} className="vol-ticket-wrap scroll-mt-24">
      <article className="vol-ticket flex flex-col sm:flex-row">
        <div className="relative aspect-[2/1] w-full shrink-0 overflow-hidden rounded-t-2xl sm:aspect-auto sm:w-40 sm:rounded-l-2xl sm:rounded-tr-none">
          {/* Кадр мероприятия сохранён в 16:10, а здесь рамка то 2:1 (телефон), то вертикальная (≥640px):
              CroppedImage с fill сам вписывает выбранную область в текущие пропорции, сохраняя её центр и масштаб. */}
          <CroppedImage src={e.imageThumbnailUrl ?? e.imageUrl} crop={e.imageCrop} fill alt={e.title} className="!rounded-none"
            placeholder={<MediaPlaceholder kind="event" icon={cat?.icon} />} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
          {cat && <p className="vol-label flex items-center gap-1.5 text-vol-accent"><VolIcon n={cat.icon} size={13} />{cat.label}</p>}
          <h3 className="font-display text-[16px] font-bold leading-snug break-words">{e.title}</h3>
          <OrganizationBadge organization={e.organization} />
          {!!e.tags?.length && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Теги">
              {e.tags.slice(0, 4).map(t => (
                <li key={t}>
                  <button type="button" onClick={() => onTag?.(t)} disabled={!onTag}
                    className="rounded-full bg-vol-accent-soft px-2.5 py-0.5 text-[12px] font-medium text-vol-accent enabled:hover:opacity-80">#{t}</button>
                </li>
              ))}
              {e.tags.length > 4 && <li className="px-1 text-[12px] text-vol-muted">+{e.tags.length - 4}</li>}
            </ul>
          )}
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-vol-muted">
            <li className="flex items-center gap-1.5"><VolIcon n="clock" size={14} className="shrink-0 text-vol-accent" /><span className="font-medium tabular-nums text-vol-fg">{timeOf(e.startsAt)}</span></li>
            <li className="flex min-w-0 items-center gap-1.5"><VolIcon n="pin" size={14} className="shrink-0 text-vol-accent" /><span className="truncate">{e.location}</span></li>
          </ul>
          <div className="mt-auto flex gap-2.5 pt-3">
            <button type="button" disabled={disabled} onClick={() => onToggle(e)} title={title}
              className={`inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-4 text-[13px] font-semibold sm:flex-none ${btnClass} ${busy ? 'opacity-70' : ''}`}>
              {checked && <VolIcon n="check" size={15} />}{btnText}
            </button>
            <Link to={`/events/${e.id}`}
              className="grid h-9 flex-1 place-items-center rounded-lg border-[1.5px] border-vol-rule px-4 text-[13px] font-medium text-vol-fg no-underline hover:border-vol-accent hover:text-vol-accent sm:flex-none">Подробнее</Link>
          </div>
        </div>

        <div className="flex h-[3.25rem] items-center justify-between gap-2 border-t-[1.5px] border-dashed border-vol-rule px-4 sm:h-auto sm:w-[8.25rem] sm:flex-col sm:items-start sm:justify-center sm:gap-1.5 sm:border-l-[1.5px] sm:border-t-0">
          <p className="vol-label text-vol-faint" style={{ fontSize: '10.5px' }}>{label}</p>
          <p className={`flex items-baseline gap-1.5 ${low ? 'text-vol-warn' : ''}`}>
            <span className={`font-display text-[1.7rem] font-bold leading-none tabular-nums ${closed ? 'text-vol-faint' : ''}`}>{num}</span>
            <span className={`text-[12.5px] ${low ? 'font-medium' : 'text-vol-muted'}`}>{word}</span>
          </p>
          {e.maxParticipants != null && (
            <div className="hidden h-[3px] w-full overflow-hidden rounded-full bg-vol-line sm:block">
              <div className={`h-full rounded-full ${low ? 'bg-vol-warn' : 'bg-vol-accent'}`} style={{ width: pct + '%' }} />
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
