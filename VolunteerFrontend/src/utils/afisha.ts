import type { EventCategory, EventResponseDto } from '../types/event';
import type { IconName } from '../components/afisha/VolIcon';

export const CATEGORIES: { id: EventCategory; label: string; icon: IconName }[] = [
  { id: 'Ecological', label: 'Экологическое', icon: 'leaf' },
  { id: 'Social', label: 'Социальное', icon: 'heart' },
  { id: 'Donation', label: 'Донорство', icon: 'drop' },
  { id: 'Education', label: 'Образование', icon: 'book' },
  { id: 'HealthyLife', label: 'ЗОЖ', icon: 'pulse' },
  { id: 'Animals', label: 'Животные', icon: 'paw' },
  { id: 'Veterans', label: 'Ветераны', icon: 'star' },
  { id: 'Medical', label: 'Медицина', icon: 'cross' },
  { id: 'Culture', label: 'Культура', icon: 'palette' },
  { id: 'Media', label: 'Медиа', icon: 'camera' },
  { id: 'Events', label: 'События', icon: 'cal' },
  { id: 'Patriotic', label: 'Патриотическое', icon: 'flag' },
  { id: 'Urban', label: 'Городская среда', icon: 'city' },
];
export const CAT = Object.fromEntries(CATEGORIES.map(c => [c.id, c])) as Record<EventCategory, (typeof CATEGORIES)[number]>;

export const MONTH_NOM = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
export const MONTH_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
export const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
export const WD_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
export const WD_ABBR = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

export const pad = (n: number) => String(n).padStart(2, '0');

/** Russian plural form: plural(5, ['место', 'места', 'мест']) */
export function plural(n: number, [a, b, c]: [string, string, string]) {
  const m = n % 100, d = n % 10;
  if (m > 10 && m < 20) return c;
  if (d === 1) return a;
  if (d >= 2 && d <= 4) return b;
  return c;
}

/** Calendar day of an instant in the viewer's time zone ("2026-10-12"), so an event at 00:30 lands on the right day. */
export const dayKey = (iso: string | Date) => {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const parseDay = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return { y, m, d, date: new Date(y, m - 1, d) };
};
export const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

/** Free seats, or null when the number of places is unlimited. */
export const seatsLeft = (e: Pick<EventResponseDto, 'maxParticipants' | 'approvedCount'>) =>
  e.maxParticipants == null ? null : Math.max(e.maxParticipants - e.approvedCount, 0);
