import { describe, expect, it } from 'vitest';
import { checkPhone, phoneError } from './phone';

describe('checkPhone', () => {
  it.each([
    ['+373 777 12345', '+37377712345'],
    ['+373(777)12-345', '+37377712345'],
    ['+7 (999) 123-45-67', '+79991234567'],
    ['+49 151 12345678', '+4915112345678'],
    ['+998 90 123 45 67', '+998901234567'],
  ])('accepts %s', (input, expected) => {
    expect(checkPhone(input)).toEqual({ ok: true, value: expected });
  });

  it.each(['0 (533) 2-22-29', '777 12345', '+373 777 1234', '+373 777 123456', '+7 999 123-45-6', '+0123456789', '+37377712345a', '+1234567', '+1234567890123456'])(
    'rejects %s', input => {
      expect(checkPhone(input).ok).toBe(false);
      expect(phoneError(input)).not.toBe('');
    });

  it('treats an empty value as valid (the field is optional)', () => {
    expect(checkPhone('')).toEqual({ ok: true, value: '' });
    expect(checkPhone('   ')).toEqual({ ok: true, value: '' });
    expect(checkPhone(null)).toEqual({ ok: true, value: '' });
  });
});
