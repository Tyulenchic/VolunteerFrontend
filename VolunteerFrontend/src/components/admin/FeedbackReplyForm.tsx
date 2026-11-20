import { useState, type FormEvent } from 'react';
import { feedbackApi, FEEDBACK_REPLY_MAX_LENGTH, type FeedbackReply } from '../../api/feedback';
import { useNotification } from '../../context/NotificationContext';
import { adminErrorMessage } from '../../utils/adminErrors';
import { Button } from '../ui/Button';
import { Field } from '../ui/Input';

interface Props {
  feedbackId: string;
  /** Адрес автора: показываем, куда уйдёт письмо. */
  email: string;
  onSent: (reply: FeedbackReply) => void;
  onCancel: () => void;
}

/**
 * Ответ на обращение. Письмо уходит с почтового ящика сайта (тот же, с которого идут остальные письма),
 * поэтому автор видит один и тот же адрес отправителя, в каком бы почтовом аккаунте ни работал администратор.
 * Пока письмо не принято почтовым сервером, ответ не сохраняется и его можно отправить повторно.
 */
export function FeedbackReplyForm({ feedbackId, email, onSent, onCancel }: Props) {
  const { notify } = useNotification();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const message = text.trim();
    if (message.length < 2) { setError('Напишите ответ.'); return; }
    if (message.length > FEEDBACK_REPLY_MAX_LENGTH) { setError(`Ответ не должен быть длиннее ${FEEDBACK_REPLY_MAX_LENGTH} символов.`); return; }
    setBusy(true); setError(null);
    try {
      const reply = await feedbackApi.reply(feedbackId, message);
      notify(`Ответ отправлен на ${email}`);
      onSent(reply);
    } catch (err) {
      setError(adminErrorMessage(err, 'Не удалось отправить ответ. Текст сохранён в форме — попробуйте ещё раз.'));
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="mt-3 ml-5 space-y-3 p-3 bg-surface-2 rounded-xl">
      <p className="text-sm text-ink-700">Письмо уйдёт с адреса сайта на <b>{email}</b>. Исходное обращение будет процитировано в письме.</p>
      <Field label="Ответ" hint={`${text.trim().length} / ${FEEDBACK_REPLY_MAX_LENGTH}`}>
        <textarea value={text} onChange={e => setText(e.target.value)} maxLength={FEEDBACK_REPLY_MAX_LENGTH} rows={6} disabled={busy}
          className="w-full px-3 py-2 text-sm" />
      </Field>
      {error && <div role="alert" className="p-3 bg-danger-50 text-danger-700 border border-danger-200 rounded-xl text-sm">{error}</div>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" loading={busy}><i className="fas fa-paper-plane" aria-hidden /> Отправить ответ</Button>
        <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={onCancel}>Отмена</Button>
      </div>
    </form>
  );
}
