import { useEffect, useState } from 'react';
import { authApi } from '../api/auth';
import { useApiError } from '../hooks/useApiError';
import { classifyApiError } from '../utils/apiError';
import { Spinner } from './Spinner';

/** Пауза между отправками (после успеха и после 429). */
export const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Повторная отправка письма подтверждения. Сервер всегда отвечает 204 (не раскрывает, существует ли аккаунт),
 * поэтому текст успеха нейтральный. Автоматических запросов нет — только по нажатию кнопки.
 */
export function ResendConfirmation({ initialEmail = '', dark = false }: { initialEmail?: string; dark?: boolean }) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { error, setError, capture } = useApiError();

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || cooldown > 0) return; // повторный submit блокируется
    setLoading(true); setError(undefined);
    try {
      await authApi.resendConfirmation(email.trim());
      setSent(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      capture(err);
      if (classifyApiError(err) === 'rate_limited') setCooldown(RESEND_COOLDOWN_SECONDS);
    } finally { setLoading(false); }
  };

  const blocked = loading || cooldown > 0;
  return (
    <form onSubmit={submit} className="space-y-3 text-left">
      {sent && !error && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
          Если этот адрес зарегистрирован и ещё не подтверждён, мы отправили новое письмо.
        </p>
      )}
      {error && <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm">{error}</div>}
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com" autoComplete="email"
        className={`w-full px-4 py-2.5 border ${dark ? 'border-gray-200' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-primary outline-none transition`} />
      <button type="submit" disabled={blocked}
        className={`w-full py-2.5 border border-primary ${dark ? 'text-blue-400' : 'text-primary'} font-semibold rounded-xl hover:bg-primary/5 transition disabled:opacity-60 flex items-center justify-center gap-2`}>
        {loading ? <><Spinner /> Отправка...</>
          : cooldown > 0 ? `Отправить ещё раз (через ${cooldown} с)`
          : sent ? 'Отправить ещё раз' : 'Отправить письмо ещё раз'}
      </button>
    </form>
  );
}
