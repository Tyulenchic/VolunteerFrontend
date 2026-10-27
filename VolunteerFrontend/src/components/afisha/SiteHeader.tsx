import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { UserNotificationBell } from '../notifications/UserNotificationBell';
import { VolIcon, VolLogo } from './VolIcon';

const NAV = [
  { to: '/', label: 'Главная' },
  { to: '/about', label: 'О нас' },
  { to: '/news', label: 'Новости' },
  { to: '/events', label: 'Мероприятия' },
] as const;

const MORE = [
  { to: '/organizers', label: 'Организаторы' },
  { to: '/volunteers', label: 'Волонтёры' },
  { to: '/organizations', label: 'Организации' },
  { to: '/organizations-feed', label: 'Лента организаций' },
  { to: '/videos', label: 'Видео' },
  { to: '/faq', label: 'FAQ' },
] as const;

const linkCls = (active: boolean) =>
  `px-3 py-2 text-[14px] ${active ? 'font-semibold text-vol-accent' : 'font-medium text-vol-muted hover:text-vol-fg'}`;

export function SiteHeader() {
  const { user, logout, isAdmin, isOrganizer } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(false);
  const [more, setMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMenu(false); setMore(false); }, [pathname]);

  useEffect(() => {
    if (!more) return;
    const onDown = (ev: MouseEvent) => { if (moreRef.current && !moreRef.current.contains(ev.target as Node)) setMore(false); };
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') setMore(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [more]);

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user?.email?.split('@')[0] ?? '';
  const initials = (displayName || '?').split(/\s+/).map(w => w.charAt(0)).join('').slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await logout();
    notify('Вы вышли из системы', 'info');
    navigate('/');
  };

  // Same behaviour as the site-wide header: contacts live on the "О нас" page.
  const goContacts = () => {
    setMenu(false);
    const scroll = () => document.getElementById('contacts')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (pathname !== '/about') { navigate('/about#contacts'); setTimeout(scroll, 150); } else scroll();
  };

  const mobileItem = 'rounded-lg px-3 py-2.5 text-[14px] font-medium text-vol-muted hover:bg-vol-bg text-left';

  return (
    <header className="vol-glass vol-head sticky z-50 border-b border-vol-line" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
      <div className="mx-auto flex h-[3.75rem] max-w-[76rem] items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2.5 no-underline text-vol-fg">
          <VolLogo size={38} />
          <span className="font-display truncate text-[15px] font-bold tracking-tight max-[359px]:whitespace-normal max-[359px]:text-[13.5px] max-[359px]:leading-[1.15]">Волонтёры Приднестровья</span>
        </Link>

        <nav className="ml-6 hidden items-center lg:flex" aria-label="Основная навигация">
          {NAV.map(it => {
            const active = it.to === '/' ? pathname === '/' : pathname.startsWith(it.to);
            return (
              <Link key={it.to} to={it.to} aria-current={active ? 'page' : undefined} className={`${linkCls(active)} no-underline`}>
                {it.label}
              </Link>
            );
          })}
          <button type="button" onClick={goContacts} className={linkCls(false)}>Контакты</button>
          <div className="relative" ref={moreRef}>
            <button type="button" onClick={() => setMore(v => !v)} aria-expanded={more} aria-haspopup="true"
              className="inline-flex items-center gap-1 px-3 py-2 text-[14px] font-medium text-vol-muted hover:text-vol-fg">
              Ещё <VolIcon n="chevron" size={14} />
            </button>
            {more && (
              <div className="absolute left-0 top-full mt-2 w-44 rounded-xl border border-vol-line bg-vol-surface p-1 shadow-lg">
                {MORE.map(t => (
                  <Link key={t.to} to={t.to} className="block rounded-lg px-3 py-2 text-[13.5px] text-vol-muted no-underline hover:bg-vol-accent-soft hover:text-vol-fg">{t.label}</Link>
                ))}
              </div>
            )}
          </div>
          {isAdmin && <Link to="/admin/users" className={`${linkCls(false)} no-underline`}>Управление</Link>}
          {isOrganizer && <Link to="/organizer" className={`${linkCls(false)} no-underline`}>Кабинет организатора</Link>}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <UserNotificationBell />
              <Link to="/profile" className="vol-tap-2 relative flex items-center gap-2 no-underline text-vol-fg" aria-label="Профиль">
                {user.avatarUrl
                  ? <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                  : <span className="grid h-8 w-8 place-items-center rounded-full bg-vol-accent-soft text-[11px] font-semibold text-vol-accent">{initials}</span>}
                <span className="hidden max-w-[10rem] truncate text-[13.5px] font-medium sm:inline">{displayName}</span>
              </Link>
              <button type="button" onClick={handleLogout}
                className="vol-tap-2 relative hidden h-8 items-center rounded-lg border-[1.5px] border-vol-rule px-3.5 text-[13px] font-medium hover:border-vol-accent hover:text-vol-accent sm:inline-flex">Выйти</button>
            </>
          ) : (
            <>
              <Link to="/login"
                className="vol-tap-2 relative hidden h-8 items-center rounded-lg border-[1.5px] border-vol-rule px-3.5 text-[13px] font-medium text-vol-fg no-underline hover:border-vol-accent hover:text-vol-accent sm:inline-flex">Вход</Link>
              <Link to="/register"
                className="vol-tap-2 relative hidden h-8 items-center rounded-lg bg-vol-accent px-3.5 text-[13px] font-semibold text-vol-accent-fg no-underline hover:opacity-90 sm:inline-flex">Регистрация</Link>
            </>
          )}
          <button type="button" onClick={() => setMenu(v => !v)} aria-label={menu ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={menu}
            className="vol-tap relative grid h-8 w-8 place-items-center rounded-lg border-[1.5px] border-vol-rule hover:border-vol-accent lg:hidden">
            <VolIcon n={menu ? 'close' : 'menu'} size={16} />
          </button>
        </div>
      </div>

      {menu && (
        <div className="border-t border-vol-line bg-vol-surface lg:hidden">
          <nav className="mx-auto flex max-w-[76rem] flex-col gap-0.5 px-4 py-3 sm:px-6" aria-label="Мобильная навигация">
            {[...NAV, ...MORE].map(it => {
              const active = it.to === '/' ? pathname === '/' : pathname.startsWith(it.to);
              return (
                <Link key={it.to} to={it.to} aria-current={active ? 'page' : undefined}
                  className={`rounded-lg px-3 py-2.5 text-[14px] font-medium no-underline ${active ? 'bg-vol-accent-soft text-vol-accent' : 'text-vol-muted hover:bg-vol-bg'}`}>{it.label}</Link>
              );
            })}
            <button type="button" onClick={goContacts} className={mobileItem}>Контакты</button>
            {isAdmin && <Link to="/admin/users" className={`${mobileItem} no-underline`}>Управление</Link>}
            {isOrganizer && <Link to="/organizer" className={`${mobileItem} no-underline`}>Кабинет организатора</Link>}
            {user ? (
              <button type="button" onClick={handleLogout} className="mt-2 h-9 rounded-lg border-[1.5px] border-vol-rule text-[13.5px] font-medium sm:hidden">Выйти</button>
            ) : (
              <div className="mt-2 flex gap-2 sm:hidden">
                <Link to="/login" className="grid h-9 flex-1 place-items-center rounded-lg border-[1.5px] border-vol-rule text-[13.5px] font-medium text-vol-fg no-underline">Вход</Link>
                <Link to="/register" className="grid h-9 flex-1 place-items-center rounded-lg bg-vol-accent text-[13.5px] font-semibold text-vol-accent-fg no-underline">Регистрация</Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
