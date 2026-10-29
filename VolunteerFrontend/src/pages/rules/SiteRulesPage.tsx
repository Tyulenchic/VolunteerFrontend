import { Link } from 'react-router-dom';
import { useSiteJson } from '../../context/SiteContentContext';
import { RULES_DEFAULT } from '../../content/defaults';


export function SiteRulesPage() {
  const SECTIONS = useSiteJson('rules.sections', RULES_DEFAULT);
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
      <>
        {/* HERO */}
        <section className="py-16 sm:py-20">
          <div className="wrap max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <Link to="/" className="text-sm text-gray-500 hover:text-primary transition no-underline">Главная</Link>
              <i className="fas fa-chevron-right text-gray-300 text-xs" />
              <span className="text-sm text-gray-700 font-medium">Правила сайта</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-6">
              <i className="fas fa-gavel" />Правила использования
            </div>
            <h1 className="vol-h1 mb-6">
              Правила сайта
            </h1>
            <p className="vol-lead mb-4">
              Ознакомьтесь с правилами использования портала ВолонтёрыПМР. Соблюдение этих правил обеспечивает комфортную и безопасную среду для всех участников движения.
            </p>
            <p className="text-sm text-gray-400">
              <i className="fas fa-clock mr-1" />Последнее обновление: 1 января 2026 года
            </p>
          </div>
        </section>

        {/* CONTENT */}
        <section className="py-12">
          <div className="wrap max-w-4xl">
            <div className="flex flex-col lg:flex-row gap-10">
              {/* TOC — Исправленный */}
              <aside className="lg:w-56 flex-shrink-0">
                <div className="sticky top-24">
                  <p className="text-[0.8125rem] font-bold text-gray-400 uppercase tracking-wide mb-3">Содержание</p>
                  <nav className="space-y-1">
                    {SECTIONS.map(s => (
                        <a
                            key={s.id}
                            href={`#${s.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              scrollToSection(s.id);
                            }}
                            className="block text-sm text-gray-600 hover:text-primary transition no-underline py-1 px-2 rounded-lg hover:bg-white"
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
                        <h2 className="vol-h3">{s.title}</h2>
                      </div>
                      <ul className="space-y-3">
                        {s.items.map((item, i) => (
                            <li key={i} className="flex gap-3 text-gray-700 leading-relaxed">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-[0.8125rem] font-bold mt-0.5">
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
        <section className="py-10">
          <div className="wrap max-w-4xl flex flex-col sm:flex-row gap-4 items-center justify-between">
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