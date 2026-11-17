import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { systemApi, type UserEmailDto } from '../../api/system';
import { useNotification } from '../../context/NotificationContext';
import { adminErrorMessage } from '../../utils/adminErrors';
import { Button } from '../ui/Button';
import { Field } from '../ui/Input';
import { StatusBadge, type Tone } from '../ui/StatusBadge';

const STATUS: Record<UserEmailDto['status'], { label: string; tone: Tone }> = {
  Pending: { label: 'Ждёт отправки', tone: 'pending' },
  Sending: { label: 'Отправляется', tone: 'pending' },
  Retrying: { label: 'Повтор после ошибки', tone: 'warning' },
  Sent: { label: 'Отправлено', tone: 'success' },
  Failed: { label: 'Не отправлено', tone: 'error' },
};

/**
 * Обращение «не пришло письмо»: видно, что сайт отправлял пользователю и с каким результатом.
 * Пока почта не подтверждена, письмо можно отправить ещё раз или подтвердить адрес вручную с основанием.
 */
export function EmailSupportPanel({ userId, emailConfirmed, onDone }: { userId: string; emailConfirmed: boolean; onDone: () => void }) {
  const { notify } = useNotification();
  const [emails, setEmails] = useState<UserEmailDto[] | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setEmails(await systemApi.getUserEmails(userId));
    } catch (e) {
      console.error('Error loading user emails:', e);
      setEmails([]);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const resend = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await systemApi.resendConfirmation(userId);
      notify('Письмо с подтверждением отправлено ещё раз');
      await load();
    } catch (err) {
      setError(adminErrorMessage(err, 'Не удалось отправить письмо'));
    } finally {
      setBusy(false);
    }
  };

  const confirmManually = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!reason.trim()) { setError('Укажите основание: от кого и когда пришло обращение.'); return; }
    setBusy(true);
    setError(null);
    try {
      await systemApi.confirmUserEmail(userId, reason.trim());
      notify('Почта подтверждена: пользователь может войти');
      onDone();
    } catch (err) {
      setError(adminErrorMessage(err, 'Не удалось подтвердить почту'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-t border-line-strong pt-4 space-y-3">
      <div>
        <p className="text-[13px] font-medium text-ink-700">Письма пользователю</p>
        <p className="meta">Что сайт отправлял на этот адрес за последние 30 дней и дошло ли.</p>
      </div>

      {emails === null ? (
        <p className="meta">Загрузка…</p>
      ) : emails.length === 0 ? (
        <p className="meta">Писем не было.</p>
      ) : (
        <ul className="divide-y divide-line rounded-xl bg-surface-2">
          {emails.slice(0, 6).map(mail => (
            <li key={mail.id} className="px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-ink-900 truncate">{mail.subject}</span>
                <StatusBadge tone={STATUS[mail.status].tone}>{STATUS[mail.status].label}</StatusBadge>
              </div>
              <p className="meta break-words">
                {new Date(mail.createdAt).toLocaleString('ru-RU')}
                {mail.lastError && mail.status !== 'Sent' ? ` · ${mail.lastError}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}

      {error && <div role="alert" className="p-3 bg-danger-50 text-danger-700 border border-danger-200 rounded-xl text-sm">{error}</div>}

      {!emailConfirmed && (
        <>
          <p className="meta">Почта не подтверждена: войти пользователь не может.</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" disabled={busy} onClick={resend}>
              <i className="fas fa-paper-plane" aria-hidden />Отправить подтверждение ещё раз
            </Button>
            <Button size="sm" variant={confirming ? 'primary' : 'secondary'} disabled={busy} onClick={() => { setConfirming(v => !v); setError(null); }}>
              <i className="fas fa-check" aria-hidden />Подтвердить email вручную
            </Button>
          </div>
          {confirming && (
            <form onSubmit={confirmManually} className="space-y-3 p-3 bg-surface-2 rounded-xl">
              <p className="text-sm text-ink-700">Только если письмо не доходит и вы уверены, что адрес принадлежит этому человеку.</p>
              <Field label="Основание подтверждения" hint="Например: звонок 16.11, сверены ФИО и номер книжки. Пишется в журнал.">
                <textarea value={reason} onChange={e => setReason(e.target.value)} maxLength={1000} rows={2} className="w-full px-3 py-2 text-sm" />
              </Field>
              <Button type="submit" size="sm" loading={busy}>Подтвердить</Button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
