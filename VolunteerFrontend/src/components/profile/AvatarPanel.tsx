import { useState } from 'react';
import axios from 'axios';
import { usersApi } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { PhotoField, type PhotoSelection } from '../PhotoField';
import { useAuthBlobUrl } from '../SecureImage';

const errorText = (err: unknown, fallback: string) =>
  axios.isAxiosError(err) && typeof err.response?.data?.error === 'string' ? err.response.data.error : fallback;

/**
 * Аватар с выбором квадратной области. Новое фото сначала проверяет модератор: до одобрения его видите только вы,
 * остальным показывается инициал. Смена только кадра повторной проверки не требует.
 */
export function AvatarPanel() {
  const { user, refreshUser } = useAuth();
  const { notify } = useNotification();
  const [selection, setSelection] = useState<PhotoSelection | null>(null);
  const [busy, setBusy] = useState(false);

  // Свой аватар (в том числе ещё не одобренный) отдаётся только с токеном — загружаем его как blob.
  const own = useAuthBlobUrl(user?.avatarPreviewUrl, user?.avatarStatus);
  const hasOwn = !!user?.avatarPreviewUrl;

  const dirty = !!selection && (!!selection.file || !!selection.removed || !!selection.crop);

  const save = async () => {
    if (!selection) return;
    setBusy(true);
    try {
      if (selection.removed) {
        await usersApi.deleteAvatar();
        notify('Аватар удалён');
      } else if (selection.file) {
        await usersApi.uploadAvatar(selection.file, selection.crop);
        notify('Фото загружено и отправлено на проверку. Остальные увидят его после одобрения.', 'info');
      } else if (selection.crop) {
        await usersApi.setAvatarCrop(selection.crop);
        notify('Область показа сохранена');
      }
      setSelection(null);
      await refreshUser();
    } catch (err) {
      notify(errorText(err, 'Не удалось сохранить аватар. Попробуйте другой файл.'), 'error');
    } finally { setBusy(false); }
  };

  return (
    <div className="border-t border-gray-100 pt-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Аватар</h2>
      <PhotoField purpose="avatar" selection={selection} onChange={setSelection}
        existingUrl={hasOwn ? own : null} existingCrop={user?.avatarCrop ?? null} disabled={busy}
        hint="Выберите квадратную область — её увидят другие пользователи" />
      {user?.avatarStatus === 'Pending' && !selection && (
        <p className="mt-3 text-sm bg-amber-50 text-amber-800 border border-amber-200 rounded-xl px-3 py-2">
          <i className="fas fa-hourglass-half mr-1.5" aria-hidden />Фото на проверке у модератора — другим пользователям оно пока не показывается.
        </p>
      )}
      {dirty && (
        <div className="mt-4 flex gap-2">
          <button onClick={save} disabled={busy} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-60">
            {busy ? 'Сохранение…' : 'Сохранить'}
          </button>
          <button onClick={() => setSelection(null)} disabled={busy} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition">Отмена</button>
        </div>
      )}
    </div>
  );
}
