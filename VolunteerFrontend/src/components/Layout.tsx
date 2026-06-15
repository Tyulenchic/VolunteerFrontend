import { useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { CookieBanner } from './CookieBanner';

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout, isAdmin } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user?.email?.split('@')[0] ?? '';

  const handleLogout = async () => {
    await logout();
    notify('Вы вышли из системы 👋', 'info');
    navigate('/');
    setMenuOpen(false);
  };

  const close = () => { setMenuOpen(false); setMoreOpen(false); };

  const scrollTo = (id: string) => {
    close();
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `font-medium transition hover:text-primary ${isActive ? 'text-primary font-bold' : 'text-gray-600'}`;

   return (
     <div className="flex flex-col min-h-screen">
       {/* ─── TOP BANNER ──────────────────────────────────────────────────── */}
       <div className="bg-gradient-to-r from-primary/95 to-primary-dark/95 text-white py-5">
         <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4">
           <i className="fas fa-hand-holding-heart text-4xl" />
           <span className="font-heading font-bold text-2xl">Волонтеры Приднестровья</span>
         </div>
       </div>

       {/* ─── NAVBAR ──────────────────────────────────────────────────────── */}
         <header className="bg-white shadow-sm sticky top-0 z-40">
           <div className="w-full px-4 sm:px-6 lg:px-8">
             <div className="flex justify-between items-center h-16">

              {/* Desktop nav */}
              <nav className="hidden md:flex items-center justify-center flex-1 gap-6 lg:gap-8" aria-label="Главная навигация">
                <NavLink to="/" className={navLinkClass}>Главная</NavLink>
                <NavLink to="/about" className={navLinkClass}>О нас</NavLink>
                <NavLink to="/news" className={navLinkClass}>Новости</NavLink>
                <NavLink to="/events" className={navLinkClass}>Мероприятия</NavLink>
                <button onClick={() => scrollTo('feedback')} className="font-medium text-gray-600 hover:text-primary transition bg-transparent border-none cursor-pointer p-0 text-base">
                  Контакты
                </button>
               {/* More dropdown */}
               <div className="relative">
                 <button
                     onClick={() => setMoreOpen(p => !p)}
                     className="font-medium text-gray-600 hover:text-primary transition flex items-center gap-1"
                 >
                   Ещё <i className={`fas fa-chevron-down text-xs transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                 </button>
                 {moreOpen && (
                     <>
                       <div className="fixed inset-0 z-10" onClick={() => setMoreOpen(false)} />
                       <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden">
                         {[
                           { to: '/organizers', icon: 'fa-star', label: 'Организаторы' },
                           { to: '/volunteers', icon: 'fa-heart', label: 'Волонтёры' },
                           { to: '/organizations', icon: 'fa-building', label: 'Организации' },
                           { to: '/faq', icon: 'fa-question-circle', label: 'FAQ' },
                           { to: '/rules', icon: 'fa-gavel', label: 'Правила сайта' },
                           { to: '/privacy', icon: 'fa-shield-alt', label: 'Конфиденциальность' },
                         ].map(item => (
                             <Link key={item.to} to={item.to} onClick={close}
                                   className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition no-underline">
                               <i className={`fas ${item.icon} text-primary w-4`} />{item.label}
                             </Link>
                         ))}
                       </div>
                     </>
                 )}
               </div>
               {isAdmin && <NavLink to="/admin/users" className={navLinkClass}>Управление</NavLink>}
             </nav>

             {/* Desktop auth + Avatar */}
             <div className="hidden md:flex items-center gap-3 flex-shrink-0 ml-auto">
               {user ? (
                 <>
                   <Link to="/profile" className="flex items-center gap-2 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition no-underline">
                     {user.avatarUrl
                       ? <img src={user.avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover" />
                       : <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">{displayName.charAt(0).toUpperCase()}</div>}
                     <span className="font-medium text-sm hidden lg:inline">{displayName}</span>
                   </Link>
                   <button onClick={handleLogout} className="hidden lg:block px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-primary transition">
                     Выйти
                   </button>
                 </>
               ) : (
                 <>
                   <Link to="/login" className="px-3 lg:px-4 py-2 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-primary transition no-underline text-sm lg:text-base">Вход</Link>
                   <Link to="/register" className="px-3 lg:px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition shadow-sm no-underline text-sm lg:text-base">Регистрация</Link>
                 </>
               )}
             </div>

             {/* Hamburger - Shows on mobile and tablet */}
             <button className="md:hidden p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition flex-shrink-0"
               aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={menuOpen}
               onClick={() => setMenuOpen(p => !p)}>
               <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'} text-xl`} />
             </button>
           </div>
         </div>

         {/* Mobile slide-out */}
         {menuOpen && (
           <>
             <div className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={close} />
             <div className="md:hidden fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 flex flex-col">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                  {user ? (
                    <div className="flex items-center gap-3 flex-1">
                      {user.avatarUrl
                        ? <img src={user.avatarUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover" />
                        : <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">{displayName.charAt(0).toUpperCase()}</div>}
                      <div>
                        <span className="font-heading font-bold text-sm text-gray-900 block">{displayName}</span>
                        <span className="text-xs text-gray-500">{user.email}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                        <i className="fas fa-hand-holding-heart text-white text-lg" />
                      </div>
                      <span className="font-heading font-bold text-lg text-gray-900">Волонтеры ПМР</span>
                    </div>
                  )}
                 <button onClick={close} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition">
                   <i className="fas fa-times text-xl" />
                 </button>
               </div>
               <div className="px-4 py-4 space-y-1 flex-grow overflow-y-auto">
                {[
                  { to: '/', icon: 'fa-home', label: 'Главная', end: true },
                  { to: '/news', icon: 'fa-newspaper', label: 'Новости' },
                  { to: '/events', icon: 'fa-calendar-alt', label: 'Мероприятия' },
                  { to: '/organizers', icon: 'fa-star', label: 'Организаторы' },
                  { to: '/volunteers', icon: 'fa-heart', label: 'Волонтёры' },
                  { to: '/about', icon: 'fa-info-circle', label: 'О нас' },
                  { to: '/faq', icon: 'fa-question-circle', label: 'FAQ' },
                  { to: '/rules', icon: 'fa-gavel', label: 'Правила сайта' },
                  { to: '/privacy', icon: 'fa-shield-alt', label: 'Конфиденциальность' },
                  { to: '/organizations', icon: 'fa-building', label: 'Организации' },
                ].map(item => (
                  <NavLink key={item.to} to={item.to} end={item.end} onClick={close}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 rounded-xl transition group ${isActive ? 'text-primary bg-primary/5' : 'text-gray-700 hover:bg-primary/5 hover:text-primary'}`
                    }>
                    <i className={`fas ${item.icon} w-5 text-center`} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </NavLink>
                ))}
                <button onClick={() => scrollTo('feedback')}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-gray-700 hover:bg-primary/5 hover:text-primary rounded-xl transition bg-transparent border-none cursor-pointer text-sm text-left">
                  <i className="fas fa-envelope w-5 text-center" />
                  <span className="font-medium">Обратная связь</span>
                </button>
                {user && (
                  <NavLink to="/profile" onClick={close}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${isActive ? 'text-primary bg-primary/5' : 'text-gray-700 hover:bg-primary/5 hover:text-primary'}`
                    }>
                    <i className="fas fa-user-circle w-5 text-center" />
                    <span className="font-medium text-sm">Личный кабинет</span>
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink to="/admin/users" onClick={close}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${isActive ? 'text-primary bg-primary/5' : 'text-gray-700 hover:bg-primary/5 hover:text-primary'}`
                    }>
                    <i className="fas fa-cog w-5 text-center" />
                    <span className="font-medium text-sm">Управление</span>
                  </NavLink>
                )}
              </div>
              <div className="mx-4 border-t border-gray-100" />
              <div className="px-6 py-4 space-y-3">
                {user ? (
                  <>
                    <Link to="/profile" onClick={close} className="flex items-center justify-center w-full px-4 py-3 text-gray-700 font-semibold border-2 border-gray-200 rounded-xl hover:border-primary hover:text-primary transition no-underline">
                      <i className="fas fa-user-circle mr-2" />{displayName}
                    </Link>
                    <button onClick={handleLogout} className="flex items-center justify-center w-full px-4 py-3 text-red-600 font-semibold border-2 border-red-200 rounded-xl hover:bg-red-50 transition">
                      <i className="fas fa-sign-out-alt mr-2" />Выйти
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={close} className="flex items-center justify-center w-full px-4 py-3 text-gray-700 font-semibold border-2 border-gray-200 rounded-xl hover:border-primary hover:text-primary transition no-underline">
                      <i className="fas fa-sign-in-alt mr-2" />Вход
                    </Link>
                    <Link to="/register" onClick={close} className="flex items-center justify-center w-full px-4 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition shadow-lg no-underline">
                      <i className="fas fa-user-plus mr-2" />Регистрация
                    </Link>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </header>

      {/* ─── MAIN ────────────────────────────────────────────────────────── */}
      <main className="flex-grow">{children}</main>

      {/* ─── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8 py-12 border-b border-gray-200">
            <div>
             <Link to="/" className="inline-flex items-center gap-3 mb-4 no-underline">
                 <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                   <i className="fas fa-hand-holding-heart text-white text-2xl" />
                 </div>
                 <span className="font-heading font-bold text-2xl text-gray-900">Волонтеры Приднестровья</span>
               </Link>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Официальный портал волонтёрского движения Приднестровья. Делаем мир лучше вместе с 2020 года.
              </p>
              <div className="flex gap-3">
                {[{href:'https://vk.com',icon:'fab fa-vk'},{href:'t.me/volonterPMR',icon:'fab fa-telegram-plane'},{href:'https://www.instagram.com/volonterpmr',icon:'fab fa-instagram'}].map(s => (
                  <a key={s.icon} href={s.href} target="_blank" rel="noopener noreferrer"
                    className="w-11 h-11 bg-gray-100 hover:bg-primary hover:text-white text-gray-600 rounded-xl flex items-center justify-center transition-all hover:scale-110 no-underline">
                    <i className={`${s.icon} text-xl`} />
                  </a>
                ))}
              </div>
            </div>
            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Разделы</h3>
                <ul className="space-y-3">
                  <li><Link to="/news" className="text-gray-600 hover:text-primary transition text-sm no-underline">Новости</Link></li>
                  <li><Link to="/events" className="text-gray-600 hover:text-primary transition text-sm no-underline">Мероприятия</Link></li>
                  <li><Link to="/organizers" className="text-gray-600 hover:text-primary transition text-sm no-underline">Организаторы</Link></li>
                  <li><Link to="/volunteers" className="text-gray-600 hover:text-primary transition text-sm no-underline">Волонтёры</Link></li>
                  <li><Link to="/about" className="text-gray-600 hover:text-primary transition text-sm no-underline">О нас</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Помощь</h3>
                <ul className="space-y-3">
                  <li><Link to="/register" className="text-gray-600 hover:text-primary transition text-sm no-underline">Стать волонтёром</Link></li>
                  <li><Link to="/faq" className="text-gray-600 hover:text-primary transition text-sm no-underline">FAQ</Link></li>
                  <li><Link to="/rules" className="text-gray-600 hover:text-primary transition text-sm no-underline">Правила сайта</Link></li>
                  <li><Link to="/privacy" className="text-gray-600 hover:text-primary transition text-sm no-underline">Конфиденциальность</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Контакты</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2 text-gray-600"><i className="fas fa-envelope text-primary text-xs w-3" /><a href="mailto:info@volunteerspmr.org" className="hover:text-primary transition no-underline text-gray-600">ump@minpros.gospmr.org</a></li>
                  <li className="flex items-center gap-2 text-gray-600"><i className="fas fa-phone text-primary text-xs w-3" /><a href="tel:+37377712345" className="hover:text-primary transition no-underline text-gray-600">+373 777 12-345</a></li>
                  <li className="flex items-start gap-2 text-gray-600"><i className="fas fa-map-marker-alt text-primary text-xs w-3 mt-0.5" /><span>г. Тирасполь, ул. Мира, 27</span></li>
                  <li className="flex items-center gap-2 text-gray-600"><i className="fas fa-clock text-primary text-xs w-3" /><span>Пн-Пт: 9:00–18:00</span></li>
                </ul>
              </div>
            </div>
          </div>
           <div className="py-8 flex flex-col md:flex-row justify-between items-center gap-4">
             <p className="text-gray-500 text-sm text-center md:text-left">© 2020–2026 Волонтеры Приднестровья. Все права защищены.</p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link to="/privacy" className="text-gray-500 hover:text-primary transition no-underline">Политика конфиденциальности</Link>
              <Link to="/rules" className="text-gray-500 hover:text-primary transition no-underline">Правила сайта</Link>
              <Link to="/faq" className="text-gray-500 hover:text-primary transition no-underline">FAQ</Link>
            </div>
          </div>
        </div>
      </footer>

      <CookieBanner />
    </div>
  );
}
