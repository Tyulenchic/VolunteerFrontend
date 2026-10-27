import { useState } from 'react';
import { publicUsersApi } from '../../api/publicUsers';
import { adminErrorMessage } from '../../utils/adminErrors';
import { Button } from '../ui/Button';

const GUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** Достаёт идентификатор пользователя из ссылки на профиль (…/#/users/<id>) или из самого идентификатора. */
export const parseProfileId = (text: string): string | null => GUID.exec(text)?.[0].toLowerCase() ?? null;

/**
 * Поле «профиль пользователя»: администратор вставляет ссылку на профиль или идентификатор, кнопка подтягивает
 * имя, фото, описание и организации из базы и заполняет ими остальные поля карточки. Все поля после этого
 * остаются обычными, их можно исправить вручную до сохранения.
 */
export function ProfilePicker({ value, onChange, onFill }: {
  value: string;
  onChange: (v: string) => void;
  onFill: (patch: Record<string, string>) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);

  const fill = async () => {
    const id = parseProfileId(value);
    if (!id) { setMsg({ text: 'Вставьте ссылку на профиль (…/#/users/…) или идентификатор пользователя.', error: true }); return; }
    setBusy(true); setMsg(null);
    try {
      const u = await publicUsersApi.getById(id);
      const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
      onFill({
        profileId: id,
        name,
        role: u.organizations?.length ? u.organizations.map(o => o.name).join(', ') : '',
        desc: u.isClosed ? '' : (u.bio ?? ''),
        avatar: u.avatarUrl ?? '',
      });
      setMsg({
        text: u.isClosed
          ? 'Профиль закрыт: подтянуты только имя и фото. Остальное заполните вручную.'
          : 'Данные подтянуты из профиля. Проверьте и при необходимости исправьте.',
        error: false,
      });
    } catch (err) {
      setMsg({ text: adminErrorMessage(err, 'Не удалось найти пользователя.'), error: true });
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder="Ссылка на профиль или идентификатор"
          className="min-w-0 flex-1 px-3 py-2 text-sm" aria-label="Профиль пользователя" />
        <Button type="button" size="sm" variant="secondary" loading={busy} onClick={fill}>
          <i className="fas fa-wand-magic-sparkles" aria-hidden /> Подтянуть из профиля
        </Button>
      </div>
      {msg && <p role={msg.error ? 'alert' : 'status'} className={`text-xs ${msg.error ? 'text-danger-700' : 'text-success-700'}`}>{msg.text}</p>}
    </div>
  );
}
