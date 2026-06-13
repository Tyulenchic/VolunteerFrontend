import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useApiError } from '../../hooks/useApiError';
import { usersApi } from '../../api/users';
import { eventsApi } from '../../api/events';
import { Spinner } from '../../components/Spinner';
import type { ParticipationResponseDto } from '../../types/event';

const STATUS_LABEL: Record<string, string> = {
  Pending:'На рассмотрении', Approved:'Одобрено',
  Rejected:'Отклонено', AttendanceConfirmed:'Посещение подтверждено',
};
const STATUS_COLOR: Record<string, string> = {
  Pending:'bg-amber-100 text-amber-700', Approved:'bg-green-100 text-green-700',
  Rejected:'bg-red-100 text-red-700', AttendanceConfirmed:'bg-blue-100 text-blue-700',
};

type Tab = 'info' | 'activity' | 'settings' | 'security' | 'danger';

export function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const { error: apiErr, capture, setError } = useApiError();
  const [tab, setTab] = useState<Tab>('info');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName,  setLastName]  = useState(user?.lastName  ?? '');
  const [bio,       setBio]       = useState(user?.bio       ?? '');
  const [saving,    setSaving]    = useState(false);

  const [avatarLoading, setAvatarLoading] = useState(false);

  const [curPw,     setCurPw]   = useState('');
  const [newPw,     setNewPw]   = useState('');
  const [confPw,    setConfPw]  = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwErr,     setPwErr]   = useState('');

  const [activities, setActivities] = useState<ParticipationResponseDto[]>([]);
  const [actLoading, setActLoading] = useState(false);

  const [deleteInput, setDeleteInput] = useState('');
  const [deleting,    setDeleting]    = useState(false);
  const CONFIRM_WORD = 'УДАЛИТЬ';

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName  ?? '');
      setBio(user.bio ?? '');
    }
  }, [user]);

  useEffect(() => {
    if (tab === 'activity') {
      setActLoading(true);
      eventsApi.getMyParticipations()
        .then(setActivities)
        .catch(() => notify('Не удалось загрузить активности', 'error'))
        .finally(() => setActLoading(false));
    }
  }, [tab]);

  if (!user) return null;

  const displayName = user.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user.email.split('@')[0];

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(undefined);
    try {
      await usersApi.updateProfile({
        firstName: firstName || undefined,
        lastName:  lastName  || undefined,
        bio:       bio       || undefined,
      });
      await refreshUser();
      notify('Профиль обновлён!');
    } catch(err) { capture(err); }
    finally { setSaving(false); }
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      await usersApi.uploadAvatar(file);
      await refreshUser();
      notify('Аватар обновлён!');
    } catch(err) { capture(err); }
    finally { setAvatarLoading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const removeAvatar = async () => {
    setAvatarLoading(true);
    try {
      await usersApi.deleteAvatar();
      await refreshUser();
      notify('Аватар удалён');
    } catch(err) { capture(err); }
    finally { setAvatarLoading(false); }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setPwErr('');
    if (newPw.length < 8)  { setPwErr('Новый пароль: минимум 8 символов'); return; }
    if (newPw !== confPw)  { setPwErr('Пароли не совпадают'); return; }
    setPwLoading(true);
    try {
      await usersApi.changePassword({ currentPassword: curPw, newPassword: newPw });
      notify('Пароль изменён!');
      setCurPw(''); setNewPw(''); setConfPw('');
    } catch(err) { capture(err); }
    finally { setPwLoading(false); }
  };

  const deleteAccount = async () => {
    if (deleteInput !== CONFIRM_WORD) { notify('Введите слово подтверждения', 'error'); return; }
    setDeleting(true);
    try {
      await usersApi.deleteAccount();
      await logout();
      notify('Аккаунт удалён', 'info');
      navigate('/');
    } catch(err) { capture(err); setDeleting(false); }
  };

  const tabs: Array<{key:Tab; label:string; icon:string}> = [
    {key:'info',     label:'Информация',  icon:'fa-user'},
    {key:'activity', label:'Активность',  icon:'fa-calendar-check'},
    {key:'settings', label:'Настройки',   icon:'fa-cog'},
    {key:'security', label:'Безопасность',icon:'fa-lock'},
    {key:'danger',   label:'Удалить аккаунт',icon:'fa-exclamation-triangle'},
  ];

  const inp = 'w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl py-8">

        {/* Profile header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt={displayName} className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-200 flex-shrink-0" />
              : <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl font-bold text-primary">{displayName.charAt(0).toUpperCase()}</span>
                </div>
            }
            <div className="flex-grow">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  user.role === 'Admin' ? 'bg-primary/10 text-primary'
                  : user.role === 'Organizer' ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
                }`}>
                  {user.role === 'Admin' ? 'Администратор' : user.role === 'Organizer' ? 'Организатор' : 'Волонтёр'}
                </span>
                {!user.isActive && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-red-100 text-red-600">Заблокирован</span>
                )}
              </div>
              <p className="text-gray-500 text-sm">{user.email}</p>
              {user.bio && <p className="text-gray-600 text-sm mt-2">{user.bio}</p>}
            </div>
            {!user.emailConfirmed && (
              <div className="flex-shrink-0 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                <i className="fas fa-exclamation-circle mr-1" />Email не подтверждён
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-100 no-scrollbar">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition border-b-2 ${
                  tab === t.key ? 'border-primary text-primary bg-primary/5'
                  : t.key === 'danger' ? 'border-transparent text-red-500 hover:bg-red-50'
                  : 'border-transparent text-gray-600 hover:bg-gray-50'
                }`}>
                <i className={`fas ${t.icon}`} />{t.label}
              </button>
            ))}
          </div>

          <div className="p-6">

            {/* ── INFO ──────────────────────────────────────── */}
            {tab === 'info' && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { icon:'fa-calendar-alt', label:'Участник с',   val: new Date(user.createdAt).toLocaleDateString('ru-RU') },
                    { icon:'fa-user-tag',     label:'Роль',         val: user.role === 'Admin' ? 'Администратор' : user.role === 'Organizer' ? 'Организатор' : 'Волонтёр' },
                    { icon:'fa-envelope',     label:'Email',        val: user.emailConfirmed ? 'Подтверждён' : 'Не подтверждён' },
                    { icon:'fa-shield-alt',   label:'Статус',       val: user.isActive ? 'Активен' : 'Заблокирован' },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                        <i className={`fas ${s.icon} text-primary`} />{s.label}
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">{s.val}</p>
                    </div>
                  ))}
                </div>
                {user.updatedAt && (
                  <p className="text-xs text-gray-400">
                    Последнее обновление: {new Date(user.updatedAt).toLocaleString('ru-RU')}
                  </p>
                )}
              </div>
            )}

            {/* ── ACTIVITY ──────────────────────────────────── */}
            {tab === 'activity' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Мои заявки на мероприятия</h2>
                {actLoading
                  ? <div className="flex justify-center py-10"><Spinner /></div>
                  : activities.length === 0
                    ? <div className="text-center py-10 text-gray-500">
                        <i className="fas fa-calendar-times text-4xl mb-3 block text-gray-300" />
                        <p>Вы ещё не подавали заявок на мероприятия</p>
                      </div>
                    : <div className="space-y-3">
                        {activities.map(a => (
                          <div key={a.id} className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div>
                              <p className="font-semibold text-gray-900">{a.eventTitle}</p>
                              <p className="text-sm text-gray-500">{new Date(a.createdAt).toLocaleDateString('ru-RU')}</p>
                              {a.adminComment && (
                                <p className="text-sm text-gray-600 mt-1">
                                  <i className="fas fa-comment mr-1 text-primary" />{a.adminComment}
                                </p>
                              )}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex-shrink-0 ${STATUS_COLOR[a.status] ?? 'bg-gray-100 text-gray-600'}`}>
                              {STATUS_LABEL[a.status] ?? a.status}
                            </span>
                          </div>
                        ))}
                      </div>
                }
              </div>
            )}

            {/* ── SETTINGS ──────────────────────────────────── */}
            {tab === 'settings' && (
              <div className="space-y-8">
                {apiErr && <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm">{apiErr}</div>}

                {/* Edit profile */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Личные данные</h2>
                  <form onSubmit={saveProfile} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                        <input value={firstName} onChange={e => setFirstName(e.target.value)} className={inp} placeholder="Иван" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
                        <input value={lastName} onChange={e => setLastName(e.target.value)} className={inp} placeholder="Иванов" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">О себе</label>
                      <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className={inp + ' resize-none'} placeholder="Расскажите немного о себе..." />
                    </div>
                    <button type="submit" disabled={saving}
                      className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-60 flex items-center gap-2">
                      {saving ? <><Spinner /> Сохранение...</> : <><i className="fas fa-save mr-1" />Сохранить</>}
                    </button>
                  </form>
                </div>

                {/* Avatar */}
                <div className="border-t border-gray-100 pt-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Аватар</h2>
                  <div className="flex items-center gap-4 mb-4">
                    {user.avatarUrl
                      ? <img src={user.avatarUrl} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover border-2 border-gray-200" />
                      : <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">{displayName.charAt(0).toUpperCase()}</span>
                        </div>
                    }
                    <div className="flex gap-2">
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarFile} className="hidden" />
                      <button onClick={() => fileInputRef.current?.click()} disabled={avatarLoading}
                        className="px-4 py-2 text-sm font-medium bg-primary text-white border border-primary rounded-xl hover:bg-primary-dark transition disabled:opacity-60 flex items-center gap-2">
                        {avatarLoading ? <Spinner /> : <><i className="fas fa-upload" />Загрузить</>}
                      </button>
                      {user.avatarUrl && (
                        <button onClick={removeAvatar} disabled={avatarLoading}
                          className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition disabled:opacity-60">
                          Удалить
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs">Допустимые форматы: JPG, PNG, WEBP. Максимальный размер: 5 МБ.</p>
                </div>
              </div>
            )}

            {/* ── SECURITY ──────────────────────────────────── */}
            {tab === 'security' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Смена пароля</h2>
                {(apiErr || pwErr) && (
                  <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm mb-4">{apiErr || pwErr}</div>
                )}
                <form onSubmit={changePassword} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Текущий пароль</label>
                    <input type="password" value={curPw} onChange={e => setCurPw(e.target.value)} required className={inp} placeholder="••••••••" autoComplete="current-password" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Новый пароль <span className="text-gray-400 font-normal">(мин. 8)</span></label>
                    <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required className={inp} placeholder="••••••••" autoComplete="new-password" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Повторите новый пароль</label>
                    <input type="password" value={confPw} onChange={e => setConfPw(e.target.value)} required className={inp} placeholder="••••••••" autoComplete="new-password" />
                  </div>
                  <button type="submit" disabled={pwLoading}
                    className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-60 flex items-center gap-2">
                    {pwLoading ? <><Spinner /> Сохранение...</> : <><i className="fas fa-key mr-1" />Изменить пароль</>}
                  </button>
                </form>
              </div>
            )}

            {/* ── DANGER ────────────────────────────────────── */}
            {tab === 'danger' && (
              <div className="space-y-6">
                {apiErr && <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm">{apiErr}</div>}
                <div className="border border-red-200 rounded-2xl p-6 bg-red-50/30">
                  <h2 className="text-xl font-bold text-red-600 mb-2">
                    <i className="fas fa-trash-alt mr-2" />Удаление аккаунта
                  </h2>
                  <p className="text-gray-600 text-sm mb-4">
                    Это действие необратимо. Все ваши данные будут анонимизированы (GDPR). Для подтверждения введите слово{' '}
                    <strong className="text-red-600">{CONFIRM_WORD}</strong>.
                  </p>
                  <div className="flex gap-3 items-center max-w-sm">
                    <input value={deleteInput} onChange={e => setDeleteInput(e.target.value)} placeholder={CONFIRM_WORD}
                      className="flex-1 px-4 py-2.5 border-2 border-red-300 rounded-xl focus:ring-2 focus:ring-red-400 outline-none transition bg-white" />
                    <button onClick={deleteAccount} disabled={deleting || deleteInput !== CONFIRM_WORD}
                      className="px-4 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition disabled:opacity-60 flex items-center gap-2 flex-shrink-0">
                      {deleting ? <Spinner /> : <><i className="fas fa-trash-alt" />Удалить</>}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
