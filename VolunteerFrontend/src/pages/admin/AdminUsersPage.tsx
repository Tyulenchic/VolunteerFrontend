import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { useNotification } from '../../context/NotificationContext';
import { useApiError } from '../../hooks/useApiError';
import { Modal } from '../../components/Modal';
import { Spinner } from '../../components/Spinner';
import type { AdminUserDetailDto, AdminUserListItemDto } from '../../types/admin';

const TAKE = 20;

const ROLE_LABEL: Record<string, string> = {
  Volunteer: 'Волонтёр',
  Organizer: 'Организатор',
  Admin: 'Администратор',
};

const ROLE_COLOR: Record<string, string> = {
  Volunteer: 'bg-gray-700 text-gray-300',
  Organizer: 'bg-blue-900/60 text-blue-400',
  Admin: 'bg-purple-900/60 text-purple-400',
};

interface UserDetailModalProps {
  user: AdminUserDetailDto;
  onClose: () => void;
  onRefresh: () => void;
}

function UserDetailModal({ user, onClose, onRefresh }: UserDetailModalProps) {
  const { notify } = useNotification();
  const { error, capture } = useApiError();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const name = `${user.firstName} ${user.lastName}`.trim() || user.email.split('@')[0];

  const do_ = async (key: string, fn: () => Promise<void>, msg: string) => {
    setActionLoading(key);
    try {
      await fn();
      notify(msg);
      onRefresh();
      onClose();
    } catch (err) {
      capture(err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
      <div className="space-y-5">
        {error && (
            <div className="p-3 bg-red-900/40 text-red-400 border border-red-800 rounded-xl text-sm">{error}</div>
        )}

        {/* Avatar + name */}
        <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-xl">
          {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={name} className="w-16 h-16 rounded-2xl object-cover border-2 border-gray-700" />
          ) : (
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary text-2xl font-bold">
                {name.charAt(0).toUpperCase()}
              </div>
          )}
          <div>
            <p className="text-white text-lg font-bold">{name}</p>
            <p className="text-gray-400 text-sm">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLOR[user.role]}`}>
              {ROLE_LABEL[user.role]}
            </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-900/60 text-green-400' : 'bg-red-900/60 text-red-400'}`}>
              {user.isActive ? 'Активен' : 'Заблокирован'}
            </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-800 rounded-lg">
            <p className="text-gray-400 text-xs">Заявки</p>
            <p className="text-white text-lg font-bold">{user.participationsCount}</p>
          </div>
          <div className="p-3 bg-gray-800 rounded-lg">
            <p className="text-gray-400 text-xs">Посещено мероприятий</p>
            <p className="text-white text-lg font-bold">{user.attendedEventsCount}</p>
          </div>
          {user.organizedEventsCount > 0 && (
              <div className="p-3 bg-gray-800 rounded-lg col-span-2">
                <p className="text-gray-400 text-xs">Организовано мероприятий</p>
                <p className="text-white text-lg font-bold">{user.organizedEventsCount}</p>
              </div>
          )}
        </div>

        {/* Bio */}
        {user.bio && (
            <div>
              <p className="text-gray-400 text-xs mb-1">О себе</p>
              <p className="text-gray-300 text-sm line-clamp-3">{user.bio}</p>
            </div>
        )}

        {/* Dates */}
        <div className="border-t border-gray-700 pt-3 text-xs text-gray-500 space-y-1">
          <p>
            Регистрация: <span className="text-gray-300">{new Date(user.createdAt).toLocaleDateString('ru-RU')}</span>
          </p>
          {user.updatedAt && (
              <p>
                Обновлено: <span className="text-gray-300">{new Date(user.updatedAt).toLocaleDateString('ru-RU')}</span>
              </p>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-700 pt-4 space-y-2 flex flex-col">
          {user.isActive ? (
              <button
                  onClick={() =>
                      do_(
                          'block',
                          () => adminApi.blockUser(user.id, 'Заблокирован администратором'),
                          'Пользователь заблокирован'
                      )
                  }
                  disabled={actionLoading === 'block'}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white text-sm rounded-lg transition"
              >
                {actionLoading === 'block' ? 'Загрузка...' : 'Заблокировать'}
              </button>
          ) : (
              <button
                  onClick={() =>
                      do_(
                          'unblock',
                          () => adminApi.unblockUser(user.id),
                          'Пользователь разблокирован'
                      )
                  }
                  disabled={actionLoading === 'unblock'}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white text-sm rounded-lg transition"
              >
                {actionLoading === 'unblock' ? 'Загрузка...' : 'Разблокировать'}
              </button>
          )}

           {user.role !== 'Admin' && (
               <button
                   onClick={() =>
                       do_(
                           'role',
                           () => adminApi.changeUserRole(user.id, 'Admin'),
                           'Роль изменена на Администратор'
                       )
                   }
                   disabled={actionLoading === 'role'}
                   className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white text-sm rounded-lg transition"
               >
                 {actionLoading === 'role' ? 'Загрузка...' : 'Сделать администратором'}
               </button>
           )}

           <button
               onClick={() => setShowDeleteConfirm(true)}
               disabled={actionLoading !== null}
               className="px-4 py-2 bg-red-700 hover:bg-red-800 disabled:bg-gray-700 text-white text-sm rounded-lg transition flex items-center gap-2 justify-center"
           >
             <i className="fas fa-trash-alt" />Удалить пользователя
           </button>

           {showDeleteConfirm && (
               <div className="p-3 bg-red-900/40 border border-red-800 rounded-lg text-sm text-red-400 space-y-2">
                 <p>Вы уверены? Это действие необратимо.</p>
                 <div className="flex gap-2">
                   <button
                       onClick={() =>
                           do_(
                               'delete',
                               () => adminApi.deleteUser(user.id),
                               'Пользователь удалён'
                           )
                       }
                       disabled={actionLoading === 'delete'}
                       className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white text-xs rounded transition"
                   >
                     {actionLoading === 'delete' ? 'Удаление...' : 'Да, удалить'}
                   </button>
                   <button
                       onClick={() => setShowDeleteConfirm(false)}
                       className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition"
                   >
                     Отменить
                   </button>
                 </div>
               </div>
           )}

           <button
               onClick={onClose}
               className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition"
           >
             Закрыть
           </button>
        </div>
      </div>
  );
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserListItemDto[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetailDto | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers(skip, TAKE, search, role || undefined, isActive ?? undefined);
      // ✅ Исправление: защита от undefined
      setUsers(res.Items || []);
      setTotal(res.Total || 0);
    } catch (e) {
      console.error('Error loading users:', e);
      setUsers([]); // ✅ установить пустой массив при ошибке
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [skip, search, role, isActive]);

  useEffect(() => {
    setSkip(0);
  }, [search, role, isActive]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (userId: string) => {
    try {
      const user = await adminApi.getUserDetail(userId);
      setSelectedUser(user);
    } catch (e) {
      console.error('Error loading user detail:', e);
    }
  };

  const pages = Math.ceil(total / TAKE) || 1;
  const currentPage = Math.floor(skip / TAKE) + 1;

  return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Пользователи</h1>
          <p className="text-gray-500 text-sm mt-1">Управление пользователями системы</p>
        </div>

        {/* Search & Filters */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Поиск</label>
            <input
                type="text"
                placeholder="Имя или email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Роль</label>
              <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
              >
                <option value="">Все роли</option>
                <option value="Volunteer">Волонтёр</option>
                <option value="Organizer">Организатор</option>
                <option value="Admin">Администратор</option>
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">Статус</label>
              <select
                  value={isActive === null ? '' : isActive ? 'active' : 'blocked'}
                  onChange={(e) => {
                    if (e.target.value === '') setIsActive(null);
                    else setIsActive(e.target.value === 'active');
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
              >
                <option value="">Все</option>
                <option value="active">Активные</option>
                <option value="blocked">Заблокированные</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
        )}

        {/* Users Table */}
        {!loading && (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800/50 border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-300">Имя</th>
                    <th className="px-4 py-3 text-left text-gray-300">Email</th>
                    <th className="px-4 py-3 text-center text-gray-300">Роль</th>
                    <th className="px-4 py-3 text-center text-gray-300">Статус</th>
                    <th className="px-4 py-3 text-center text-gray-300">Заявки</th>
                    <th className="px-4 py-3 text-center text-gray-300">Действия</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                  {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          Пользователи не найдены
                        </td>
                      </tr>
                  ) : (
                      users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-800/50 transition">
                            <td className="px-4 py-3 text-white font-medium">{user.fullName}</td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{user.email}</td>
                            <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLOR[user.role]}`}>
                          {ROLE_LABEL[user.role]}
                        </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                        <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-900/60 text-green-400' : 'bg-red-900/60 text-red-400'}`}
                        >
                          {user.isActive ? 'Активен' : 'Блокирован'}
                        </span>
                            </td>
                            <td className="px-4 py-3 text-center text-white">{user.participationsCount}</td>
                            <td className="px-4 py-3 text-center">
                              <button
                                  onClick={() => openDetail(user.id)}
                                  className="text-primary hover:underline text-sm"
                              >
                                Подробнее
                              </button>
                            </td>
                          </tr>
                      ))
                  )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-4 border-t border-gray-800 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Страница {currentPage} из {pages || 1} • Всего: {total}
                </div>
                <div className="flex items-center gap-2">
                  <button
                      onClick={() => setSkip(Math.max(0, skip - TAKE))}
                      disabled={skip === 0}
                      className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 text-white rounded text-sm transition"
                  >
                    ← Назад
                  </button>
                  <button
                      onClick={() => setSkip(skip + TAKE)}
                      disabled={currentPage >= pages}
                      className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 text-white rounded text-sm transition"
                  >
                    Далее →
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* Detail Modal */}
        {selectedUser && (
            <Modal
                title="Информация о пользователе"
                isOpen={!!selectedUser}
                onClose={() => setSelectedUser(null)}
            >
              <UserDetailModal
                  user={selectedUser}
                  onClose={() => setSelectedUser(null)}
                  onRefresh={load}
              />
            </Modal>
        )}
      </div>
  );
}