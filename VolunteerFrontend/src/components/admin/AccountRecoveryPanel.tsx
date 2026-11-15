import { useState, type FormEvent } from 'react';
import { adminApi } from '../../api/admin';
import { useNotification } from '../../context/NotificationContext';
import { adminErrorMessage } from '../../utils/adminErrors';
import { useConfirm } from '../ui/ConfirmDialog';
import { Button } from '../ui/Button';
import { Field } from '../ui/Input';

type Mode = 'reset' | 'email' | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Восстановление доступа по обращению пользователя. Пароль администратор не видит и не задаёт:
 * ссылка уходит на почту аккаунта. Основание обращения записывается в журнал.
 */
export function AccountRecoveryPanel({ userId, email, isActive, onDone }: { userId: string; email: string; isActive: boolean; onDone: () => void }) {
  const { notify } = useNotification();
  const confirm = useConfirm();
  const [mode, setMode] = useState<Mode>(null);
  const [reason, setReason] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = (next: Mode) => { setMode(m => (m === next ? null : next)); setError(null); };

  const sendReset = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!reason.trim()) { setError('Укажите основание: от кого и когда пришло обращение.'); return; }
    setBusy(true);
    setError(null);
    try {
      await adminApi.sendPasswordReset(userId, reason.trim());
      notify(`Ссылка для сброса пароля отправлена на ${email}`);
      setMode(null);
      setReason('');
    } catch (err) {
      setError(adminErrorMessage(err, 'Не удалось отправить ссылку'));
    } finally {
      setBusy(false);
    }
  };

  const changeEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const target = newEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(target)) { setError('Введите корректный email.'); return; }
    if (target === email.toLowerCase()) { setError('Это уже текущий email пользователя.'); return; }
    if (!reason.trim()) { setError('Укажите основание: от кого и когда пришло обращение.'); return; }
    if (!(await confirm({
      title: 'Сменить email?',
      message: `${email} → ${target}. Все входы пользователя завершатся, войти можно будет после подтверждения нового адреса. На старый адрес уйдёт уведомление.`,
      confirmLabel: 'Сменить email',
    }))) return;
    setBusy(true);
    setError(null);
    try {
      await adminApi.changeUserEmail(userId, target, reason.trim());
      notify(`Email изменён. Письмо для подтверждения отправлено на ${target}`);
      onDone();
    } catch (err) {
      setError(adminErrorMessage(err, 'Не удалось сменить email'));
    } finally {
      setBusy(false);
    }
  };

  const reasonField = (
    <Field label="Основание" hint="Например: письмо с адреса … от 15.11, сверены имя и номер книжки. Пишется в журнал.">
      <textarea value={reason} onChange={e => setReason(e.target.value)} maxLength={1000} rows={2} className="w-full px-3 py-2 text-sm" />
    </Field>
  );

  return (
    <div className="border-t border-line-strong pt-4 space-y-3">
      <div>
        <p className="text-[13px] font-medium text-ink-700">Восстановление доступа</p>
        <p className="meta">Только по обращению владельца аккаунта. Убедитесь, что пишет именно он.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={mode === 'reset' ? 'primary' : 'secondary'} disabled={!isActive || busy} onClick={() => open('reset')}>
          <i className="fas fa-key" aria-hidden />Ссылка для сброса пароля
        </Button>
        <Button size="sm" variant={mode === 'email' ? 'primary' : 'secondary'} disabled={busy} onClick={() => open('email')}>
          <i className="fas fa-at" aria-hidden />Сменить email
        </Button>
      </div>
      {!isActive && <p className="meta">Пользователь заблокирован: ссылку сброса можно отправить после разблокировки.</p>}

      {error && <div role="alert" className="p-3 bg-danger-50 text-danger-700 border border-danger-200 rounded-xl text-sm">{error}</div>}

      {mode === 'reset' && (
        <form onSubmit={sendReset} className="space-y-3 p-3 bg-surface-2 rounded-xl">
          <p className="text-sm text-ink-700">Письмо придёт на <b>{email}</b>. Ссылка действует 1 час, пароль пользователь задаст сам.</p>
          {reasonField}
          <Button type="submit" size="sm" loading={busy}>Отправить ссылку</Button>
        </form>
      )}

      {mode === 'email' && (
        <form onSubmit={changeEmail} className="space-y-3 p-3 bg-surface-2 rounded-xl">
          <Field label="Новый email">
            <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} maxLength={256} autoComplete="off" className="w-full px-3 py-2 text-sm" />
          </Field>
          {reasonField}
          <p className="meta">Если пароль тоже забыт, после смены отправьте ссылку для сброса: переход по ней подтвердит и новый адрес.</p>
          <Button type="submit" size="sm" loading={busy}>Сменить email</Button>
        </form>
      )}
    </div>
  );
}
