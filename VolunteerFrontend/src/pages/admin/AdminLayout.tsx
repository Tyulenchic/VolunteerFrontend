import logoMark from '../../assets/logo-mark.webp';
import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { AdminScopeContext } from '../../components/ui/AdminScope';
import { Avatar } from '../../components/ui/Avatar';
import { ConfirmProvider } from '../../components/ui/ConfirmDialog';
import { NotificationBell } from '../../components/ui/NotificationBell';

interface NavItem { to: string; icon: string; label: string; }
interface NavGroup { title: string; items: NavItem[]; }

const NAV: NavGroup[] = [
  { title: 'Обзор', items: [
    { to: '/admin',           icon: 'fa-gauge-high', label: 'Дашборд' },
    { to: '/admin/analytics', icon: 'fa-chart-line', label: 'Аналитика' },
  ]},
  { title: 'Платформа', items: [
    { to: '/admin/events',         icon: 'fa-calendar-days',  label: 'Мероприятия' },
    { to: '/admin/participations', icon: 'fa-clipboard-list', label: 'Заявки' },
    { to: '/admin/users',          icon: 'fa-users',          label: 'Пользователи' },
    { to: '/admin/organizations',  icon: 'fa-building-columns', label: 'Организации' },
    { to: '/admin/feedback',       icon: 'fa-envelope',       label: 'Обращения' },
  ]},
  { title: 'Контент', items: [
    { to: '/admin/news',   icon: 'fa-newspaper', label: 'Новости' },
    { to: '/admin/videos', icon: 'fa-video',     label: 'Видеоотчёты' },
    { to: '/admin/moderation', icon: 'fa-user-check', label: 'Модерация аватаров' },
    { to: '/admin/content', icon: 'fa-pen-to-square', label: 'Тексты сайта' },
  ]},
  { title: 'Система', items: [
    { to: '/admin/audit-log', icon: 'fa-clock-rotate-left', label: 'Журнал действий' },
  ]},
];

// Кабинет организатора использует ту же оболочку, что и панель администратора, но со своей навигацией.
const ORGANIZER_NAV: NavGroup[] = [
  { title: 'Обзор', items: [
    { to: '/organizer', icon: 'fa-gauge-high', label: 'Обзор' },
  ]},
  { title: 'Волонтёры', items: [
    { to: '/organizer/applications',   icon: 'fa-user-plus',      label: 'Заявки в организацию' },
    { to: '/organizer/participations', icon: 'fa-clipboard-list', label: 'Заявки на мероприятия' },
  ]},
  { title: 'Организация', items: [
    { to: '/organizer/events',        icon: 'fa-calendar-days',   label: 'Мероприятия' },
    { to: '/organizer/posts',         icon: 'fa-images',          label: 'Публикации' },
    { to: '/organizer/videos',        icon: 'fa-film',            label: 'Видео' },
    { to: '/organizer/organizations', icon: 'fa-building-columns', label: 'Моя организация' },
  ]},
];

const titlesOf = (nav: NavGroup[]): Record<string, { title: string; group: string }> =>
  Object.fromEntries(nav.flatMap(g => g.items.map(i => [i.to, { title: i.label, group: g.title }])));

const COLLAPSE_KEY = 'admin.sidebar.collapsed';
const readCollapsed = () => { try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; } };

