/**
 * Телефон: международный формат «+» код страны и цифры. Те же правила, что и на сервере (PhoneRules):
 * для известных стран точное число цифр национального номера, для остальных общий предел E.164 (всего 8–15 цифр).
 * Пустое значение допустимо: поле необязательное.
 */
const KNOWN: ReadonlyArray<readonly [code: string, lengths: readonly number[]]> = [
  ['373', [8]],      // Молдова, Приднестровье
  ['380', [9]],      // Украина
  ['375', [9]],      // Беларусь
  ['7', [10]],       // Россия, Казахстан
  ['40', [9]],       // Румыния
  ['48', [9]],       // Польша
  ['49', [10, 11]],  // Германия
  ['44', [10]],      // Великобритания
  ['1', [10]],       // США, Канада
  ['90', [10]],      // Турция
  ['995', [9]],      // Грузия
  ['374', [8]],      // Армения
  ['371', [8]],      // Латвия
  ['370', [8]],      // Литва
  ['372', [7, 8]],   // Эстония
  ['33', [9]],       // Франция
  ['39', [9, 10]],   // Италия
  ['34', [9]],       // Испания
];

export const PHONE_PLACEHOLDER = '+373 777 12345';
export const PHONE_HINT = 'В международном формате: + код страны и номер, например +373 777 12345.';

export type PhoneCheck = { ok: true; value: string } | { ok: false; error: string };

export function checkPhone(raw: string | null | undefined): PhoneCheck {
  const text = (raw ?? '').trim();
  if (!text) return { ok: true, value: '' };

  const compact = text.replace(/[\s().\- ]/g, '');
  if (!compact.startsWith('+')) return { ok: false, error: 'Номер должен начинаться с «+» и кода страны, например +373 777 12345.' };

  const digits = compact.slice(1);
  if (!/^\d+$/.test(digits)) return { ok: false, error: 'После «+» допускаются только цифры (а также пробелы, скобки и дефисы).' };
  if (digits[0] === '0' || digits.length < 8 || digits.length > 15) {
    return { ok: false, error: 'Укажите код страны и номер: всего от 8 до 15 цифр.' };
  }

  let best: (typeof KNOWN)[number] | null = null;
  for (const k of KNOWN) if (digits.startsWith(k[0]) && (!best || k[0].length > best[0].length)) best = k;
  if (best && !best[1].includes(digits.length - best[0].length)) {
    return { ok: false, error: `Для +${best[0]} после кода страны должно быть ${best[1].join(' или ')} цифр.` };
  }
  return { ok: true, value: `+${digits}` };
}

/** Текст ошибки или пустая строка. */
export const phoneError = (raw: string | null | undefined): string => {
  const r = checkPhone(raw);
  return r.ok ? '' : r.error;
};
