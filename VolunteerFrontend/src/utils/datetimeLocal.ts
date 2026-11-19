const pad = (n: number) => String(n).padStart(2, '0');

/** ISO-время → значение поля datetime-local в часовом поясе пользователя; пустая строка для пустого или неверного. */
export function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Значение поля datetime-local → ISO (UTC); null для пустого или неверного. */
export function fromDatetimeLocal(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
