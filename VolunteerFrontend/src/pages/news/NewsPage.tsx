import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { newsApi, type NewsResponseDto } from '../../api/news';
import { Spinner } from '../../components/Spinner';
import PhoneNewsImage from '../../assets/PhoneNews.webp';
import { IMAGE_POSITIONS } from '../../constants/imagePositions';
import { SecureImage } from '../../components/SecureImage';

const fmtDate = (s: string) => new Date(s).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' });

// Категория новости — свободный текст, который вводит администратор, поэтому список фильтров
// строится из загруженных новостей, а цвет метки берётся по хешу названия.
const CAT_PALETTE = ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-teal-100 text-teal-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700'];
const catColor = (name: string) => CAT_PALETTE[[...name].reduce((h, ch) => h + ch.charCodeAt(0), 0) % CAT_PALETTE.length];

const PER_PAGE = 9;


export function NewsPage() {
  const [items, setItems] = useState<NewsResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const [searchRaw, setSearchRaw] = useState('');
  const [page, setPage] = useState(1);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setLoading(true);
    newsApi.getActual(0, 100)
      .then(res => setItems(res.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onSearch = (v: string) => {
    setSearchRaw(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setSearch(v.trim()); setPage(1); }, 300);
  };

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const n of items) { const c = n.category?.trim(); if (c) counts.set(c, (counts.get(c) ?? 0) + 1); }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ru'));
  }, [items]);

  const filtered = items
    .filter(n => cat === 'all' || n.category === cat)
    .filter(n => {
      if (!search) return true;
      const q = search.toLowerCase();
      return n.title.toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q);
    });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const goPage = (p: number) => { setPage(p); window.scrollTo({ top: 300, behavior: 'smooth' }); };

   return (
     <>
       {/* HERO */}
       <section className="py-16 sm:py-24 relative overflow-hidden">
         {/* Background image */}
         <div className="absolute inset-0">
           <img
             src={PhoneNewsImage} 
             alt="Background" 
             className="w-full h-full object-cover"
             style={{ objectPosition: IMAGE_POSITIONS.news }}
           />
           <div className="absolute inset-0 bg-gradient-to-br from-teal-50/30 to-blue-50/30"></div>
         </div>
         <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
           <div className="text-center max-w-3xl mx-auto">
             <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-gray-900 mb-6 leading-tight">
               Новости нашего <span className="text-primary">движения</span>
             </h1>
             <p className="text-lg text-gray-600">
               Будьте в курсе последних событий, акций и историй успеха волонтёров Приднестровья.
             </p>
           </div>
         </div>
       </section>

      {/* FILTERS */}
      <section className="py-5 bg-white border-b border-gray-200 sticky top-[3.75rem] z-20 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <input
                value={searchRaw}
                onChange={e => onSearch(e.target.value)}
                placeholder="Поиск новостей..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
              <i className="fas fa-search absolute left-3.5 top-3 text-gray-400" />
              {searchRaw && (
                <button type="button" aria-label="Очистить поиск" onClick={() => { onSearch(''); setSearch(''); }}
                  className="absolute right-3 top-2.5 grid h-6 w-6 place-items-center rounded-full text-gray-400 hover:text-gray-700">
                  <i className="fas fa-times" />
                </button>
              )}
            </div>
            {categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto md:flex-wrap md:justify-end w-full md:w-auto pb-1 no-scrollbar">
                {[['all', 'Все', items.length] as const, ...categories.map(([c, n]) => [c, c, n] as const)].map(([key, label, count]) => (
                  <button key={key} onClick={() => { setCat(key); setPage(1); }} aria-pressed={cat === key}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${cat === key ? 'bg-primary text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
                    {label} <span className="opacity-70">{count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* GRID */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20"><Spinner /></div>
          ) : paged.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-200 rounded-full mb-4">
                <i className="fas fa-search text-3xl text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ничего не найдено</h3>
              <p className="text-gray-600">Попробуйте изменить параметры поиска или категорию.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paged.map(n => (
                <article key={n.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                  <Link to={`/news/${n.id}`} className="block no-underline">
                    {n.imageUrl && (
                      <div className="relative overflow-hidden">
                        <SecureImage src={n.imageUrl} alt={n.title} className="w-full h-48 object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
                        {n.category && (
                          <div className="absolute top-4 left-4">
                            <span className={`px-3 py-1 ${catColor(n.category)} rounded-full text-xs font-semibold`}>
                              {n.category}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-6">
                      <time className="text-sm text-gray-500 flex items-center gap-2 mb-3">
                        <i className="far fa-calendar-alt text-primary" />{fmtDate(n.createdAt)}
                      </time>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition line-clamp-2">{n.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{n.content}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        {n.authorName && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <i className="far fa-user text-primary" />
                            <span className="font-medium">{n.authorName}</span>
                          </div>
                        )}
                        <span className="inline-flex items-center gap-1 text-primary text-sm font-medium ml-auto">
                          Читать далее <i className="fas fa-arrow-right text-xs" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <section className="py-8 bg-gray-50 border-t border-gray-200">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex justify-center items-center gap-2">
              {page > 1 && (
                <button onClick={() => goPage(page - 1)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  <i className="fas fa-chevron-left" />
                </button>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
                const show = p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1);
                if (!show && p !== page - 2 && p !== page + 2) return null;
                if (p === page - 2 || p === page + 2) return <span key={p} className="px-2 text-gray-400">…</span>;
                return (
                  <button key={p} onClick={() => goPage(p)}
                    className={`px-4 py-2 rounded-lg transition ${p === page ? 'bg-primary text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>
                    {p}
                  </button>
                );
              })}
              {page < totalPages && (
                <button onClick={() => goPage(page + 1)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  <i className="fas fa-chevron-right" />
                </button>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