export function AdminLayout({ children, variant = 'admin' }: { children: ReactNode; variant?: 'admin' | 'organizer' }) {
  const organizer = variant === 'organizer';
  const nav = organizer ? ORGANIZER_NAV : NAV;
  const home = organizer ? '/organizer' : '/admin';
  const { user, logout } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [sideOpen, setSideOpen] = useState(false);       // mobile drawer
  const [collapsed, setCollapsed] = useState(readCollapsed); // desktop rail

  useEffect(() => { setSideOpen(false); }, [pathname]);
  useEffect(() => {
    if (!sideOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setSideOpen(false); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [sideOpen]);

  const toggleCollapsed = () => setCollapsed(c => {
    try { localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1'); } catch { /* storage unavailable: state just isn't remembered */ }
    return !c;
  });

  const handleLogout = async () => {
    await logout();
    notify('Вы вышли из системы', 'info');
    navigate('/');
  };

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user?.email?.split('@')[0] ?? '';

  const titles = titlesOf(nav);
  // вложенные страницы (/organizer/organizations/:id) наследуют заголовок ближайшего раздела
  const section = Object.keys(titles).filter(p => pathname === p || pathname.startsWith(p + '/')).sort((a, b) => b.length - a.length)[0];
  const current = titles[section ?? home] ?? titles[home];
  // On desktop the rail can be collapsed; in the mobile drawer it is always expanded.
  const rail = collapsed ? 'lg:w-[68px]' : 'lg:w-[248px]';
  const labelCls = collapsed ? 'lg:hidden' : '';

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `relative group flex items-center gap-3 h-9 px-3 rounded-control text-[13.5px] font-medium transition-colors duration-150 no-underline ${collapsed ? 'lg:justify-center lg:px-0' : ''} ${
      isActive
        ? 'bg-brand-50 text-brand-700 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-full before:bg-brand-500'
        : 'text-ink-500 hover:bg-white/5 hover:text-ink-900'
    }`;

  return (
    <AdminScopeContext.Provider value={true}>
      <ConfirmProvider>
        <div className="admin-shell flex h-screen bg-canvas overflow-hidden">
          <a href="#admin-main" onClick={(e) => { e.preventDefault(); document.getElementById('admin-main')?.focus(); }} className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:top-2 focus:left-2 focus:px-3 focus:py-2 focus:rounded-control focus:bg-brand-600 focus:text-white">
            К содержимому
          </a>

          {sideOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40 lg:hidden anim-backdrop" onClick={() => setSideOpen(false)} />}

          {/* ── Sidebar ─────────────────────────────────────────── */}
          <aside
            aria-label={organizer ? 'Навигация организатора' : 'Навигация администратора'}
            className={`glass fixed lg:static inset-y-0 left-0 z-50 w-[248px] max-w-[85vw] ${rail} border-r border-line flex flex-col shrink-0
              transition-[transform,width] duration-200 ease-out ${sideOpen ? 'translate-x-0 shadow-pop' : '-translate-x-full lg:translate-x-0'}`}
          >
            <div className={`flex items-center gap-3 h-14 px-4 shrink-0 border-b border-line ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
              <Link to={home} className="flex items-center gap-3 min-w-0 text-ink-900 no-underline" aria-label={organizer ? 'Волонтеры Приднестровья — кабинет организатора' : 'Волонтеры Приднестровья — панель управления'}>
                <img src={logoMark} alt="" aria-hidden="true" className="h-8 w-8 shrink-0 object-contain" />
                <span className={`min-w-0 leading-tight ${labelCls}`}>
                  <span className="block font-heading font-bold text-[13.5px] truncate">Волонтеры ПМР</span>
                  <span className="block text-[11px] text-ink-400">{organizer ? 'Кабинет организатора' : 'Администрирование'}</span>
                </span>
              </Link>
              <button type="button" className="lg:hidden ml-auto icon-btn" onClick={() => setSideOpen(false)} aria-label="Закрыть меню"><i className="fas fa-xmark" /></button>
            </div>

            <nav className="flex-1 px-2.5 py-4 overflow-y-auto scroll-soft">
              {nav.map((group, gi) => (
                <div key={group.title} className={gi === 0 ? '' : 'mt-5'}>
                  <p className={`px-3 mb-1.5 eyebrow ${labelCls}`}>{group.title}</p>
                  {gi > 0 && collapsed && <div className="hidden lg:block mx-3 mb-2 border-t border-line" />}
                  <div className="space-y-0.5">
                    {group.items.map(item => (
                      <NavLink key={item.to} to={item.to} end={item.to === home} className={linkCls} title={collapsed ? item.label : undefined}>
                        <i className={`fas ${item.icon} w-4 text-center text-[13px]`} />
                        <span className={labelCls}>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="p-2.5 border-t border-line space-y-1">
              <Link to="/" title="Открыть сайт" className={`flex items-center gap-3 h-9 px-3 rounded-control text-[13px] text-ink-500 hover:bg-white/5 hover:text-ink-900 no-underline ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
                <i className="fas fa-arrow-up-right-from-square w-4 text-center text-[12px]" /><span className={labelCls}>Открыть сайт</span>
              </Link>
              <button type="button" onClick={toggleCollapsed} aria-pressed={collapsed} title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
                className="hidden lg:flex w-full items-center gap-3 h-9 px-3 rounded-control text-[13px] text-ink-500 hover:bg-white/5 hover:text-ink-900 justify-start data-[c=true]:justify-center data-[c=true]:px-0" data-c={collapsed}>
                <i className={`fas ${collapsed ? 'fa-angles-right' : 'fa-angles-left'} w-4 text-center text-[12px]`} />{!collapsed && <span>Свернуть</span>}
              </button>
              <div className={`flex items-center gap-3 pt-2 mt-1 border-t border-line px-1 ${collapsed ? 'lg:flex-col lg:gap-2' : ''}`}>
                <Avatar name={displayName} src={user?.avatarUrl} size="md" />
                <div className={`min-w-0 flex-1 ${labelCls}`}>
                  <p className="text-ink-900 text-[13px] font-semibold truncate">{displayName}</p>
                  <p className="meta">{user?.role === 'Admin' ? 'Администратор' : 'Организатор'}</p>
                </div>
                <button onClick={handleLogout} title="Выйти" aria-label="Выйти" className="icon-btn is-danger"><i className="fas fa-right-from-bracket" /></button>
              </div>
            </div>
          </aside>

          {/* ── Main ────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-w-0">
            <header className="glass flex items-center gap-2 h-14 px-3 sm:px-5 border-b border-line shrink-0 z-30">
              <button className="lg:hidden icon-btn" onClick={() => setSideOpen(true)} aria-label="Открыть меню" aria-expanded={sideOpen}><i className="fas fa-bars" /></button>
              <nav aria-label="Хлебные крошки" className="flex items-center gap-2 text-[13px] min-w-0">
                <span className="text-ink-400 hidden sm:inline">{current.group}</span>
                <i className="fas fa-chevron-right text-[9px] text-ink-300 hidden sm:inline" />
                <span className="font-semibold text-ink-900 truncate">{current.title}</span>
              </nav>
              <div className="ml-auto flex items-center gap-1">
                <NotificationBell source={organizer ? 'organizer' : 'admin'} />
              </div>
            </header>

            <main id="admin-main" tabIndex={-1} className="flex-1 overflow-y-auto overflow-x-hidden scroll-soft outline-none">
              <div key={pathname} className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 anim-page">
                {children}
              </div>
            </main>
          </div>
        </div>
      </ConfirmProvider>
    </AdminScopeContext.Provider>
  );
}
