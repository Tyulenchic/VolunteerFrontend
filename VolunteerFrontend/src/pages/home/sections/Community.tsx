import { VolButton } from '../../../components/afisha/VolButton';
import people from '../../../assets/home/community.webp';

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

/**
 * «Наше сообщество» — светлая редакционная секция: заголовок и текст на фоне страницы, фото 4:5 с мягким декором из палитры,
 * единственный тёмный (изумрудный) контейнер — список преимуществ. Декор скрыт на телефоне, фото уходит под текст.
 */
export function Community({ isAuthenticated, onRegister }: Props) {
  return (
    <section className="wrap relative z-10 pb-[var(--section-y)]" aria-labelledby="community-title">
      <div className="grid items-center gap-10 sm:gap-12 lg:grid-cols-[1.1fr_.9fr] lg:gap-16">
        <div className="min-w-0 max-lg:text-center">
          <h2 id="community-title" className="vol-h2">Наше сообщество</h2>
          <p className="mt-3 max-w-[34rem] text-body-sm text-vol-muted max-lg:mx-auto">
            Волонтёры Приднестровья — это большая команда неравнодушных людей, которые меняют Приднестровье к лучшему каждый день.
          </p>

          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-4 rounded-sheet bg-vol-emerald p-4 text-left text-white shadow-float sm:gap-x-8 sm:gap-y-5 sm:p-8">
            {PERKS.map(p => (
              <li key={p.t} className="min-w-0">
                <span className="flex items-center gap-2.5">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-vol-sky" aria-hidden="true" />
                  <span className="font-display text-body-sm font-bold leading-tight sm:text-h3">{p.t}</span>
                </span>
                <span className="mt-1 block pl-[1.125rem] text-meta leading-snug text-white/90 sm:mt-1.5 sm:text-ctrl">{p.d}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex max-lg:justify-center max-sm:[&>*]:w-full">
            {isAuthenticated
              ? <VolButton kind="primary" icon="arrow" to="/profile">Мой профиль</VolButton>
              : <VolButton kind="primary" icon="arrow" onClick={onRegister} aria-haspopup="dialog">Присоединиться</VolButton>}
          </div>
        </div>

        <div className="relative min-w-0 max-lg:mx-auto max-lg:w-full max-lg:max-w-[26rem]">
          <span className="absolute -right-4 -top-4 hidden h-3/4 w-3/4 rounded-[2rem] bg-vol-decor sm:block" aria-hidden="true" />
          <span className="vol-dots absolute -bottom-5 -left-5 hidden h-24 w-24 opacity-50 sm:block" aria-hidden="true" />
          <img src={people} alt="Волонтёры на выездном мероприятии" draggable={false} loading="lazy"
            className="relative block aspect-[4/3] w-full rounded-sheet sm:aspect-[4/5] border border-vol-line object-cover" style={{ objectPosition: '50% 35%' }} />
        </div>
      </div>
    </section>
  );
}
