import { useState } from 'react';
import { bookletAdminApi } from '../../../api/booklet';
import { adminErrorMessage } from '../../../utils/adminErrors';
import { useNotification } from '../../../context/NotificationContext';
import { Modal } from '../../Modal';
import { Button } from '../../ui/Button';

/**
 * Выдать книжку без заявки: бумажная книжка уже есть или человек пришёл сам. Номер можно не вписывать (будет следующий
 * свободный), аккаунт необязателен: его можно привязать позже.
 */
export function CreateBookletModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { notify } = useNotification();
  const [number, setNumber] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [userId, setUserId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastName.trim() || !firstName.trim()) { setError('Укажите фамилию и имя.'); return; }
    if (!/^\d{4}$/.test(birthYear.trim())) { setError('Год рождения — четыре цифры, например 2005.'); return; }
    setBusy(true);
    setError(null);
    try {
      const created = await bookletAdminApi.create({
        number: number.trim() || null, userId: userId.trim() || null, lastName: lastName.trim(), firstName: firstName.trim(),
        middleName: middleName.trim() || null, birthYear: Number(birthYear), issuedAt: issuedAt || null,
      });
      notify(`Книжка ${created.label} выдана`);
      onCreated();
    } catch (err) {
      setError(adminErrorMessage(err, 'Не удалось выдать книжку.'));
    } finally {
      setBusy(false);
    }
  };

  const field = 'mt-1 w-full px-3 py-2 text-sm';
  return (
    <Modal isOpen onClose={() => (busy ? undefined : onClose())} title="Выдать книжку без заявки" maxWidth="max-w-xl">
      <form onSubmit={submit} className="space-y-3 text-sm" noValidate>
        {error && <div role="alert" className="p-3 bg-danger-50 text-danger-700 border border-danger-200 rounded-lg">{error}</div>}
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="text-ink-500">Фамилия *<input value={lastName} onChange={e => setLastName(e.target.value)} maxLength={100} className={field} /></label>
          <label className="text-ink-500">Имя *<input value={firstName} onChange={e => setFirstName(e.target.value)} maxLength={100} className={field} /></label>
          <label className="text-ink-500">Отчество<input value={middleName} onChange={e => setMiddleName(e.target.value)} maxLength={100} className={field} /></label>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="text-ink-500">Год рождения *<input inputMode="numeric" value={birthYear} onChange={e => setBirthYear(e.target.value)} maxLength={4} className={field} /></label>
          <label className="text-ink-500">Номер<input value={number} onChange={e => setNumber(e.target.value)} placeholder="V-00414" className={field} /></label>
          <label className="text-ink-500">Дата выдачи<input type="date" value={issuedAt} onChange={e => setIssuedAt(e.target.value)} className={field} /></label>
        </div>
        <label className="block text-ink-500">Аккаунт (идентификатор, необязательно)<input value={userId} onChange={e => setUserId(e.target.value)} placeholder="xxxxxxxx-xxxx-…" className={field} /></label>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Отмена</Button>
          <Button type="submit" loading={busy}>Выдать книжку</Button>
        </div>
      </form>
    </Modal>
  );
}
