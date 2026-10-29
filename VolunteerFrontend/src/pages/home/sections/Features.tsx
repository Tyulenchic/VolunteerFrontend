import { Link } from 'react-router-dom';
import { VolIcon } from '../../../components/afisha/VolIcon';
import { VolSectionHead } from '../../../components/afisha/VolSectionHead';

// Static content: there is no API for these blocks.
const FEATS = [
  { to: '/news', tone: 'blue', t: 'Новости движения', d: 'Следите за событиями и анонсами' },
  { to: '/events', tone: 'green', t: 'Участие в акциях', d: 'Находите события и регистрируйтесь онлайн' },
  { to: '/volunteers', tone: 'blue', t: 'Сообщество', d: 'Общайтесь с единомышленниками' },
  { to: '/profile', tone: 'green', t: 'Достижения', d: 'Отслеживайте вклад и получайте сертификаты' },
] as const;

export function Features() {
  return (
    <section className="wrap relative z-10 py-[var(--section-y)]">
      <VolSectionHead title="Возможности портала" sub="Удобная платформа для координации волонтёрской деятельности" />
      {/* Телефон — сетка 2×2 из компактных карточек, планшет и шире — четыре в ряд (или по месту). */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {FEATS.map(f => (
          <Link key={f.t} to={f.to}
            className="press group relative flex flex-col overflow-hidden rounded-panel border border-vol-line bg-vol-surface p-4 no-underline hover:border-vol-accent hover:shadow-raise sm:p-6">
            <span className={`absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${f.tone === 'green' ? 'bg-vol-green' : 'bg-vol-accent'}`} aria-hidden="true" />
            <h3 className="font-display text-body-sm font-bold leading-snug text-vol-head sm:text-h3">{f.t}</h3>
            <p className="mt-1.5 flex-1 text-meta leading-snug text-vol-muted sm:mt-2.5 sm:leading-relaxed">{f.d}</p>
            <p className="mt-4 flex w-full items-center justify-end gap-2 text-meta font-semibold text-vol-accent sm:mt-7">
              <span className="max-sm:sr-only">Подробнее</span><VolIcon n="arrow" size={16} className="transition-transform group-hover:translate-x-1" />
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
