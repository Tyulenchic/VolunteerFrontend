import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { UserNotificationBell } from '../notifications/UserNotificationBell';
import { VolIcon, VolLogo } from './VolIcon';
import { Avatar } from '../ui/Avatar';

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

const isActive = (to: string, pathname: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

const linkCls = (active: boolean) =>
  `press-flat whitespace-nowrap rounded-control px-3 py-2 text-ctrl ${active ? 'font-semibold text-vol-accent' : 'font-medium text-vol-muted hover:bg-vol-accent-soft hover:text-vol-fg'}`;

/** Small header control (Вход / Регистрация / Выйти): 36px, the tap area is widened to 44px by .vol-tap-2. */
const headBtn = 'press-flat vol-tap-2 relative hidden h-9 items-center rounded-control px-3.5 text-meta font-medium no-underline sm:inline-flex';

export function SiteHeader() {
  const { user, logout, isAdmin, isOrganizer } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(false);
  const [closing, setClosing] = useState(false); // меню доигрывает анимацию закрытия, потом снимается
  const [more, setMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMenu(false); setClosing(false); setMore(false); }, [pathname]);

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

  const handleLogout = async () => {
    setMenu(false);
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

  const closeTimer = useRef<number | undefined>(undefined);
  const closeMenu = useCallback(() => {
    setClosing(true);
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => { setMenu(false); setClosing(false); burgerRef.current?.focus(); }, 200);
  }, []);
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  return (
    <header className="vol-glass vol-head sticky z-50 border-b border-vol-line" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
      <div className="wrap flex min-h-[3.75rem] items-center gap-3 lg:gap-4">
        <Link to="/" className="press-flat flex min-w-0 items-center gap-2.5 no-underline text-vol-fg">
          <VolLogo size={38} />
          <span className="font-display truncate text-body-sm font-bold tracking-tight max-[359px]:whitespace-normal max-[359px]:text-meta max-[359px]:leading-[1.15] lg:max-xl:sr-only">Волонтёры Приднестровья</span>
        </Link>

        <nav className="ml-2 hidden items-center lg:flex xl:ml-6" aria-label="Основная навигация">
          {NAV.map(it => {
            const active = isActive(it.to, pathname);
            return (
              <Link key={it.to} to={it.to} aria-current={active ? 'page' : undefined} className={`${linkCls(active)} no-underline`}>
                {it.label}
              </Link>
            );
          })}
          <button type="button" onClick={goContacts} className={linkCls(false)}>Контакты</button>
          <div className="relative" ref={moreRef}>
            <button type="button" onClick={() => setMore(v => !v)} aria-expanded={more} aria-haspopup="true"
              className={`${linkCls(false)} inline-flex items-center gap-1`}>
              Ещё <VolIcon n="chevron" size={14} className={`transition-transform duration-200 ${more ? 'rotate-180' : ''}`} />
            </button>
            {more && (
              <div className="anim-pop absolute left-0 top-full mt-2 w-52 rounded-card border border-vol-line bg-vol-surface p-1 shadow-raise">
                {MORE.map(t => (
                  <Link key={t.to} to={t.to} className="block rounded-control px-3 py-2 text-meta text-vol-muted no-underline hover:bg-vol-accent-soft hover:text-vol-fg">{t.label}</Link>
                ))}
                {/* на 1024–1279px строка навигации тесная: служебные разделы роли доступны отсюда, от 1280px — в строке */}
                {isAdmin && <Link to="/admin/users" className="block rounded-control px-3 py-2 text-meta text-vol-muted no-underline hover:bg-vol-accent-soft hover:text-vol-fg xl:hidden">Управление</Link>}
                {isOrganizer && <Link to="/organizer" className="block rounded-control px-3 py-2 text-meta text-vol-muted no-underline hover:bg-vol-accent-soft hover:text-vol-fg xl:hidden">Кабинет организатора</Link>}
              </div>
            )}
          </div>
          {isAdmin && <Link to="/admin/users" className={`${linkCls(false)} hidden no-underline xl:block`}>Управление</Link>}
          {isOrganizer && <Link to="/organizer" className={`${linkCls(false)} hidden no-underline xl:block`}>Кабинет организатора</Link>}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <UserNotificationBell />
              <Link to="/profile" className="press-flat vol-tap-2 relative flex items-center gap-2 no-underline text-vol-fg" aria-label="Профиль">
                <Avatar name={displayName || '?'} thumb={user.avatarThumbnailUrl} src={user.avatarUrl} crop={user.avatarCrop} size="sm" />
                <span className="hidden max-w-[10rem] truncate text-meta font-medium sm:inline lg:hidden 2xl:inline">{displayName}</span>
              </Link>
              <button type="button" onClick={handleLogout}
                className={`${headBtn} border-[1.5px] border-vol-ctrl hover:border-vol-accent hover:text-vol-accent`}>Выйти</button>
            </>
          ) : (
            <>
              <Link to="/login" className={`${headBtn} border-[1.5px] border-vol-ctrl text-vol-fg hover:border-vol-accent hover:text-vol-accent`}>Вход</Link>
              <Link to="/register" className={`${headBtn} press-shadow bg-vol-accent font-semibold text-vol-accent-fg hover:bg-primary-dark`}>Регистрация</Link>
            </>
          )}
          <button ref={burgerRef} type="button" onClick={() => setMenu(true)} aria-label="Открыть меню" aria-expanded={menu} aria-controls="site-menu"
            className="press-flat grid h-10 w-10 place-items-center rounded-control border-[1.5px] border-vol-ctrl hover:border-vol-accent hover:text-vol-accent lg:hidden">
            <VolIcon n="menu" size={18} />
          </button>
        </div>
      </div>

      {menu && createPortal(
        <MobileMenu closing={closing} pathname={pathname} displayName={displayName} onClose={closeMenu} onContacts={goContacts} onLogout={handleLogout} />,
        document.body,
      )}
    </header>
  );
}

