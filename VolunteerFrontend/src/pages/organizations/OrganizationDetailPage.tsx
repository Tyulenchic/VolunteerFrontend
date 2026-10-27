import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { organizationsApi } from '../../api/organizations';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Modal } from '../../components/Modal';
import { Spinner } from '../../components/Spinner';
import { CroppedImage } from '../../components/ImageCropper';
import { PostCard } from '../../components/organizations/PostCard';
import { getCategoryColor, getCategoryLabel, type EventResponseDto } from '../../types/event';
import {
  CATEGORY_BADGE, CATEGORY_LABEL, DIRECTION_ICON, DIRECTION_LABEL, LEVEL_ICON, LEVEL_LABEL,
  type OrganizationApplication, type OrganizationDetails, type OrganizationMember, type OrganizationPost,
} from '../../types/organization';

type Tab = 'about' | 'events' | 'posts' | 'members';
const TABS: Array<{ key: Tab; label: string; icon: string }> = [
  { key: 'about', label: 'Об организации', icon: 'fa-circle-info' },
  { key: 'events', label: 'Мероприятия', icon: 'fa-calendar-days' },
  { key: 'posts', label: 'Публикации', icon: 'fa-images' },
  { key: 'members', label: 'Участники', icon: 'fa-people-group' },
];
const PAGE = 12;

const errorText = (err: unknown, fallback: string) =>
  axios.isAxiosError(err) && typeof err.response?.data?.error === 'string' ? err.response.data.error : fallback;

