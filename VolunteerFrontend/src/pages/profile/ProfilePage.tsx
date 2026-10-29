import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useApiError } from '../../hooks/useApiError';
import { usersApi } from '../../api/users';
import { eventsApi } from '../../api/events';
import { publicUsersApi } from '../../api/publicUsers';
import { Spinner } from '../../components/Spinner';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useAuthBlobUrl } from '../../components/SecureImage';
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
  Pending:'bg-amber-50 text-amber-800', Approved:'bg-vol-green-soft text-vol-green',
  Rejected:'bg-red-50 text-vol-warn', AttendanceConfirmed:'bg-vol-accent-soft text-primary-dark', Withdrawn:'bg-vol-bg text-vol-muted',
};
/** Бейдж статуса и роли: одна форма на всю страницу, обычный регистр. */
const BADGE = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-meta font-semibold whitespace-nowrap';

type Tab = 'info' | 'public' | 'activity' | 'organizations' | 'settings' | 'security' | 'danger';

export function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const { error: apiErr, capture, setError } = useApiError();
  const [tab, setTab] = useState<Tab>('info');
  const [publicView, setPublicView] = useState<PublicUserDto | null>(null);
  // Пока аватар на проверке, публичного адреса нет — владельцу показываем его по адресу с токеном.
  const ownAvatar = useAuthBlobUrl(user && !user.avatarUrl ? user.avatarPreviewUrl : null, user?.updatedAt);

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

  // Значения формы = сохранённый профиль. Тот же сброс — у кнопки «Отменить изменения».
  const resetForm = () => {
    if (!user) return;
    setFirstName(user.firstName ?? '');
    setLastName(user.lastName  ?? '');
    setBio(user.bio ?? '');
    setMiddleName(user.middleName ?? '');
    setBirthYear(user.birthYear ? String(user.birthYear) : '');
    setCity(user.city ?? '');
    setBookNumber(user.bookNumber ?? '');
    setPhone(user.phoneNumber ?? '');
    setPhoneErr('');
    setSocialText((user.socialLinks ?? []).join('\n'));
    setPublicFields(user.publicFields ?? []);
    setIsClosed(user.isProfileClosed ?? false);
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect -- форма синхронизируется с профилем после загрузки/сохранения
  useEffect(resetForm, [user]);

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
    if (tab === 'public' && user) publicUsersApi.getById(user.id).then(setPublicView).catch(() => notify('Не удалось загрузить публичный вид', 'error'));
  }, [tab, user?.id, user?.publicFields]);

  if (!user) return null;

  const sameSet = (a: ProfileField[], b: ProfileField[]) => a.length === b.length && a.every(x => b.includes(x));
  const dirty =
    firstName !== (user.firstName ?? '') || lastName !== (user.lastName ?? '') || middleName !== (user.middleName ?? '') ||
    bio !== (user.bio ?? '') || birthYear !== (user.birthYear ? String(user.birthYear) : '') || city !== (user.city ?? '') ||
    bookNumber !== (user.bookNumber ?? '') || phone !== (user.phoneNumber ?? '') ||
    socialText !== (user.socialLinks ?? []).join('\n') || !sameSet(publicFields, user.publicFields ?? []) ||
    isClosed !== (user.isProfileClosed ?? false);

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

  const inp = 'w-full h-11 px-3.5 text-body-sm bg-vol-surface border border-vol-ctrl rounded-control focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition';
  const area = 'w-full px-3.5 py-2.5 text-body-sm bg-vol-surface border border-vol-ctrl rounded-control focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition resize-none';
  const lbl = 'block text-ctrl font-medium text-vol-fg mb-1.5';

  return (
    <div>
      <div className="wrap max-w-5xl py-6 sm:py-8">

        {/* Profile header */}
        <Card tone="public" padding="lg" className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Владелец видит своё фото и до проверки модератором (адрес с токеном), посетители — только одобренное. */}
            <Avatar name={displayName} thumb={user.avatarThumbnailUrl} src={user.avatarUrl ?? ownAvatar} crop={user.avatarCrop}
              size="lg" square className="border-2 border-vol-line" />
            <div className="flex-grow">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="vol-compact">{displayName}</h1>
                <span className={`${BADGE} ${user.role === 'Volunteer' ? 'bg-vol-bg text-vol-muted' : 'bg-vol-accent-soft text-primary-dark'}`}>
                  {user.role === 'Admin' ? 'Администратор' : user.role === 'Organizer' ? 'Организатор' : 'Волонтёр'}
                </span>
                {!user.isActive && (
                  <span className={`${BADGE} bg-red-50 text-vol-warn`}>Заблокирован</span>
                )}
              </div>
              <p className="vol-meta">{user.email}</p>
              {user.bio && <p className="vol-text-sm mt-2 max-w-[68ch]">{user.bio}</p>}
            </div>
            {!user.emailConfirmed && (
              <div className="flex-shrink-0 rounded-control border border-amber-200 bg-amber-50 px-3 py-2 text-meta font-medium text-amber-800">
                <i className="fas fa-exclamation-circle mr-1" />Email не подтверждён
              </div>
            )}
          </div>
        </Card>

        {/* Tabs */}
        <Card tone="public" className="overflow-hidden">
          {/* На телефоне вкладки прокручиваются вбок; затухание у правого края показывает, что дальше есть ещё. */}
          <div className="relative border-b border-vol-line after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-10 after:bg-gradient-to-l after:from-white after:to-transparent lg:after:hidden">
            <div role="tablist" aria-label="Разделы профиля" className="flex overflow-x-auto no-scrollbar scroll-px-4 pr-8 lg:pr-0">
              {tabs.map(t => (
                <button key={t.key} type="button" role="tab" id={`tab-${t.key}`} aria-selected={tab === t.key} aria-controls="profile-panel"
                  onClick={e => { setTab(t.key); e.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }); }}
                  className={`press-flat flex shrink-0 items-center gap-2 border-b-2 px-4 py-3.5 text-ctrl font-medium whitespace-nowrap sm:px-5 sm:py-4 ${
                    tab === t.key ? 'border-primary text-vol-accent'
                    : t.key === 'danger' ? 'border-transparent text-vol-warn hover:bg-red-50'
                    : 'border-transparent text-vol-muted hover:bg-vol-bg hover:text-vol-fg'
                  }`}>
                  <i className={`fas ${t.icon}`} aria-hidden />{t.label}
                </button>
              ))}
            </div>
          </div>

          <div id="profile-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="p-4 sm:p-6">

            {/* ── INFO ──────────────────────────────────────── */}
            {tab === 'info' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                  {[
                    { icon:'fa-calendar-alt', label:'Участник с',   val: new Date(user.createdAt).toLocaleDateString('ru-RU') },
                    { icon:'fa-user-tag',     label:'Роль',         val: user.role === 'Admin' ? 'Администратор' : user.role === 'Organizer' ? 'Организатор' : 'Волонтёр' },
                    { icon:'fa-envelope',     label:'Email',        val: user.emailConfirmed ? 'Подтверждён' : 'Не подтверждён' },
                    { icon:'fa-shield-alt',   label:'Статус',       val: user.isActive ? 'Активен' : 'Заблокирован' },
                  ].map(s => (
                    <div key={s.label} className="rounded-card border border-vol-line bg-vol-bg p-3 sm:p-4">
                      <div className="mb-1 flex items-center gap-2 text-meta text-vol-faint">
                        <i className={`fas ${s.icon} text-primary`} aria-hidden />{s.label}
                      </div>
                      <p className="text-ctrl font-semibold text-vol-fg">{s.val}</p>
                    </div>
                  ))}
                </div>
                {user.updatedAt && (
                  <p className="vol-meta">
                    Последнее обновление: {new Date(user.updatedAt).toLocaleString('ru-RU')}
                  </p>
                )}
              </div>
            )}

            {tab === 'public' && (publicView ? <PublicProfileView user={publicView} isOwner /> : <div className="flex justify-center py-10"><Spinner /></div>)}

            {/* ── ACTIVITY ──────────────────────────────────── */}
            {tab === 'activity' && (
                <div>
                  <h2 className="vol-h3 mb-4">Мои заявки на мероприятия</h2>
                  {actLoading
                      ? <div className="flex justify-center py-10"><Spinner /></div>
                      : activities.length === 0
                          ? <div className="py-10 text-center">
                            <i className="fas fa-calendar-times mb-3 block text-4xl text-vol-rule" aria-hidden />
                            <p className="vol-text-sm mb-5">Вы ещё не подавали заявок на мероприятия</p>
                            <Button to="/events" size="lg">Найти мероприятие</Button>
                          </div>
                          : <div className="space-y-3">
                            {activities.map(a => (
                                <div key={a.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-card border border-vol-line bg-vol-bg p-3 sm:p-4">
                                  <div className="min-w-0">
                                    <p className="text-body-sm font-semibold text-vol-fg">{a.eventTitle}</p>
                                    <p className="vol-meta">{new Date(a.createdAt).toLocaleDateString('ru-RU')}</p>
                                    {a.status === 'Withdrawn' && a.withdrawalReason && (
                                        <p className="vol-text-sm mt-1">
                                          <i className="fas fa-comment-dots mr-1 text-primary" />Ваш комментарий: {a.withdrawalReason}
                                        </p>
                                    )}
                                    {a.adminComment && (
                                        <p className="vol-text-sm mt-1">
                                          <i className="fas fa-comment mr-1 text-primary" />{a.adminComment}
                                        </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {a.status === 'Pending' && (
                                        <button
                                            onClick={() => setCancelling(a)}
                                            disabled={withdrawingId === a.id}
                                            className="press-flat h-8 rounded-control border border-red-200 bg-vol-surface px-3 text-meta font-semibold text-vol-warn hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                          {withdrawingId === a.id
                                              ? <i className="fas fa-spinner fa-spin" />
                                              : 'Отозвать'
                                          }
                                        </button>
                                    )}
                                    {a.status === 'Approved' && (
                                        <button onClick={() => setCancelling(a)} disabled={withdrawingId === a.id}
                                            className="press-flat h-8 rounded-control border border-red-200 bg-vol-surface px-3 text-meta font-semibold text-vol-warn hover:bg-red-50 disabled:opacity-50">
                                          Не смогу прийти
                                        </button>
                                    )}
                                    <span className={`${BADGE} ${STATUS_COLOR[a.status] ?? 'bg-vol-bg text-vol-muted'}`}>
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
                {apiErr && <div role="alert" className="rounded-control border border-red-200 bg-red-50 p-3 text-ctrl text-vol-warn">{apiErr}</div>}

                {/* Edit profile */}
                <div>
                  <h2 className="vol-h3 mb-4">Личные данные</h2>
                  <form onSubmit={saveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="pf-first" className={lbl}>Имя</label>
                        <input id="pf-first" value={firstName} onChange={e => setFirstName(e.target.value)} className={inp} placeholder="Иван" />
                      </div>
                      <div>
                        <label htmlFor="pf-last" className={lbl}>Фамилия</label>
                        <input id="pf-last" value={lastName} onChange={e => setLastName(e.target.value)} className={inp} placeholder="Иванов" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="pf-middle" className={lbl}>Отчество</label>
                      <input id="pf-middle" value={middleName} onChange={e => setMiddleName(e.target.value)} className={inp} placeholder="Иванович" maxLength={100} />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="pf-birth" className={lbl}>Год рождения</label>
                        <input id="pf-birth" type="number" inputMode="numeric" min={1920} max={new Date().getFullYear()} value={birthYear}
                          onChange={e => setBirthYear(e.target.value)} className={inp} placeholder="2000" />
                      </div>
                      <div>
                        <label htmlFor="pf-city" className={lbl}>Город проживания</label>
                        <select id="pf-city" value={city} onChange={e => setCity(e.target.value)} className={inp}>
                          <option value="">Не указан</option>
                          {cities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="profile-phone" className={lbl}>Телефон</label>
                      <input id="profile-phone" type="tel" value={phone} onChange={e => { setPhone(e.target.value); if (phoneErr) setPhoneErr(''); }}
                        onBlur={() => setPhoneErr(phoneError(phone))} className={inp} placeholder={PHONE_PLACEHOLDER} maxLength={32} autoComplete="tel"
                        aria-invalid={phoneErr ? 'true' : undefined} aria-describedby="profile-phone-hint" />
                      <p id="profile-phone-hint" role={phoneErr ? 'alert' : undefined} className={`mt-1 text-meta ${phoneErr ? 'font-medium text-vol-warn' : 'text-vol-faint'}`}>
                        {phoneErr || `${PHONE_HINT} Телефон и год рождения видят только организаторы и администраторы.`}
                      </p>
                    </div>
                    <div>
                      <label htmlFor="pf-book" className={lbl}>Номер личной книжки добровольца</label>
                      <input id="pf-book" value={bookNumber} onChange={e => setBookNumber(e.target.value)} className={inp} maxLength={50} />
                    </div>
                    <div>
                      <label htmlFor="pf-bio" className={lbl}>О себе</label>
                      <textarea id="pf-bio" value={bio} onChange={e => setBio(e.target.value)} rows={3} maxLength={1000} className={area} placeholder="Расскажите немного о себе..." />
                    </div>
                    <div>
                      <label htmlFor="pf-social" className={lbl}>Социальные сети <span className="font-normal text-vol-faint">(по одной ссылке в строке, https, до 5)</span></label>
                      <textarea id="pf-social" value={socialText} onChange={e => setSocialText(e.target.value)} rows={3} className={area} placeholder="https://t.me/username" />
                    </div>

                    <section aria-labelledby="pf-visibility" className="space-y-4 rounded-panel border border-primary/20 bg-vol-accent-soft p-4 sm:p-5">
                      <div>
                        <h3 id="pf-visibility" className="vol-h3 flex items-center gap-2"><i className="fas fa-eye text-primary text-base" aria-hidden />Видимость в публичном профиле</h3>
                        <p className="vol-text-sm mt-1">Вы всегда видите все свои данные. Посетители сайта — только отмеченное ниже; проверить можно во вкладке «Как видят другие».</p>
                      </div>
                    {user.role !== 'Volunteer' && (
                      <label className="flex cursor-pointer items-start gap-3 rounded-card border border-vol-line bg-vol-surface p-4">
                        <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={isClosed} onChange={e => setIsClosed(e.target.checked)} />
                        <span>
                          <span className="block text-ctrl font-semibold text-vol-fg"><i className="fas fa-lock mr-1" aria-hidden />Закрыть профиль</span>
                          <span className="mt-0.5 block text-meta text-vol-muted">Посторонние увидят только имя и фото — и то лишь если они отмечены ниже. Администраторам профиль виден полностью.</span>
                        </span>
                      </label>
                    )}

                    <fieldset className="rounded-card border border-vol-line bg-vol-surface p-4">
                      <legend className="px-2 text-ctrl font-semibold text-vol-fg">Что видно другим посетителям сайта</legend>
                      <p className="mb-3 text-meta text-vol-muted">Отмеченное видят все посетители сайта. Снимите отметку, чтобы скрыть поле из публичного профиля. Год рождения и телефон публично не показываются никогда.</p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {VISIBILITY_OPTIONS.map(o => (
                          <label key={o.key} className="flex min-h-9 cursor-pointer items-center gap-2.5 text-ctrl text-vol-fg">
                            <input type="checkbox" className="h-4 w-4 accent-primary" checked={publicFields.includes(o.key)}
                              onChange={() => setPublicFields(prev => prev.includes(o.key) ? prev.filter(k => k !== o.key) : [...prev, o.key])} />
                            {o.label}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    </section>
                    <div className="flex flex-wrap items-center gap-3 border-t border-vol-line pt-4">
                      <Button type="submit" size="lg" loading={saving} disabled={!dirty} className="max-sm:flex-1">
                        {saving ? 'Сохранение…' : <><i className="fas fa-save" aria-hidden />Сохранить</>}
                      </Button>
                      <Button type="button" variant="secondary" size="lg" onClick={resetForm} disabled={saving || !dirty} className="max-sm:flex-1">
                        Отменить изменения
                      </Button>
                      <p className="vol-meta" role="status" aria-live="polite">
                        {saving ? '' : dirty ? 'Есть несохранённые изменения' : 'Все изменения сохранены'}
                      </p>
                    </div>
                  </form>
                </div>

                {/* Avatar */}
                <AvatarPanel />
              </div>
            )}

            {/* ── SECURITY ──────────────────────────────────── */}
            {tab === 'security' && (
              <div>
                <h2 className="vol-h3 mb-4">Смена пароля</h2>
                {(apiErr || pwErr) && (
                  <div role="alert" className="mb-4 rounded-control border border-red-200 bg-red-50 p-3 text-ctrl text-vol-warn">{apiErr || pwErr}</div>
                )}
                <form onSubmit={changePassword} className="space-y-4 max-w-md">
                  <div>
                    <label htmlFor="pw-current" className={lbl}>Текущий пароль</label>
                    <input id="pw-current" type="password" value={curPw} onChange={e => setCurPw(e.target.value)} required className={inp} placeholder="••••••••" autoComplete="current-password" />
                  </div>
                  <div>
                    <label htmlFor="pw-new" className={lbl}>Новый пароль <span className="font-normal text-vol-faint">(мин. 8)</span></label>
                    <input id="pw-new" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required className={inp} placeholder="••••••••" autoComplete="new-password" />
                  </div>
                  <div>
                    <label htmlFor="pw-confirm" className={lbl}>Повторите новый пароль</label>
                    <input id="pw-confirm" type="password" value={confPw} onChange={e => setConfPw(e.target.value)} required className={inp} placeholder="••••••••" autoComplete="new-password" />
                  </div>
                  <Button type="submit" size="lg" loading={pwLoading}>
                    {pwLoading ? 'Сохранение…' : <><i className="fas fa-key" aria-hidden />Изменить пароль</>}
                  </Button>
                </form>
              </div>
            )}

            {tab === 'security' && (
              <div className="mt-8 border-t border-vol-line pt-6">
                <h2 className="vol-h3 mb-2">Скачать мои данные</h2>
                <p className="vol-text-sm mb-4">
                  Все сведения о вашем аккаунте: профиль, заявки на мероприятия, обращения и другое.
                </p>
                <DossierExportButtons onExport={usersApi.exportMyData} />
              </div>
            )}

            {/* ── DANGER ────────────────────────────────────── */}
            {tab === 'danger' && (
              <div className="space-y-6">
                {apiErr && <div role="alert" className="rounded-control border border-red-200 bg-red-50 p-3 text-ctrl text-vol-warn">{apiErr}</div>}
                <div className="rounded-panel border border-red-200 bg-red-50/40 p-4 sm:p-6">
                  <h2 className="vol-h3 mb-2 flex items-center gap-2"><i className="fas fa-trash-alt text-vol-warn" aria-hidden />Удаление аккаунта</h2>
                  <p className="vol-text-sm mb-4">
                    Это действие необратимо. Все ваши данные будут анонимизированы (GDPR). Для подтверждения введите слово{' '}
                    <strong className="text-vol-warn">{CONFIRM_WORD}</strong>.
                  </p>
                  <div className="flex max-w-sm items-center gap-3">
                    <input value={deleteInput} onChange={e => setDeleteInput(e.target.value)} placeholder={CONFIRM_WORD} aria-label={`Введите ${CONFIRM_WORD} для подтверждения`}
                      className="h-11 min-w-0 flex-1 rounded-control border-[1.5px] border-red-300 bg-vol-surface px-3.5 text-body-sm outline-none transition focus:ring-2 focus:ring-red-300" />
                    <Button variant="danger" size="lg" onClick={deleteAccount} loading={deleting} disabled={deleteInput !== CONFIRM_WORD} className="shrink-0">
                      {!deleting && <i className="fas fa-trash-alt" aria-hidden />}Удалить
                    </Button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </Card>
      </div>
      <CancelParticipationDialog isOpen={cancelling !== null} eventTitle={cancelling?.eventTitle ?? ''} approved={cancelling?.status === 'Approved'}
        busy={cancelling !== null && withdrawingId === cancelling.id} onConfirm={handleCancel} onClose={() => setCancelling(null)} />
    </div>
  );
}