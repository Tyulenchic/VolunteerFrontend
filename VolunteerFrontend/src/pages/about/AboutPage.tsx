import { Link } from 'react-router-dom';
import OnasImage from '../../assets/Onas.png';
import { IMAGE_POSITIONS } from '../../constants/imagePositions';

const TEAM = [
  { name: 'Александр Ковалёв', role: 'Основатель & Директор', avatar: 'https://i.pravatar.cc/150?img=52', desc: 'Более 10 лет в сфере социального предпринимательства. Основал движение в 2020 году.' },
  { name: 'Анна Петрова', role: 'Руководитель направлений', avatar: 'https://i.pravatar.cc/150?img=47', desc: 'Координирует все основные направления волонтёрской деятельности.' },
  { name: 'Иван Сидоров', role: 'Руководитель социального блока', avatar: 'https://i.pravatar.cc/150?img=12', desc: 'Отвечает за программы помощи ветеранам и пожилым людям.' },
  { name: 'Мария Козлова', role: 'Куратор обучения', avatar: 'https://i.pravatar.cc/150?img=23', desc: 'Разрабатывает образовательные программы и тренинги для волонтёров.' },
];

const VALUES = [
  { icon: 'fa-heart', title: 'Доброта', desc: 'Каждое действие продиктовано искренним желанием помочь, без ожидания награды.', color: 'text-red-500 bg-red-50' },
  { icon: 'fa-users', title: 'Единство', desc: 'Вместе мы сильнее. Мы верим в силу сообщества и коллективного действия.', color: 'text-blue-500 bg-blue-50' },
  { icon: 'fa-leaf', title: 'Ответственность', desc: 'Мы заботимся о природе, обществе и будущих поколениях Приднестровья.', color: 'text-teal-500 bg-teal-50' },
  { icon: 'fa-graduation-cap', title: 'Развитие', desc: 'Мы учимся и растём, делясь знаниями и опытом друг с другом.', color: 'text-purple-500 bg-purple-50' },
];

export function AboutPage() {
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
              <p className="text-xl text-gray-600 leading-relaxed mb-6">
                Официальный портал волонтёрского движения Приднестровья.
                <br />
                С 2020 года мы объединяем людей с добрыми сердцами
                <br />
                и направляем их энергию на позитивные изменения.
              </p>
              <p className="text-xl text-gray-600 leading-relaxed mb-6">
                Наша миссия
                <br/> — создать устойчивое сообщество неравнодушных граждан,
                <br />
                способных эффективно решать социальные,
                <br/> и культурные проблемы региона.
              </p>
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
              <p className="text-lg text-gray-700 leading-relaxed">
                Это платформа для волонтёров, организаторов и организаций, которая содержит в себе самые актуальные новости из жизни добровольческого сообщества Приднестровья.
              </p>
              <p className="text-gray-700 leading-relaxed">
                ЕИС "Волонтёры Приднестровья" объединяет различные запросы и предложения со стороны добровольцев и организаций в рамках одного ресурса, что позволяет всем гражданам, независимо от возраста, места жительства и интересов, находить возможности для оказания волонтерской помощи и самореализации через добровольчество.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Сайт разработан Министерством цифрового развития, связи и массовых коммуникаций Приднестровской Молдавской Республики совместно с Министерством просвещения Приднестровской Молдавской Республики в рамках реализации Плана работы Координационного совета по развитию добровольческого (волонтерского) движения в Приднестровской Молдавской Республике.
              </p>
              <div className="mt-10 pt-8 border-t border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6">НАШИ УСИЛИЯ НАПРАВЛЕНЫ НА:</h3>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-3" />
                    <p className="text-gray-700">РАЗВИТИЕ КУЛЬТУРЫ ДОБРЫХ ДЕЛ В ПРИДНЕСТРОВЬЕ;</p>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-3" />
                    <p className="text-gray-700">КОНСОЛИДАЦИЮ ПОТЕНЦИАЛА ВОЛОНТЁРОВ;</p>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-3" />
                    <p className="text-gray-700">ПОДДЕРЖКУ ПАРТНЕРОВ ЧЕРЕЗ КОМПЛЕКС УСЛУГ И РЕСУРСОВ.</p>
                  </li>
                </ul>
                <p className="text-lg font-medium text-primary">
                  Мы получаем уникальный опыт и жизненно важные навыки вместе с вами!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* MISSION & VALUES */}
      <section className="py-4 sm:py-0 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4">Наши ценности</h2>
            <p className="text-gray-600 text-lg">Принципы, которыми мы руководствуемся в каждом проекте</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(v => (
              <div key={v.title} className="bg-gray-50 rounded-2xl p-6 text-center hover:shadow-lg transition">
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


      {/* TEAM */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4">Команда руководства</h2>
            <p className="text-gray-600 text-lg">Люди, которые направляют движение вперёд</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map(m => (
              <div key={m.name} className="bg-gray-50 rounded-2xl p-6 text-center hover:shadow-lg transition group">
                <img src={m.avatar} alt={m.name} className="w-20 h-20 rounded-full object-cover mx-auto mb-4 shadow-md ring-4 ring-primary/10 group-hover:ring-primary/30 transition" />
                <h3 className="font-bold text-gray-900">{m.name}</h3>
                <p className="text-sm text-primary font-medium mb-3">{m.role}</p>
                <p className="text-gray-600 text-xs leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
                    <i className="fas fa-envelope text-primary text-xl" />
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>

                    <a
                        href="mailto:ump@minpros.gospmr.org"
                        className="font-semibold text-gray-900 hover:text-primary no-underline"
                    >
                      ump@minpros.gospmr.org
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <i className="fas fa-phone text-primary text-xl" />
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Телефон</p>

                    <a
                        href="tel:+37377712345"
                        className="font-semibold text-gray-900 hover:text-primary no-underline block"
                    >
                      +373 777 12-345
                    </a>

                    <span className="text-sm text-gray-500">
                                Пн–Пт, 9:00–18:00
                            </span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <i className="fas fa-map-marker-alt text-primary text-xl" />
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Адрес</p>

                    <p className="font-semibold text-gray-900">
                      г. Тирасполь
                    </p>

                    <span className="text-sm text-gray-500">
                                Управление молодежной политики
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
                    href="tel:+37377712345"
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
                      href="#"
                      className="text-gray-500 hover:text-blue-600 transition"
                      aria-label="Telegram"
                  >
                    <i className="fab fa-telegram" />
                  </a>

                  <a
                      href="#"
                      className="text-gray-500 hover:text-pink-600 transition"
                      aria-label="Instagram"
                  >
                    <i className="fab fa-instagram" />
                  </a>

                  <a
                      href="#"
                      className="text-gray-500 hover:text-blue-700 transition"
                      aria-label="VK"
                  >
                    <i className="fab fa-vk" />
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

              <div className="h-[500px]">
                <iframe
                    title="Карта"
                    className="w-full h-full border-0"
                    src="https://yandex.ru/map-widget/v1/?um=constructor%3A5fe78c3b3f99d6edd0b14928a1aecbbe2b69aaa8345247b021d33f17660a7693&amp;source=constructor"
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
