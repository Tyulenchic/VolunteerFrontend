import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFeedback } from '../../context/FeedbackContext';
import { useSiteJson } from '../../context/SiteContentContext';
import { FAQ_DEFAULT } from '../../content/defaults';

/** Вопрос раскрывается плавно (высота 0 → по содержимому через grid-template-rows); свёрнутый ответ недоступен фокусу и чтецам. */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={`overflow-hidden rounded-card border bg-vol-surface transition-[border-color,box-shadow] duration-300 ${open ? 'border-primary/30 shadow-raise' : 'border-vol-line'}`}>
      <button type="button" onClick={() => setOpen(p => !p)} aria-expanded={open} aria-controls={id}
        className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-vol-bg sm:p-5">
        <span className="text-body-sm font-semibold text-vol-fg sm:text-body">{q}</span>
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-[background-color,rotate] duration-300 ${open ? 'rotate-180 bg-vol-accent-soft' : ''}`}>
          <i className="fas fa-chevron-down text-primary" aria-hidden />
        </span>
      </button>
      <div id={id} inert={!open} className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(.2,.7,.2,1)] ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="min-h-0">
          <p className={`vol-text-sm border-t border-vol-line px-4 pb-5 pt-3 leading-relaxed transition-opacity duration-300 sm:px-5 ${open ? 'opacity-100' : 'opacity-0'}`}>{a}</p>
        </div>
      </div>
    </div>
  );
}

export function FaqPage() {
  const [search, setSearch] = useState('');
  const { openFeedback } = useFeedback();
  const FAQS = useSiteJson('faq.categories', FAQ_DEFAULT);

  const filtered = FAQS.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      !search ||
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => cat.items.length > 0);

  return (
    <>
      {/* HERO */}
      <section className="py-16 sm:py-20">
        <div className="wrap text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-6">
            <i className="fas fa-question-circle" />FAQ
          </div>
          <h1 className="vol-h1 mb-6">
            Часто задаваемые <span className="text-primary">вопросы</span>
          </h1>
          <p className="vol-lead mx-auto mb-8">
            Ответы на самые популярные вопросы о волонтёрстве на нашем портале
          </p>
          <div className="relative max-w-lg mx-auto">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по вопросам..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition shadow-sm text-sm"
            />
            <i className="fas fa-search absolute left-4 top-3.5 text-gray-400" />
          </div>
        </div>
      </section>

      {/* FAQ LIST */}
      <section className="py-12 sm:py-16">
        <div className="wrap max-w-4xl">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <i className="fas fa-search text-4xl text-gray-300 mb-3 block" />
              <p className="text-gray-600">По запросу «{search}» ничего не найдено</p>
            </div>
          ) : (
            <div className="space-y-10">
              {filtered.map(cat => (
                <div key={cat.cat}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center`}>
                      <i className={`fas ${cat.icon} ${cat.color}`} />
                    </div>
                    <h2 className="vol-h3">{cat.cat}</h2>
                  </div>
                  <div className="space-y-3">
                    {cat.items.map(item => (
                      <FAQItem key={item.q} q={item.q} a={item.a} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* STILL HAVE QUESTIONS */}
      <section className="py-12">
        <div className="wrap max-w-xl text-center">
          <h2 className="vol-compact mb-3">Не нашли ответ?</h2>
          <p className="text-gray-600 mb-6">Свяжитесь с нами — мы ответим в течение рабочего дня.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                  onClick={openFeedback}
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition shadow-lg"
              >
                <i className="fas fa-envelope mr-2" />Написать нам
              </button>
            <Link to="/" className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-300 hover:border-primary hover:text-primary transition no-underline">
              На главную
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
