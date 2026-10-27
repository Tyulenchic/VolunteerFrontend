import { BlockAction, VolButton } from '../../../components/afisha/VolButton';
import communityBg from '../../../assets/home/community-bg.webp';
import people from '../../../assets/home/community.jpg';

// Static content: there is no API for these blocks.
const PERKS = [
  { t: 'Общение', d: 'С единомышленниками из разных городов' },
  { t: 'Обмен опытом', d: 'Делимся знаниями и идеями' },
  { t: 'Совместные проекты', d: 'Запускаем инициативы вместе' },
  { t: 'Поддержка', d: 'Мотивируем друг друга' },
] as const;

interface Props {
  isAuthenticated: boolean;
  onRegister: () => void;
}

export function Community({ isAuthenticated, onRegister }: Props) {
  return (
    <section className="relative z-10 mx-auto max-w-[76rem] px-4 pb-32 sm:px-6">
      <div className="on-dark relative isolate overflow-hidden rounded-3xl text-white shadow-[0_30px_60px_rgba(8,26,56,.28)]">
        <div className="absolute inset-0 -z-10 bg-[#061427]" aria-hidden="true">
          <img src={communityBg} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: '55% 50%' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(245deg, rgba(6,20,42,.86) 0%, rgba(8,42,64,.76) 50%, rgba(5,52,50,.68) 100%)' }} />
          <div className="absolute -right-28 -top-28 h-[28rem] w-[28rem] rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(182,239,214,.18), rgba(182,239,214,0))' }} />
          <div className="absolute -bottom-40 -left-20 h-[30rem] w-[30rem] rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(56,120,255,.3), rgba(56,120,255,0))' }} />
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.5), transparent)' }} />
          <svg className="absolute -right-24 -top-24 h-[28rem] w-[28rem] opacity-40 max-md:hidden" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="46" stroke="#fff" strokeWidth=".25" strokeDasharray=".6 2.2" strokeLinecap="round" />
            <circle cx="50" cy="50" r="34" stroke="#fff" strokeWidth=".25" />
            <circle cx="50" cy="50" r="22" stroke="#b6efd6" strokeWidth=".3" />
          </svg>
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 560" preserveAspectRatio="xMidYMid slice" fill="none">
            <g stroke="#fff" strokeLinecap="round">
              <path d="M-60 470C180 360 380 560 640 450S1020 360 1260 440" strokeOpacity=".16" strokeWidth="1" />
              <path d="M-60 520C200 410 400 600 660 490S1030 410 1260 490" stroke="#b6efd6" strokeOpacity=".22" strokeWidth="1" />
            </g>
          </svg>
          <div className="vol-grain absolute inset-0" />
        </div>

        <div className="relative grid items-center gap-10 p-7 sm:p-12 lg:grid-cols-[1.1fr_.9fr] lg:gap-14 lg:p-14">
          <div className="min-w-0 max-md:text-center">
            <h2 className="vol-h2">Наше сообщество</h2>
            <p className="mt-3 max-w-[32rem] text-[14.5px] leading-relaxed text-white/90 max-md:mx-auto">
              Волонтёры Приднестровья — это большая команда неравнодушных людей, которые меняют Приднестровье к лучшему каждый день.
            </p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {PERKS.map(p => (
                <li key={p.t} className="vol-glass-dark rounded-xl p-4 max-md:text-center">
                  <span className="font-display block text-[1.05rem] font-bold">{p.t}</span>
                  <span className="mt-1 block text-[13.5px] leading-snug text-white/90">{p.d}</span>
                </li>
              ))}
            </ul>
            <BlockAction className="mt-9">
              {isAuthenticated
                ? <VolButton kind="light" icon="arrow" to="/profile">Мой профиль</VolButton>
                : <VolButton kind="light" icon="arrow" onClick={onRegister} aria-haspopup="dialog">Присоединиться</VolButton>}
            </BlockAction>
          </div>
          <div className="min-w-0">
            <div className="mx-auto w-full max-w-[30rem] overflow-hidden rounded-2xl border border-white/20">
              <img src={people} alt="Волонтёры на выездном мероприятии" draggable={false} className="block aspect-square w-full object-cover" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
