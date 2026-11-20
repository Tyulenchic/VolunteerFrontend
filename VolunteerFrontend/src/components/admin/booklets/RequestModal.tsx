import { useEffect, useState } from 'react';
import { bookletAdminApi } from '../../../api/booklet';
import type { BookletRequestDetailsDto } from '../../../types/booklet';
import { adminErrorMessage } from '../../../utils/adminErrors';
import { useNotification } from '../../../context/NotificationContext';
import { Modal } from '../../Modal';
import { useAuthBlobUrl } from '../../SecureImage';
import { Button } from '../../ui/Button';
import { ErrorState } from '../../ui/PageStates';
import { ListSkeleton } from '../../ui/Skeleton';

const date = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

/**
 * Заявка волонтёра на бумажную книжку: заполненная форма, предупреждения о двойниках и решение. Номер необязателен:
 * если его не вписать, сервер возьмёт подходящий (V-00 и прежний id аккаунта, если свободен, иначе следующий).
 */
export function RequestModal({ requestId, onClose, onDone }: { requestId: string; onClose: () => void; onDone: () => void }) {
  const { notify } = useNotification();
  const [item, setItem] = useState<BookletRequestDetailsDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [number, setNumber] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [note, setNote] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const photo = useAuthBlobUrl(item?.photoUrl);

  useEffect(() => {
    let alive = true;
    bookletAdminApi.request(requestId)
      .then(r => { if (alive) setItem(r); })
      .catch(e => { if (alive) setError(adminErrorMessage(e, 'Не удалось загрузить заявку.')); });
    return () => { alive = false; };
  }, [requestId]);

  const run = async (action: () => Promise<unknown>, done: string) => {
    setBusy(true);
    setError(null);
    try { await action(); notify(done); onDone(); }
    catch (e) { setError(adminErrorMessage(e, 'Не удалось выполнить действие.')); }
    finally { setBusy(false); }
  };

  const pending = item?.status === 'Pending';

  return (
    <Modal isOpen onClose={() => (busy ? undefined : onClose())} title="Заявка на добровольческую книжку" maxWidth="max-w-2xl">
      {!item && !error ? <ListSkeleton /> : !item ? <ErrorState message={error ?? ''} /> : (
        <div className="space-y-5 text-sm">
          {error && <div role="alert" className="p-3 bg-danger-50 text-danger-700 border border-danger-200 rounded-lg">{error}</div>}

          <div className="flex gap-4">
            {photo && <img src={photo} alt="Фото из заявки" className="w-28 aspect-[3/4] object-cover rounded-lg border border-line" />}
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              <dt className="text-ink-400">ФИО</dt><dd className="text-ink-900 font-medium">{item.lastName} {item.firstName} {item.middleName ?? ''}</dd>
              <dt className="text-ink-400">Год рождения</dt><dd>{item.birthYear}</dd>
              <dt className="text-ink-400">Телефон</dt><dd><a href={`tel:${item.phone}`} className="text-brand-600 hover:underline">{item.phone}</a></dd>
              <dt className="text-ink-400">Аккаунт</dt><dd>{item.accountEmail}</dd>
              <dt className="text-ink-400">Подана</dt><dd>{date(item.createdAt)}</dd>
              {item.comment && (<><dt className="text-ink-400">Комментарий</dt><dd className="whitespace-pre-line">{item.comment}</dd></>)}
              {!pending && (<><dt className="text-ink-400">Решение</dt><dd>{item.status === 'Issued' ? `Выдана ${item.bookletLabel ?? ''}` : `Отклонена${item.adminNote ? `: ${item.adminNote}` : ''}`} ({date(item.handledAt)})</dd></>)}
            </dl>
          </div>

          {item.sameBooklets.length > 0 && (
            <div role="alert" className="p-3 rounded-lg border border-warning-200 bg-warning-50 text-warning-700">
              У человека с такими именем и годом рождения уже есть книжка: {item.sameBooklets.map(b => b.label).join(', ')}. На человека приходится одна книжка: проверьте, не дубль ли это, и передайте её на нужный аккаунт на странице «Дубли».
            </div>
          )}
          {item.sameAccounts.length > 1 && (
            <div className="p-3 rounded-lg border border-line bg-surface-2 text-ink-500">
              Похожие аккаунты: {item.sameAccounts.map(a => a.email).join(', ')}.
            </div>
          )}

          {pending && !rejecting && (
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block text-ink-500">Номер книжки
                <input value={number} onChange={e => setNumber(e.target.value)} placeholder={item.suggestedLabel} aria-describedby="rq-number-hint" className="mt-1 w-full px-3 py-2 text-sm" />
                <span id="rq-number-hint" className="block text-xs text-ink-400 mt-1">V-00 и число. Если не вписать, будет {item.suggestedLabel}.</span>
              </label>
              <label className="block text-ink-500">Дата выдачи
                <input type="date" value={issuedAt} onChange={e => setIssuedAt(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm" />
                <span className="block text-xs text-ink-400 mt-1">Можно оставить пустой и вписать при выдаче.</span>
              </label>
            </div>
          )}
          {pending && rejecting && (
            <label className="block text-ink-500">Причина (её увидит волонтёр)
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} maxLength={1000} className="mt-1 w-full px-3 py-2 text-sm" />
            </label>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={busy}>Закрыть</Button>
            {pending && !rejecting && <Button variant="danger" onClick={() => setRejecting(true)} disabled={busy}>Отклонить…</Button>}
            {pending && rejecting && <Button variant="secondary" onClick={() => setRejecting(false)} disabled={busy}>Назад</Button>}
            {pending && rejecting && <Button variant="danger" loading={busy} onClick={() => void run(() => bookletAdminApi.reject(item.id, note.trim()), 'Заявка отклонена')}>Отклонить заявку</Button>}
            {pending && !rejecting && <Button loading={busy} onClick={() => void run(() => bookletAdminApi.issue(item.id, number.trim() || null, issuedAt || null), 'Книжка выдана')}>Выдать книжку</Button>}
          </div>
        </div>
      )}
    </Modal>
  );
}
