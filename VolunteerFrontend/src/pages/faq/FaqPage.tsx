import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFeedback } from '../../context/FeedbackContext';
import { useSiteJson } from '../../context/SiteContentContext';
import { FAQ_DEFAULT } from '../../content/defaults';

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left bg-white hover:bg-gray-50 transition"
      >
        <span className="font-semibold text-gray-900">{q}</span>
        <i className={`fas fa-chevron-down text-primary transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 bg-white border-t border-gray-100">
          <p className="text-gray-600 leading-relaxed pt-3">{a}</p>
        </div>
      )}
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
      <section className="bg-gradient-to-br from-blue-50 to-teal-50 py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-6">
            <i className="fas fa-question-circle" />FAQ
          </div>
          <h1 className="text-4xl sm:text-5xl font-heading font-extrabold text-gray-900 leading-tight mb-5">
            Часто задаваемые <span className="text-primary">вопросы</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8">
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
      <section className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
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
                    <h2 className="text-xl font-heading font-bold text-gray-900">{cat.cat}</h2>
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
      <section className="py-12 bg-gradient-to-br from-teal-50 to-blue-50 border-t border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-xl text-center">
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-3">Не нашли ответ?</h2>
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
