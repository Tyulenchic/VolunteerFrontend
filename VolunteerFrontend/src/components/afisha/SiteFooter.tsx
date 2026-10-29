import { Link } from 'react-router-dom';
import { VolIcon, VolLogo, type IconName } from './VolIcon';
import { SOCIAL_PATHS } from './socialPaths';
import footerBg from '../../assets/home/footer-bg.webp';

const SOCIAL = [
  { key: 'vk', name: 'ВКонтакте', href: 'https://vk.com' },
  { key: 'tg', name: 'Telegram', href: 'https://t.me/volonterPMR' },
  { key: 'ig', name: 'Instagram', href: 'https://www.instagram.com/volonterpmr' },
] as const;

const COLUMNS = [
  { title: 'Разделы', items: [
    { to: '/news', label: 'Новости' }, { to: '/events', label: 'Мероприятия' }, { to: '/organizers', label: 'Организаторы' },
    { to: '/volunteers', label: 'Волонтёры' }, { to: '/about', label: 'О нас' },
  ] },
  { title: 'Помощь', items: [
    { to: '/register', label: 'Стать волонтёром' }, { to: '/faq', label: 'FAQ' },
    { to: '/rules', label: 'Правила сайта' }, { to: '/privacy', label: 'Конфиденциальность' },
  ] },
];

const CONTACTS: { icon: IconName; v: string; href?: string }[] = [
  { icon: 'mail', v: 'ump@minpros.gospmr.org', href: 'mailto:ump@minpros.gospmr.org' },
  { icon: 'phone', v: '0 (533) 2-22-29', href: 'tel:053322229' },
  { icon: 'pin', v: 'г. Тирасполь, ул. Мира, 27' },
  { icon: 'clock', v: 'Пн–Пт: 8:00–17:00' },
];

const LEGAL = [{ to: '/privacy', label: 'Политика конфиденциальности' }, { to: '/rules', label: 'Правила сайта' }, { to: '/faq', label: 'FAQ' }];

export function SiteFooter() {
  return (
    <footer className="on-dark relative isolate z-10 mt-4 overflow-hidden text-white">
      <div className="vol-band vol-band-soft relative z-10" />
      <div className="absolute inset-0 -z-10 bg-vol-head" aria-hidden="true">
        <img src={footerBg} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: '50% 55%' }} />
        <div className="vol-veil absolute inset-0" style={{ ["--veil-angle" as string]: "180deg" }} />
        <div className="vol-glow vol-glow-sky absolute -left-24 top-0 h-[26rem] w-[26rem] max-md:hidden" />
        <div className="vol-glow vol-glow-brand absolute -bottom-32 right-0 h-[30rem] w-[30rem] max-md:hidden" />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 520" preserveAspectRatio="xMidYMid slice" fill="none">
          <g stroke="#fff" strokeLinecap="round">
            <path d="M-60 400C240 300 460 470 780 370S1340 300 1660 380" strokeOpacity=".14" strokeWidth="1" />
            <path d="M-60 450C260 350 480 530 800 410S1360 350 1660 430" stroke="var(--vol-sky)" strokeOpacity=".18" strokeWidth="1" />
          </g>
        </svg>
      </div>

      <div className="wrap py-14">
        <div className="vol-glass-dark rounded-3xl p-7 sm:p-9">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.15fr_1fr_1.25fr] lg:gap-14">
            <div className="flex max-w-xs flex-col gap-4 max-md:mx-auto max-md:items-center max-md:text-center md:col-span-2 md:max-w-none md:flex-row md:flex-wrap md:items-center md:gap-x-8 lg:col-span-1 lg:max-w-xs lg:flex-col lg:items-stretch">
              <Link to="/" className="flex min-w-0 items-center gap-2.5 text-white no-underline">
                <VolLogo size={34} onDark />
                <span className="font-display truncate text-[14.5px] font-bold tracking-tight">Волонтёры Приднестровья</span>
              </Link>
              <p className="text-[13px] leading-relaxed text-white/80">Официальный портал волонтёрского движения Приднестровья. Делаем мир лучше вместе с 2020 года.</p>
              <div className="flex gap-2.5 max-md:justify-center">
                {SOCIAL.map(s => (
                  <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.name} title={s.name}
                    className="vol-tap-2 relative grid h-10 w-10 place-items-center rounded-lg border border-white/25 bg-white/10 text-white backdrop-blur-md hover:border-vol-sky hover:text-vol-sky">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={SOCIAL_PATHS[s.key]} /></svg>
                  </a>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 max-md:text-center">
              {COLUMNS.map(col => (
                <div key={col.title}>
                  <h2 className="vol-label mb-2 text-vol-sky">{col.title}</h2>
                  <ul className="flex flex-col text-[13px]">
                    {col.items.map(it => (
                      <li key={it.to}><Link to={it.to} className="inline-block py-1 text-white/85 no-underline hover:text-white">{it.label}</Link></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="max-md:text-center">
              <h2 className="vol-label mb-3 text-vol-sky">Контакты</h2>
              <ul className="flex flex-col gap-2.5 text-[13px] max-md:items-center">
                {CONTACTS.map(c => (
                  <li key={c.v} className="flex items-start gap-2.5 max-md:justify-center">
                    <span className="mt-0.5 shrink-0 text-vol-sky"><VolIcon n={c.icon} size={15} /></span>
                    <span className="min-w-0 select-text break-words font-medium text-white/90">
                      {c.href ? <a href={c.href} className="text-white/90 no-underline hover:text-white">{c.v}</a> : c.v}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-1 text-center text-[12.5px] text-white/75 md:flex-row md:items-center md:justify-between md:text-left">
          <p>© 2020–2026 Волонтёры Приднестровья. Все права защищены.</p>
          <div className="flex flex-wrap justify-center gap-x-4">
            {LEGAL.map(l => <Link key={l.to} to={l.to} className="inline-block py-1 text-white/75 no-underline hover:text-vol-sky">{l.label}</Link>)}
          </div>
        </div>
      </div>
    </footer>
  );
}
