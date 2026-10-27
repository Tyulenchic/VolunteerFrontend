import logoMark from '../assets/logo-mark.webp';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SiteHeader } from './afisha/SiteHeader';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      {/* ─── HEADER (shared with the events page) ───────────────────────── */}
      <SiteHeader />


      {/* ─── MAIN ────────────────────────────────────────────────────────── */}
      <main className="flex-grow">{children}</main>

      {/* ─── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8 py-12 border-b border-gray-200">
            <div>
             <Link to="/" className="inline-flex items-center gap-3 mb-4 no-underline">
                 <img src={logoMark} alt="" aria-hidden="true" className="h-12 w-12 object-contain" />
                 <span className="font-heading font-bold text-xl sm:text-2xl text-gray-900">Волонтеры Приднестровья</span>
               </Link>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Официальный портал волонтёрского движения Приднестровья. Делаем мир лучше вместе с 2020 года.
              </p>
              <div className="flex gap-3">
                {[{href:'https://vk.com',icon:'fab fa-vk'},{href:'https://t.me/volonterPMR',icon:'fab fa-telegram-plane'},{href:'https://www.instagram.com/volonterpmr',icon:'fab fa-instagram'}].map(s => (
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
                <ul className="space-y-3 text-sm break-words">
                  <li className="flex items-center gap-2 text-gray-600"><i className="fas fa-envelope text-primary text-xs w-3" /><a href="mailto:ump@minpros.gospmr.org" className="hover:text-primary transition no-underline text-gray-600">ump@minpros.gospmr.org</a></li>
                  <li className="flex items-center gap-2 text-gray-600"><i className="fas fa-phone text-primary text-xs w-3" /><a href="tel:0 (533) 2-22-29." className="hover:text-primary transition no-underline text-gray-600"> 0 (533) 2-22-29</a></li>
                  <li className="flex items-start gap-2 text-gray-600"><i className="fas fa-map-marker-alt text-primary text-xs w-3 mt-0.5" /><span>г. Тирасполь, ул. Мира, 27</span></li>
                  <li className="flex items-center gap-2 text-gray-600"><i className="fas fa-clock text-primary text-xs w-3" /><span>Пн-Пт: 8:00–17:00</span></li>
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

    </div>
  );
}
