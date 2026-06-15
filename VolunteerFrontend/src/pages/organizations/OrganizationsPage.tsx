import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import { useFeedback } from '../../context/FeedbackContext';

export const CAT_LABELS: Record<OrgCategory | 'all', string> = {
  all:       'Все направления',
  eco:       'Экология',
  social:    'Соц. помощь',
  patriotic: 'Патриотическое',
  cultural:  'Культурное',
  sport:     'Спорт',
  zoo:       'Зооволонтерство',
  youth:     'Молодёжь',
  health:    'Здоровье',
};

const CAT_ICONS: Record<OrgCategory | 'all', string> = {
  all:       '',
  eco:       'fa-leaf',
  social:    'fa-hands-helping',
  patriotic: 'fa-flag',
  cultural:  'fa-theater-masks',
  sport:     'fa-running',
  zoo:       'fa-paw',
  youth:     'fa-graduation-cap',
  health:    'fa-heartbeat',
};

export const CAT_BADGE: Record<OrgCategory, string> = {
  eco:       'bg-green-100 text-green-700',
  social:    'bg-red-100 text-red-700',
  patriotic: 'bg-blue-100 text-blue-800',
  cultural:  'bg-purple-100 text-purple-700',
  sport:     'bg-orange-100 text-orange-700',
  zoo:       'bg-amber-100 text-amber-700',
  youth:     'bg-indigo-100 text-indigo-700',
  health:    'bg-pink-100 text-pink-700',
};

export const CAT_BADGE_LABEL: Record<OrgCategory, string> = {
  eco:       'Экология',
  social:    'Соц. помощь',
  patriotic: 'Патриотическое',
  cultural:  'Культурное',
  sport:     'Спорт',
  zoo:       'Зооволонтерство',
  youth:     'Молодёжь',
  health:    'Здоровье',
};

export function OrganizationsPage() {
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [cat, setCat] = useState<OrgCategory | 'all'>('all');
  const [searchRaw, setSearchRaw] = useState('');
  const [search, setSearch] = useState('');
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const { openFeedback } = useFeedback();

  const onSearch = (v: string) => {
    setSearchRaw(v);
    if (timer) clearTimeout(timer);
    setTimer(setTimeout(() => setSearch(v), 300));
  };

  const filtered = ORGS
      .filter(o => cat === 'all' || o.categories.includes(cat))
      .filter(o =>
          !search ||
          o.searchKey.toLowerCase().includes(search.toLowerCase()) ||
          o.name.toLowerCase().includes(search.toLowerCase())
      );

  return (
      <>
        {/* HERO */}
        <section className="bg-gradient-to-br from-teal-50 to-blue-50 py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-gray-900 mb-6 leading-tight">
                Волонтёрские организации <span className="text-primary">Приднестровья</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Познакомьтесь с командами, которые ежедневно делают мир вокруг нас лучше.
                Найдите организацию, близкую вам по духу, и вступайте в ряды добровольцев.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {['Проверенные организации', 'Прямая связь с командой'].map(b => (
                    <div key={b} className="flex items-center gap-2 text-gray-600 bg-white px-4 py-2 rounded-xl shadow-sm">
                      <i className="fas fa-check-circle text-primary" />
                      <span>{b}</span>
                    </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FILTERS */}
        <section className="py-5 bg-white border-b border-gray-200 sticky top-16 z-30 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:w-96">
                <input
                    value={searchRaw}
                    onChange={e => onSearch(e.target.value)}
                    placeholder="Поиск организации..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                />
                <i className="fas fa-search absolute left-3.5 top-3 text-gray-400" />
              </div>
              <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 no-scrollbar">
                {(['all', 'eco', 'social', 'patriotic', 'cultural', 'sport', 'zoo', 'youth', 'health'] as Array<OrgCategory | 'all'>).map(k => (
                    <button
                        key={k}
                        onClick={() => setCat(k)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                            cat === k
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                        }`}
                    >
                      {CAT_ICONS[k] && <i className={`fas ${CAT_ICONS[k]} mr-1`} />}
                      {CAT_LABELS[k]}
                    </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* GRID */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {filtered.length === 0 ? (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-200 rounded-full mb-4">
                    <i className="fas fa-search text-3xl text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Ничего не найдено</h3>
                  <p className="text-gray-600">Попробуйте изменить параметры поиска или категорию.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filtered.map(org => (
                      <article
                          key={org.id}
                          className="group relative bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-primary/30 transition-all duration-300 overflow-hidden pt-14 flex flex-col"
                      >
                        {/* bg image */}
                        {org.bgImg && (
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: `url('${org.bgImg}')`, opacity: 0.07 }}
                            />
                        )}
                        {/* logo */}
                        <div className="absolute -top-0 left-1/2 -translate-x-1/2 translate-y-4">
                          <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-gray-100">
                            <i className={`${org.icon} text-3xl ${org.iconColor}`} />
                          </div>
                        </div>

                        <div className="relative p-8 pt-6 flex flex-col flex-grow text-center">
                          {/* category badges */}
                          <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                            {org.categories.slice(0, 2).map(c => (
                                <span key={c} className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${CAT_BADGE[c]}`}>
                          {CAT_BADGE_LABEL[c]}
                        </span>
                            ))}
                            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase">
                        {org.city}
                      </span>
                          </div>

                          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition">
                            {org.shortName}
                          </h3>
                          <p className="text-gray-600 text-sm mb-4 leading-relaxed flex-grow">
                            {org.description}
                          </p>

                          <div className="flex justify-center gap-6 mb-5 border-t border-gray-100 py-3">
                            {org.stats.map(s => (
                                <div key={s.label} className="text-center">
                                  <div className="text-lg font-bold text-primary">{s.value}</div>
                                  <div className="text-xs text-gray-500">{s.label}</div>
                                </div>
                            ))}
                          </div>

                          {/* ── TWO-BUTTON ROW ── */}
                          <div className="flex gap-2">
                            {/* Подробнее */}
                            <button
                                onClick={() => navigate(`/organizations/${org.id}`)}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition text-sm"
                            >
                              <i className="fas fa-info-circle" />
                              Подробнее
                            </button>
                          </div>
                        </div>
                      </article>
                  ))}
                </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary py-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-dark/30 rounded-full -ml-20 -mb-20 blur-3xl" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-6">
              Представить свою организацию?
            </h2>
            <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">
              Если вы руководите волонтёрской инициативой и хотите попасть в наш каталог — отправьте заявку.
              Мы будем рады сотрудничеству!
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                  onClick={() => notify('Форма заявки скоро будет доступна!', 'info')}
                  className="px-8 py-4 bg-white text-primary font-bold rounded-xl hover:bg-gray-100 transition shadow-lg"
              >
                <i className="fas fa-paper-plane mr-2" />Подать заявку
              </button>
              <button
                  onClick={openFeedback}
                  className="px-8 py-4 bg-transparent text-white border-2 border-white font-bold rounded-xl hover:bg-white/10 transition"
              >
                <i className="fas fa-envelope mr-2" />Написать нам
              </button>
            </div>
          </div>
        </section>
      </>
  );
}

export type OrgCategory = 'eco' | 'social' | 'patriotic' | 'cultural' | 'sport' | 'zoo' | 'youth' | 'health';
export type OrgLevel = 'school' | 'college' | 'university';
export type OrgCity =
    | 'Тирасполь'
    | 'Бендеры'
    | 'Слободзея'
    | 'Дубоссары'
    | 'Григориополь'
    | 'Рыбница'
    | 'Каменка';

export interface OrgStat {
  label: string;
  value: string;
}

export interface VolunteerMovement {
  name: string;
  directions: string[];
  leader: string;
  phone?: string;
  email?: string;
}

export interface Organization {
  id: string;
  name: string;
  shortName: string;
  city: OrgCity;
  level: OrgLevel;
  categories: OrgCategory[];
  movements: VolunteerMovement[];
  icon: string;
  iconColor: string;
  bgImg: string;
  description: string;
  searchKey: string;
  stats: OrgStat[];
}

// ─── helpers ────────────────────────────────────────────────────────────────
const eco = (name: string, leader: string, phone?: string, email?: string): VolunteerMovement =>
    ({ name, directions: ['Экологическое'], leader, phone, email });
const social = (name: string, leader: string, phone?: string, email?: string): VolunteerMovement =>
    ({ name, directions: ['Социальное'], leader, phone, email });
const patriotic = (name: string, leader: string, phone?: string, email?: string): VolunteerMovement =>
    ({ name, directions: ['Гражданско-патриотическое'], leader, phone, email });

