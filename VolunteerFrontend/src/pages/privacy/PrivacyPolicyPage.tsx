import { Link } from 'react-router-dom';
import { useSiteJson } from '../../context/SiteContentContext';
import { PRIVACY_DEFAULT } from '../../content/defaults';


export function PrivacyPolicyPage() {
  const SECTIONS = useSiteJson('privacy.sections', PRIVACY_DEFAULT);
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