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
    <section className="relative z-10 mx-auto max-w-[76rem] px-4 py-32 sm:px-6">
      <VolSectionHead title="Возможности портала" sub="Удобная платформа для координации волонтёрской деятельности" />
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {FEATS.map(f => (
          <Link key={f.t} to={f.to}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-vol-line bg-vol-surface p-6 no-underline transition-shadow hover:border-vol-accent hover:shadow-[0_16px_34px_rgba(15,27,51,.08)] max-md:items-center max-md:text-center">
            <span className={`absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${f.tone === 'green' ? 'bg-vol-green' : 'bg-vol-accent'}`} aria-hidden="true" />
            <h3 className="font-display text-[1.05rem] font-bold leading-snug text-vol-head">{f.t}</h3>
            <p className="mt-2.5 flex-1 text-[13.5px] leading-relaxed text-vol-muted">{f.d}</p>
            <p className="mt-7 flex w-full items-center justify-end gap-2 text-[13.5px] font-semibold text-vol-accent max-md:justify-center">
              Подробнее<VolIcon n="arrow" size={16} className="transition-transform group-hover:translate-x-1" />
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