// ─── DATA ───────────────────────────────────────────────────────────────────
export const ORGS: Organization[] = [

  // ══════════════════════════════════════════════════════════
  // Тирасполь — общее образование
  // ══════════════════════════════════════════════════════════
  {
    id: 'rmtl',
    name: 'ГОУ «Республиканский молдавский теоретический лицей-комплекс»',
    shortName: 'Республиканский молдавский ТЛК',
    city: 'Тирасполь',
    level: 'school',
    categories: ['eco', 'social', 'cultural', 'patriotic'],
    movements: [
      {
        name: 'Приетиние («Дружба»)',
        directions: ['Экологическое', 'Патриотическое', 'Культурное', 'Социальное'],
        leader: 'Греча Светлана Леонидовна / Мицул Елена Михайловна',
        phone: '779 56497 / 778 31707',
        email: 'rmtl@list.ru',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-teal-500',
    bgImg: '',
    description: 'Волонтёрское движение «Приетиние» объединяет экологическое, патриотическое, культурное и социальное направления добровольчества.',
    searchKey: 'республиканский молдавский лицей приетиние дружба тирасполь',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '4' }],
  },
  {
    id: 'school3-tiraspol',
    name: 'МОУ «Тираспольская средняя школа № 3 им. А.П. Чехова»',
    shortName: 'Школа № 3 им. А.П. Чехова',
    city: 'Тирасполь',
    level: 'school',
    categories: ['social', 'patriotic', 'eco', 'sport', 'cultural'],
    movements: [
      {
        name: 'Лидер-доброволец',
        directions: ['Культурное', 'Спортивное'],
        leader: 'Кичкина Валерия Владиславовна',
        phone: '778 29886',
      },
      {
        name: 'Звезда',
        directions: ['Гражданско-патриотическое'],
        leader: 'Банцгаф Павел Юрьевич',
        phone: '779 40395',
      },
      {
        name: 'Автостоп',
        directions: ['Социальное'],
        leader: 'Кичкина Валерия Владиславовна',
        phone: '778 29886',
      },
      {
        name: 'Шрек 3',
        directions: ['Экологическое'],
        leader: 'Метелева Наталья Юрьевна',
        phone: '777 90480',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-blue-500',
    bgImg: '',
    description: 'Четыре волонтёрских движения охватывают культурное, спортивное, патриотическое, социальное и экологическое направления.',
    searchKey: 'тираспольская школа 3 чехов лидер доброволец звезда автостоп шрек',
    stats: [{ label: 'Движений', value: '4' }, { label: 'Направлений', value: '5' }],
  },
  {
    id: 'school5-tiraspol',
    name: 'МОУ «Тираспольская средняя школа №5»',
    shortName: 'Школа № 5',
    city: 'Тирасполь',
    level: 'school',
    categories: ['social', 'patriotic', 'eco', 'cultural', 'sport', 'zoo'],
    movements: [
      {
        name: 'Волонтеры Победы',
        directions: ['Социальное', 'Гражданско-патриотическое', 'Культурное', 'Экологическое', 'Зооволонтерство', 'Спортивное'],
        leader: 'Литвякова Екатерина Александровна',
        phone: '778 54895',
        email: 'katyusha0988@mail.ru',
      },
      {
        name: 'Юный эколог Приднестровья',
        directions: ['Экологическое', 'Зооволонтерство'],
        leader: 'Крамаренко Елена Павловна',
        phone: '777 97530',
        email: 'llesya1983@mail.ru',
      },
      {
        name: 'Юный инспектор дорожного движения',
        directions: ['Социальное', 'Профилактика детского дорожно-транспортного травматизма'],
        leader: 'Усова Ольга Григорьевна',
        phone: '777 73473',
        email: 'vsova-ojga1971@mail.ru',
      },
      {
        name: 'Юный патриот Приднестровья',
        directions: ['Гражданско-патриотическое'],
        leader: 'Пурчел Виктор Иванович',
        phone: '777 82713',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-green-500',
    bgImg: '',
    description: 'Широкий спектр: от зооволонтерства и экологии до патриотического воспитания и безопасности дорожного движения.',
    searchKey: 'тираспольская школа 5 волонтеры победы юный эколог патриот',
    stats: [{ label: 'Движений', value: '4' }, { label: 'Направлений', value: '6' }],
  },
  {
    id: 'school7-tiraspol',
    name: 'МОУ «Тираспольская средняя школа №7»',
    shortName: 'Школа № 7',
    city: 'Тирасполь',
    level: 'school',
    categories: ['social', 'eco', 'patriotic'],
    movements: [
      {
        name: 'Волонтеры Победы',
        directions: ['Социальное'],
        leader: 'Ковальчук Вера Михайловна',
        phone: '778 43701',
        email: '77843701@mail.ru',
      },
      {
        name: 'ЭКО отряд',
        directions: ['Экологическое (раздельный сбор, макулатура, озеленение, кормушки)'],
        leader: 'Боярчук Д.Е.',
        phone: '778 25053',
        email: 'kudelinad@mail.ru',
      },
      {
        name: 'ЮПП',
        directions: ['Гражданско-патриотическое'],
        leader: 'Станишевская В.И.',
        phone: '0778 14700',
        email: 'stanishevskaja62@mail.ru',
      },
      {
        name: 'ЮИД',
        directions: ['Мероприятия и акции по ПДД'],
        leader: 'Ковальчук Вера Михайловна',
        phone: '778 43701',
        email: '77843701@mail.ru',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-purple-500',
    bgImg: '',
    description: 'Четыре активных отряда: социальный, экологический, патриотический и по безопасности дорожного движения.',
    searchKey: 'тираспольская школа 7 волонтеры победы эко отряд юпп юид',
    stats: [{ label: 'Движений', value: '4' }, { label: 'Направлений', value: '3' }],
  },
  {
    id: 'school8-tiraspol',
    name: 'МОУ «Тираспольская средняя школа-комплекс №8»',
    shortName: 'Школа-комплекс № 8',
    city: 'Тирасполь',
    level: 'school',
    categories: ['social', 'patriotic', 'eco', 'cultural', 'sport'],
    movements: [
      {
        name: 'Мы рядом!',
        directions: ['Социальное', 'Культурное', 'Спортивное'],
        leader: 'Куруч Ирина Константиновна',
        phone: '777 51241',
        email: 'i.k.kuruch@gmail.com',
      },
      {
        name: 'Родина',
        directions: ['Гражданско-патриотическое'],
        leader: 'Мошин Сергей Николаевич',
        phone: '779 40478',
        email: 'mosinsergej36@gmail.com',
      },
      {
        name: 'Экопатруль / Экология и жизнь',
        directions: ['Экологическое'],
        leader: 'Дукрин Ирина Викторовна',
        phone: '777 98998',
        email: 'rina-1985@mail.ru',
      },
      {
        name: 'ЮИД',
        directions: ['Социальное (ПДД)'],
        leader: 'Латий Анастасия Юрьевна',
        phone: '779 86761',
        email: 'angel_1404@mail.ru',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-amber-500',
    bgImg: '',
    description: 'Разнообразная волонтёрская деятельность: от спорта и культуры до экопатруля и гражданского воспитания.',
    searchKey: 'тираспольская школа 8 мы рядом родина экопатруль юид',
    stats: [{ label: 'Движений', value: '4' }, { label: 'Направлений', value: '5' }],
  },
  {
    id: 'school9-tiraspol',
    name: 'МОУ «Тираспольская средняя школа № 9 им. С.А. Крупко»',
    shortName: 'Школа № 9 им. С.А. Крупко',
    city: 'Тирасполь',
    level: 'school',
    categories: ['social', 'eco', 'sport', 'patriotic', 'zoo'],
    movements: [
      {
        name: 'ШАНС',
        directions: ['Социальное', 'Экологическое', 'Спортивное', 'Патриотическое', 'Зооволонтерство'],
        leader: 'Юнгова Ольга Васильевна',
        phone: '777 17494',
        email: 'oyungova@mail.ru',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-red-500',
    bgImg: '',
    description: 'Движение «ШАНС» — пять направлений в одном: социальное, экология, спорт, патриотика и помощь животным.',
    searchKey: 'тираспольская школа 9 крупко шанс',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '5' }],
  },
  {
    id: 'school10-tiraspol',
    name: 'МОУ «Тираспольская средняя школа №10»',
    shortName: 'Школа № 10',
    city: 'Тирасполь',
    level: 'school',
    categories: ['social'],
    movements: [
      social('Добрый след', 'Янковская Ирина Александровна', '777 08199', 'i.a.yankovskaya@yandex.ru'),
    ],
    icon: 'fas fa-school',
    iconColor: 'text-pink-500',
    bgImg: '',
    description: 'Волонтёрское движение «Добрый след» направлено на социальную поддержку нуждающихся.',
    searchKey: 'тираспольская школа 10 добрый след',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '1' }],
  },
  {
    id: 'school11-tiraspol',
    name: 'МОУ «Тираспольская средняя школа №11»',
    shortName: 'Школа № 11',
    city: 'Тирасполь',
    level: 'school',
    categories: ['social', 'patriotic'],
    movements: [
      {
        name: 'Наследники Победы',
        directions: ['Социальное', 'Гражданско-патриотическое'],
        leader: 'Власова А.О.',
        phone: '778 60757',
        email: 'alena_vlasova_88@mail.ru',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-orange-500',
    bgImg: '',
    description: '«Наследники Победы» ведут социальную и патриотическую работу с молодёжью.',
    searchKey: 'тираспольская школа 11 наследники победы',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '2' }],
  },
  {
    id: 'school12-tiraspol',
    name: 'МОУ «Тираспольская средняя школа-комплекс №12»',
    shortName: 'Школа-комплекс № 12',
    city: 'Тирасполь',
    level: 'school',
    categories: ['social', 'patriotic'],
    movements: [
      {
        name: 'Юные волонтеры',
        directions: ['Социальное', 'Гражданско-патриотическое'],
        leader: 'Чабанюк Елена Петровна',
        phone: '777 72288',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-lime-500',
    bgImg: '',
    description: 'Отряд «Юные волонтеры» объединяет школьников в социальных и патриотических инициативах.',
    searchKey: 'тираспольская школа 12 юные волонтеры',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '2' }],
  },
  {
    id: 'school14-tiraspol',
    name: 'МОУ «Тираспольская средняя школа №14»',
    shortName: 'Школа № 14',
    city: 'Тирасполь',
    level: 'school',
    categories: ['social', 'patriotic', 'eco', 'zoo'],
    movements: [
      {
        name: 'ЮИД',
        directions: ['Формирование культуры поведения на дорогах'],
        leader: 'Терещенко А.Г.',
        phone: '777 44430',
      },
      patriotic('ЮПП', 'Руденко А.А.', '778 49249'),
      {
        name: 'ЮЭП',
        directions: ['Природоохранные акции', 'Зооволонтерство'],
        leader: 'Дога И.Н.',
        phone: '777 26073',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-cyan-500',
    bgImg: '',
    description: 'Три отряда: безопасность на дорогах, патриотика и зооволонтерство с природоохранными акциями.',
    searchKey: 'тираспольская школа 14 юид юпп юэп',
    stats: [{ label: 'Движений', value: '3' }, { label: 'Направлений', value: '4' }],
  },
  {
    id: 'school15-tiraspol',
    name: 'МОУ «Тираспольская средняя школа №15»',
    shortName: 'Школа № 15',
    city: 'Тирасполь',
    level: 'school',
    categories: ['social', 'eco', 'patriotic'],
    movements: [
      social('DOбро (социальное)', 'Флока Елена Леонидовна', '777 18644', 'stavr1999@mail.ru'),
      eco('DOбро (экологическое)', 'Кириленко Елена Федоровна', '778 76509'),
      patriotic('DOбро (патриотическое)', 'Фрига Ирина Анатольевна', '779 91649', 'irafriga5@gmail.com'),
    ],
    icon: 'fas fa-school',
    iconColor: 'text-violet-500',
    bgImg: '',
    description: 'Бренд «DOбро» объединяет три отряда по социальному, экологическому и патриотическому направлениям.',
    searchKey: 'тираспольская школа 15 добро социальное экологическое патриотическое',
    stats: [{ label: 'Движений', value: '3' }, { label: 'Направлений', value: '3' }],
  },
  {
    id: 'school16-tiraspol',
    name: 'МОУ «Тираспольская средняя школа №16»',
    shortName: 'Школа № 16',
    city: 'Тирасполь',
    level: 'school',
    categories: ['patriotic'],
    movements: [
      patriotic('Пегас', 'Дудка Марианна Алексеевна', '778 90547'),
    ],
    icon: 'fas fa-school',
    iconColor: 'text-fuchsia-500',
    bgImg: '',
    description: 'Движение «Пегас» реализует гражданско-патриотическое воспитание среди школьников.',
    searchKey: 'тираспольская школа 16 пегас патриотическое',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '1' }],
  },
  {
    id: 'school18-tiraspol',
    name: 'МОУ «Тираспольская средняя школа с гимназическими классами №18»',
    shortName: 'Школа № 18 (с гимн. классами)',
    city: 'Тирасполь',
    level: 'school',
    categories: ['patriotic'],
    movements: [
      patriotic('Волонтеры Победы', 'Йордан Надежда Анатольевна', '777 65945', 'yordan00@mail.ru'),
    ],
    icon: 'fas fa-school',
    iconColor: 'text-sky-500',
    bgImg: '',
    description: 'Патриотическое движение «Волонтёры Победы» сохраняет историческую память.',
    searchKey: 'тираспольская школа 18 волонтеры победы',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '1' }],
  },
  {
    id: 'gymn-tiraspol',
    name: 'МОУ «Тираспольская гуманитарно-математическая гимназия»',
    shortName: 'Гуманитарно-математическая гимназия',
    city: 'Тирасполь',
    level: 'school',
    categories: ['social', 'patriotic', 'eco'],
    movements: [
      social('Поколение добра', 'Телегина Анастасия Игоревна', '775 98344', 'gymnasia-vr-61@mail.ru'),
      patriotic('Забота рядом', 'Китикарь Зинаида Дмитриевна', '777 50322', 'gymnasia-vr-61@mail.ru'),
      eco('ЭкоРитм', 'Савинкина Галина Александровна', '778 30230', 'gymnasia-vr-61@mail.ru'),
    ],
    icon: 'fas fa-graduation-cap',
    iconColor: 'text-indigo-500',
    bgImg: '',
    description: 'Гимназия реализует три движения: социальное «Поколение добра», патриотическое «Забота рядом» и экологическое «ЭкоРитм».',
    searchKey: 'тираспольская гимназия поколение добра забота рядом экоритм',
    stats: [{ label: 'Движений', value: '3' }, { label: 'Направлений', value: '3' }],
  },
  {
    id: 'lyceum-tiraspol',
    name: 'МОУ «Тираспольский общеобразовательный теоретический лицей»',
    shortName: 'Тираспольский ОТ Лицей',
    city: 'Тирасполь',
    level: 'school',
    categories: ['social', 'cultural', 'eco'],
    movements: [
      {
        name: 'Твори добро',
        directions: ['Социальное', 'Культурное', 'Экологическое'],
        leader: 'Калачёва Марина Владимировна / Барбулат Ольга Вячеславовна',
        phone: '777 74966',
        email: 'marinchik0728@gmail.com',
      },
    ],
    icon: 'fas fa-university',
    iconColor: 'text-emerald-500',
    bgImg: '',
    description: 'Движение «Твори добро» охватывает социальное, культурное и экологическое волонтерство.',
    searchKey: 'тираспольский лицей твори добро социальное культурное экологическое',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '3' }],
  },

  // ══════════════════════════════════════════════════════════
  // Бендеры — общее образование
  // ══════════════════════════════════════════════════════════
  {
    id: 'lyceum-benders',
    name: 'МОУ «Бендерский теоретический лицей им. Л.С. Берга»',
    shortName: 'ТЛ им. Л.С. Берга',
    city: 'Бендеры',
    level: 'school',
    categories: ['patriotic'],
    movements: [
      patriotic('Волонтеры Победы', 'Цуркан И.А.', '777 03765', 'benderytl@yandex.ru'),
    ],
    icon: 'fas fa-university',
    iconColor: 'text-red-600',
    bgImg: '',
    description: 'Движение «Волонтёры Победы» занимается гражданско-патриотическим воспитанием молодёжи.',
    searchKey: 'бендерский лицей берг волонтеры победы',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '1' }],
  },
  {
    id: 'gymn3-benders',
    name: 'МОУ «Бендерская гимназия №3 им. И.П. Котляревского»',
    shortName: 'Гимназия № 3 им. Котляревского',
    city: 'Бендеры',
    level: 'school',
    categories: ['eco', 'patriotic'],
    movements: [
      {
        name: 'Отряд «Следопыт»',
        directions: ['Экологическое', 'Гражданско-патриотическое'],
        leader: 'Борищук С.В.',
        phone: '778 50016',
        email: 'sveta.borishchuk@jmail.com',
      },
    ],
    icon: 'fas fa-graduation-cap',
    iconColor: 'text-green-600',
    bgImg: '',
    description: 'Отряд «Следопыт» совмещает экологические инициативы с патриотическим воспитанием.',
    searchKey: 'бендерская гимназия 3 котляревский следопыт',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '2' }],
  },
  {
    id: 'school2-benders',
    name: 'МОУ «Бендерская средняя общеобразовательная школа №2»',
    shortName: 'Школа № 2 (Бендеры)',
    city: 'Бендеры',
    level: 'school',
    categories: ['patriotic', 'eco'],
    movements: [
      patriotic('Доброе сердце', 'Григоренко Е.С.', '777 34224', 'jeniagrigorenko.74z@gmail.com'),
      eco('Зеленый патруль', 'Грудко Е.И.', '775 65759', 'ekaterinagrudko38@gmail.com'),
    ],
    icon: 'fas fa-school',
    iconColor: 'text-blue-600',
    bgImg: '',
    description: 'Патриотическое «Доброе сердце» и экологический «Зелёный патруль» — два активных движения школы.',
    searchKey: 'бендерская школа 2 доброе сердце зеленый патруль',
    stats: [{ label: 'Движений', value: '2' }, { label: 'Направлений', value: '2' }],
  },
  {
    id: 'school5-benders',
    name: 'МОУ «Бендерская средняя общеобразовательная школа №5»',
    shortName: 'Школа № 5 (Бендеры)',
    city: 'Бендеры',
    level: 'school',
    categories: ['eco', 'social', 'cultural'],
    movements: [
      {
        name: 'Открытые сердца',
        directions: ['Экологическое', 'Социальное', 'Культурно-массовое'],
        leader: 'Гринько С.И.',
        phone: '778 48228',
        email: 'grinkosvetlana388@gmail.com',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-teal-600',
    bgImg: '',
    description: 'Движение «Открытые сердца» объединяет экологическое, социальное и культурно-массовое направления.',
    searchKey: 'бендерская школа 5 открытые сердца',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '3' }],
  },
  {
    id: 'school11-benders',
    name: 'МОУ «Бендерская средняя общеобразовательная школа № 11 им. Ю.А. Гагарина»',
    shortName: 'Школа № 11 им. Гагарина',
    city: 'Бендеры',
    level: 'school',
    categories: ['patriotic'],
    movements: [
      patriotic('Волонтеры Победы', 'Бурыкина В.Т.', '778 77463', 'burukina.1965@gmail.com'),
    ],
    icon: 'fas fa-school',
    iconColor: 'text-purple-600',
    bgImg: '',
    description: 'Движение «Волонтёры Победы» им. Гагарина ведёт гражданско-патриотическую работу.',
    searchKey: 'бендерская школа 11 гагарин волонтеры победы',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '1' }],
  },
  {
    id: 'school13-benders',
    name: 'МОУ «Бендерская средняя общеобразовательная школа №13»',
    shortName: 'Школа № 13 (Бендеры)',
    city: 'Бендеры',
    level: 'school',
    categories: ['patriotic', 'cultural'],
    movements: [
      {
        name: 'Волонтеры Победы / 3D. Делаем добрые дела',
        directions: ['Гражданско-патриотическое', 'Патриотическое и историко-просветительское', 'Творческое'],
        leader: 'Казакова Т.А.',
        phone: '777 54396',
        email: 'tanechka.kazakova.81@inbox.ru',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-rose-500',
    bgImg: '',
    description: 'Объединённое движение «Волонтёры Победы» и «3D» — патриотика, история и творчество.',
    searchKey: 'бендерская школа 13 волонтеры победы 3d делаем добрые дела',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '3' }],
  },
  {
    id: 'school14-benders',
    name: 'МОУ «Бендерская средняя общеобразовательная школа №14»',
    shortName: 'Школа № 14 (Бендеры)',
    city: 'Бендеры',
    level: 'school',
    categories: ['patriotic'],
    movements: [
      patriotic('Волонтеры Победы', 'Влежу Л.Г.', '775 15519', 'vlezhu1973@mail.ru'),
    ],
    icon: 'fas fa-school',
    iconColor: 'text-amber-600',
    bgImg: '',
    description: 'Движение «Волонтёры Победы» ведёт гражданско-патриотическую деятельность.',
    searchKey: 'бендерская школа 14 волонтеры победы',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '1' }],
  },
  {
    id: 'school15-benders',
    name: 'МОУ «Бендерская средняя общеобразовательная школа №15»',
    shortName: 'Школа № 15 (Бендеры)',
    city: 'Бендеры',
    level: 'school',
    categories: ['patriotic'],
    movements: [
      patriotic('Волонтеры Победы', 'Зайцева М.П.', '777 12274', 'zaiceva1983@mail.ru'),
    ],
    icon: 'fas fa-school',
    iconColor: 'text-cyan-600',
    bgImg: '',
    description: 'Гражданско-патриотическое движение «Волонтёры Победы».',
    searchKey: 'бендерская школа 15 волонтеры победы',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '1' }],
  },
  {
    id: 'school16-benders',
    name: 'МОУ «Бендерская средняя общеобразовательная школа №16»',
    shortName: 'Школа № 16 (Бендеры)',
    city: 'Бендеры',
    level: 'school',
    categories: ['social', 'patriotic'],
    movements: [
      {
        name: 'ДОБРЫЕ СЕРДЦА',
        directions: ['Социальное', 'Гражданско-патриотическое'],
        leader: 'Клёван А.Д.',
        phone: '779 07804',
        email: 'anjelik-katy@mail.ru',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-pink-600',
    bgImg: '',
    description: '«Добрые сердца» — социальное и патриотическое добровольчество.',
    searchKey: 'бендерская школа 16 добрые сердца',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '2' }],
  },
  {
    id: 'school17-benders',
    name: 'МОУ «Бендерская средняя общеобразовательная школа №17»',
    shortName: 'Школа № 17 (Бендеры)',
    city: 'Бендеры',
    level: 'school',
    categories: ['social', 'eco', 'patriotic'],
    movements: [
      {
        name: 'Волонтеры Победы',
        directions: ['Социальное', 'Экологическое', 'Патриотическое'],
        leader: 'Ковтун М.С.',
        phone: '777 01691',
        email: 'marina.kovtun.66@list.ru',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-lime-600',
    bgImg: '',
    description: 'Движение «Волонтёры Победы» охватывает социальное, экологическое и патриотическое направления.',
    searchKey: 'бендерская школа 17 волонтеры победы',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '3' }],
  },
  {
    id: 'school18-benders',
    name: 'МОУ «Бендерская средняя общеобразовательная школа №18»',
    shortName: 'Школа № 18 (Бендеры)',
    city: 'Бендеры',
    level: 'school',
    categories: ['patriotic', 'social', 'eco'],
    movements: [
      {
        name: 'Волонтеры Победы',
        directions: ['Гражданско-патриотическое', 'Социальное', 'Экологическое'],
        leader: 'Виеру А.О.',
        phone: '775 6623',
        email: 'nastia.m95@mail.ru',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-orange-600',
    bgImg: '',
    description: 'Три направления в одном: патриотика, социальная помощь и экология.',
    searchKey: 'бендерская школа 18 волонтеры победы',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '3' }],
  },
  {
    id: 'school20-benders',
    name: 'МОУ «Бендерская средняя общеобразовательная школа №20»',
    shortName: 'Школа № 20 (Бендеры)',
    city: 'Бендеры',
    level: 'school',
    categories: ['patriotic', 'social', 'eco'],
    movements: [
      {
        name: 'Юный волонтер',
        directions: ['Гражданско-патриотическое', 'Социальное', 'Экологическое'],
        leader: 'Попова В.В.',
        phone: '779 40280',
        email: 'popovavalentinka8891@gmail.com',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-indigo-600',
    bgImg: '',
    description: '«Юный волонтёр» — комплексное движение: патриотика, социальная поддержка и экология.',
    searchKey: 'бендерская школа 20 юный волонтер',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '3' }],
  },

  // ══════════════════════════════════════════════════════════
  // Слободзейский район
  // ══════════════════════════════════════════════════════════
  {
    id: 'nezavertaylovka',
    name: 'МОУ «Незавертайловская ОШ-Д/С № 2»',
    shortName: 'Незавертайловская ОШ',
    city: 'Слободзея',
    level: 'school',
    categories: ['social', 'eco', 'sport'],
    movements: [
      {
        name: 'Штаб «Лидер-доброволец»',
        directions: ['Социальное', 'Экологическое', 'Событийное', 'Спортивное'],
        leader: 'Шакирова Надежда Михайловна',
        phone: '778 06562',
        email: 'Lunanad-m@mail.ru',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-green-500',
    bgImg: '',
    description: 'Штаб «Лидер-доброволец»: социальное, экологическое, событийное и спортивное направления.',
    searchKey: 'незавертайловка слободзея лидер доброволец',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '4' }],
  },
  {
    id: 'chobruchi',
    name: 'МОУ «Чобручская МСОШ №2»',
    shortName: 'Чобручская МСОШ №2',
    city: 'Слободзея',
    level: 'school',
    categories: ['social', 'eco', 'sport'],
    movements: [
      {
        name: 'Штаб «Лидер-доброволец»',
        directions: ['Социальное', 'Экологическое', 'Событийное', 'Спортивное'],
        leader: 'Талпа Оксана Михайловна',
        phone: '778 19007',
        email: 'oksana.talpa.80@mail.ru',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-teal-500',
    bgImg: '',
    description: 'Движение «Лидер-доброволец» реализует четыре направления деятельности.',
    searchKey: 'чобручская школа слободзея лидер доброволец',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '4' }],
  },
  {
    id: 'korotnoye',
    name: 'МОУ «Коротнянская РМСОШ»',
    shortName: 'Коротнянская РМСОШ',
    city: 'Слободзея',
    level: 'school',
    categories: ['social', 'eco', 'sport'],
    movements: [
      {
        name: 'Штаб «Лидер-доброволец»',
        directions: ['Социальное', 'Экологическое', 'Спортивное'],
        leader: 'Емельянова Ольга Яковлевна',
        phone: '775 05148',
        email: 'emelyanovaolya82@gmail.com',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-blue-500',
    bgImg: '',
    description: 'Социальное, экологическое и спортивное добровольчество в рамках движения «Лидер-доброволец».',
    searchKey: 'коротнянская школа слободзея лидер доброволец',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '3' }],
  },
  {
    id: 'slobodzeya-osh4',
    name: 'МОУ «Слободзейская ООШ №4»',
    shortName: 'Слободзейская ООШ №4',
    city: 'Слободзея',
    level: 'school',
    categories: ['eco', 'patriotic'],
    movements: [
      {
        name: 'Волонтёрское движение',
        directions: ['Духовно-нравственное', 'Экологическое', 'Патриотическое'],
        leader: 'Марьян Елена Павловна',
        phone: '779 52209',
        email: 'marianlena511@gmail.com',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-purple-500',
    bgImg: '',
    description: 'Духовно-нравственное, экологическое и патриотическое направления добровольчества.',
    searchKey: 'слободзейская школа 4 волонтерское движение',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '3' }],
  },
  {
    id: 'krasnaya-slobodzeya',
    name: 'МОУ «Краснянская СОШ»',
    shortName: 'Краснянская СОШ',
    city: 'Слободзея',
    level: 'school',
    categories: ['social'],
    movements: [
      social('Шагай за мной', 'Тоницой Татьяна Ивановна', '778 25340', 'tonico_1977@mail.ru'),
    ],
    icon: 'fas fa-school',
    iconColor: 'text-red-500',
    bgImg: '',
    description: 'Социальное волонтёрское движение «Шагай за мной».',
    searchKey: 'краснянская школа слободзея шагай за мной',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '1' }],
  },
  {
    id: 'slobodzeya-sosh1',
    name: 'МОУ «Слободзейская СОШ №1»',
    shortName: 'Слободзейская СОШ №1',
    city: 'Слободзея',
    level: 'school',
    categories: ['social'],
    movements: [
      {
        name: 'Доброе сердце',
        directions: ['Лидерская компетентность, гражданская позиция, социально-значимая деятельность'],
        leader: 'Табак Анна Федоровна',
        phone: '777 06085',
        email: 'school_lenina80@mail.ru',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-amber-500',
    bgImg: '',
    description: 'Движение «Доброе сердце» развивает лидерские компетенции и активную гражданскую позицию.',
    searchKey: 'слободзейская школа 1 доброе сердце',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '1' }],
  },
  {
    id: 'glinoe',
    name: 'МОУ «Глинойская СОШ»',
    shortName: 'Глинойская СОШ',
    city: 'Слободзея',
    level: 'school',
    categories: ['social', 'patriotic'],
    movements: [
      {
        name: 'Я-Доброволец',
        directions: ['Лидерская компетентность, гражданская позиция, социально-значимая деятельность'],
        leader: 'Гордиенко Татьяна Николаевна',
        phone: '775 37310',
        email: 'glinoyesoh@mail.ru',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-cyan-500',
    bgImg: '',
    description: '«Я-Доброволец» — движение, формирующее активную гражданскую позицию молодёжи.',
    searchKey: 'глинойская школа слободзея я доброволец',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '1' }],
  },
  {
    id: 'frunze-slobodzeya',
    name: 'МОУ «Фрунзенская СОШ»',
    shortName: 'Фрунзенская СОШ',
    city: 'Слободзея',
    level: 'school',
    categories: ['patriotic', 'eco'],
    movements: [
      {
        name: 'Тимуровцы',
        directions: ['Духовно-нравственное', 'Экологическое', 'Патриотическое'],
        leader: 'Албук Татьяна Александровна',
        phone: '779 65607',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-emerald-500',
    bgImg: '',
    description: 'Движение «Тимуровцы» — духовно-нравственное, экологическое и патриотическое воспитание.',
    searchKey: 'фрунзенская школа слободзея тимуровцы',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '3' }],
  },
  {
    id: 'kitskany1',
    name: 'МОУ «Кицканская СОШ №1»',
    shortName: 'Кицканская СОШ №1',
    city: 'Слободзея',
    level: 'school',
    categories: ['social', 'eco', 'patriotic', 'zoo'],
    movements: [
      {
        name: 'Бумеранг добра',
        directions: ['Социальное', 'Экологическое', 'Патриотическое', 'Образовательное', 'Зооволонтёрство'],
        leader: 'Руссу Елена Вячеславовна',
        phone: '777 46726',
        email: 'yelena.russu.00@mail.ru',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-violet-500',
    bgImg: '',
    description: '«Бумеранг добра» — пять направлений: от зооволонтерства до образовательной деятельности.',
    searchKey: 'кицканская школа 1 слободзея бумеранг добра',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '5' }],
  },
  {
    id: 'kitskany2',
    name: 'МОУ «Кицканская СОШ №2»',
    shortName: 'Кицканская СОШ №2',
    city: 'Слободзея',
    level: 'school',
    categories: ['patriotic', 'eco'],
    movements: [
      {
        name: 'Лидер Доброволец',
        directions: ['Духовно-нравственное', 'Экологическое', 'Патриотическое'],
        leader: 'Соловьева Татьяна Алексеевна',
        phone: '778 20499',
        email: 'kitskansky2@gmail.com',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-sky-500',
    bgImg: '',
    description: '«Лидер Доброволец» — духовно-нравственное, экологическое и патриотическое направления.',
    searchKey: 'кицканская школа 2 слободзея лидер доброволец',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '3' }],
  },
  {
    id: 'blizhny-hutor',
    name: 'МОУ «Ближнехуторская СОШ»',
    shortName: 'Ближнехуторская СОШ',
    city: 'Слободзея',
    level: 'school',
    categories: ['patriotic', 'eco'],
    movements: [
      {
        name: 'Добрые сердца',
        directions: ['Духовно-нравственное', 'Экологическое', 'Патриотическое'],
        leader: 'Подкаура Марина Анатольевна',
        phone: '779 12319',
        email: 'b.hutor1897@mail.ru',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-rose-500',
    bgImg: '',
    description: '«Добрые сердца» объединяют духовно-нравственное, экологическое и патриотическое воспитание.',
    searchKey: 'ближнехуторская школа слободзея добрые сердца',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '3' }],
  },

  // ══════════════════════════════════════════════════════════
  // Дубоссары
  // ══════════════════════════════════════════════════════════
  {
    id: 'school2-dubossary',
    name: 'МОУ «Дубоссарская русская средняя общеобразовательная школа №2»',
    shortName: 'Дубоссарская РСОШ №2',
    city: 'Дубоссары',
    level: 'school',
    categories: ['social', 'patriotic'],
    movements: [
      {
        name: 'Соколята',
        directions: ['Социальное', 'Патриотическое'],
        leader: 'Склифос Екатерина Анатольевна',
        phone: '778 09061',
        email: 'sklifosea@gmail.com',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-blue-500',
    bgImg: '',
    description: 'Движение «Соколята» — социальное и патриотическое добровольчество в Дубоссарах.',
    searchKey: 'дубоссарская школа 2 соколята',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '2' }],
  },

  // ══════════════════════════════════════════════════════════
  // Григориопольский район
  // ══════════════════════════════════════════════════════════
  {
    id: 'tashlyk',
    name: 'МОУ «Ташлыкская ОСШ Григориопольского района им. А. Антонова»',
    shortName: 'Ташлыкская ОСШ им. Антонова',
    city: 'Григориополь',
    level: 'school',
    categories: ['social'],
    movements: [
      social('Совет старшеклассников «Кораблик»', 'Брага Марианна Федоровна', '778 85091', 'marianna.braga@mail.ru'),
    ],
    icon: 'fas fa-school',
    iconColor: 'text-teal-500',
    bgImg: '',
    description: '«Кораблик» — социальное направление: помощь пожилым и нуждающимся людям.',
    searchKey: 'ташлыкская школа григориополь кораблик',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '1' }],
  },
  {
    id: 'krasnaya-gorka',
    name: 'МОУ «Русско-молдавская ОСШ с. Красная Горка»',
    shortName: 'ОСШ с. Красная Горка',
    city: 'Григориополь',
    level: 'school',
    categories: ['social', 'cultural'],
    movements: [
      {
        name: 'Совет старшеклассников «Добрые сердца»',
        directions: ['Социальное', 'Культурное'],
        leader: 'Сафонова Галина Викторовна',
        phone: '779 81183',
        email: 'galina.safonova68@mail.ru',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-rose-500',
    bgImg: '',
    description: '«Добрые сердца» — социальное и культурное добровольчество.',
    searchKey: 'красная горка григориополь добрые сердца',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '2' }],
  },
  {
    id: 'vinogradnoye',
    name: 'МОУ «Винограднянская ООШ-ДС им. А.В. Танасейчука»',
    shortName: 'Винограднянская ООШ',
    city: 'Григориополь',
    level: 'school',
    categories: ['patriotic'],
    movements: [
      patriotic('Волонтеры Победы', 'Павлова Светлана Юрьевна', '775 15101', 'sveta.sveta88.pavlova@mail.ru'),
    ],
    icon: 'fas fa-school',
    iconColor: 'text-green-600',
    bgImg: '',
    description: 'Движение «Волонтёры Победы» — патриотическое воспитание молодёжи.',
    searchKey: 'винограднянская школа григориополь волонтеры победы',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '1' }],
  },
  {
    id: 'teyskaya',
    name: 'МОУ «Тейская ОСШ Григориопольского района»',
    shortName: 'Тейская ОСШ',
    city: 'Григориополь',
    level: 'school',
    categories: ['patriotic'],
    movements: [
      patriotic('Я доброволец', 'Луполова Олеся Васильевна', '779 68249', 'olesealupolov@mail.ru'),
    ],
    icon: 'fas fa-school',
    iconColor: 'text-blue-600',
    bgImg: '',
    description: 'Движение «Я доброволец» — гражданско-патриотическая деятельность.',
    searchKey: 'тейская школа григориополь я доброволец',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '1' }],
  },
  {
    id: 'speya',
    name: 'МОУ «Спейская ОСШ Григориопольского района»',
    shortName: 'Спейская ОСШ',
    city: 'Григориополь',
    level: 'school',
    categories: ['patriotic', 'eco', 'social'],
    movements: [
      {
        name: 'Волонтеры Победы',
        directions: ['Патриотическое', 'Экологическое', 'Социальное'],
        leader: 'Салкуцан Алла Валерьевна',
        phone: '775 80522',
        email: 'asalkucan@mail.ru',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-orange-500',
    bgImg: '',
    description: 'Три направления: патриотика, экология и социальная поддержка.',
    searchKey: 'спейская школа григориополь волонтеры победы',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '3' }],
  },
  {
    id: 'malaeshty',
    name: 'МОУ «Малаештская ОСШ Григориопольского района»',
    shortName: 'Малаештская ОСШ',
    city: 'Григориополь',
    level: 'school',
    categories: ['patriotic', 'eco', 'sport'],
    movements: [
      {
        name: 'МОО «Истина молодых» / Местный совет детей и молодежи',
        directions: ['Гражданско-патриотическое', 'Экологическое', 'Спорт и здоровье'],
        leader: 'Чайковская Ольга Алексеевна',
        phone: '779 10139',
        email: 'adevarul.tinerilor@gmail.com',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-emerald-600',
    bgImg: '',
    description: '«Истина молодых» — патриотика, экология и здоровый образ жизни.',
    searchKey: 'малаештская школа григориополь истина молодых',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '3' }],
  },
  {
    id: 'grigoriopol2',
    name: 'МОУ «Григориопольская ОСШ №2 им. А. Стоева с лицейскими классами»',
    shortName: 'ОСШ № 2 им. Стоева',
    city: 'Григориополь',
    level: 'school',
    categories: ['eco', 'social', 'patriotic'],
    movements: [
      {
        name: 'Волонтеры Победы («Все вместе»)',
        directions: ['Социально-экологическое'],
        leader: 'Шевцова Елена Анатольевна',
        phone: '775 28746',
      },
      patriotic('Совет старшеклассников «Республика ГРиГИ»', 'Васильева Альонушка Викторовна', '777 59500', 'schoolstoev2@gmail.com'),
    ],
    icon: 'fas fa-school',
    iconColor: 'text-purple-600',
    bgImg: '',
    description: 'Два движения: социально-экологическое «Все вместе» и патриотическое самоуправление «Республика ГРиГИ».',
    searchKey: 'григориопольская школа 2 стоев все вместе грги',
    stats: [{ label: 'Движений', value: '2' }, { label: 'Направлений', value: '2' }],
  },
  {
    id: 'mayak-grig',
    name: 'МОУ «Маякская ОСШ им. С.К. Колесниченко Григориопольского района»',
    shortName: 'Маякская ОСШ',
    city: 'Григориополь',
    level: 'school',
    categories: ['patriotic'],
    movements: [
      patriotic('Волонтеры Победы', 'Макаревич Анжелика Алексеевна', '779 12521', 'lika.pmr7070@mail.ru'),
    ],
    icon: 'fas fa-school',
    iconColor: 'text-cyan-600',
    bgImg: '',
    description: 'Движение «Волонтёры Победы» — гражданско-патриотическая деятельность.',
    searchKey: 'маякская школа григориополь волонтеры победы',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '1' }],
  },
  {
    id: 'butor',
    name: 'МОУ «Буторская ОСШ Григориопольского района»',
    shortName: 'Буторская ОСШ',
    city: 'Григориополь',
    level: 'school',
    categories: ['patriotic'],
    movements: [
      patriotic('Волонтеры Победы', 'Демиденко Аурелия Андреевна', '779 81162', 'aurelliya1993@gmail.com'),
    ],
    icon: 'fas fa-school',
    iconColor: 'text-amber-600',
    bgImg: '',
    description: '«Волонтёры Победы» ведут патриотическое воспитание.',
    searchKey: 'буторская школа григориополь волонтеры победы',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '1' }],
  },
  {
    id: 'glinyanskaya-grig',
    name: 'МОУ «Глинянская ООШ Григориопольского района»',
    shortName: 'Глинянская ООШ',
    city: 'Григориополь',
    level: 'school',
    categories: ['patriotic'],
    movements: [
      patriotic('Совет старшеклассников «Росток»', 'Дмитренко Виктория Викторовна', '775 17761', '7891_11_71@mail.ru'),
    ],
    icon: 'fas fa-school',
    iconColor: 'text-lime-600',
    bgImg: '',
    description: '«Росток» — гражданско-патриотическое самоуправление старшеклассников.',
    searchKey: 'глинянская школа григориополь росток',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '1' }],
  },
  {
    id: 'grigoriopol1',
    name: 'МОУ «Григориопольская ОСШ №1 им. А. Нирши с лицейскими классами»',
    shortName: 'ОСШ № 1 им. Нирши',
    city: 'Григориополь',
    level: 'school',
    categories: ['patriotic'],
    movements: [
      patriotic('Совет старшеклассников «Юность»', 'Харитонова Наталья Андреевна', '779 12884', 'haritonovanatali91@gmail.com'),
    ],
    icon: 'fas fa-school',
    iconColor: 'text-pink-600',
    bgImg: '',
    description: 'Совет старшеклассников «Юность» — гражданско-патриотическое направление.',
    searchKey: 'григориопольская школа 1 нирши юность',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '1' }],
  },

  // ══════════════════════════════════════════════════════════
  // Рыбницкий район
  // ══════════════════════════════════════════════════════════
  {
    id: 'rybnitsa-ukr1',
    name: 'МОУ «Рыбницкая украинская СОШ №1 с гимназическими классами»',
    shortName: 'Рыбницкая укр. СОШ №1',
    city: 'Рыбница',
    level: 'school',
    categories: ['eco', 'patriotic', 'social'],
    movements: [
      {
        name: 'Содружество',
        directions: ['Экологическое', 'Гражданско-патриотическое', 'Социальное'],
        leader: 'Мельник Наталья Анатольевна',
        phone: '778 42164',
        email: 'melniknatala186@gmail.com',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-blue-500',
    bgImg: '',
    description: '«Содружество» охватывает экологическое, патриотическое и социальное добровольчество.',
    searchKey: 'рыбницкая украинская школа 1 содружество',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '3' }],
  },
  {
    id: 'rybnitsa-tl',
    name: 'МОУ «Рыбницкий теоретический лицей-комплекс»',
    shortName: 'Рыбницкий ТЛК',
    city: 'Рыбница',
    level: 'school',
    categories: ['patriotic', 'social', 'zoo'],
    movements: [
      {
        name: 'Волонтеры Победы',
        directions: ['Гражданско-патриотическое', 'Социальное', 'Зооволонтерство'],
        leader: 'Богданская Татьяна Александровна',
        phone: '775 98560',
        email: 'taniabogda90@gmail.com',
      },
    ],
    icon: 'fas fa-university',
    iconColor: 'text-green-500',
    bgImg: '',
    description: '«Волонтёры Победы» — патриотика, социальная поддержка и помощь животным.',
    searchKey: 'рыбницкий лицей волонтеры победы',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '3' }],
  },
  {
    id: 'rybnitsa-rus3',
    name: 'МОУ «Рыбницкая русская СОШ №3»',
    shortName: 'Рыбницкая РС ОШ №3',
    city: 'Рыбница',
    level: 'school',
    categories: ['patriotic', 'zoo'],
    movements: [
      {
        name: 'Мираж',
        directions: ['Благоустройство территории школы', 'Гражданско-патриотическое', 'Зооволонтерство'],
        leader: 'Туркив Ирина Васильевна',
        phone: '777 89236',
        email: 'turkiv2000@gmail.com',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-teal-500',
    bgImg: '',
    description: 'Движение «Мираж» — благоустройство, патриотика и зооволонтерство.',
    searchKey: 'рыбницкая школа 3 мираж',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '3' }],
  },
  {
    id: 'rybnitsa-rus6',
    name: 'МОУ «Рыбницкая русская СОШ №6 с лицейскими классами»',
    shortName: 'Рыбницкая РС ОШ №6',
    city: 'Рыбница',
    level: 'school',
    categories: ['social', 'cultural', 'eco', 'patriotic', 'health', 'zoo'],
    movements: [
      {
        name: 'Бумеранг',
        directions: ['Социальное', 'Культурное', 'Экологическое', 'Патриотическое', 'ЗОЖ', 'Духовно-патриотическое', 'Зооволонтерство', 'Просветительское'],
        leader: 'Пономарчук Наталья Александровна',
        phone: '778 89026',
        email: 'ponomarcuknatali@gmail.com',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-purple-500',
    bgImg: '',
    description: '«Бумеранг» — одно из самых разносторонних движений, охватывающее 8 направлений.',
    searchKey: 'рыбницкая школа 6 бумеранг',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '8' }],
  },
  {
    id: 'rybnitsa-gymn1',
    name: 'МОУ «Рыбницкая русская гимназия №1»',
    shortName: 'Рыбницкая гимназия №1',
    city: 'Рыбница',
    level: 'school',
    categories: ['eco', 'patriotic', 'social', 'zoo'],
    movements: [
      {
        name: 'Мир в ладонях',
        directions: ['Экологическое', 'Гражданско-патриотическое', 'Социальное', 'Зооволонтерство'],
        leader: 'Чарная Юлия Вячеславовна',
        phone: '778 00577',
        email: 'ryb.gimnazia1@yandex.ru',
      },
    ],
    icon: 'fas fa-graduation-cap',
    iconColor: 'text-amber-500',
    bgImg: '',
    description: '«Мир в ладонях» — четыре направления: экология, патриотика, социальное и зооволонтерство.',
    searchKey: 'рыбницкая гимназия 1 мир в ладонях',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '4' }],
  },
  {
    id: 'rybnitsa-rus8',
    name: 'МОУ «Рыбницкая русская средняя школа №8»',
    shortName: 'Рыбницкая РСШ №8',
    city: 'Рыбница',
    level: 'school',
    categories: ['patriotic', 'social', 'eco'],
    movements: [
      {
        name: 'Волонтеры Победы',
        directions: ['Благоустройство территории школы', 'Гражданско-патриотическое', 'Социальное', 'Экологическое'],
        leader: 'Маличук Виктория Михайловна',
        phone: '778 47914',
        email: 'gandrabura83@mail.ru',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-red-500',
    bgImg: '',
    description: '«Волонтёры Победы» — от благоустройства школьной территории до патриотических акций.',
    searchKey: 'рыбницкая школа 8 волонтеры победы',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '4' }],
  },
  {
    id: 'rybnitsa-rm9',
    name: 'МОУ «Рыбницкая русско-молдавская СОШ №9»',
    shortName: 'Рыбницкая РМ СОШ №9',
    city: 'Рыбница',
    level: 'school',
    categories: ['social', 'eco', 'zoo'],
    movements: [
      {
        name: 'PROдобро',
        directions: ['Социальное', 'Благотворительное', 'Экологическое', 'Зооволонтерство', 'Гуманитарное'],
        leader: 'Иовица Оксана Петровна',
        phone: '775 37673',
        email: 'sholl9-1980@yandex.ru',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-cyan-500',
    bgImg: '',
    description: 'PROдобро — социальное, благотворительное, экологическое и гуманитарное направления.',
    searchKey: 'рыбницкая школа 9 продобро',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '5' }],
  },
  {
    id: 'rybnitsa-rus10',
    name: 'МОУ «Рыбницкая русская средняя школа №10 с гимназическими классами»',
    shortName: 'Рыбницкая РСШ №10',
    city: 'Рыбница',
    level: 'school',
    categories: ['eco', 'social', 'patriotic', 'zoo'],
    movements: [
      {
        name: 'Твори добро',
        directions: ['Благоустройство территории школы', 'Экологическое', 'Социальное', 'Гражданско-патриотическое', 'Зооволонтерство'],
        leader: 'Парфентьева Ксения Викторовна',
        phone: '775 94093',
        email: 'ksuni06121997@gmail.com',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-lime-500',
    bgImg: '',
    description: '«Твори добро» — пять активных направлений в Рыбницкой школе №10.',
    searchKey: 'рыбницкая школа 10 твори добро',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '5' }],
  },
  {
    id: 'rybnitsa-rus11',
    name: 'МОУ «Рыбницкая русская СОШ №11»',
    shortName: 'Рыбницкая РС ОШ №11',
    city: 'Рыбница',
    level: 'school',
    categories: ['patriotic', 'eco', 'social', 'zoo', 'cultural'],
    movements: [
      {
        name: 'Волонтёры Победы',
        directions: ['Гражданско-патриотическое', 'Экологическое', 'Социальное', 'Зооволонтерство', 'Культурно-просветительское'],
        leader: 'Кушнир Лилия Васильевна',
        phone: '778 89236',
        email: 'liliya.kushnir62@mail.ru',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-violet-500',
    bgImg: '',
    description: 'Пять направлений: патриотика, экология, социальное, зооволонтерство и культурно-просветительское.',
    searchKey: 'рыбницкая школа 11 волонтеры победы',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '5' }],
  },
  {
    id: 'rybnitsa-internat',
    name: 'МОУ «Рыбницкая средняя ОШ-интернат»',
    shortName: 'Рыбницкая ОШ-интернат',
    city: 'Рыбница',
    level: 'school',
    categories: ['eco', 'patriotic', 'social', 'sport', 'zoo'],
    movements: [
      {
        name: 'Незабудка',
        directions: ['Благоустройство', 'Экологическое', 'Гражданско-патриотическое', 'Социальное', 'Спортивно-оздоровительное', 'Зооволонтерство'],
        leader: 'Мазуренко Яна Витальевна',
        phone: '779 19103',
        email: 'jenvexus1396@gmail.com',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-pink-500',
    bgImg: '',
    description: '«Незабудка» — шесть направлений, включая зооволонтерство и спортивно-оздоровительную работу.',
    searchKey: 'рыбницкая школа интернат незабудка',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '6' }],
  },

  // ══════════════════════════════════════════════════════════
  // Каменский район
  // ══════════════════════════════════════════════════════════
  {
    id: 'kamenka1',
    name: 'МОУ «Каменская ОСШ №1»',
    shortName: 'Каменская ОСШ №1',
    city: 'Каменка',
    level: 'school',
    categories: ['patriotic'],
    movements: [
      {
        name: 'Отряд «Консилиул де елевь ал школий»',
        directions: ['Патриотическое'],
        leader: 'Подопригора Марина Юрьевна',
        phone: '778 33290',
        email: 'marina.podoprigora.2020@mail.ru',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-blue-600',
    bgImg: '',
    description: 'Ученическое самоуправление с патриотическим направлением.',
    searchKey: 'каменская школа 1 патриотическое',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '1' }],
  },
  {
    id: 'kamenka2',
    name: 'МОУ «Каменская ОСШ с гимназическими классами №2»',
    shortName: 'Каменская ОСШ №2',
    city: 'Каменка',
    level: 'school',
    categories: ['social'],
    movements: [
      social('Отряд «Ученическое самоуправление и добровольческое движение»', 'Богорош Анастасия Андреевна', '778 68133', 'nasteuhabog@mail.ru'),
    ],
    icon: 'fas fa-school',
    iconColor: 'text-teal-600',
    bgImg: '',
    description: 'Социальное добровольчество через ученическое самоуправление.',
    searchKey: 'каменская школа 2 социальное самоуправление',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '1' }],
  },
  {
    id: 'kamenka3',
    name: 'МОУ «Каменская ОСШ №3»',
    shortName: 'Каменская ОСШ №3',
    city: 'Каменка',
    level: 'school',
    categories: ['youth'],
    movements: [
      {
        name: 'Отряд «Ученическое самоуправление и добровольческое движение»',
        directions: ['Мотивация добровольческой деятельности'],
        leader: 'Кафтанатий Мариана Валерьевна',
        phone: '777 17614',
        email: 'sofiavlad2630@gmil.ru',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-emerald-600',
    bgImg: '',
    description: 'Мотивация и развитие добровольческой деятельности среди школьников.',
    searchKey: 'каменская школа 3 мотивация добровольческая деятельность',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '1' }],
  },
  {
    id: 'raskovo-kamenka',
    name: 'МОУ «Рашковская ОСШ им. Ф.И. Жарчинского»',
    shortName: 'Рашковская ОСШ',
    city: 'Каменка',
    level: 'school',
    categories: ['eco'],
    movements: [
      {
        name: 'Отряд «Ученическое самоуправление»',
        directions: ['Экологическое'],
        leader: 'Гнатышена Елена Сергеевна',
        phone: '777 65835',
        email: 'rahkovskaiahkola@mail.ru',
      },
    ],
    icon: 'fas fa-school',
    iconColor: 'text-green-500',
    bgImg: '',
    description: 'Экологическое направление через ученическое самоуправление.',
    searchKey: 'рашковская школа каменка экологическое',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '1' }],
  },
  {
    id: 'kamenka-ddut',
    name: 'МОУ «Каменский ДДЮТ»',
    shortName: 'Каменский ДДЮТ',
    city: 'Каменка',
    level: 'school',
    categories: ['youth', 'social'],
    movements: [
      {
        name: 'Районный штаб «Ученическое соуправление и добровольческое движение»',
        directions: ['Стимулирование участия молодежи в общественно-полезной деятельности'],
        leader: 'Подопригора Марина Юрьевна',
        phone: '778 33290',
        email: 'marina.podoprigora.2020@mail.ru',
      },
    ],
    icon: 'fas fa-users',
    iconColor: 'text-indigo-500',
    bgImg: '',
    description: 'Районный координационный штаб по развитию добровольчества среди молодёжи.',
    searchKey: 'каменский ддют районный штаб молодежь добровольчество',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '1' }],
  },

  // ══════════════════════════════════════════════════════════
  // СПО — средние профессиональные организации
  // ══════════════════════════════════════════════════════════
  {
    id: 'spo-benders-ped',
    name: 'ГОУ СПО «Бендерский педагогический колледж»',
    shortName: 'Бендерский педколледж',
    city: 'Бендеры',
    level: 'college',
    categories: ['patriotic', 'cultural'],
    movements: [
      {
        name: 'Волонтёры Победы',
        directions: ['Гражданско-патриотическое', 'Социокультурное', 'Сохранение исторической памяти'],
        leader: 'Китаева Ирина Петровна',
        phone: '778 48702',
        email: 'irenka_0884@mail.ru',
      },
    ],
    icon: 'fas fa-chalkboard-teacher',
    iconColor: 'text-blue-500',
    bgImg: '',
    description: '«Волонтёры Победы» — патриотика, социокультурная деятельность и сохранение исторической памяти.',
    searchKey: 'бендерский педагогический колледж волонтеры победы',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '3' }],
  },
  {
    id: 'spo-tatk',
    name: 'ГОУ СПО «Тираспольский аграрно-технический колледж им. М.В. Фрунзе»',
    shortName: 'ТАТК им. Фрунзе',
    city: 'Тирасполь',
    level: 'college',
    categories: ['eco', 'zoo', 'social', 'patriotic'],
    movements: [
      {
        name: 'Волонтеры ТАТК',
        directions: ['Эковолонтерство', 'Зооволонтерство', 'Агроволонтерство', 'Социальное', 'Патриотическое'],
        leader: 'Криворучко Юлия Михайловна',
        phone: '779 90799',
        email: 'baichulia25.10.81.baichulia@gmail.com',
      },
    ],
    icon: 'fas fa-seedling',
    iconColor: 'text-green-500',
    bgImg: '',
    description: 'Уникальное агроволонтерство в сочетании с экологической и социальной деятельностью.',
    searchKey: 'тираспольский аграрно технический колледж татк фрунзе волонтеры',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '5' }],
  },
  {
    id: 'spo-pktu',
    name: 'ГОУ СПО «Приднестровский колледж технологий и управления»',
    shortName: 'Приднестровский КТУ',
    city: 'Тирасполь',
    level: 'college',
    categories: ['social', 'patriotic', 'health'],
    movements: [
      {
        name: 'Волонтеры Победы',
        directions: ['Благотворительное', 'Социальное', 'Гражданско-патриотическое', 'Пропаганда здорового образа жизни'],
        leader: 'Прусакова Татьяна Валентиновна',
        phone: '777 69663',
        email: 'tanya.prusakova.28@mail.ru',
      },
    ],
    icon: 'fas fa-laptop',
    iconColor: 'text-teal-500',
    bgImg: '',
    description: '«Волонтёры Победы» — от благотворительности до пропаганды ЗОЖ.',
    searchKey: 'приднестровский колледж технологий управления волонтеры победы',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '4' }],
  },
  {
    id: 'spo-kamenka-tech',
    name: 'ГОУ СПО «Каменский политехнический техникум им. И.С. Солтыса»',
    shortName: 'Каменский политехникум',
    city: 'Каменка',
    level: 'college',
    categories: ['patriotic', 'social', 'sport'],
    movements: [
      {
        name: 'Волонтеры Победы',
        directions: ['Патриотическое', 'Инклюзивное', 'Событийное', 'Благоустройство', 'Социальное', 'Спортивное'],
        leader: 'Китайка Анастасия Викторовна',
        phone: '777 88851',
        email: 'taisy5@mail.ru',
      },
    ],
    icon: 'fas fa-tools',
    iconColor: 'text-orange-500',
    bgImg: '',
    description: '«Волонтёры Победы» — шесть направлений, включая инклюзивное и событийное.',
    searchKey: 'каменский политехнический техникум солтыс волонтеры победы',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '6' }],
  },
  {
    id: 'spo-slobodzeya-tech',
    name: 'ГОУ СПО «Слободзейский политехнический техникум»',
    shortName: 'Слободзейский политехникум',
    city: 'Слободзея',
    level: 'college',
    categories: ['patriotic', 'social', 'sport', 'eco', 'health'],
    movements: [
      {
        name: 'Волонтеры Победы',
        directions: ['Патриотическое', 'Социальное', 'Спортивное', 'Экологическое', 'Волонтерство в ЧС', 'Медицинское'],
        leader: 'Баранова Наталья Георгиевна',
        phone: '778 98583',
        email: 'natalya121075@gmail.com',
      },
    ],
    icon: 'fas fa-hard-hat',
    iconColor: 'text-yellow-500',
    bgImg: '',
    description: 'В т.ч. волонтёрство в чрезвычайных ситуациях и медицинское направление.',
    searchKey: 'слободзейский политехнический техникум волонтеры победы',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '6' }],
  },
  {
    id: 'spo-rybnitsa-tech',
    name: 'ГОУ СПО «Рыбницкий политехнический техникум»',
    shortName: 'Рыбницкий политехникум',
    city: 'Рыбница',
    level: 'college',
    categories: ['patriotic', 'health'],
    movements: [
      {
        name: 'Волонтеры Победы',
        directions: ['Сохранение исторической памяти', 'Поддержка ветеранов', 'Благоустройство мемориалов'],
        leader: 'Сулима Светлана Александровна',
        phone: '775 44743',
      },
      {
        name: 'Волонтеры ветеранов ОГБ «Меч»',
        directions: ['Популяризация ЗОЖ', 'Помощь ветеранам ОГБ', 'Благоустройство памятников'],
        leader: 'Мурадов Олег Суванович',
        phone: '779 34563',
      },
    ],
    icon: 'fas fa-tools',
    iconColor: 'text-red-600',
    bgImg: '',
    description: 'Два движения — сохранение исторической памяти и поддержка ветеранов.',
    searchKey: 'рыбницкий политехнический техникум волонтеры победы меч',
    stats: [{ label: 'Движений', value: '2' }, { label: 'Направлений', value: '3' }],
  },
  {
    id: 'spo-dubossary-tech',
    name: 'ГОУ СПО «Дубоссарский индустриальный техникум»',
    shortName: 'Дубоссарский инд. техникум',
    city: 'Дубоссары',
    level: 'college',
    categories: ['social', 'patriotic', 'eco', 'health'],
    movements: [
      {
        name: 'Доброе сердце',
        directions: ['Благотворительное', 'Пропаганда ЗОЖ', 'Социальное', 'Гражданско-патриотическое', 'Экологическое'],
        leader: 'Головач Марина Валерьевна',
        phone: '060232756',
        email: 'golovachmarina1970@gmail.com',
      },
    ],
    icon: 'fas fa-industry',
    iconColor: 'text-slate-500',
    bgImg: '',
    description: '«Доброе сердце» — социальная, экологическая и патриотическая активность.',
    searchKey: 'дубоссарский индустриальный техникум доброе сердце',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '5' }],
  },
  {
    id: 'spo-dnestrovsk',
    name: 'ГОУ СПО «Днестровский техникум энергетики и компьютерных технологий»',
    shortName: 'Днестровский ТЭиКТ',
    city: 'Тирасполь',
    level: 'college',
    categories: ['patriotic', 'eco', 'cultural', 'health'],
    movements: [
      {
        name: 'Наследники Прометея',
        directions: ['Гражданско-патриотическое', 'Пропаганда ЗОЖ', 'Экологическое', 'Культурное'],
        leader: 'Якушенкова Светлана Дмитриевна',
        phone: '778 94066',
        email: 'yakushenkovasvetlana@gmail.com',
      },
    ],
    icon: 'fas fa-bolt',
    iconColor: 'text-yellow-600',
    bgImg: '',
    description: '«Наследники Прометея» — патриотика, ЗОЖ, экология и культура.',
    searchKey: 'днестровский техникум энергетики компьютерных технологий наследники прометея',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '4' }],
  },
  {
    id: 'spo-ttip',
    name: 'ГОУ СПО «Тираспольский техникум информатики и права»',
    shortName: 'ТТИиП',
    city: 'Тирасполь',
    level: 'college',
    categories: ['social', 'patriotic'],
    movements: [
      social('Волонтеры добрые сердца', 'Котвицкая Лилия Сергеевна', '779 17872', 'Liya-moroz@mail.ru'),
      patriotic('Волонтеры Победы', 'Котвицкая Лилия Сергеевна', '779 17872'),
    ],
    icon: 'fas fa-laptop-code',
    iconColor: 'text-blue-600',
    bgImg: '',
    description: 'Два движения: социальное «Добрые сердца» и патриотическое «Волонтёры Победы».',
    searchKey: 'тираспольский техникум информатики права добрые сердца волонтеры победы',
    stats: [{ label: 'Движений', value: '2' }, { label: 'Направлений', value: '2' }],
  },
  {
    id: 'spo-ttk',
    name: 'ГОУ СПО «Тираспольский техникум коммерции»',
    shortName: 'Техникум коммерции',
    city: 'Тирасполь',
    level: 'college',
    categories: ['zoo'],
    movements: [
      {
        name: 'От сердца к лапе',
        directions: ['Зооволонтерство'],
        leader: 'Моздюк Анастасия (студентка 4 курса)',
        phone: '777 06151',
      },
    ],
    icon: 'fas fa-store',
    iconColor: 'text-pink-500',
    bgImg: '',
    description: 'Зооволонтёрское движение «От сердца к лапе» — помощь животным.',
    searchKey: 'тираспольский техникум коммерции от сердца к лапе зооволонтерство',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '1' }],
  },

  // ══════════════════════════════════════════════════════════
  // ВПО — высшее образование
  // ══════════════════════════════════════════════════════════
  {
    id: 'pgu',
    name: 'ГОУ «Приднестровский государственный университет им. Т.Г. Шевченко»',
    shortName: 'ПГУ им. Шевченко',
    city: 'Тирасполь',
    level: 'university',
    categories: ['social', 'patriotic', 'eco', 'health', 'zoo', 'sport'],
    movements: [
      {
        name: 'Мы из ПГУ!',
        directions: [
          'Социально-патриотическое',
          'Социально-благотворительное',
          'Экологическое',
          'Гражданско-патриотическое',
          'Медицинско-гуманитарное',
          'Эколого-гуманистическое (помощь зооприютам)',
          'Спортивно-оздоровительное',
        ],
        leader: 'Мортин Дмитрий Евгеньевич / Кучерявый Владислав Юрьевич',
        phone: '0779 11795 / 0779 57644',
        email: 'mortindima@mail.ru',
      },
    ],
    icon: 'fas fa-university',
    iconColor: 'text-indigo-600',
    bgImg: '',
    description: 'Главный университет ПМР — 7 направлений добровольчества: от медицины до помощи зооприютам.',
    searchKey: 'пгу приднестровский государственный университет шевченко мы из пгу',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '7' }],
  },
  {
    id: 'pgiis',
    name: 'ГОУ ВПО «Приднестровский Государственный институт искусств им. А.Г. Рубинштейна»',
    shortName: 'Институт искусств им. Рубинштейна',
    city: 'Тирасполь',
    level: 'university',
    categories: ['cultural', 'social'],
    movements: [
      {
        name: 'Согреем сердца добром',
        directions: ['Благотворительные концерты', 'Благотворительные акции «Вторая жизнь вещам»'],
        leader: 'Егорова Елена Вячеславовна',
        phone: '777 23528',
        email: 'ee694556@gmail.com',
      },
    ],
    icon: 'fas fa-music',
    iconColor: 'text-purple-600',
    bgImg: '',
    description: 'Благотворительные концерты и акции «Вторая жизнь вещам».',
    searchKey: 'приднестровский институт искусств рубинштейн согреем сердца добром',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '2' }],
  },
  {
    id: 'bvhk',
    name: 'ГОУ ВПО «Бендерский высший художественный колледж им. В.И. Постойкина»',
    shortName: 'БВХК им. Постойкина',
    city: 'Бендеры',
    level: 'university',
    categories: ['patriotic', 'cultural'],
    movements: [
      {
        name: 'Согреем сердца добром',
        directions: ['Гражданско-патриотическое', 'Благотворительные акции «Вторая жизнь вещам»', 'Участие в городских мероприятиях'],
        leader: 'Бивол Ирина Федоровна',
        phone: '775 29084',
        email: 'benderyart@gmail.com',
      },
    ],
    icon: 'fas fa-palette',
    iconColor: 'text-amber-600',
    bgImg: '',
    description: 'Художественный колледж: патриотика, благотворительность и городские мероприятия.',
    searchKey: 'бендерский художественный колледж постойкин согреем сердца добром',
    stats: [{ label: 'Движений', value: '1' }, { label: 'Направлений', value: '3' }],
  },
  {
    id: 'pgmk',
    name: 'ГОУ ВПО «Приднестровский государственный медицинский колледж им. Л.А. Тарасевича»',
    shortName: 'Медицинский колледж им. Тарасевича',
    city: 'Тирасполь',
    level: 'university',
    categories: ['health', 'patriotic'],
    movements: [
      {
        name: 'Отряд «Дорогой добра»',
        directions: ['Санитарно-просветительская работа', 'Формирование культуры здоровья и ЗОЖ'],
        leader: 'Шептефрац И.С.',
        phone: '775 97829',
        email: 'pgmk_osv@mail.ru',
      },
      patriotic('Отряд «Волонтеры Победы»', 'Терентьев В.И.', '777 90495', 'pgmk_osv@mail.ru'),
    ],
    icon: 'fas fa-stethoscope',
    iconColor: 'text-red-600',
    bgImg: '',
    description: 'Медицинский колледж: санитарное просвещение и гражданско-патриотическое воспитание.',
    searchKey: 'медицинский колледж тарасевич дорогой добра волонтеры победы',
    stats: [{ label: 'Движений', value: '2' }, { label: 'Направлений', value: '3' }],
  },
];