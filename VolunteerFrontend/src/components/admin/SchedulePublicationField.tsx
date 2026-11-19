import { toDatetimeLocal } from '../../utils/datetimeLocal';

interface Props {
  /** Значение datetime-local; пустая строка — публикация не запланирована. */
  value: string;
  onChange: (value: string) => void;
  /** Что публикуется, для подписи: «Мероприятие» или «Новость». */
  subject: string;
  disabled?: boolean;
}

/** Ближайший круглый час — разумное время по умолчанию, когда администратор включает планирование. */
function nextHour(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return toDatetimeLocal(d.toISOString());
}

/** Выбор времени, когда черновик станет виден всем сам. Время — по часовому поясу администратора. */
export function SchedulePublicationField({ value, onChange, subject, disabled }: Props) {
  const enabled = value !== '';

  return (
    <div className="rounded-lg border border-line-strong p-3 space-y-2">
      <label className="flex items-center gap-2 text-[13px] font-medium text-ink-700 cursor-pointer">
        <input
          type="checkbox"
          className="w-4 h-4 rounded cursor-pointer"
          checked={enabled}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked ? nextHour() : '')}
        />
        Запланировать публикацию
      </label>
      {enabled ? (
        <div>
          <input
            type="datetime-local"
            aria-label="Время публикации"
            value={value}
            min={toDatetimeLocal(new Date().toISOString())}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 text-sm"
          />
          <p className="text-xs text-ink-400 mt-1">
            {subject} сохранится как черновик и опубликуется автоматически в это время (по вашему часовому поясу).
          </p>
        </div>
      ) : (
        <p className="text-xs text-ink-400">Без планирования черновик остаётся скрытым, пока вы не опубликуете его вручную.</p>
      )}
    </div>
  );
}
