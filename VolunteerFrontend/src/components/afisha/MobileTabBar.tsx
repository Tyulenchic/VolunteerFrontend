import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { VolIcon, type IconName } from './VolIcon';

type Tab = { to: string; label: string; icon: IconName; end?: boolean };

const BASE: Tab[] = [
  { to: '/', label: 'Главная', icon: 'home', end: true },
  { to: '/events', label: 'Мероприятия', icon: 'cal' },
  { to: '/news', label: 'Новости', icon: 'news' },
];

/** Поле, при фокусе на котором телефон открывает клавиатуру (флажки и кнопки её не вызывают). */
const opensKeyboard = (el: EventTarget | null) =>
  el instanceof HTMLElement && (
    el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement || el.isContentEditable ||
    (el instanceof HTMLInputElement && !['checkbox', 'radio', 'button', 'submit', 'reset', 'file', 'range', 'color'].includes(el.type))
  );

/**
 * Bottom tab bar, phones and small tablets only (below 768px). Floats over the content and respects the home-indicator inset.
 * Пока открыта экранная клавиатура, панель прячется: иначе она поднимается вместе с клавиатурой и закрывает поле ввода.
 */
export function MobileTabBar() {
  const { user } = useAuth();
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const onIn = (e: FocusEvent) => setTyping(opensKeyboard(e.target));
    const onOut = () => setTyping(false);
    document.addEventListener('focusin', onIn);
    document.addEventListener('focusout', onOut);
    return () => { document.removeEventListener('focusin', onIn); document.removeEventListener('focusout', onOut); };
  }, []);

  const tabs: Tab[] = [...BASE, user ? { to: '/profile', label: 'Профиль', icon: 'user' } : { to: '/login', label: 'Войти', icon: 'user' }];

  return (
    <nav aria-label="Быстрая навигация"
      className={`vol-head fixed inset-x-0 bottom-0 z-30 px-3 transition-transform duration-200 md:hidden ${typing ? 'translate-y-[calc(100%+1rem)]' : ''}`}
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)' }}>
      <ul className="vol-glass mx-auto grid max-w-md grid-cols-4 rounded-sheet border border-vol-line p-1.5 shadow-raise">
        {tabs.map(t => (
          <li key={t.to}>
            <NavLink to={t.to} end={t.end}
              className={({ isActive }) => `press-flat flex min-h-[3.1rem] flex-col items-center justify-center gap-1 rounded-card text-[0.75rem] font-semibold leading-none no-underline ${isActive ? 'text-vol-accent' : 'text-vol-muted hover:text-vol-fg'}`}>
              {({ isActive }) => (
                <>
                  <span className={`grid h-7 w-12 place-items-center rounded-full ${isActive ? 'vol-pill bg-vol-accent-soft' : ''}`}><VolIcon n={t.icon} size={19} /></span>
                  <span className="max-w-full truncate px-0.5">{t.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
