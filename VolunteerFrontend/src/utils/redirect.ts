/**
 * Куда вернуть пользователя после входа. Принимается только путь внутри сайта: «//host» и «http://…» отбрасываются,
 * иначе ссылка вида /login?from=//evil.example превратилась бы в перенаправление на чужой сайт.
 * Страницы входа и регистрации адресом возврата не бывают.
 */
export function safeRedirect(from: unknown): string | null {
  if (typeof from !== 'string') return null;
  if (!from.startsWith('/') || from.startsWith('//') || from.includes('\\')) return null;
  if (/^\/(login|register|forgot-password|reset-password|confirm-email|resend-confirmation)(\/|\?|$)/.test(from)) return null;
  return from;
}

/** Состояние навигации для перехода на /login: вернуться на эту страницу после входа. */
export const loginState = (path: string) => ({ from: path });
