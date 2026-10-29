import { BlockAction, VolButton } from '../../../components/afisha/VolButton';
import stepsBg from '../../../assets/home/steps-bg.webp';

// Static content: there is no API for these blocks.
const STEPS = [
  { t: 'Зарегистрируйтесь', d: 'Заполните простую форму за 5 минут' },
  { t: 'Заполните профиль', d: 'Расскажите о себе и своих интересах' },
  { t: 'Выберите мероприятие', d: 'Просмотрите календарь событий' },
  { t: 'Примите участие', d: 'Приходите и делайте мир лучше!' },
] as const;

interface Props {
  isAuthenticated: boolean;
  onRegister: () => void;
}

export function Steps({ isAuthenticated, onRegister }: Props) {
  return (
    <section className="on-dark relative z-10 isolate overflow-hidden py-[var(--section-y)] text-white">
      <div className="absolute inset-0 -z-10 bg-vol-head" aria-hidden="true">
        <img src={stepsBg} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: '50% 60%' }} />
        <div className="vol-veil absolute inset-0" />
        <div className="vol-glow vol-glow-sky absolute -left-32 -top-32 h-[30rem] w-[30rem] max-md:hidden" />
        <div className="vol-glow vol-glow-brand absolute -bottom-40 -right-24 h-[34rem] w-[34rem] max-md:hidden" />
        <div className="vol-hairline absolute inset-x-0 top-0 h-px" />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" fill="none">
          <g stroke="#fff" strokeLinecap="round">
            <path d="M-60 430C170 300 360 540 620 410S1010 300 1260 390" strokeOpacity=".16" strokeWidth="1" />
            <path d="M-60 480C190 360 380 580 640 450S1020 350 1260 440" stroke="var(--vol-sky)" strokeOpacity=".22" strokeWidth="1" />
            <circle cx="1030" cy="130" r="170" strokeOpacity=".2" strokeWidth=".9" strokeDasharray="2 8" />
            <circle cx="130" cy="520" r="150" strokeOpacity=".16" strokeWidth=".9" strokeDasharray="2 8" />
          </g>
        </svg>
      </div>

      <div className="wrap">
        <div className="mb-8 max-w-2xl max-md:mx-auto max-md:text-center md:mb-14">
          <h2 className="vol-h2">Как начать путь волонтёра</h2>
          <p className="mt-3 text-ctrl leading-relaxed text-white/90">Всего четыре простых шага</p>
        </div>
        {/* Четыре шага всегда в одну строку. На телефоне — компактная шкала: номер на линии, под ним короткое название
            (описание остаётся для экранных чтецов); от 768px — карточки с описанием. */}
        <ol className="relative grid grid-cols-4 gap-2 sm:gap-4 md:gap-8">
          <span className="absolute inset-x-[12.5%] top-[1.125rem] h-px bg-white/35 md:hidden" aria-hidden="true" />
          {STEPS.map((s, k) => (
            <li key={s.t} className="group relative min-w-0 text-center md:pt-10 md:text-left">
              <span className="absolute left-0 top-0 hidden h-2.5 w-2.5 rounded-full bg-vol-sky ring-[1.5px] ring-white md:block" aria-hidden="true" />
              <span className="absolute -right-8 left-5 top-[4.5px] hidden h-px bg-white/35 group-last:hidden md:block" aria-hidden="true" />
              <span className="font-display relative mx-auto grid h-9 w-9 place-items-center rounded-full bg-vol-sky text-body-sm font-extrabold tabular-nums text-vol-head ring-4 ring-[color-mix(in_srgb,var(--pal-ink)_80%,transparent)] md:hidden" aria-hidden="true">{k + 1}</span>
              <div className="vol-glass-dark relative mt-3 h-[calc(100%-3rem)] overflow-hidden rounded-card px-1.5 py-2.5 transition-transform duration-300 sm:px-3 md:mt-0 md:h-full md:rounded-panel md:p-5 md:pt-4 md:hover:-translate-y-1">
                <span className="font-display relative hidden text-[2.6rem] font-extrabold leading-none tabular-nums text-vol-sky md:block" aria-hidden="true">{k + 1}</span>
                <h3 className="font-display relative text-[0.75rem] font-bold leading-tight [hyphens:auto] sm:text-meta md:mt-3 md:text-h3">{s.t}</h3>
                <p className="relative mt-1.5 text-meta leading-relaxed text-white/90 max-md:sr-only">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
        <BlockAction className="mt-10 md:mt-14">
          {isAuthenticated
            ? <VolButton kind="light" icon="arrow" to="/events">К мероприятиям</VolButton>
            : <VolButton kind="light" icon="arrow" onClick={onRegister} aria-haspopup="dialog">Зарегистрироваться</VolButton>}
        </BlockAction>
      </div>
    </section>
  );
}