/**
 * Меню бургера: панель справа поверх страницы (до 1024px). Рендерится в body — у шапки backdrop-filter,
 * и fixed-потомок внутри неё позиционировался бы от шапки, а не от экрана.
 * Закрывается кнопкой, Esc, нажатием на затемнение и переходом; пока открыто, страница не прокручивается,
 * фокус переходит в панель и не уходит из неё.
 */
function MobileMenu({ closing, pathname, displayName, onClose, onContacts, onLogout }: {
  closing: boolean; pathname: string; displayName: string; onClose: () => void; onContacts: () => void; onLogout: () => void;
}) {
  const { user, isAdmin, isOrganizer } = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const item = (active: boolean) =>
    `press-flat flex min-h-11 items-center rounded-control px-3 text-ctrl no-underline text-left ${active ? 'bg-vol-accent-soft font-semibold text-vol-accent' : 'font-medium text-vol-fg hover:bg-vol-bg'}`;

  return (
    <div className="vol-head fixed inset-0 z-[70] lg:hidden">
      <div className={`${closing ? 'vol-fade-out' : 'vol-fade'} absolute inset-0 bg-[color-mix(in_srgb,var(--pal-ink)_45%,transparent)] backdrop-blur-[2px]`} onClick={onClose} aria-hidden />
      <div ref={panelRef} id="site-menu" role="dialog" aria-modal="true" aria-label="Меню сайта"
        className={`${closing ? 'vol-drawer-out' : 'vol-drawer'} absolute inset-y-0 right-0 flex w-[min(21rem,88vw)] flex-col bg-vol-surface shadow-float`}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex h-[3.75rem] shrink-0 items-center justify-between gap-3 border-b border-vol-line px-4">
          {user ? (
            <Link to="/profile" className="press-flat flex min-w-0 items-center gap-2.5 no-underline text-vol-fg">
              <Avatar name={displayName || '?'} thumb={user.avatarThumbnailUrl} src={user.avatarUrl} crop={user.avatarCrop} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-ctrl font-semibold">{displayName}</span>
                <span className="block text-meta text-vol-faint">Мой профиль</span>
              </span>
            </Link>
          ) : <span className="font-display text-body font-bold text-vol-head">Меню</span>}
          <button type="button" onClick={onClose} aria-label="Закрыть меню"
            className="press-flat grid h-10 w-10 shrink-0 place-items-center rounded-control text-vol-muted hover:bg-vol-bg hover:text-vol-fg">
            <VolIcon n="close" size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-3" aria-label="Мобильная навигация">
          <ul className="flex flex-col gap-0.5">
            {NAV.map(it => {
              const active = isActive(it.to, pathname);
              return <li key={it.to}><Link to={it.to} aria-current={active ? 'page' : undefined} className={item(active)}>{it.label}</Link></li>;
            })}
            <li><button type="button" onClick={onContacts} className={`${item(false)} w-full`}>Контакты</button></li>
          </ul>
          <p className="vol-meta mt-4 px-3 pb-1">Сообщество</p>
          <ul className="flex flex-col gap-0.5">
            {MORE.map(it => {
              const active = isActive(it.to, pathname);
              return <li key={it.to}><Link to={it.to} aria-current={active ? 'page' : undefined} className={item(active)}>{it.label}</Link></li>;
            })}
          </ul>
          {(isAdmin || isOrganizer) && (
            <>
              <p className="vol-meta mt-4 px-3 pb-1">Работа</p>
              <ul className="flex flex-col gap-0.5">
                {isAdmin && <li><Link to="/admin/users" className={item(false)}>Управление</Link></li>}
                {isOrganizer && <li><Link to="/organizer" className={item(false)}>Кабинет организатора</Link></li>}
              </ul>
            </>
          )}
        </nav>

        <div className="shrink-0 border-t border-vol-line p-4">
          {user ? (
            <button type="button" onClick={onLogout}
              className="press-flat h-11 w-full rounded-control border-[1.5px] border-vol-ctrl text-ctrl font-medium hover:border-vol-accent hover:text-vol-accent">Выйти</button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link to="/login" className="press-flat grid h-11 place-items-center rounded-control border-[1.5px] border-vol-ctrl text-ctrl font-medium text-vol-fg no-underline">Вход</Link>
              <Link to="/register" className="press-flat grid h-11 place-items-center rounded-control bg-vol-accent text-ctrl font-semibold text-vol-accent-fg no-underline">Регистрация</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
