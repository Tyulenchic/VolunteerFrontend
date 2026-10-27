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
    <section className="on-dark relative z-10 isolate overflow-hidden py-32 text-white">
      <div className="absolute inset-0 -z-10 bg-[#061427]" aria-hidden="true">
        <img src={stepsBg} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: '50% 60%' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(115deg, rgba(6,20,42,.82) 0%, rgba(8,42,64,.7) 55%, rgba(5,52,50,.64) 100%)' }} />
        <div className="absolute -left-32 -top-32 h-[30rem] w-[30rem] rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(182,239,214,.2), rgba(182,239,214,0))' }} />
        <div className="absolute -bottom-40 -right-24 h-[34rem] w-[34rem] rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(56,120,255,.3), rgba(56,120,255,0))' }} />
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.5), transparent)' }} />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" fill="none">
          <g stroke="#fff" strokeLinecap="round">
            <path d="M-60 430C170 300 360 540 620 410S1010 300 1260 390" strokeOpacity=".16" strokeWidth="1" />
            <path d="M-60 480C190 360 380 580 640 450S1020 350 1260 440" stroke="#b6efd6" strokeOpacity=".22" strokeWidth="1" />
            <circle cx="1030" cy="130" r="170" strokeOpacity=".2" strokeWidth=".9" strokeDasharray="2 8" />
            <circle cx="130" cy="520" r="150" strokeOpacity=".16" strokeWidth=".9" strokeDasharray="2 8" />
          </g>
        </svg>
        <div className="vol-grain absolute inset-0" />
      </div>

      <div className="mx-auto max-w-[76rem] px-4 sm:px-6">
        <div className="mb-14 max-w-2xl max-md:mx-auto max-md:text-center">
          <h2 className="vol-h2">Как начать путь волонтёра</h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-white/90">Всего четыре простых шага</p>
        </div>
        <ol className="grid gap-10 md:grid-cols-4 md:gap-8">
          {STEPS.map((s, k) => (
            <li key={s.t} className="group relative pt-8 max-md:text-center md:pt-10">
              <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-vol-mint ring-[1.5px] ring-white md:left-0 md:translate-x-0" aria-hidden="true" />
              <span className="absolute -bottom-[2.3rem] left-1/2 h-[1.9rem] w-px -translate-x-1/2 bg-white/35 group-last:hidden md:hidden" aria-hidden="true" />
              <span className="absolute -right-8 left-5 top-[4.5px] hidden h-px bg-white/35 group-last:hidden md:block" aria-hidden="true" />
              <div className="vol-glass-dark relative h-full overflow-hidden rounded-2xl p-5 pt-4">
                <span className="font-display relative block text-[2.6rem] font-extrabold leading-none tabular-nums text-vol-mint" aria-hidden="true">{k + 1}</span>
                <h3 className="font-display relative mt-3 text-[1.05rem] font-bold">{s.t}</h3>
                <p className="relative mt-1.5 text-[13.5px] leading-relaxed text-white/90">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
        <BlockAction className="mt-14">
          {isAuthenticated
            ? <VolButton kind="light" icon="arrow" to="/events">К мероприятиям</VolButton>
            : <VolButton kind="light" icon="arrow" onClick={onRegister} aria-haspopup="dialog">Зарегистрироваться</VolButton>}
        </BlockAction>
      </div>
    </section>
  );
}
