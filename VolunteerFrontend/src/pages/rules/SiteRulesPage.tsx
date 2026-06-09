import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    id: 'general',
    title: '1. Общие положения',
    icon: 'fa-gavel',
    items: [
      'Настоящие Правила регулируют использование портала ВолонтёрыПМР (далее — Портал) всеми зарегистрированными и незарегистрированными пользователями.',
      'Используя Портал, вы автоматически соглашаетесь с настоящими Правилами. Если вы не согласны с какими-либо положениями, пожалуйста, прекратите использование Портала.',
      'Администрация оставляет за собой право изменять Правила без предварительного уведомления. Продолжение использования Портала после внесения изменений означает согласие с обновлёнными Правилами.',
      'Портал предназначен для координации волонтёрской деятельности на территории Приднестровья. Использование в иных целях запрещено.',
    ],
  },
  {
    id: 'registration',
    title: '2. Регистрация и аккаунт',
    icon: 'fa-user-check',
    items: [
      'Для регистрации необходимо указать действующий адрес электронной почты и подтвердить его. Регистрация с одноразовыми или недействительными email-адресами запрещена.',
      'Каждый пользователь может иметь только один аккаунт. Создание нескольких аккаунтов одним лицом является нарушением Правил.',
      'Вы обязаны сохранять конфиденциальность ваших учётных данных. Администрация не несёт ответственности за последствия несанкционированного использования вашего аккаунта.',
      'При регистрации вы обязаны предоставлять достоверную информацию о себе. Использование чужих личных данных запрещено.',
      'Минимальный возраст для самостоятельной регистрации — 18 лет. Пользователи от 14 до 18 лет могут регистрироваться с письменного согласия родителей или законных представителей.',
    ],
  },
  {
    id: 'conduct',
    title: '3. Правила поведения',
    icon: 'fa-handshake',
    items: [
      'Пользователи обязаны общаться уважительно и корректно. Оскорбления, агрессия, угрозы и дискриминация по любому признаку категорически запрещены.',
      'Запрещено публиковать заведомо ложную, вводящую в заблуждение или клеветническую информацию.',
      'Запрещено распространение спама, рекламных материалов без согласования с администрацией, а также ссылок на вредоносное программное обеспечение.',
      'Запрещено использование Портала в целях, противоречащих законодательству Приднестровской Молдавской Республики.',
      'Запрещена публикация контента сексуального характера, материалов, пропагандирующих насилие, экстремизм или иную противоправную деятельность.',
    ],
  },
  {
    id: 'participation',
    title: '4. Участие в мероприятиях',
    icon: 'fa-calendar-check',
    items: [
      'Регистрация на мероприятие является принятием обязательства участвовать. Пожалуйста, отменяйте заявку заблаговременно, если вы не сможете прийти — минимум за 24 часа.',
      'Систематические незаявленные неявки (более 3 раз) могут стать основанием для временного ограничения доступа к регистрации на мероприятия.',
      'Все участники обязаны соблюдать инструктаж, предоставленный организаторами, и следовать указаниям ответственных лиц.',
      'Организаторы вправе отказать в участии без объяснения причин, если поведение волонтёра создаёт риски для окружающих или нарушает правила.',
      'Участники несут личную ответственность за点儿 своё здоровье и безопасность. Администрация и организаторы не несут ответственности за несчастные случаи, произошедшие по вине самого участника.',
    ],
  },
  {
    id: 'content',
    title: '5. Пользовательский контент',
    icon: 'fa-images',
    items: [
      'Публикуя любой контент на Портале, вы подтверждаете, что обладаете необходимыми правами на его размещение.',
      'Вы предоставляете администрации Портала неисключительное право использовать опубликованный вами контент в целях функционирования и продвижения Портала.',
      'Администрация оставляет за собой право удалить любой контент, нарушающий настоящие Правила, без предварительного уведомления.',
      'Запрещена публикация персональных данных третьих лиц без их явного согласия.',
    ],
  },
  {
    id: 'responsibility',
    title: '6. Ответственность и ограничения',
    icon: 'fa-shield-alt',
    items: [
      'Администрация Портала не несёт ответственности за действия пользователей и организаторов мероприятий.',
      'Портал предоставляется «как есть». Администрация не гарантирует бесперебойную работу и не несёт ответственности за технические сбои.',
      'Администрация вправе заблокировать аккаунт пользователя при нарушении настоящих Правил без предупреждения и без права на возмещение.',
    ],
  },
  {
    id: 'sanctions',
    title: '7. Нарушения и санкции',
    icon: 'fa-exclamation-triangle',
    items: [
      'За нарушение Правил предусмотрены следующие меры: предупреждение, временная блокировка аккаунта, постоянная блокировка аккаунта.',
      'Тяжесть нарушения определяется администрацией. При систематических нарушениях аккаунт блокируется без предупреждения.',
      'Если вы считаете блокировку необоснованной, вы можете обратиться по адресу [info@volunteerspmr.org](mailto:info@volunteerspmr.org) с объяснением ситуации.',
    ],
  },
];

