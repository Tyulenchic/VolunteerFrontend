import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { publicUsersApi } from '../../api/publicUsers';
import { Spinner } from '../../components/Spinner';
import { PublicProfileView, publicName } from '../../components/profile/PublicProfileView';
import { ProfilePage } from './ProfilePage';
import { useAuth } from '../../context/AuthContext';
import type { PublicUserDto } from '../../types/user';

/**
 * Профиль по адресу /users/:id — один адрес для всех. Свой профиль открывается как кабинет (данные, активность, настройки),
 * чужой — как публичная страница с тем, что владелец разрешил показывать.
 */
export function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuth();
  if (me && id && me.id.toLowerCase() === id.toLowerCase()) return <ProfilePage />;
  return <OtherUserProfile id={id} />;
}

function OtherUserProfile({ id }: { id?: string }) {
  const location = useLocation();
  const [user, setUser] = useState<PublicUserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const from: { path: string; label: string } = location.state?.from ?? { path: '/volunteers', label: 'Волонтёры' };

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);
    publicUsersApi.getById(id)
      .then(u => { if (alive) setUser(u); })
      .catch(e => { console.error('Не удалось загрузить профиль', e); if (alive) setUser(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Пользователь не найден</p>
        <Link to={from.path} className="text-primary hover:underline mt-2 inline-block">← {from.label}</Link>
      </div>
    );
  }
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl py-8">
        <div className="flex items-center gap-2 mb-5 text-sm">
          <Link to={from.path} className="text-gray-500 hover:text-primary">{from.label}</Link>
          <i className="fas fa-chevron-right text-gray-300 text-xs" aria-hidden />
          <span className="text-gray-700">{publicName(user)}</span>
        </div>
        <PublicProfileView user={user} />
      </div>
    </div>
  );
}
