import { Link } from 'react-router-dom';
import { VolIcon } from '../../../components/afisha/VolIcon';
import { VolSectionHead } from '../../../components/afisha/VolSectionHead';
import { HOME_FEATURES_DEFAULT, HOME_TEXT_DEFAULT as H } from '../../../content/defaults';
import { useSiteJson, useSiteText } from '../../../context/SiteContentContext';

// Ссылки и цвета карточек заданы здесь; названия и описания берутся из «Тексты сайта» по порядку.
const FEATS = [
  { to: '/news', tone: 'blue' },
  { to: '/events', tone: 'green' },
  { to: '/volunteers', tone: 'blue' },
  { to: '/profile', tone: 'green' },
] as const;

export function Features() {
  const title = useSiteText('home.features.title', H.featuresTitle);
  const sub = useSiteText('home.features.sub', H.featuresSub);
  const items = useSiteJson('home.features.items', HOME_FEATURES_DEFAULT);
  return (
    <section className="wrap relative z-10 py-[var(--section-y)]">
      <VolSectionHead title={title} sub={sub} />
      {/* Телефон — сетка 2×2 из компактных карточек, планшет и шире — четыре в ряд (или по месту). */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {FEATS.map((f, i) => (
          <Link key={f.to} to={f.to}
            className="press group relative flex flex-col overflow-hidden rounded-panel border border-vol-line bg-vol-surface p-4 no-underline hover:border-vol-accent hover:shadow-raise sm:p-6">
            <span className={`absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${f.tone === 'green' ? 'bg-vol-green' : 'bg-vol-accent'}`} aria-hidden="true" />
            <h3 className="font-display text-body-sm font-bold leading-snug text-vol-head sm:text-h3">{items[i]?.t ?? HOME_FEATURES_DEFAULT[i].t}</h3>
            <p className="mt-1.5 flex-1 text-meta leading-snug text-vol-muted sm:mt-2.5 sm:leading-relaxed">{items[i]?.d ?? HOME_FEATURES_DEFAULT[i].d}</p>
            <p className="mt-4 flex w-full items-center justify-end gap-2 text-meta font-semibold text-vol-accent sm:mt-7">
              <span className="max-sm:sr-only">Подробнее</span><VolIcon n="arrow" size={16} className="transition-transform group-hover:translate-x-1" />
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
