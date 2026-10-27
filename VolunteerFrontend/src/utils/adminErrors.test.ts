import { describe, it, expect } from 'vitest';
import { AxiosError } from 'axios';
import { adminErrorMessage } from './adminErrors';

const http = (status: number, data?: unknown) =>
  new AxiosError('x', 'ERR_BAD_REQUEST', undefined, undefined, { status, data, statusText: '', headers: {}, config: {} as never });

describe('adminErrorMessage', () => {
  it('explains the event-delete business rule in plain words', () => {
    const m = adminErrorMessage(http(400, { error: 'Удалить можно только мероприятие в статусе Draft или Cancelled.' }), 'fallback');
    expect(m).toMatch(/черновик или отменённое/);
    expect(m).not.toMatch(/Draft|Cancelled/);
  });
  it('replaces internal status names in unknown rule texts', () => {
    expect(adminErrorMessage(http(400, { error: 'Нельзя для заявки в статусе Pending или Rejected.' }), 'f')).toBe('Нельзя для заявки в статусе ожидает решения или отклонено.');
  });
  it('maps 403 / 404 / 401', () => {
    expect(adminErrorMessage(http(403), 'f')).toMatch(/нет прав/);
    expect(adminErrorMessage(http(404), 'f')).toMatch(/не найдена/);
    expect(adminErrorMessage(http(401), 'f')).toMatch(/Сессия истекла/);
  });
  it('uses the fallback when the body has nothing usable, and the safe text for 5xx', () => {
    expect(adminErrorMessage(http(400, '<html>'), 'Не удалось удалить')).toBe('Не удалось удалить');
    expect(adminErrorMessage(http(500, { error: 'boom' }), 'f')).toMatch(/временно недоступен/);
    expect(adminErrorMessage(new Error('x'), 'Не удалось')).toBe('Не удалось');
  });
});
