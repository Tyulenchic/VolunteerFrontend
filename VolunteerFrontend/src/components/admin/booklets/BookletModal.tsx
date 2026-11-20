import { useEffect, useState } from 'react';
import { bookletAdminApi } from '../../../api/booklet';
import type { BookletDetailsDto } from '../../../types/booklet';
import { adminErrorMessage } from '../../../utils/adminErrors';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { Modal } from '../../Modal';
import { useAuthBlobUrl } from '../../SecureImage';
import { Button } from '../../ui/Button';
import { ErrorState } from '../../ui/PageStates';
import { ListSkeleton } from '../../ui/Skeleton';

/**
 * Одна книжка: данные для печати, печать PDF, номер (меняет только системный администратор) и аккаунт, к которому
 * она привязана. Изменение данных создаёт новую версию, и PDF собирается заново.
 */
export function BookletModal({ bookletId, onClose, onChanged }: { bookletId: string; onClose: () => void; onChanged: () => void }) {
  const { isSystemAdmin } = useAuth();
  const { notify } = useNotification();
  const [item, setItem] = useState<BookletDetailsDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [number, setNumber] = useState('');
  const [accountId, setAccountId] = useState('');
  const photo = useAuthBlobUrl(item?.photoUrl);

  const fill = (b: BookletDetailsDto) => {
    setItem(b);
    setLastName(b.lastName); setFirstName(b.firstName); setMiddleName(b.middleName ?? '');
    setBirthYear(String(b.birthYear)); setIssuedAt(b.issuedAt ?? ''); setNumber(b.label);
  };

  useEffect(() => {
    let alive = true;
    bookletAdminApi.get(bookletId)
      .then(b => { if (alive) fill(b); })
      .catch(e => { if (alive) setError(adminErrorMessage(e, 'Не удалось загрузить книжку.')); });
    return () => { alive = false; };
  }, [bookletId]);

  const run = async (action: () => Promise<unknown>, done: string, reload = true) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      notify(done);
      if (reload) fill(await bookletAdminApi.get(bookletId));
      onChanged();
    } catch (e) { setError(adminErrorMessage(e, 'Не удалось выполнить действие.')); }
    finally { setBusy(false); }
  };

  const openPdf = async () => {
    try { await bookletAdminApi.openPdf(bookletId); }
    catch (e) { setError(adminErrorMessage(e, 'Не удалось подготовить PDF.')); }
  };

  const edited = item !== null && (lastName !== item.lastName || firstName !== item.firstName || middleName !== (item.middleName ?? '')
    || birthYear !== String(item.birthYear) || issuedAt !== (item.issuedAt ?? ''));

  return (
    <Modal isOpen onClose={() => (busy ? undefined : onClose())} title={item ? `Книжка ${item.label}` : 'Книжка'} maxWidth="max-w-2xl">
      {!item && !error ? <ListSkeleton /> : !item ? <ErrorState message={error ?? ''} /> : (
        <div className="space-y-5 text-sm">
          {error && <div role="alert" className="p-3 bg-danger-50 text-danger-700 border border-danger-200 rounded-lg">{error}</div>}

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void openPdf()}><i className="fas fa-print" aria-hidden />Печать</Button>
            <Button size="sm" variant="secondary" onClick={() => void run(() => bookletAdminApi.downloadPdf(item.id, item.label), 'PDF скачан', false)}><i className="fas fa-file-pdf" aria-hidden />Скачать PDF</Button>
            <span className="meta self-center">Версия {item.version}: при изменении данных PDF собирается заново. Подпись и печать (М.П.) в PDF остаются пустыми.</span>
          </div>

          <div className="flex gap-4">
            {photo && <img src={photo} alt="Фото владельца книжки" className="w-24 aspect-[3/4] object-cover rounded-lg border border-line" />}
            <div className="grid sm:grid-cols-3 gap-3 flex-1">
              <label className="text-ink-500">Фамилия<input value={lastName} onChange={e => setLastName(e.target.value)} maxLength={100} className="mt-1 w-full px-3 py-2 text-sm" /></label>
              <label className="text-ink-500">Имя<input value={firstName} onChange={e => setFirstName(e.target.value)} maxLength={100} className="mt-1 w-full px-3 py-2 text-sm" /></label>
              <label className="text-ink-500">Отчество<input value={middleName} onChange={e => setMiddleName(e.target.value)} maxLength={100} className="mt-1 w-full px-3 py-2 text-sm" /></label>
              <label className="text-ink-500">Год рождения<input inputMode="numeric" value={birthYear} onChange={e => setBirthYear(e.target.value)} maxLength={4} className="mt-1 w-full px-3 py-2 text-sm" /></label>
              <label className="text-ink-500">Дата выдачи<input type="date" value={issuedAt} onChange={e => setIssuedAt(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm" /></label>
            </div>
          </div>
          <div className="flex justify-end">
            <Button loading={busy} disabled={!edited} onClick={() => void run(() => bookletAdminApi.update(item.id, {
              lastName: lastName.trim(), firstName: firstName.trim(), middleName: middleName.trim() || null, birthYear: Number(birthYear), issuedAt: issuedAt || null,
            }), 'Данные книжки сохранены')}>Сохранить данные</Button>
          </div>

          <fieldset className="border-t border-line pt-4 space-y-2">
            <legend className="font-semibold text-ink-900">Номер</legend>
            {isSystemAdmin ? (
              <div className="flex flex-wrap items-end gap-2">
                <label className="text-ink-500">V-00 и число<input value={number} onChange={e => setNumber(e.target.value)} className="mt-1 block px-3 py-2 text-sm" aria-describedby="bk-num-hint" /></label>
                <Button variant="secondary" loading={busy} disabled={number.trim() === item.label} onClick={() => void run(() => bookletAdminApi.changeNumber(item.id, number.trim()), 'Номер изменён')}>Изменить номер</Button>
                <p id="bk-num-hint" className="meta w-full">Номер уникален и не используется повторно: занятый номер сохранить нельзя. Изменение записывается в журнал.</p>
              </div>
            ) : <p className="meta">Номер {item.label}. Менять номер может только системный администратор.</p>}
          </fieldset>

          <fieldset className="border-t border-line pt-4 space-y-2">
            <legend className="font-semibold text-ink-900">Аккаунт</legend>
            {item.userId ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-ink-700">{item.accountName || '—'} · {item.accountEmail}</span>
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => void run(() => bookletAdminApi.reassign(item.id, null), 'Книжка снята с аккаунта')}>Снять с аккаунта</Button>
              </div>
            ) : (
              <p className="text-ink-500">{item.accountDeleted ? 'Аккаунт удалён: номер и данные сохранены.' : 'Книжка не привязана к аккаунту.'}</p>
            )}
            {item.freeAccounts.length > 0 && (
              <div className="space-y-1">
                <p className="text-ink-500">Подходят по имени и году рождения:</p>
                {item.freeAccounts.map(a => (
                  <div key={a.id} className="flex flex-wrap items-center gap-2">
                    <span>{a.name} · {a.email}</span>
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => void run(() => bookletAdminApi.reassign(item.id, a.id), 'Книжка передана аккаунту')}>Передать</Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-ink-500">Передать другому аккаунту (идентификатор)<input value={accountId} onChange={e => setAccountId(e.target.value)} placeholder="xxxxxxxx-xxxx-…" className="mt-1 block w-72 px-3 py-2 text-sm" /></label>
              <Button size="sm" variant="secondary" loading={busy} disabled={!accountId.trim()} onClick={() => void run(() => bookletAdminApi.reassign(item.id, accountId.trim()), 'Книжка передана аккаунту')}>Передать</Button>
            </div>
          </fieldset>

          {item.sameBooklets.length > 0 && (
            <div role="alert" className="p-3 rounded-lg border border-warning-200 bg-warning-50 text-warning-700">
              Есть другая книжка того же человека: {item.sameBooklets.map(b => b.label).join(', ')}. На человека приходится одна: проверьте, не дубль ли это.
            </div>
          )}
          <div className="flex justify-end"><Button variant="secondary" onClick={onClose}>Закрыть</Button></div>
        </div>
      )}
    </Modal>
  );
}
