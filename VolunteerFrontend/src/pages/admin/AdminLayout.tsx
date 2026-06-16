import { useState, type ReactNode } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

interface NavItem {
  to: string;
  icon: string;
  label: string;
  badge?: number;
}

const NAV: NavItem[] = [
  { to: '/admin',              icon: 'fa-tachometer-alt', label: 'Дашборд' },
  { to: '/admin/users',        icon: 'fa-users',           label: 'Пользователи' },
  { to: '/admin/events',       icon: 'fa-calendar-alt',    label: 'Мероприятия' },
  { to: '/admin/news',         icon: 'fa-newspaper',       label: 'Новости' },
  { to: '/admin/participations',icon: 'fa-clipboard-list', label: 'Заявки' },
  { to: '/admin/videos',       icon: 'fa-video',           label: 'Видеоотчёты' },
  { to: '/admin/analytics',    icon: 'fa-chart-bar',       label: 'Аналитика' },
  { to: '/admin/audit-log',    icon: 'fa-history',         label: 'Журнал аудита' },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [sideOpen, setSideOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    notify('Вы вышли из системы', 'info');
    navigate('/');
  };

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user?.email?.split('@')[0] ?? '';

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-primary text-white shadow-md'
        : 'text-gray-400 hover:bg-gray-700/60 hover:text-white'
    }`;

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">

      {/* ── Sidebar ────────────────────────────────────────────────── */}
      {/* Mobile overlay */}
      {sideOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSideOpen(false)} />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-gray-900 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sideOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
            <i className="fas fa-shield-alt text-white text-lg" />
          </div>
          <div>
            <p className="font-heading font-bold text-white text-base leading-tight">Панель управления</p>
            <p className="text-gray-500 text-xs">ВолонтёрыПМР</p>
          </div>
          <button className="lg:hidden ml-auto text-gray-500 hover:text-white" onClick={() => setSideOpen(false)}>
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-grow px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/admin'} className={linkCls} onClick={() => setSideOpen(false)}>
              <i className={`fas ${item.icon} w-5 text-center`} />
              <span>{item.label}</span>
              {item.badge != null && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}

          <div className="pt-4 border-t border-gray-800 mt-4">
            <p className="text-gray-600 text-xs uppercase tracking-widest px-4 mb-2">Навигация</p>
            <Link to="/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-700/60 hover:text-white transition-all" onClick={() => setSideOpen(false)}>
              <i className="fas fa-globe w-5 text-center" />
              <span>На сайт</span>
            </Link>
          </div>
        </nav>

        {/* User card */}
        <div className="px-3 py-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-3 bg-gray-800 rounded-xl">
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              : <div className="w-8 h-8 bg-primary/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-sm">{displayName.charAt(0).toUpperCase()}</span>
                </div>
            }
            <div className="flex-grow min-w-0">
              <p className="text-white text-sm font-medium truncate">{displayName}</p>
              <p className="text-gray-500 text-xs">Администратор</p>
            </div>
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition p-1" title="Выйти">
              <i className="fas fa-sign-out-alt" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-4 flex-shrink-0">
          <button className="lg:hidden text-gray-400 hover:text-white transition" onClick={() => setSideOpen(true)}>
            <i className="fas fa-bars text-xl" />
          </button>
          <div className="flex-1" />
          <Link to="/" className="hidden sm:flex items-center gap-2 text-sm text-gray-400 hover:text-white transition no-underline">
            <i className="fas fa-external-link-alt" />
            <span>Открыть сайт</span>
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-950 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
