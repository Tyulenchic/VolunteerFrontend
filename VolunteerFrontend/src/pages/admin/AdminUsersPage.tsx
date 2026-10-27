import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { useNotification } from '../../context/NotificationContext';
import { adminErrorMessage } from '../../utils/adminErrors';
import { useApiError } from '../../hooks/useApiError';
import { Modal } from '../../components/Modal';
import { DossierExportButtons } from '../../components/DossierExportButtons';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { ActionMenu } from '../../components/ui/ActionMenu';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState, ErrorState } from '../../components/ui/PageStates';
import { useDebounced, useLatestRequest, usePaging } from '../../hooks/useListHelpers';
import { Pagination } from '../../components/ui/Pagination';
import { Segmented } from '../../components/ui/Segmented';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { StatusBadge, type Tone } from '../../components/ui/StatusBadge';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/Input';
import type { AdminUserDetailDto, AdminUserListItemDto } from '../../types/admin';

const TAKE = 20;

/** Состояние учётной записи: заблокирована, почта не подтверждена (вход невозможен, в публичных списках нет) или всё в порядке. */
const accountStatus = (u: { isActive: boolean; emailConfirmed?: boolean }): { label: string; tone: Tone } =>
  !u.isActive ? { label: 'Заблокирован', tone: 'error' }
    : u.emailConfirmed === false ? { label: 'Почта не подтверждена', tone: 'pending' }
    : { label: 'Почта подтверждена', tone: 'success' };

const ROLE_LABEL: Record<string, string> = {
  Volunteer: 'Волонтёр',
  Organizer: 'Организатор',
  Admin: 'Администратор',
};

const ROLE_TONE: Record<string, Tone> = {
  Volunteer: 'neutral',
  Organizer: 'brand',
  Admin: 'brand',
};

interface UserDetailModalProps {
  user: AdminUserDetailDto;
  onClose: () => void;
  onRefresh: () => void;
}

