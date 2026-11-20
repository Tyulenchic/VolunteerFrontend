import { useState } from 'react';
import { adminApi } from '../../api/admin';
import { Button } from '../ui/Button';
import { useNotification } from '../../context/NotificationContext';
import { adminErrorMessage } from '../../utils/adminErrors';
import { ADMIN_SECTIONS, ALL_SECTION_KEYS } from '../../utils/adminSections';

interface Props {
  userId: string;
  /** Что сохранено сейчас: null — системный администратор (всё), список — администратор контента. */
  initial: string[] | null;
  onSaved: (sections: string[] | null) => void;
}

/**
 * Права администратора: системный администратор управляет всем (в том числе состоянием системы, журналом, базой данных
 * и импортом), администратор контента видит только те разделы панели, которые здесь отмечены галочками.
 * Панель показывается только системному администратору и не для него самого (чтобы не остаться без доступа).
 */
export function AdminAccessPanel({ userId, initial, onSaved }: Props) {
  const { notify } = useNotification();
  const [limited, setLimited] = useState(initial !== null);
  const [chosen, setChosen] = useState<string[]>(initial ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (key: string) => setChosen(list => (list.includes(key) ? list.filter(k => k !== key) : [...list, key]));
  const changed = limited !== (initial !== null) || (limited && chosen.slice().sort().join() !== (initial ?? []).slice().sort().join());

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const { adminSections } = await adminApi.setAdminSections(userId, limited ? ALL_SECTION_KEYS.filter(k => chosen.includes(k)) : null);
      notify(adminSections === null ? 'Администратор получил полный доступ' : 'Права администратора контента сохранены');
      setChosen(adminSections ?? []);
      onSaved(adminSections);
    } catch (e) {
      setError(adminErrorMessage(e, 'Не удалось сохранить права. Попробуйте ещё раз.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <fieldset className="border-t border-line-strong pt-4 space-y-3" aria-describedby="admin-access-hint">
      <legend className="text-[13px] font-semibold text-ink-900 pt-1">Права в админ-панели</legend>
      <p id="admin-access-hint" className="text-xs text-ink-400">
        Системный администратор управляет всем. Администратор контента видит только отмеченные разделы и не видит системные страницы.
      </p>
      <label className="flex items-start gap-2 text-sm text-ink-700">
        <input type="radio" name={`access-${userId}`} checked={!limited} onChange={() => setLimited(false)} className="mt-1" />
        <span><span className="font-medium">Системный администратор</span> — полный доступ</span>
      </label>
      <label className="flex items-start gap-2 text-sm text-ink-700">
        <input type="radio" name={`access-${userId}`} checked={limited} onChange={() => setLimited(true)} className="mt-1" />
        <span><span className="font-medium">Администратор контента</span> — только отмеченные разделы</span>
      </label>

      {limited && (
        <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-2 pl-6" aria-label="Разделы, открытые администратору">
          {ADMIN_SECTIONS.map(s => (
            <li key={s.key}>
              <label className="flex items-start gap-2 text-sm text-ink-700">
                <input type="checkbox" checked={chosen.includes(s.key)} onChange={() => toggle(s.key)} className="mt-1" />
                <span>{s.label}<span className="block text-xs text-ink-400">{s.hint}</span></span>
              </label>
            </li>
          ))}
        </ul>
      )}
      {limited && chosen.length === 0 && <p className="text-xs text-amber-700 pl-6">Ни один раздел не отмечен: администратор увидит только уведомления.</p>}
      {error && <p role="alert" className="text-xs text-danger-700">{error}</p>}
      <Button onClick={() => void save()} loading={busy} disabled={!changed}>Сохранить права</Button>
    </fieldset>
  );
}
