import { useState } from 'react';
import axios from 'axios';
import { usersApi } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../ui/Button';
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
    <div className="border-t border-vol-line pt-6">
      <h2 className="vol-h3 mb-4">Аватар</h2>
      <PhotoField purpose="avatar" selection={selection} onChange={setSelection}
        existingUrl={hasOwn ? own : null} existingCrop={user?.avatarCrop ?? null} disabled={busy}
        hint="Выберите квадратную область — её увидят другие пользователи" />
      {user?.avatarStatus === 'Pending' && !selection && (
        <p className="mt-3 rounded-control border border-amber-200 bg-amber-50 px-3 py-2 text-ctrl text-amber-800">
          <i className="fas fa-hourglass-half mr-1.5" aria-hidden />Фото на проверке у модератора — другим пользователям оно пока не показывается.
        </p>
      )}
      {dirty && (
        <div className="mt-4 flex flex-wrap gap-3">
          <Button size="lg" onClick={save} loading={busy}>{busy ? 'Сохранение…' : 'Сохранить фото'}</Button>
          <Button size="lg" variant="secondary" onClick={() => setSelection(null)} disabled={busy}>Отмена</Button>
        </div>
      )}
    </div>
  );
}
