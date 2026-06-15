import { useState, useEffect } from 'react';
import {useParams, Link, useLocation} from 'react-router-dom';
import { publicUsersApi } from '../../api/publicUsers';
import type { UserResponseDto } from '../../types/user';
import { Spinner } from '../../components/Spinner';

export function UserProfilePage() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const [user, setUser] = useState<UserResponseDto | null>(null);
    const [loading, setLoading] = useState(true);
    const from: { path: string; label: string } = location.state?.from ?? {
        path: '/users',
        label: 'Пользователи',
    };

    useEffect(() => {
        if (!id) return;

        setLoading(true);
        publicUsersApi.getById(id)
            .then(setUser)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Spinner />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <p className="text-gray-500">Пользователь не найден</p>
                <Link to={from.path} className="text-primary hover:underline mt-2">
                    ← {from.label}
                </Link>
            </div>
        );
    }

    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email.split('@')[0];

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-6">
                <Link to={from.path} className="text-sm text-gray-500 hover:text-primary">
                    {from.label}
                </Link>
                <i className="fas fa-chevron-right text-gray-300 text-xs" />
                <span className="text-sm text-gray-700">{name}</span>
            </div>

            {/* Profile Card */}
            <div className="bg-white ro unded-2xl border border-gray-200 p-6">
                {/* Avatar */}
                {user.avatarUrl ? (
                    <img
                        src={user.avatarUrl}
                        alt={name}
                        className="w-24 h-24 rounded-full object-cover mb-4 mx-auto"
                    />
                ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-blue-400/20 rounded-full flex items-center justify-center mb-4 mx-auto">
            <span className="text-2xl font-bold text-primary">
              {name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
            </span>
                    </div>
                )}

                {/* Info */}
                <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">{name}</h1>

                <div className="space-y-2 text-gray-600">
                    <p className="flex items-center gap-2 justify-center">
                        <i className="fas fa-envelope text-primary" />
                        {user.email}
                    </p>

                    {user.bio && (
                        <p className="mt-4 text-center">{user.bio}</p>
                    )}

                    <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="text-center">
                            <p className="text-gray-400 text-xs">Роль</p>
                            <p className="font-medium">{user.role === 'Volunteer' ? 'Волонтёр' : user.role === 'Organizer' ? 'Организатор' : 'Администратор'}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-gray-400 text-xs">Статус</p>
                            <p className="font-medium">{user.isActive ? 'Активен' : 'Заблокирован'}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-gray-400 text-xs">Дата регистрации</p>
                            <p className="font-medium">{new Date(user.createdAt).toLocaleDateString('ru-RU')}</p>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-6 justify-center">
                    <Link
                        to="/events"
                        className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition text-sm"
                    >
                        <i className="fas fa-calendar mr-1" />Мероприятия
                    </Link>
                </div>
            </div>
        </div>
    );
}