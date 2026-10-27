/** Ограничения на НОВЫЙ пароль (регистрация, сброс). Согласованы с политикой backend: 8+ символов, не более 72 байт UTF-8. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72;

export const passwordByteLength = (password: string): number => new TextEncoder().encode(password).length;

/** Возвращает русское сообщение об ошибке или null, если пароль подходит. */
export function validateNewPassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return "Минимум 8 символов";
  if (passwordByteLength(password) > PASSWORD_MAX_BYTES) {
    return "Пароль слишком длинный. Сократите его (кириллица и эмодзи занимают больше места, чем латиница).";
  }
  return null;
}
