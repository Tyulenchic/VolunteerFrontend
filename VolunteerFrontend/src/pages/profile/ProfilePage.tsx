import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useApiError } from '../../hooks/useApiError';
import { usersApi } from '../../api/users';
import { eventsApi } from '../../api/events';
import { publicUsersApi } from '../../api/publicUsers';
import { Spinner } from '../../components/Spinner';
import { DossierExportButtons } from '../../components/DossierExportButtons';
import { AvatarPanel } from '../../components/profile/AvatarPanel';
import { MyOrganizationsPanel } from '../../components/profile/MyOrganizationsPanel';
import { PublicProfileView } from '../../components/profile/PublicProfileView';
import { checkPhone, phoneError, PHONE_HINT, PHONE_PLACEHOLDER } from '../../utils/phone';
import { CancelParticipationDialog } from '../../components/CancelParticipationDialog';
import type { PublicUserDto } from '../../types/user';
import type { ParticipationResponseDto } from '../../types/event';
import type { ProfileField } from '../../types/user';

const VISIBILITY_OPTIONS: Array<{ key: ProfileField; label: string }> = [
  { key: 'FullName',    label: 'ФИО' },
  { key: 'Photo',       label: 'Фотография' },
  { key: 'City',        label: 'Город проживания' },
  { key: 'BookNumber',  label: 'Номер книжки' },
  { key: 'About',       label: 'О себе' },
  { key: 'SocialLinks', label: 'Социальные сети' },
  { key: 'Events',      label: 'Мероприятия, в которых я участвовал' },
  { key: 'Organizations', label: 'Организации, в которых я состою' },
];

const STATUS_LABEL: Record<string, string> = {
  Pending:'На рассмотрении', Approved:'Одобрено',
  Rejected:'Отклонено', AttendanceConfirmed:'Посещение подтверждено', Withdrawn:'Отозвана',
};
const STATUS_COLOR: Record<string, string> = {
  Pending:'bg-amber-100 text-amber-700', Approved:'bg-green-100 text-green-700',
  Rejected:'bg-red-100 text-red-700', AttendanceConfirmed:'bg-blue-100 text-blue-700', Withdrawn:'bg-gray-100 text-gray-600',
};

type Tab = 'info' | 'public' | 'activity' | 'organizations' | 'settings' | 'security' | 'danger';

