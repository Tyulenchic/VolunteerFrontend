import { Link } from 'react-router-dom';
import OnasImage from '../../assets/Onas.webp';
import { IMAGE_POSITIONS } from '../../constants/imagePositions';
import { useSiteJson, useSiteText } from '../../context/SiteContentContext';
import { ABOUT_TEAM_DEFAULT, ABOUT_TEXT_DEFAULT as T, ABOUT_VALUES_DEFAULT, type TeamMember } from '../../content/defaults';

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
  return (
    <>
      {/* HERO */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={OnasImage}
            alt="Background"
            className="w-full h-full object-cover"
            style={{ objectPosition: IMAGE_POSITIONS.about }}
          />
          <div className="absolute inset-0"></div>
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-6">
                <i className="fas fa-hand-holding-heart" />О нас
              </div>
              <h1 className="text-4xl sm:text-5xl font-heading font-extrabold text-gray-900 leading-tight mb-6">
                Мы — <span className="text-primary">ВолонтёрыПМР</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed mb-6 whitespace-pre-line">{heroLead}</p>
              <p className="text-xl text-gray-600 leading-relaxed mb-6 whitespace-pre-line">{heroMission}</p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition shadow-lg no-underline">
                  <i className="fas fa-user-plus mr-2" />Присоединиться
                </Link>
                <Link to="/events" className="inline-flex items-center px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-300 hover:border-primary hover:text-primary transition no-underline">
                  Наши мероприятия
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT PLATFORM */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4">О нас</h2>
            </div>
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">{platform1}</p>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{platform2}</p>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{platform3}</p>
              <div className="mt-10 pt-8 border-t border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6">{effortsTitle}</h3>
                <ul className="space-y-4 mb-8">
                  {efforts.map((line, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-3" />
                      <p className="text-gray-700">{line}</p>
                    </li>
                  ))}
                </ul>
                <p className="text-lg font-medium text-primary">
                  {tagline}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION & VALUES */}
      <section className="py-16 sm:py-20 bg-gray-50 border-y border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4">Наши ценности</h2>
            <p className="text-gray-600 text-lg">Принципы, которыми мы руководствуемся в каждом проекте</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(v => (
              <div key={v.title} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 text-center hover:shadow-lg hover:-translate-y-0.5 transition h-full">
                <div className={`w-16 h-16 ${v.color} rounded-2xl flex items-center justify-center mx-auto mb-5`}>
                  <i className={`fas ${v.icon} text-2xl`} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{v.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOUNDERS: hidden while the administrator has not added anyone */}
      {TEAM.length > 0 && (
        <section className="py-16 sm:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4">{teamTitle}</h2>
              <p className="text-gray-600 text-lg">{teamSubtitle}</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {TEAM.map((m, i) => {
                const card = (
                  <>
                    {m.avatar
                      ? <img src={m.avatar} alt={m.name} className="w-20 h-20 rounded-full object-cover mx-auto mb-4 shadow-md ring-4 ring-primary/10 group-hover:ring-primary/30 transition" />
                      : <span aria-hidden className="w-20 h-20 rounded-full mx-auto mb-4 grid place-items-center bg-primary/10 text-primary text-xl font-bold">{(m.name || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()}</span>}
                    <h3 className="font-bold text-gray-900 break-words">{m.name}</h3>
                    {m.role && <p className="text-sm text-primary font-medium mb-3 break-words">{m.role}</p>}
                    {m.desc && <p className="text-gray-600 text-xs leading-relaxed">{m.desc}</p>}
                  </>
                );
                const cls = 'block bg-gray-50 rounded-2xl p-6 text-center hover:shadow-lg transition group no-underline';
                return m.profileId
                  ? <Link key={m.profileId + i} to={`/users/${m.profileId}`} className={cls}>{card}</Link>
                  : <div key={m.name + i} className={cls}>{card}</div>;
              })}
            </div>
          </div>
        </section>
      )}

      {/* CONTACTS */}
      <section id="contacts" className="py-20 bg-gradient-to-br from-primary to-blue-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">

          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
              Контакты
            </h2>
            <p className="text-lg text-blue-100">
              Мы открыты для общения, сотрудничества и новых инициатив
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">

            {/* Левая колонка */}
            <div className="bg-white rounded-3xl p-8 shadow-xl">

              <div className="space-y-6">

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <i className="fas fa-envelope text-primary text-xl"/>
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

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <i className="fas fa-phone text-primary text-xl"/>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Телефон</p>

                    <a
                        href={`tel:${phone}`}
                        className="font-semibold text-gray-900 hover:text-primary no-underline block"
                    >
                      {phone}
                    </a>

                    <span className="text-sm text-gray-500">
                                {hours}
                            </span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <i className="fas fa-map-marker-alt text-primary text-xl"/>
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

                <a
                    href="mailto:ump@minpros.gospmr.org"
                    className="flex-1 bg-primary text-white text-center py-3 rounded-xl font-semibold hover:opacity-90 transition no-underline"
                >
                  Написать Email
                </a>

                <a
                    href="tel:0 (533) 2-22-29"
                    className="flex-1 border border-primary text-primary text-center py-3 rounded-xl font-semibold hover:bg-primary hover:text-white transition no-underline"
                >
                  Позвонить
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
                      className="text-gray-500 hover:text-blue-600 transition"
                      aria-label="Telegram"
                  >
                    <i className="fab fa-telegram"/>
                  </a>

                  <a
                      href="https://www.instagram.com/volonterpmr"
                      className="text-gray-500 hover:text-pink-600 transition"
                      aria-label="Instagram"
                  >
                    <i className="fab fa-instagram"/>
                  </a>

                  <a
                      href="https://vk.com"
                      target="_blank" rel="noopener noreferrer"
                      className="text-gray-500 hover:text-blue-700 transition"
                      aria-label="VK"
                  >
                    <i className="fab fa-vk"/>
                  </a>

                </div>
              </div>

            </div>

            {/* Карта */}
            <div className="overflow-hidden rounded-3xl shadow-xl bg-white">

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

            </div>
          </div>
        </div>
      </section>
    </>
  );
}
