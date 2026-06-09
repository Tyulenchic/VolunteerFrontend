import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    id: 'intro',
    title: '1. Общие положения',
    icon: 'fa-info-circle',
    content: `Настоящая Политика конфиденциальности (далее — Политика) описывает, какие персональные данные собирает и обрабатывает портал ВолонтёрыПМР (далее — Портал), как они используются, хранятся и защищаются.

Портал действует в соответствии с применимым законодательством о защите персональных данных, включая нормы Приднестровской Молдавской Республики, а также принципы Общего регламента защиты данных ЕС (GDPR) в части, применимой к деятельности Портала.

Используя Портал, вы подтверждаете своё согласие с данной Политикой.`,
  },
  {
    id: 'data-collected',
    title: '2. Собираемые данные',
    icon: 'fa-database',
    content: `При регистрации: адрес электронной почты, имя и фамилия (опционально), пароль в зашифрованном виде, дата и время регистрации.

При использовании Портала: фотография профиля (загружается добровольно), краткая биография (заполняется добровольно), история участия в мероприятиях, IP-адрес и user agent браузера (для защиты аккаунта).

Технические данные: cookie-файлы для поддержания сессии аутентификации, логи ошибок (без персональных данных).`,
  },
  {
    id: 'usage',
    title: '3. Цели обработки',
    icon: 'fa-tasks',
    content: `Ваши данные используются в следующих целях:
— Создание и управление вашим аккаунтом
— Координация волонтёрской деятельности и отправка уведомлений о мероприятиях
— Обеспечение безопасности аккаунта (защита от несанкционированного доступа)
— Подтверждение участия в мероприятиях и выдача сертификатов
— Улучшение функциональности Портала на основе агрегированной статистики
— Ответы на ваши обращения и запросы`,
  },
  {
    id: 'sharing',
    title: '4. Передача данных третьим лицам',
    icon: 'fa-share-alt',
    content: `Мы не продаём и не передаём ваши персональные данные третьим лицам в коммерческих целях.

Данные могут быть переданы:
— Организаторам мероприятий (только имя и контактный email) — для координации участия
— Техническим партнёрам (хостинг, email-сервисы) — исключительно в рамках оказания услуг Порталу, на условиях соглашений о конфиденциальности
— По требованию компетентных органов — в случаях, предусмотренных законодательством

Публично отображаются: имя и фамилия, фото профиля, биография и история участия в мероприятиях — только то, что вы сами добавили в профиль.`,
  },
  {
    id: 'storage',
    title: '5. Хранение и безопасность',
    icon: 'fa-lock',
    content: `Пароли хранятся исключительно в виде криптографических хэшей (bcrypt) и никогда не передаются в открытом виде.

Обмен данными между вашим браузером и сервером осуществляется по протоколу HTTPS с шифрованием TLS.

Токены аутентификации имеют ограниченное время жизни и могут быть отозваны в любой момент из личного кабинета.

Данные хранятся на серверах, расположенных на территории ПМР и/или в юрисдикциях с надлежащим уровнем защиты данных.`,
  },
  {
    id: 'rights',
    title: '6. Ваши права',
    icon: 'fa-user-shield',
    content: `В соответствии с применимым законодательством вы имеете право:

Право на доступ — запросить информацию о том, какие данные о вас хранятся.

Право на исправление — потребовать исправления неточных данных.

Право на удаление — потребовать удаления своих данных. В этом случае аккаунт будет анонимизирован (согласно принципу ссылочной целостности записи сохраняются, однако персональные данные удаляются).

Право на отзыв согласия — вы можете отозвать согласие на обработку данных в любой момент в личном кабинете.

Право на переносимость — запросить копию своих данных в машиночитаемом формате.

Для реализации прав обращайтесь по адресу: info@volunteerspmr.org`,
  },
  {
    id: 'cookies',
    title: '7. Cookie-файлы',
    icon: 'fa-cookie-bite',
    content: `Портал использует только необходимые (технические) cookie-файлы для поддержания сессии авторизации. Мы не используем рекламные или аналитические cookie-файлы третьих сторон.

Вы можете настроить браузер для отклонения cookie, однако это может нарушить работу функций, требующих авторизации.`,
  },
  {
    id: 'minors',
    title: '8. Несовершеннолетние',
    icon: 'fa-child',
    content: `Портал не предназначен для детей до 14 лет. Мы не собираем намеренно данные лиц младше 14 лет. Если вы считаете, что такие данные были собраны, свяжитесь с нами — мы немедленно их удалим.

Регистрация пользователей в возрасте 14–17 лет возможна с согласия родителей или законных представителей.`,
  },
  {
    id: 'changes',
    title: '9. Изменения Политики',
    icon: 'fa-edit',
    content: `Мы можем периодически обновлять данную Политику. При существенных изменениях пользователи будут уведомлены по email или через уведомление на Портале. Продолжение использования Портала после обновления означает согласие с новой версией Политики.`,
  },
];

export function PrivacyPolicyPage() {
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
              <span className="text-sm text-gray-700 font-medium">Политика конфиденциальности</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-6">
              <i className="fas fa-shield-alt" />Конфиденциальность
            </div>
            <h1 className="text-4xl sm:text-5xl font-heading font-extrabold text-gray-900 leading-tight mb-5">
              Политика конфиденциальности
            </h1>
            <p className="text-gray-600 text-lg mb-4">
              Мы серьёзно относимся к защите ваших персональных данных. Этот документ объясняет, как мы собираем, используем и защищаем информацию о вас.
            </p>
            <p className="text-sm text-gray-400">
              <i className="fas fa-clock mr-1" />Дата вступления в силу: 1 января 2026 года
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
                      <div className="text-gray-700 leading-relaxed space-y-3 pl-13">
                        {s.content.split('\n\n').map((para, i) => (
                            <p key={i}>{para}</p>
                        ))}
                      </div>
                    </section>
                ))}

                <section className="pt-8 border-t border-gray-200">
                  <p className="text-gray-500 text-sm">
                    По вопросам, связанным с данной Политикой, обращайтесь:{' '}
                    <a href="mailto:info@volunteerspmr.org" className="text-primary hover:underline no-underline">info@volunteerspmr.org</a>
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
              <Link to="/rules" className="text-primary hover:underline no-underline font-medium">Правилами сайта</Link>
            </p>
            <Link to="/" className="px-5 py-2.5 bg-white text-gray-700 font-semibold rounded-xl border border-gray-300 hover:border-primary hover:text-primary transition text-sm no-underline">
              На главную
            </Link>
          </div>
        </section>
      </>
  );
}