/** Страница организации: описание и контакты, мероприятия, лента публикаций и заявка на вступление. */
export function OrganizationDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const { notify } = useNotification();

  const [org, setOrg] = useState<OrganizationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<'notfound' | 'error' | null>(null);
  const [pending, setPending] = useState<OrganizationApplication | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  // Вкладка «Участники» есть только у членов организации и тех, кто её ведёт; остальным она недоступна даже по ссылке.
  const canSeeMembers = !!org && (!!org.myRole || org.canManage);
  const visibleTabs = TABS.filter(t => t.key !== 'members' || canSeeMembers);
  const tab = (visibleTabs.find(t => t.key === params.get('tab'))?.key ?? 'about') as Tab;
  const setTab = (key: Tab) => setParams(key === 'about' ? {} : { tab: key }, { replace: true });

  const load = useCallback(async () => {
    setFailed(null);
    try {
      const details = await organizationsApi.get(id);
      setOrg(details);
      // Для отзыва заявки нужен её идентификатор — берём из «моих заявок».
      if (details.hasPendingApplication) {
        const mine = await organizationsApi.myApplications().catch(() => []);
        setPending(mine.find(a => a.organizationId === id && a.status === 'Pending') ?? null);
      } else setPending(null);
    } catch (err) {
      setFailed(axios.isAxiosError(err) && err.response?.status === 404 ? 'notfound' : 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { setLoading(true); void load(); }, [load, user?.id]);

  const apply = async () => {
    setBusy(true);
    try {
      await organizationsApi.apply(id, message);
      setApplyOpen(false);
      setMessage('');
      notify('Заявка отправлена. Организатор рассмотрит её, мы пришлём письмо с решением.');
      await load();
    } catch (err) {
      notify(errorText(err, 'Не удалось отправить заявку. Попробуйте позже.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    if (!pending) return;
    setBusy(true);
    try { await organizationsApi.withdraw(pending.id); notify('Заявка отозвана', 'info'); await load(); }
    catch (err) { notify(errorText(err, 'Не удалось отозвать заявку.'), 'error'); }
    finally { setBusy(false); }
  };

  const leave = async () => {
    if (!window.confirm('Выйти из организации? Её название пропадёт из вашего профиля.')) return;
    setBusy(true);
    try { await organizationsApi.leave(id); notify('Вы вышли из организации', 'info'); await load(); }
    catch (err) { notify(errorText(err, 'Не удалось выйти из организации.'), 'error'); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="flex justify-center py-32"><Spinner /></div>;

  if (failed || !org) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center px-4">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center"><i className="fas fa-search text-4xl text-gray-400" /></div>
        <h2 className="text-2xl font-bold text-gray-800">{failed === 'error' ? 'Не удалось загрузить страницу' : 'Организация не найдена'}</h2>
        <p className="text-gray-500 max-w-sm">{failed === 'error' ? 'Проверьте соединение и попробуйте ещё раз.' : 'Возможно, она в архиве или ссылка устарела.'}</p>
        <div className="flex gap-3">
          {failed === 'error' && <button onClick={() => { setLoading(true); void load(); }} className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition">Повторить</button>}
          <Link to="/organizations" className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition no-underline"><i className="fas fa-arrow-left mr-2" />К списку</Link>
        </div>
      </div>
    );
  }

  const title = org.shortName || org.name;

  return (
    <>
      {/* ── BREADCRUMB ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500" aria-label="Хлебные крошки">
            <Link to="/" className="hover:text-primary transition">Главная</Link>
            <i className="fas fa-chevron-right text-xs text-gray-300" />
            <Link to="/organizations" className="hover:text-primary transition">Организации</Link>
            <i className="fas fa-chevron-right text-xs text-gray-300" />
            <span className="text-gray-700 font-medium truncate max-w-[200px]">{title}</span>
          </nav>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50 overflow-hidden">
        {org.coverUrl && (
          <div className="absolute inset-0 opacity-25">
            <CroppedImage src={org.coverUrl} crop={org.coverCrop} aspect={16 / 5} className="!rounded-none w-full h-full [&>img]:!h-full" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white/70 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition mb-6 group">
            <span className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:shadow-md transition"><i className="fas fa-arrow-left text-xs" /></span>
            Назад
          </button>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-gray-100 overflow-hidden">
              {org.logoUrl
                ? <CroppedImage src={org.logoUrl} crop={org.logoCrop} aspect={1} className="w-full !rounded-none" alt={`Логотип: ${org.name}`} />
                : <i className={`${LEVEL_ICON[org.level]} text-5xl text-teal-500`} />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-xs font-semibold text-gray-600 shadow-sm">
                  <i className={`${LEVEL_ICON[org.level]} text-primary`} />{LEVEL_LABEL[org.level]}
                </span>
                {org.city && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-xs font-semibold text-gray-600 shadow-sm">
                    <i className="fas fa-map-marker-alt text-primary" />{org.city}
                  </span>
                )}
                {!org.isActive && <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">В архиве — видна только организаторам</span>}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-gray-900 leading-tight mb-4">{org.name}</h1>
              <div className="flex flex-wrap gap-2 mb-6">
                {org.categories.map(c => (
                  <span key={c} className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${CATEGORY_BADGE[c]}`}>{CATEGORY_LABEL[c]}</span>
                ))}
              </div>

              {/* действия */}
              <div className="flex flex-wrap items-center gap-3">
                {org.myRole === 'Volunteer' && (
                  <>
                    <span className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-100 text-green-800 rounded-xl font-semibold text-sm"><i className="fas fa-check-circle" />Вы волонтёр организации</span>
                    <button onClick={leave} disabled={busy} className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">Выйти</button>
                  </>
                )}
                {org.myRole === 'Organizer' && (
                  <span className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-100 text-blue-800 rounded-xl font-semibold text-sm"><i className="fas fa-user-shield" />Вы организатор</span>
                )}
                {org.canManage && (
                  <Link to={`/organizer/organizations/${org.id}`} className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition no-underline">
                    <i className="fas fa-gear" />Управлять
                  </Link>
                )}
                {org.canApply && (
                  <button onClick={() => setApplyOpen(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition shadow-lg">
                    <i className="fas fa-hand-holding-heart" />Подать заявку в организацию
                  </button>
                )}
                {org.hasPendingApplication && (
                  <>
                    <span className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-100 text-amber-800 rounded-xl font-semibold text-sm"><i className="fas fa-hourglass-half" />Заявка на рассмотрении</span>
                    {pending && <button onClick={withdraw} disabled={busy} className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">Отозвать</button>}
                  </>
                )}
                {!user && (
                  <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition shadow-lg no-underline">
                    <i className="fas fa-right-to-bracket" />Войдите, чтобы подать заявку
                  </Link>
                )}
              </div>
              {user && !org.canApply && !org.myRole && !org.hasPendingApplication && !org.canManage && org.cannotApplyReason && (
                <p className="mt-3 text-sm text-gray-600 max-w-xl"><i className="fas fa-circle-info mr-1.5 text-gray-400" />{org.cannotApplyReason}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── TABS ── */}
      <div className="bg-white border-b border-gray-200 sticky top-[3.75rem] z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div role="tablist" aria-label="Разделы страницы организации" className="flex gap-1 overflow-x-auto no-scrollbar">
            {visibleTabs.map(t => (
              <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
                className={`px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                <i className={`fas ${t.icon} mr-2`} aria-hidden />{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="py-12 sm:py-16 bg-gray-50 min-h-[40vh]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {tab === 'about' && <AboutTab org={org} />}
          {tab === 'events' && <EventsTab orgId={org.id} canManage={org.canManage} />}
          {tab === 'posts' && <PostsTab orgId={org.id} orgName={title} />}
          {tab === 'members' && <MembersTab orgId={org.id} />}
        </div>
      </section>

      <Modal isOpen={applyOpen} onClose={() => setApplyOpen(false)} title={`Заявка в «${title}»`} maxWidth="max-w-lg">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Организатор получит уведомление и рассмотрит заявку. Если вас примут, организация автоматически появится в вашем профиле.
            Одновременно можно состоять не более чем в двух организациях.
          </p>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Несколько слов о себе (необязательно)</span>
            <textarea value={message} onChange={e => setMessage(e.target.value)} maxLength={500} rows={4}
              placeholder="Чем хотите заниматься, есть ли опыт"
              className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary outline-none" />
            <span className="text-xs text-gray-400">{message.length}/500</span>
          </label>
          <div className="flex justify-end gap-2">
            <button onClick={() => setApplyOpen(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition">Отмена</button>
            <button onClick={apply} disabled={busy} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition disabled:opacity-60">
              {busy ? 'Отправка…' : 'Отправить заявку'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ─── Вкладка «Об организации» ─────────────────────────────────────────────────

function AboutTab({ org }: { org: OrganizationDetails }) {
  return (
    <div className="grid lg:grid-cols-3 gap-10">
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
          <h2 className="text-xl font-heading font-bold text-gray-900 mb-4">О нас</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{org.description}</p>
        </div>

        {org.movements.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-heading font-bold text-gray-900 flex items-center gap-3">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center"><i className="fas fa-users text-primary text-sm" /></span>
              Волонтёрские движения
            </h2>
            {org.movements.map(m => (
              <article key={m.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-primary/30 hover:shadow-md transition">
                <div className="bg-gradient-to-r from-primary/5 to-teal-50 px-6 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">{m.name}</h3>
                  {m.directions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {m.directions.map(d => (
                        <span key={d} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600">
                          <i className={`fas ${DIRECTION_ICON[d]} text-primary`} aria-hidden />{DIRECTION_LABEL[d]}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="px-6 py-4 text-sm space-y-1.5">
                  <p className="text-gray-700"><i className="fas fa-user-tie w-5 text-gray-400" aria-hidden />Руководитель: <span className="font-medium">{m.leaderName}</span></p>
                  {m.phone && <p className="text-gray-700"><i className="fas fa-phone w-5 text-gray-400" aria-hidden />{m.phone}</p>}
                  {m.email && <p><i className="fas fa-envelope w-5 text-gray-400" aria-hidden /><a className="text-primary hover:underline" href={`mailto:${m.email}`}>{m.email}</a></p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <aside className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-heading font-bold text-gray-900 mb-4">Контакты</h2>
          <ul className="space-y-3 text-sm">
            {org.city && <li className="flex gap-3 text-gray-700"><i className="fas fa-map-marker-alt w-4 text-primary mt-0.5" aria-hidden />{org.city}</li>}
            {org.contactPhone && <li className="flex gap-3 text-gray-700"><i className="fas fa-phone w-4 text-primary mt-0.5" aria-hidden />{org.contactPhone}</li>}
            {org.contactEmail && <li className="flex gap-3"><i className="fas fa-envelope w-4 text-primary mt-0.5" aria-hidden /><a href={`mailto:${org.contactEmail}`} className="text-primary hover:underline break-all">{org.contactEmail}</a></li>}
            {org.website && <li className="flex gap-3"><i className="fas fa-globe w-4 text-primary mt-0.5" aria-hidden /><a href={org.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{org.website.replace(/^https?:\/\//, '')}</a></li>}
            {!org.city && !org.contactPhone && !org.contactEmail && !org.website && <li className="text-gray-500">Контакты не указаны.</li>}
          </ul>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-sm text-gray-600">
          <p>На странице — мероприятия организации и её публикации. Подайте заявку, чтобы стать волонтёром: организатор рассмотрит её, а организация появится в вашем профиле.</p>
        </div>
      </aside>
    </div>
  );
}

// ─── Вкладка «Мероприятия» ────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = { Draft: 'Черновик', Cancelled: 'Отменено', Completed: 'Завершено' };

/** Участники организации: видят её члены. Телефон и почта приходят с сервера только организаторам и администратору. */
function MembersTab({ orgId }: { orgId: string }) {
  const [items, setItems] = useState<OrganizationMember[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const request = useRef(0);

  const load = useCallback(async (skip: number) => {
    const id = ++request.current;
    setLoading(true); setError(false);
    try {
      const page = await organizationsApi.members(orgId, undefined, skip, 24);
      if (id !== request.current) return;
      setItems(prev => (skip === 0 ? page.items : [...prev, ...page.items]));
      setTotal(page.totalCount);
    } catch { if (id === request.current) setError(true); }
    finally { if (id === request.current) setLoading(false); }
  }, [orgId]);

  useEffect(() => { void load(0); }, [load]);

  if (!loading && error) return <p className="text-center text-gray-600">Не удалось загрузить участников. <button className="text-primary underline" onClick={() => void load(0)}>Повторить</button></p>;
  if (loading && items.length === 0) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div>
      <p className="mb-4 text-sm text-gray-500">Участников: {total}</p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(m => (
          <li key={m.userId} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <Link to={`/users/${m.userId}`} className="flex items-center gap-3 no-underline">
              {m.avatarThumbnailUrl
                ? <img src={m.avatarThumbnailUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
                : <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">{m.fullName.charAt(0).toUpperCase()}</span>}
              <span className="min-w-0">
                <span className="block truncate font-semibold text-gray-900">{m.fullName}</span>
                <span className="block text-xs text-gray-500">{m.role === 'Organizer' ? 'Организатор' : 'Волонтёр'}{m.city && <> · {m.city}</>}</span>
              </span>
            </Link>
            {(m.email || m.phoneNumber) && (
              <p className="mt-2 break-words text-xs text-gray-500">
                {m.email && <a href={`mailto:${m.email}`} className="hover:underline">{m.email}</a>}
                {m.email && m.phoneNumber && ' · '}{m.phoneNumber}
              </p>
            )}
          </li>
        ))}
      </ul>
      {items.length < total && (
        <div className="mt-5 text-center">
          <button type="button" disabled={loading} onClick={() => void load(items.length)}
            className="rounded-xl border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
            {loading ? 'Загрузка…' : 'Показать ещё'}
          </button>
        </div>
      )}
    </div>
  );
}

function EventsTab({ orgId, canManage }: { orgId: string; canManage: boolean }) {
  const [items, setItems] = useState<EventResponseDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const request = useRef(0);

  const load = useCallback(async (skip: number) => {
    const id = ++request.current;
    setLoading(true); setError(false);
    try {
      const page = await organizationsApi.events(orgId, skip, PAGE);
      if (id !== request.current) return;
      setItems(prev => (skip === 0 ? page.items : [...prev, ...page.items]));
      setTotal(page.totalCount);
    } catch { if (id === request.current) setError(true); }
    finally { if (id === request.current) setLoading(false); }
  }, [orgId]);

  useEffect(() => { void load(0); }, [load]);

  if (!loading && error) return <p className="text-center text-gray-600">Не удалось загрузить мероприятия. <button className="text-primary underline" onClick={() => void load(0)}>Повторить</button></p>;
  if (!loading && items.length === 0) {
    return (
      <div className="text-center py-16">
        <i className="fas fa-calendar-xmark text-4xl text-gray-300 mb-4" aria-hidden />
        <p className="text-gray-600">{canManage ? 'У организации пока нет мероприятий. Создайте первое в кабинете организатора.' : 'Мероприятий пока нет — загляните позже.'}</p>
        {canManage && <Link to="/organizer/events" className="inline-block mt-4 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold no-underline">Создать мероприятие</Link>}
      </div>
    );
  }

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(e => (
          <Link key={e.id} to={`/events/${e.id}`} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/30 transition no-underline flex flex-col">
            <div className="relative">
              <CroppedImage src={e.imageThumbnailUrl ?? e.imageUrl} crop={e.imageCrop} aspect={16 / 10} className="!rounded-none w-full" alt={e.title} />
              <span className={`absolute left-3 top-3 px-2.5 py-1 rounded-full text-xs font-bold text-white ${getCategoryColor(e.category)}`}>{getCategoryLabel(e.category)}</span>
              {STATUS_LABEL[e.status] && <span className="absolute right-3 top-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-gray-700">{STATUS_LABEL[e.status]}</span>}
            </div>
            <div className="p-5 flex flex-col flex-grow">
              <p className="text-xs text-primary font-semibold mb-1">{new Date(e.startsAt).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
              <h3 className="font-bold text-gray-900 group-hover:text-primary transition mb-2">{e.title}</h3>
              <p className="text-sm text-gray-500 mt-auto"><i className="fas fa-map-marker-alt mr-1.5" aria-hidden />{e.location}</p>
            </div>
          </Link>
        ))}
      </div>
      {loading && <div className="flex justify-center py-8"><Spinner /></div>}
      {!loading && items.length < total && (
        <div className="text-center mt-8">
          <button onClick={() => void load(items.length)} className="px-8 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition">Показать ещё</button>
        </div>
      )}
    </>
  );
}

// ─── Вкладка «Публикации» ─────────────────────────────────────────────────────

function PostsTab({ orgId, orgName }: { orgId: string; orgName: string }) {
  const [items, setItems] = useState<OrganizationPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const request = useRef(0);

  const load = useCallback(async (skip: number) => {
    const id = ++request.current;
    setLoading(true); setError(false);
    try {
      const page = await organizationsApi.posts(orgId, skip, 10);
      if (id !== request.current) return;
      setItems(prev => (skip === 0 ? page.items : [...prev, ...page.items]));
      setTotal(page.totalCount);
    } catch { if (id === request.current) setError(true); }
    finally { if (id === request.current) setLoading(false); }
  }, [orgId]);

  useEffect(() => { void load(0); }, [load]);

  if (!loading && error) return <p className="text-center text-gray-600">Не удалось загрузить публикации. <button className="text-primary underline" onClick={() => void load(0)}>Повторить</button></p>;
  if (!loading && items.length === 0) {
    return (
      <div className="text-center py-16">
        <i className="fas fa-images text-4xl text-gray-300 mb-4" aria-hidden />
        <p className="text-gray-600">Публикаций пока нет.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {items.map(p => <PostCard key={p.id} post={p} orgName={orgName} />)}
      {loading && <div className="flex justify-center py-8"><Spinner /></div>}
      {!loading && items.length < total && (
        <div className="text-center">
          <button onClick={() => void load(items.length)} className="px-8 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition">Показать ещё</button>
        </div>
      )}
    </div>
  );
}
