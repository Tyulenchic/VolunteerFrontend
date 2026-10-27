import { describe, expect, it } from 'vitest';
import { loginState, safeRedirect } from './redirect';

describe('safeRedirect', () => {
  it.each(['/events/abc', '/events?x=1', '/profile', '/organizer/posts'])('keeps the in-site path %s', p => {
    expect(safeRedirect(p)).toBe(p);
  });

  it.each([undefined, null, 42, '', 'events', 'https://evil.example', '//evil.example', '/\\evil.example', 'javascript:alert(1)'])(
    'rejects %s', p => {
      expect(safeRedirect(p)).toBeNull();
    });

  it('never returns to an auth page', () => {
    for (const p of ['/login', '/login?x=1', '/register', '/forgot-password', '/reset-password?token=1', '/confirm-email']) {
      expect(safeRedirect(p)).toBeNull();
    }
    expect(safeRedirect('/loginfoo')).toBe('/loginfoo');   // другой адрес, не страница входа
  });

  it('builds the navigation state', () => {
    expect(loginState('/events/1')).toEqual({ from: '/events/1' });
  });
});