function UserDetailModal({ user, onClose, onRefresh }: UserDetailModalProps) {
  const { notify } = useNotification();
  const { error, setError } = useApiError();
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
      setError(adminErrorMessage(err, 'Не удалось выполнить действие'));
    } finally {
      setActionLoading(null);
    }
  };

  return (
      <div className="space-y-5">
        {error && (
            <div className="p-3 bg-danger-50 text-danger-700 border border-danger-200 rounded-xl text-sm">{error}</div>
        )}

        {/* Avatar + name */}
        <div className="flex items-center gap-4 p-4 bg-surface-2 rounded-xl">
          {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={name} className="w-16 h-16 rounded-2xl object-cover border-2 border-line-strong" />
          ) : (
              <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center text-brand-700 text-2xl font-bold">
                {name.charAt(0).toUpperCase()}
              </div>
          )}
          <div>
            <p className="text-ink-900 text-lg font-bold">{name}</p>
            <p className="text-ink-500 text-sm">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
            <StatusBadge tone={ROLE_TONE[user.role] ?? 'neutral'}>{ROLE_LABEL[user.role]}</StatusBadge>
              <StatusBadge tone={accountStatus(user).tone}>{accountStatus(user).label}</StatusBadge>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-surface-2 rounded-lg">
            <p className="text-ink-500 text-xs">Заявки</p>
            <p className="text-ink-900 text-lg font-bold">{user.participationsCount}</p>
          </div>
          <div className="p-3 bg-surface-2 rounded-lg">
            <p className="text-ink-500 text-xs">Посещено мероприятий</p>
            <p className="text-ink-900 text-lg font-bold">{user.attendedEventsCount}</p>
          </div>
          {user.organizedEventsCount > 0 && (
              <div className="p-3 bg-surface-2 rounded-lg col-span-2">
                <p className="text-ink-500 text-xs">Организовано мероприятий</p>
                <p className="text-ink-900 text-lg font-bold">{user.organizedEventsCount}</p>
              </div>
          )}
        </div>

        {/* Bio */}
        {user.bio && (
            <div>
              <p className="text-ink-500 text-xs mb-1">О себе</p>
              <p className="text-ink-700 text-sm line-clamp-3">{user.bio}</p>
            </div>
        )}

        {/* Dates */}
        <div className="border-t border-line-strong pt-3 text-xs text-ink-400 space-y-1">
          <p>
            Регистрация: <span className="text-ink-700">{new Date(user.createdAt).toLocaleDateString('ru-RU')}</span>
          </p>
          {user.updatedAt && (
              <p>
                Обновлено: <span className="text-ink-700">{new Date(user.updatedAt).toLocaleDateString('ru-RU')}</span>
              </p>
          )}
        </div>

        {/* Досье */}
        <div className="border-t border-line-strong pt-4">
          <p className="text-ink-500 text-xs mb-2">Скачать досье пользователя</p>
          <DossierExportButtons onExport={(f) => adminApi.exportUserDossier(user.id, f)} />
        </div>

        {/* Actions */}
        <div className="border-t border-line-strong pt-4 space-y-2 flex flex-col">
          <Link to={`/users/${user.id}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary no-underline">
            <i className="fas fa-arrow-up-right-from-square text-xs" aria-hidden /> Открыть профиль на сайте
          </Link>
          {user.isActive ? (
              <button
                  onClick={() =>
                      do_(
                          'block',
                          () => adminApi.blockUser(user.id, 'Заблокирован администратором'),
                          'Пользователь заблокирован'
                      )
                  }
                  disabled={actionLoading !== null}
                  className="btn btn-danger"
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
                  disabled={actionLoading !== null}
                  className="btn btn-success"
              >
                {actionLoading === 'unblock' ? 'Загрузка...' : 'Разблокировать'}
              </button>
          )}

           <div className="space-y-2">
             {user.role === 'Volunteer' && (
                 <p className="meta">Организатором пользователя назначают в разделе «Организации»: роль выдаётся вместе с организацией.</p>
             )}

             {user.role !== 'Admin' && (
                 <button
                     onClick={() =>
                         do_(
                             'role-admin',
                             () => adminApi.changeUserRole(user.id, 'Admin'),
                             'Роль изменена на Администратор'
                         )
                     }
                     disabled={actionLoading !== null}
                     className="btn btn-primary w-full"
                 >
                   {actionLoading === 'role-admin' ? 'Загрузка...' : 'Сделать администратором'}
                 </button>
             )}
           </div>

           <button
               onClick={() => setShowDeleteConfirm(true)}
               disabled={actionLoading !== null}
               className="btn btn-danger"
           >
             <i className="fas fa-trash-alt" />Удалить пользователя
           </button>

           {showDeleteConfirm && (
               <div className="p-3 bg-danger-100 border border-danger-200 rounded-lg text-sm text-danger-700 space-y-2">
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
                       disabled={actionLoading !== null}
                       className="btn btn-danger btn-sm flex-1"
                   >
                     {actionLoading === 'delete' ? 'Удаление...' : 'Да, удалить'}
                   </button>
                   <button
                       onClick={() => setShowDeleteConfirm(false)}
                       className="btn btn-secondary btn-sm flex-1"
                   >
                     Отменить
                   </button>
                 </div>
               </div>
           )}

           <button
               onClick={onClose}
               className="btn btn-secondary"
           >
             Закрыть
           </button>
        </div>
      </div>
  );
}

export function AdminUsersPage() {
  const confirm = useConfirm();
  const { notify } = useNotification();
  const [users, setUsers] = useState<AdminUserListItemDto[]>([]);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounced(searchInput);
  const [role, setRole] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [skip, setSkip] = usePaging(`${search}|${role}|${isActive}`);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const beginRequest = useLatestRequest();
  const [selectedUser, setSelectedUser] = useState<AdminUserDetailDto | null>(null);

  const load = useCallback(async () => {
    const isCurrent = beginRequest();
    setLoading(true);
    setFailed(false);
    try {
      const res = await adminApi.getUsers(skip, TAKE, search, role || undefined, isActive ?? undefined);
      if (!isCurrent()) return;
      setUsers(res.Items || []);
      setTotal(res.Total || 0);
    } catch (e) {
      if (!isCurrent()) return;
      console.error('Error loading users:', e);
      setUsers([]);
      setTotal(0);
      setFailed(true);
    } finally {
      if (isCurrent()) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, search, role, isActive]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (userId: string) => {
    try {
      const user = await adminApi.getUserDetail(userId);
      setSelectedUser(user);
    } catch (e) {
      console.error('Error loading user detail:', e);
      notify('Не удалось загрузить профиль пользователя', 'error');
    }
  };

  const removeUser = async (user: AdminUserListItemDto) => {
    if (!(await confirm({ title: 'Удалить пользователя?', message: `Это удалит пользователя ${user.fullName}. Действие нельзя отменить.`, confirmLabel: 'Удалить' }))) return;
    try {
      await adminApi.deleteUser(user.id);
      if (users.length === 1 && skip > 0) setSkip(Math.max(0, skip - TAKE)); else load();
    } catch (e) {
      console.error('Error deleting user:', e);
      notify(adminErrorMessage(e, 'Не удалось удалить пользователя'), 'error');
    }
  };

  const statusValue = isActive === null ? 'all' : isActive ? 'active' : 'blocked';
  const filtered = !!(searchInput || role || isActive !== null);
  const resetFilters = () => { setSearchInput(''); setRole(''); setIsActive(null); };

  return (
    <div className="space-y-5">
      <PageHeader title="Пользователи" description="Поиск, роли и блокировка учётных записей." />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput label="Поиск пользователя" placeholder="Имя или email…" value={searchInput} onChange={setSearchInput} />
        <Segmented label="Роль" value={role} onChange={setRole}
          options={[{ value: '', label: 'Все' }, { value: 'Volunteer', label: 'Волонтёры' }, { value: 'Organizer', label: 'Организаторы' }, { value: 'Admin', label: 'Админы' }]} />
        <Segmented label="Статус" value={statusValue} onChange={v => setIsActive(v === 'all' ? null : v === 'active')}
          options={[{ value: 'all', label: 'Любой' }, { value: 'active', label: 'Не заблокированные' }, { value: 'blocked', label: 'Заблокированные' }]} />
      </div>

      <Card className="overflow-hidden">
        {loading && users.length === 0 ? (
          <ListSkeleton rows={8} />
        ) : failed ? (
          <ErrorState message="Не удалось загрузить пользователей" onRetry={load} />
        ) : users.length === 0 ? (
          <EmptyState icon="fa-users"
            title={filtered ? 'Пользователи не найдены' : 'Пользователей пока нет'}
            hint={filtered ? 'Проверьте написание или сбросьте фильтры.' : 'Зарегистрированные пользователи появятся здесь.'}
            action={filtered ? <Button variant="secondary" size="sm" onClick={resetFilters}>Сбросить фильтры</Button> : undefined} />
        ) : (
          <div className={`relative overflow-x-auto scroll-soft transition-opacity ${loading ? 'opacity-60' : ''}`}>
            <table className="rtable w-full text-sm">
              <thead>
                <tr>
                  <th className="px-4 text-left">Пользователь</th>
                  <th className="px-4 text-left">Роль</th>
                  <th className="px-4 text-left">Статус</th>
                  <th className="px-4 text-left hidden md:table-cell">Регистрация</th>
                  <th className="px-4 text-left hidden 2xl:table-cell">Активность</th>
                  <th className="px-4 text-right"><span className="sr-only">Действия</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 rt-full">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={user.fullName || user.email} src={user.avatarUrl} size="md" />
                        <div className="min-w-0">
                          <button type="button" onClick={() => openDetail(user.id)} className="block text-left font-medium text-ink-900 hover:text-brand-700 truncate max-w-[12rem] sm:max-w-[16rem]">{user.fullName || '—'}</button>
                          <p className="meta truncate max-w-[12rem] sm:max-w-[16rem]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge tone={ROLE_TONE[user.role] ?? 'neutral'}>{ROLE_LABEL[user.role] ?? user.role}</StatusBadge></td>
                    <td className="px-4 py-3"><StatusBadge tone={accountStatus(user).tone}>{accountStatus(user).label}</StatusBadge></td>
                    <td className="px-4 py-3 hidden md:table-cell text-ink-500 whitespace-nowrap">{new Date(user.createdAt).toLocaleDateString('ru-RU')}</td>
                    <td className="px-4 py-3 hidden 2xl:table-cell meta whitespace-nowrap">заявок {user.participationsCount} · посещено {user.attendedEventsCount}</td>
                    <td className="px-4 py-3 rt-end">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="secondary" size="sm" onClick={() => openDetail(user.id)}>Профиль</Button>
                        <ActionMenu label={`Действия: ${user.fullName}`} actions={[{ label: 'Удалить', icon: 'fa-trash', danger: true, onSelect: () => removeUser(user) }]} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination skip={skip} take={TAKE} total={total} onChange={setSkip} />
      </Card>

      {selectedUser && (
        <Modal title="Информация о пользователе" isOpen={!!selectedUser} onClose={() => setSelectedUser(null)}>
          <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} onRefresh={load} />
        </Modal>
      )}
    </div>
  );
}
