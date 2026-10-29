import { Link } from 'react-router-dom';
import collage1 from '../../assets/about/collage-1.webp';
import collage2 from '../../assets/about/collage-2.webp';
import collage3 from '../../assets/about/collage-3.webp';
import collage4 from '../../assets/about/collage-4.webp';
import collage5 from '../../assets/about/collage-5.webp';
import { Reveal } from '../../components/ui/Reveal';
import { useFeedback } from '../../context/FeedbackContext';
import { useSiteJson, useSiteText } from '../../context/SiteContentContext';
import { ABOUT_TEAM_DEFAULT, ABOUT_TEXT_DEFAULT as T, ABOUT_VALUES_DEFAULT, type TeamMember } from '../../content/defaults';

// Номер для ссылки tel: — только цифры и ведущий «+» («0 (533) 2-22-29» → «053322229»)
const telHref = (phone: string) => `tel:${phone.trim().replace(/(?!^\+)[^\d]/g, '')}`;

// Фото волонтёров для фона-коллажа в шапке (порядок = расположение плиток в .about-collage)
const COLLAGE = [collage1, collage3, collage5, collage4, collage2];

export function AboutPage() {
  const TEAM = useSiteJson<TeamMember[]>('about.team', ABOUT_TEAM_DEFAULT);
  const teamTitle = useSiteText('about.team.title', T.teamTitle);
  const teamSubtitle = useSiteText('about.team.subtitle', T.teamSubtitle);
  const VALUES = useSiteJson('about.values', ABOUT_VALUES_DEFAULT);
  const heroLead = useSiteText('about.hero.lead', T.heroLead);
  const heroMission = useSiteText('about.hero.mission', T.heroMission);
  const platform1 = useSiteText('about.platform.p1', T.platform1);
  const platform2 = useSiteText('about.platform.p2', T.platform2);
  const platform3 = useSiteText('about.platform.p3', T.platform3);
  const effortsTitle = useSiteText('about.efforts.title', T.effortsTitle);
  const efforts = useSiteJson('about.efforts', T.efforts);
  const tagline = useSiteText('about.tagline', T.tagline);
  const email = useSiteText('about.contacts.email', T.email);
  const phone = useSiteText('about.contacts.phone', T.phone);
  const hours = useSiteText('about.contacts.hours', T.hours);
  const city = useSiteText('about.contacts.city', T.city);
  const office = useSiteText('about.contacts.office', T.office);
  const { openFeedback } = useFeedback();
  return (
    <>
      {/* HERO */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        {/* Фон-коллаж из фотографий */}
        <div className="absolute inset-0" aria-hidden>
          <div className="about-collage">
            {COLLAGE.map(src => (
              <div key={src} className="about-collage__tile">
                <img src={src} alt="" decoding="async" />
              </div>
            ))}
          </div>
          <div className="about-collage__veil" />
        </div>
        <div className="wrap relative z-10">
          <div className="max-w-3xl lg:max-w-[calc(50%-2rem)]">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-6">
                <i className="fas fa-hand-holding-heart" />О нас
              </div>
              <h1 className="vol-h1 mb-6">
                Мы — <span className="text-primary">ВолонтёрыПМР</span>
              </h1>
              <p className="vol-lead mb-6 whitespace-pre-line">{heroLead}</p>
              <p className="vol-lead mb-6 whitespace-pre-line">{heroMission}</p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="group inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-xl transition duration-300 shadow-lg no-underline">
                  <i className="fas fa-user-plus mr-2 transition-transform duration-300 group-hover:scale-110" />Присоединиться
                </Link>
                <Link to="/events" className="group inline-flex items-center px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-300 hover:border-primary hover:text-primary hover:-translate-y-0.5 transition duration-300 no-underline">
                  Наши мероприятия
                  <i className="fas fa-arrow-right ml-2 text-sm transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ABOUT PLATFORM */}
      <section className="py-16 sm:py-20">
        <div className="wrap">
          <div className="max-w-4xl mx-auto">
            <Reveal className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="vol-h2 mb-4">О нас</h2>
            </Reveal>
            <div className="space-y-6">
              <Reveal as="p" className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">{platform1}</Reveal>
              <Reveal as="p" className="text-gray-700 leading-relaxed whitespace-pre-line">{platform2}</Reveal>
              <Reveal as="p" className="text-gray-700 leading-relaxed whitespace-pre-line">{platform3}</Reveal>
              <div className="mt-10 pt-8 border-t border-gray-200">
                <Reveal as="h3" className="vol-h3 mb-6">{effortsTitle}</Reveal>
                <ul className="space-y-4 mb-8">
                  {efforts.map((line, i) => (
                    <Reveal as="li" key={i} delay={i * 70} className="group flex items-start gap-4">
                      <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-3 transition-transform duration-300 group-hover:scale-150" />
                      <p className="text-gray-700 transition-transform duration-300 group-hover:translate-x-1">{line}</p>
                    </Reveal>
                  ))}
                </ul>
                <Reveal as="p" className="text-lg font-medium text-primary">
                  {tagline}
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION & VALUES */}
      <section className="py-16 sm:py-20">
        <div className="wrap">
          <Reveal className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="vol-h2 mb-4">Наши ценности</h2>
            <p className="text-gray-600 text-lg">Принципы, которыми мы руководствуемся в каждом проекте</p>
          </Reveal>
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 90} className="h-full">
                <div className="lift group h-full rounded-panel border border-vol-line bg-vol-surface p-4 text-center shadow-soft hover:border-primary/20 sm:p-6">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 ${v.color} rounded-panel flex items-center justify-center mx-auto mb-3 sm:mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6`}>
                    <i className={`fas ${v.icon} text-xl sm:text-2xl`} />
                  </div>
                  <h3 className="vol-h3 mb-1.5 max-sm:text-body-sm sm:mb-2">{v.title}</h3>
                  <p className="text-meta leading-snug text-vol-muted sm:text-ctrl sm:leading-relaxed">{v.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FOUNDERS: hidden while the administrator has not added anyone */}
      {TEAM.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="wrap">
            <Reveal className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="vol-h2 mb-4">{teamTitle}</h2>
              <p className="text-gray-600 text-lg">{teamSubtitle}</p>
            </Reveal>
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
              {TEAM.map((m, i) => {
                const card = (
                  <>
                    {m.avatar
                      ? <img src={m.avatar} alt={m.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover mx-auto mb-3 sm:mb-4 shadow-md ring-4 ring-primary/10 group-hover:ring-primary/30 group-hover:scale-105 transition duration-300" />
                      : <span aria-hidden className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-3 sm:mb-4 grid place-items-center bg-primary/10 text-primary text-xl font-bold">{(m.name || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()}</span>}
                    <h3 className="font-bold text-gray-900 break-words">{m.name}</h3>
                    {m.role && <p className="text-sm text-primary font-medium mb-3 break-words">{m.role}</p>}
                    {m.desc && <p className="text-gray-600 text-[0.8125rem] leading-relaxed">{m.desc}</p>}
                  </>
                );
                const cls = 'lift block h-full rounded-panel border border-vol-line bg-vol-surface p-4 text-center shadow-soft group no-underline sm:p-6';
                return (
                  <Reveal key={(m.profileId || m.name) + i} delay={(i % 4) * 90} className="h-full">
                    {m.profileId
                      ? <Link to={`/users/${m.profileId}`} className={cls}>{card}</Link>
                      : <div className={cls}>{card}</div>}
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CONTACTS */}
      <section id="contacts" className="py-20 bg-gradient-to-br from-primary to-blue-900">
        <div className="wrap max-w-7xl">

          <Reveal className="text-center mb-12">
            <h2 className="vol-h2 !text-white mb-4">
              Контакты
            </h2>
            <p className="text-lg text-blue-100">
              Мы открыты для общения, сотрудничества и новых инициатив
            </p>
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-8">

            {/* Левая колонка */}
            <Reveal className="bg-white rounded-3xl p-8 shadow-xl">

              <div className="space-y-6">

                <div className="group flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center transition-colors duration-300 group-hover:bg-primary">
                    <i className="fas fa-envelope text-primary text-xl transition-colors duration-300 group-hover:text-white"/>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>

                    <a
                        href={`mailto:${email}`}
                        className="font-semibold text-gray-900 hover:text-primary no-underline"
                    >
                      {email}
                    </a>
                  </div>
                </div>

                <div className="group flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center transition-colors duration-300 group-hover:bg-primary">
                    <i className="fas fa-phone text-primary text-xl transition-colors duration-300 group-hover:text-white"/>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Телефон</p>

                    <a
                        href={telHref(phone)}
                        className="font-semibold text-gray-900 hover:text-primary no-underline block"
                    >
                      {phone}
                    </a>

                    <span className="text-sm text-gray-500">
                                {hours}
                            </span>
                  </div>
                </div>

                <div className="group flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center transition-colors duration-300 group-hover:bg-primary">
                    <i className="fas fa-map-marker-alt text-primary text-xl transition-colors duration-300 group-hover:text-white"/>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Адрес</p>

                    <p className="font-semibold text-gray-900">{city}</p>

                    <span className="text-sm text-gray-500">
                                {office}
                            </span>
                  </div>
                </div>

              </div>

              {/* Кнопки */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4">

                {/* форма обратной связи сайта: работает без почтового клиента, обращение приходит в админку («Обращения») */}
                <button
                    type="button"
                    onClick={openFeedback}
                    aria-haspopup="dialog"
                    className="flex-1 bg-primary text-white text-center py-3 rounded-xl font-semibold hover:bg-primary-dark hover:-translate-y-0.5 transition duration-300"
                >
                  <i className="fas fa-envelope mr-2" aria-hidden />Написать нам
                </button>

                <a
                    href={telHref(phone)}
                    className="flex-1 border border-primary text-primary text-center py-3 rounded-xl font-semibold hover:bg-primary hover:text-white hover:-translate-y-0.5 transition duration-300 no-underline"
                >
                  <i className="fas fa-phone mr-2" aria-hidden />Позвонить
                </a>

              </div>

              {/* Соцсети */}
              <div className="mt-10 pt-8 border-t">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Мы в социальных сетях
                </h3>

                <div className="flex gap-4 text-2xl">

                  <a
                      href="https://t.me/volonterPMR"
                      className="inline-block text-gray-500 hover:text-blue-600 hover:-translate-y-1 transition duration-300"
                      aria-label="Telegram"
                  >
                    <i className="fab fa-telegram"/>
                  </a>

                  <a
                      href="https://www.instagram.com/volonterpmr"
                      className="inline-block text-gray-500 hover:text-pink-600 hover:-translate-y-1 transition duration-300"
                      aria-label="Instagram"
                  >
                    <i className="fab fa-instagram"/>
                  </a>

                  <a
                      href="https://vk.com"
                      target="_blank" rel="noopener noreferrer"
                      className="inline-block text-gray-500 hover:text-blue-700 hover:-translate-y-1 transition duration-300"
                      aria-label="VK"
                  >
                    <i className="fab fa-vk"/>
                  </a>

                </div>
              </div>

            </Reveal>

            {/* Карта */}
            <Reveal delay={120} className="overflow-hidden rounded-3xl shadow-xl bg-white">

              <div className="p-6 border-b">
                <h3 className="text-xl font-semibold text-gray-900">
                  Как нас найти
                </h3>
              </div>

              <div className="h-[31.25rem]">
                <iframe
                    title="Карта"
                    className="w-full h-full border-0"
                    src="https://yandex.ru/map-widget/v1/?um=constructor%3A0799eeb4096400b563b77e04c4ea998f8f6faa6419bd80cb46fe0629bd5a6d48&amp;source=constructor"
                    allowFullScreen
                />
              </div>

            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
