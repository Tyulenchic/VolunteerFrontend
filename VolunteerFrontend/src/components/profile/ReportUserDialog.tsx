import { useState } from 'react';
import { reportsApi, REPORT_TEXT_MAX, type ReportReason } from '../../api/moderation';
import { useNotification } from '../../context/NotificationContext';
import { mapApiError } from '../../utils/apiError';
import { REPORT_REASONS } from '../../utils/moderationLabels';
import { Modal } from '../Modal';

/** Кнопка «Пожаловаться» и окно жалобы на чужой профиль. Жалоба уходит модераторам, автор жалобы им известен. */
export function ReportUserButton({ userId, userName }: { userId: string; userName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600">
        <i className="fas fa-flag" aria-hidden /> Пожаловаться на профиль
      </button>
      {open && <ReportUserDialog userId={userId} userName={userName} onClose={() => setOpen(false)} />}
    </>
  );
}

function ReportUserDialog({ userId, userName, onClose }: { userId: string; userName: string; onClose: () => void }) {
  const { notify } = useNotification();
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!reason) return;
    setBusy(true); setError(null);
    try {
      await reportsApi.reportUser(userId, reason, comment.trim() || null);
      notify('Жалоба отправлена модераторам. Спасибо!');
      onClose();
    } catch (err) {
      setError(mapApiError(err));
    } finally { setBusy(false); }
  };

  return (
    <Modal isOpen onClose={() => (busy ? undefined : onClose())} title={`Жалоба на профиль «${userName}»`}>
      <p className="mb-3 text-sm text-gray-700">
        Модераторы проверят профиль и при нарушении правил примут меры. На одного пользователя можно подать одну жалобу, пока она рассматривается.
      </p>
      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium text-gray-700">Что не так?</legend>
        {(Object.keys(REPORT_REASONS) as ReportReason[]).map(key => (
          <label key={key} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm ${reason === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
            <input type="radio" name="report-reason" value={key} checked={reason === key} onChange={() => setReason(key)} />
            {REPORT_REASONS[key]}
          </label>
        ))}
      </fieldset>
      <label className="mt-4 block text-sm font-medium text-gray-700">
        Пояснение <span className="font-normal text-gray-400">(необязательно)</span>
        <textarea value={comment} onChange={e => setComment(e.target.value.slice(0, REPORT_TEXT_MAX))} rows={3}
          className="mt-1 w-full resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
      </label>
      <p className="mt-1 text-right text-xs text-gray-400">{comment.length}/{REPORT_TEXT_MAX}</p>
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} disabled={busy}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">Отмена</button>
        <button type="button" onClick={submit} disabled={busy || !reason}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
          {busy ? 'Отправка…' : 'Отправить жалобу'}
        </button>
      </div>
    </Modal>
  );
}
