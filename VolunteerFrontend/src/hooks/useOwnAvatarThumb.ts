import { OWN_AVATAR_THUMBNAIL_URL } from '../api/users';
import { useAuthBlobUrl } from '../components/SecureImage';
import { useAuth } from '../context/AuthContext';

/**
 * Пока новый аватар ждёт модерации, публичной миниатюры нет — владелец видит свою через запрос с токеном.
 * Возвращает адрес миниатюры для шапки: публичный, если он есть, иначе собственный blob, иначе null.
 */
export function useOwnAvatarThumb(): string | null {
  const { user } = useAuth();
  const needsOwn = !!user && !user.avatarThumbnailUrl && !!user.avatarPreviewUrl;
  const version = user ? `${user.avatarStatus}|${JSON.stringify(user.avatarCrop)}` : null;
  const own = useAuthBlobUrl(needsOwn ? OWN_AVATAR_THUMBNAIL_URL : null, version);
  return user?.avatarThumbnailUrl ?? own;
}