export function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const { error: apiErr, capture, setError } = useApiError();
  const [tab, setTab] = useState<Tab>('info');
  const [publicView, setPublicView] = useState<PublicUserDto | null>(null);

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName,  setLastName]  = useState(user?.lastName  ?? '');
  const [bio,       setBio]       = useState(user?.bio       ?? '');
  const [middleName, setMiddleName] = useState(user?.middleName ?? '');
  const [birthYear,  setBirthYear]  = useState(user?.birthYear ? String(user.birthYear) : '');
  const [city,       setCity]       = useState(user?.city ?? '');
  const [bookNumber, setBookNumber] = useState(user?.bookNumber ?? '');
  const [phone,      setPhone]      = useState(user?.phoneNumber ?? '');
  const [phoneErr,   setPhoneErr]   = useState('');
  const [cities,     setCities]     = useState<string[]>([]);
  const [socialText, setSocialText] = useState((user?.socialLinks ?? []).join('\n'));
  const [publicFields, setPublicFields] = useState<ProfileField[]>(user?.publicFields ?? []);
  const [isClosed,  setIsClosed]  = useState(user?.isProfileClosed ?? false);
  const [saving,    setSaving]    = useState(false);

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

  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<ParticipationResponseDto | null>(null);
  const handleCancel = async (reason: string) => {
    if (!cancelling) return;
    setWithdrawingId(cancelling.id);
    try {
      await eventsApi.cancelParticipation(cancelling.id, reason);
      // Запись остаётся в списке со статусом «Отозвана» и вашим комментарием.
      setActivities(prev => prev.map(a => a.id === cancelling.id ? { ...a, status: 'Withdrawn', withdrawalReason: reason || null } : a));
      notify(cancelling.status === 'Approved' ? 'Вы отказались от участия. Организатор получит уведомление.' : 'Заявка отозвана', 'info');
      setCancelling(null);
    } catch (err) {
      capture(err);
    } finally {
      setWithdrawingId(null);
    }
  };

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName  ?? '');
      setBio(user.bio ?? '');
      setMiddleName(user.middleName ?? '');
      setBirthYear(user.birthYear ? String(user.birthYear) : '');
      setCity(user.city ?? '');
      setBookNumber(user.bookNumber ?? '');
      setPhone(user.phoneNumber ?? '');
      setSocialText((user.socialLinks ?? []).join('\n'));
      setPublicFields(user.publicFields ?? []);
      setIsClosed(user.isProfileClosed ?? false);
    }
  }, [user]);

  useEffect(() => {
    publicUsersApi.getCities().then(setCities).catch(() => setCities([]));
  }, []);

  useEffect(() => {
    if (tab === 'activity') {
      setActLoading(true);
      eventsApi.getMyParticipations()
        .then(setActivities)
        .catch(() => notify('Не удалось загрузить активности', 'error'))
        .finally(() => setActLoading(false));
    }
  }, [tab]);

  // Вкладка «Как видят другие»: профиль так, как его отдаёт сервер посторонним (с учётом скрытых полей).
  useEffect(() => {
    if (tab === 'public' && user && true) publicUsersApi.getById(user.id).then(setPublicView).catch(() => notify('Не удалось загрузить публичный вид', 'error'));
  }, [tab, user?.id, user?.publicFields]);

  if (!user) return null;

  const displayName = user.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user.email.split('@')[0];

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneCheck = checkPhone(phone);
    if (!phoneCheck.ok) { setPhoneErr(phoneCheck.error); document.getElementById('profile-phone')?.focus(); return; }
    setPhoneErr('');
    setSaving(true); setError(undefined);
    try {
      await usersApi.updateProfile({
        firstName:  firstName  || undefined,
        lastName:   lastName   || undefined,
        middleName: middleName || undefined,
        bio:        bio        || undefined,
        birthYear:  birthYear ? Number(birthYear) : undefined,
        city:       city       || undefined,
        bookNumber: bookNumber || undefined,
        phoneNumber: phoneCheck.value || undefined,
        socialLinks: socialText.split('\n').map(l => l.trim()).filter(Boolean),
        publicFields,
        isProfileClosed: user.role !== 'Volunteer' ? isClosed : false,
      });
      await refreshUser();
      notify('Профиль обновлён!');
    } catch(err) { capture(err); }
    finally { setSaving(false); }
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
    {key:'public',   label:'Как видят другие', icon:'fa-eye'},
    {key:'activity', label:'Активность',  icon:'fa-calendar-check'},
    {key:'organizations', label:'Организации', icon:'fa-building-columns'},
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

            {tab === 'public' && (publicView ? <PublicProfileView user={publicView} isOwner /> : <div className="flex justify-center py-10"><Spinner /></div>)}

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
                                <div key={a.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                  <div className="min-w-0">
                                    <p className="font-semibold text-gray-900">{a.eventTitle}</p>
                                    <p className="text-sm text-gray-500">{new Date(a.createdAt).toLocaleDateString('ru-RU')}</p>
                                    {a.status === 'Withdrawn' && a.withdrawalReason && (
                                        <p className="text-sm text-gray-600 mt-1">
                                          <i className="fas fa-comment-dots mr-1 text-primary" />Ваш комментарий: {a.withdrawalReason}
                                        </p>
                                    )}
                                    {a.adminComment && (
                                        <p className="text-sm text-gray-600 mt-1">
                                          <i className="fas fa-comment mr-1 text-primary" />{a.adminComment}
                                        </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {a.status === 'Pending' && (
                                        <button
                                            onClick={() => setCancelling(a)}
                                            disabled={withdrawingId === a.id}
                                            className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {withdrawingId === a.id
                                              ? <i className="fas fa-spinner fa-spin" />
                                              : 'Отозвать'
                                          }
                                        </button>
                                    )}
                                    {a.status === 'Approved' && (
                                        <button onClick={() => setCancelling(a)} disabled={withdrawingId === a.id}
                                            className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50">
                                          Не смогу прийти
                                        </button>
                                    )}
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${STATUS_COLOR[a.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABEL[a.status] ?? a.status}
                  </span>
                                  </div>
                                </div>
                            ))}
                          </div>
                  }
                </div>
            )}

            {/* ── SETTINGS ──────────────────────────────────── */}
            {tab === 'organizations' && <MyOrganizationsPanel />}

            {tab === 'settings' && (
              <div className="space-y-8">
                {apiErr && <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm">{apiErr}</div>}

                {/* Edit profile */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Личные данные</h2>
                  <form onSubmit={saveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Отчество</label>
                      <input value={middleName} onChange={e => setMiddleName(e.target.value)} className={inp} placeholder="Иванович" maxLength={100} />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Год рождения</label>
                        <input type="number" inputMode="numeric" min={1920} max={new Date().getFullYear()} value={birthYear}
                          onChange={e => setBirthYear(e.target.value)} className={inp} placeholder="2000" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Город проживания</label>
                        <select value={city} onChange={e => setCity(e.target.value)} className={inp}>
                          <option value="">Не указан</option>
                          {cities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                      <input id="profile-phone" type="tel" value={phone} onChange={e => { setPhone(e.target.value); if (phoneErr) setPhoneErr(''); }}
                        onBlur={() => setPhoneErr(phoneError(phone))} className={inp} placeholder={PHONE_PLACEHOLDER} maxLength={32} autoComplete="tel"
                        aria-invalid={phoneErr ? 'true' : undefined} aria-describedby="profile-phone-hint" />
                      <p id="profile-phone-hint" role={phoneErr ? 'alert' : undefined} className={`text-xs mt-1 ${phoneErr ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {phoneErr || `${PHONE_HINT} Телефон и год рождения видят только организаторы и администраторы.`}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Номер личной книжки добровольца</label>
                      <input value={bookNumber} onChange={e => setBookNumber(e.target.value)} className={inp} maxLength={50} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">О себе</label>
                      <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} maxLength={1000} className={inp + ' resize-none'} placeholder="Расскажите немного о себе..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Социальные сети <span className="text-gray-400 font-normal">(по одной ссылке в строке, https, до 5)</span></label>
                      <textarea value={socialText} onChange={e => setSocialText(e.target.value)} rows={3} className={inp + ' resize-none'} placeholder="https://t.me/username" />
                    </div>

                    {user.role !== 'Volunteer' && (
                      <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer">
                        <input type="checkbox" className="mt-1" checked={isClosed} onChange={e => setIsClosed(e.target.checked)} />
                        <span>
                          <span className="block text-sm font-semibold text-gray-700"><i className="fas fa-lock mr-1" />Закрыть профиль</span>
                          <span className="block text-xs text-gray-500 mt-0.5">Посторонние увидят только имя и фото, остальное скрыто. Администраторам профиль виден полностью.</span>
                        </span>
                      </label>
                    )}

                    <fieldset className="border border-gray-200 rounded-xl p-4">
                      <legend className="px-2 text-sm font-semibold text-gray-700">Что видно другим посетителям сайта</legend>
                      <p className="text-xs text-gray-500 mb-3">По умолчанию все данные скрыты. Отметьте только то, что хотите показать в публичном профиле.</p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {VISIBILITY_OPTIONS.map(o => (
                          <label key={o.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={publicFields.includes(o.key)}
                              onChange={() => setPublicFields(prev => prev.includes(o.key) ? prev.filter(k => k !== o.key) : [...prev, o.key])} />
                            {o.label}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <button type="submit" disabled={saving}
                      className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-60 flex items-center gap-2">
                      {saving ? <><Spinner /> Сохранение...</> : <><i className="fas fa-save mr-1" />Сохранить</>}
                    </button>
                  </form>
                </div>

                {/* Avatar */}
                <AvatarPanel />
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

            {tab === 'security' && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Скачать мои данные</h2>
                <p className="text-gray-600 text-sm mb-4">
                  Все сведения о вашем аккаунте: профиль, заявки на мероприятия, обращения и другое.
                </p>
                <DossierExportButtons onExport={usersApi.exportMyData} />
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
      <CancelParticipationDialog isOpen={cancelling !== null} eventTitle={cancelling?.eventTitle ?? ''} approved={cancelling?.status === 'Approved'}
        busy={cancelling !== null && withdrawingId === cancelling.id} onConfirm={handleCancel} onClose={() => setCancelling(null)} />
    </div>
  );
}