export function SiteRulesPage() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
      <>
        {/* HERO */}
        <section className="bg-gradient-to-br from-gray-50 to-blue-50 py-16 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <Link to="/" className="text-sm text-gray-500 hover:text-primary transition no-underline">Главная</Link>
              <i className="fas fa-chevron-right text-gray-300 text-xs" />
              <span className="text-sm text-gray-700 font-medium">Правила сайта</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-6">
              <i className="fas fa-gavel" />Правила использования
            </div>
            <h1 className="text-4xl sm:text-5xl font-heading font-extrabold text-gray-900 leading-tight mb-5">
              Правила сайта
            </h1>
            <p className="text-gray-600 text-lg mb-4">
              Ознакомьтесь с правилами использования портала ВолонтёрыПМР. Соблюдение этих правил обеспечивает комфортную и безопасную среду для всех участников движения.
            </p>
            <p className="text-sm text-gray-400">
              <i className="fas fa-clock mr-1" />Последнее обновление: 1 января 2026 года
            </p>
          </div>
        </section>

        {/* CONTENT */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="flex flex-col lg:flex-row gap-10">
              {/* TOC — Исправленный */}
              <aside className="lg:w-56 flex-shrink-0">
                <div className="sticky top-24">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Содержание</p>
                  <nav className="space-y-1">
                    {SECTIONS.map(s => (
                        <a
                            key={s.id}
                            href={`#${s.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              scrollToSection(s.id);
                            }}
                            className="block text-sm text-gray-600 hover:text-primary transition no-underline py-1 px-2 rounded-lg hover:bg-gray-50"
                        >
                          {s.title}
                        </a>
                    ))}
                  </nav>
                </div>
              </aside>

              {/* SECTIONS */}
              <div className="flex-1 space-y-10">
                {SECTIONS.map(s => (
                    <section key={s.id} id={s.id} className="scroll-mt-24">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <i className={`fas ${s.icon} text-primary`} />
                        </div>
                        <h2 className="text-xl font-heading font-bold text-gray-900">{s.title}</h2>
                      </div>
                      <ul className="space-y-3">
                        {s.items.map((item, i) => (
                            <li key={i} className="flex gap-3 text-gray-700 leading-relaxed">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                          {i + 1}
                        </span>
                              <span>{item}</span>
                            </li>
                        ))}
                      </ul>
                    </section>
                ))}

                <section className="pt-8 border-t border-gray-200">
                  <p className="text-gray-500 text-sm">
                    Если у вас есть вопросы по данным Правилам, обращайтесь по адресу{' '}
                    <a href="mailto:info@volunteerspmr.org" className="text-primary hover:underline no-underline">info@volunteerspmr.org</a>.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-10 bg-gray-50 border-t border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl flex flex-col sm:flex-row gap-4 items-center justify-between">
            <p className="text-gray-600 text-sm">
              Ознакомьтесь также с{' '}
              <Link to="/privacy" className="text-primary hover:underline no-underline font-medium">Политикой конфиденциальности</Link>
            </p>
            <div className="flex gap-3">
              <Link to="/" className="px-5 py-2.5 bg-white text-gray-700 font-semibold rounded-xl border border-gray-300 hover:border-primary hover:text-primary transition text-sm no-underline">
                На главную
              </Link>
              <Link to="/register" className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition text-sm no-underline">
                Зарегистрироваться
              </Link>
            </div>
          </div>
        </section>
      </>
  );
}