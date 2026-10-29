/**
 * Декоративный анимированный фон шапки страницы: под каплями «гуляет» мягкий свет, по фону плывут и меняют форму
 * капли в гамме синий / фиолетовый / бирюзовый / розовый, маленькие капли всплывают, время от времени проходит блик,
 * всплывают иконки темы страницы. Только CSS (.hero-backdrop* в index.css), скрыт от скринридеров.
 * Родитель должен быть relative overflow-hidden, контент — relative z-10.
 */
type Tone = 'blue' | 'violet' | 'teal' | 'pink';

const ICONS: Record<'volunteers' | 'organizers', [string, Tone][]> = {
  volunteers: [['fa-heart', 'pink'], ['fa-hand-holding-heart', 'blue'], ['fa-leaf', 'teal'], ['fa-seedling', 'teal'], ['fa-hands-helping', 'violet'], ['fa-heart', 'pink']],
  organizers: [['fa-star', 'violet'], ['fa-calendar-check', 'blue'], ['fa-bullhorn', 'pink'], ['fa-flag', 'teal'], ['fa-users', 'blue'], ['fa-star', 'violet']],
};

// Позиции и тайминги иконок заданы заранее: фон одинаков при каждом рендере
const FLOATERS = [
  { left: '6%', top: '62%', size: 1.6, dur: 14, delay: 0 },
  { left: '16%', top: '18%', size: 1.1, dur: 17, delay: -6 },
  { left: '28%', top: '78%', size: 0.9, dur: 12, delay: -3 },
  { left: '72%', top: '70%', size: 1.3, dur: 16, delay: -9 },
  { left: '84%', top: '22%', size: 1.7, dur: 19, delay: -2 },
  { left: '93%', top: '58%', size: 1, dur: 13, delay: -11 },
];

export function AnimatedBackdrop({ variant }: { variant: keyof typeof ICONS }) {
  return (
    <div className="hero-backdrop" aria-hidden>
      <span className="hero-backdrop__light hero-backdrop__light--1" />
      <span className="hero-backdrop__light hero-backdrop__light--2" />
      {[1, 2, 3, 4].map(n => <span key={n} className={`hero-backdrop__drop hero-backdrop__drop--${n}`} />)}
      {[5, 6, 7].map(n => <span key={n} className={`hero-backdrop__drop hero-backdrop__drop--rise hero-backdrop__drop--${n}`} />)}
      <span className="hero-backdrop__beam" />
      {FLOATERS.map((f, i) => {
        const [icon, tone] = ICONS[variant][i];
        return (
          <i
            key={i}
            className={`fas ${icon} hero-backdrop__icon hero-backdrop__icon--${tone}`}
            style={{ left: f.left, top: f.top, fontSize: `${f.size}rem`, animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s` }}
          />
        );
      })}
    </div>
  );
}
