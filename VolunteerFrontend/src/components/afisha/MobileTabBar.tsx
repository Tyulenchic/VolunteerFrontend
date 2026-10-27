import { NavLink } from 'react-router-dom';
import { VolIcon, type IconName } from './VolIcon';

const TABS: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/', label: 'Главная', icon: 'home', end: true },
  { to: '/events', label: 'События', icon: 'cal' },
  { to: '/news', label: 'Новости', icon: 'news' },
  { to: '/profile', label: 'Профиль', icon: 'user' },
];

/** Bottom tab bar, phones and small tablets only (below 768px). Floats over the content and respects the home-indicator inset. */
export function MobileTabBar() {
  return (
    <nav aria-label="Быстрая навигация" className="vol-head fixed inset-x-0 bottom-0 z-30 px-3 md:hidden"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)' }}>
      <ul className="mx-auto grid max-w-md grid-cols-4 rounded-2xl border border-vol-line bg-[rgba(255,255,255,.96)] p-1.5 shadow-[0_10px_30px_rgba(15,27,51,.14)] backdrop-blur-md">
        {TABS.map(t => (
          <li key={t.to}>
            <NavLink to={t.to} end={t.end}
              className={({ isActive }) => `flex min-h-[3.1rem] flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold no-underline ${isActive ? 'text-vol-accent' : 'text-vol-muted hover:text-vol-fg'}`}>
              {({ isActive }) => (
                <>
                  <span className={`grid h-7 w-12 place-items-center rounded-full ${isActive ? 'bg-vol-accent-soft' : ''}`}><VolIcon n={t.icon} size={19} /></span>
                  {t.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
