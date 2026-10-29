import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { organizationsApi } from '../../api/organizations';
import { CroppedImage } from '../../components/ImageCropper';
import { Spinner } from '../../components/Spinner';
import { useFeedback } from '../../context/FeedbackContext';
import {
  ALL_CATEGORIES, ALL_LEVELS, CATEGORY_BADGE, CATEGORY_ICON, CATEGORY_LABEL, LEVEL_ICON, LEVEL_LABEL,
  type OrganizationCategory, type OrganizationLevel, type OrganizationListItem,
} from '../../types/organization';

const PAGE = 18;
const CITIES = ['Тирасполь', 'Бендеры', 'Рыбница', 'Дубоссары', 'Слободзея', 'Григориополь', 'Каменка'];

/** Каталог организаций. Данные приходят с сервера: поиск, тип, направление и город фильтруются на стороне API. */
export function OrganizationsPage() {
  const { openFeedback } = useFeedback();
  const [items, setItems] = useState<OrganizationListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<OrganizationCategory | ''>('');
  const [level, setLevel] = useState<OrganizationLevel | ''>('');
  const [city, setCity] = useState('');
  const [searchRaw, setSearchRaw] = useState('');
  const [search, setSearch] = useState('');
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const request = useRef(0); // ответ устаревшего запроса не должен перезаписать свежий

  const onSearch = (value: string) => {
    setSearchRaw(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setSearch(value.trim()), 300);
  };
  useEffect(() => () => { if (debounce.current) clearTimeout(debounce.current); }, []);

  const load = useCallback(async (skip: number) => {
    const id = ++request.current;
    if (skip === 0) setLoading(true); else setLoadingMore(true);
    setError(null);
    try {
      const page = await organizationsApi.list({
        skip, take: PAGE,
        search: search || undefined, city: city || undefined,
        level: level || undefined, category: category || undefined,
      });
      if (id !== request.current) return;
      setItems(prev => (skip === 0 ? page.items : [...prev, ...page.items]));
      setTotal(page.totalCount);
    } catch {
      if (id === request.current) setError('Не удалось загрузить организации. Проверьте соединение и попробуйте ещё раз.');
    } finally {
      if (id === request.current) { setLoading(false); setLoadingMore(false); }
    }
  }, [search, city, level, category]);

  useEffect(() => { void load(0); }, [load]);

  return (
    <>
      {/* HERO */}
      <section className="py-16 sm:py-24">
        <div className="wrap">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="vol-h1 mb-6">
              Волонтёрские организации <span className="text-primary">Приднестровья</span>
            </h1>
            <p className="vol-lead mx-auto mb-8">
              Познакомьтесь с командами, которые ежедневно делают мир вокруг нас лучше. Загляните на страницу организации,
              посмотрите её мероприятия и фотографии, подайте заявку и становитесь волонтёром.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {['Мероприятия и фото организаций', 'Заявка в один клик'].map(b => (
                <div key={b} className="flex items-center gap-2 text-gray-600 bg-white px-4 py-2 rounded-xl shadow-sm">
                  <i className="fas fa-check-circle text-primary" /><span>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <section className="py-5 vol-bar border-b border-vol-line sticky top-[3.75rem] z-20">
        <div className="wrap space-y-3">
          <div className="flex flex-col md:flex-row gap-3 justify-between">
            <div className="relative w-full md:w-96">
              <input
                value={searchRaw}
                onChange={e => onSearch(e.target.value)}
                placeholder="Поиск организации..."
                aria-label="Поиск организации"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
              <i className="fas fa-search absolute left-3.5 top-3.5 text-gray-400" />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <select value={level} onChange={e => setLevel(e.target.value as OrganizationLevel | '')} aria-label="Тип организации"
                className="flex-1 md:flex-none px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-sm">
                <option value="">Все типы</option>
                {ALL_LEVELS.map(l => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
              </select>
              <select value={city} onChange={e => setCity(e.target.value)} aria-label="Город"
                className="flex-1 md:flex-none px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-sm">
                <option value="">Все города</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {(['', ...ALL_CATEGORIES] as Array<OrganizationCategory | ''>).map(k => (
              <button
                key={k || 'all'}
                onClick={() => setCategory(k)}
                aria-pressed={category === k}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  category === k ? 'bg-primary text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {k && <i className={`fas ${CATEGORY_ICON[k]} mr-1`} />}
                {k ? CATEGORY_LABEL[k] : 'Все направления'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* GRID */}
      <section className="py-16 sm:py-20">
        <div className="wrap">
          {loading ? (
            <div className="flex justify-center py-20"><Spinner /></div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-gray-700 mb-4">{error}</p>
              <button onClick={() => void load(0)} className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition">Повторить</button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-200 rounded-full mb-4">
                <i className="fas fa-search text-3xl text-gray-400" />
              </div>
              <h3 className="vol-h3 mb-2">Ничего не найдено</h3>
              <p className="text-gray-600">Попробуйте изменить параметры поиска или направление.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-6" aria-live="polite">Найдено организаций: {total}</p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,19rem),1fr))] gap-8">
                {items.map(org => (
                  <article key={org.id}
                    className="group relative bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-primary/30 transition-all duration-300 overflow-hidden flex flex-col">
                    {/* обложка */}
                    <div className="h-24 bg-gradient-to-r from-blue-100 to-blue-100 overflow-hidden">
                      {org.coverThumbnailUrl && (
                        <CroppedImage src={org.coverThumbnailUrl} crop={org.coverCrop} aspect={16 / 5} className="!rounded-none w-full" />
                      )}
                    </div>
                    {/* логотип */}
                    <div className="-mt-9 px-8 relative">
                      <div className="w-[72px] h-[72px] bg-white rounded-2xl shadow-xl flex items-center justify-center border border-gray-100 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                        {org.logoThumbnailUrl
                          ? <CroppedImage src={org.logoThumbnailUrl} crop={org.logoCrop} aspect={1} className="w-full !rounded-none" alt="" />
                          : <i className={`${LEVEL_ICON[org.level]} text-3xl text-blue-500`} />}
                      </div>
                    </div>

                    <div className="p-8 pt-4 flex flex-col flex-grow">
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {org.categories.slice(0, 2).map(c => (
                          <span key={c} className={`px-2.5 py-0.5 rounded-full text-[0.8125rem] font-bold uppercase ${CATEGORY_BADGE[c]}`}>{CATEGORY_LABEL[c]}</span>
                        ))}
                        {org.city && <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[0.8125rem] font-bold uppercase">{org.city}</span>}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-primary transition">{org.shortName || org.name}</h3>
                      <p className="text-[0.8125rem] text-gray-500 mb-3">{LEVEL_LABEL[org.level]}</p>
                      <p className="text-gray-600 text-sm mb-4 leading-relaxed flex-grow">{org.shortDescription}</p>

                      <Link to={`/organizations/${org.id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition text-sm no-underline">
                        <i className="fas fa-info-circle" /> Подробнее
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
              {items.length < total && (
                <div className="text-center mt-10">
                  <button onClick={() => void load(items.length)} disabled={loadingMore}
                    className="px-8 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition disabled:opacity-60">
                    {loadingMore ? 'Загрузка…' : `Показать ещё (${total - items.length})`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-dark/30 rounded-full -ml-20 -mb-20 blur-3xl" />
        <div className="wrap relative z-10 text-center">
          <h2 className="vol-h2 !text-white mb-6">Представить свою организацию?</h2>
          <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">
            Если вы руководите волонтёрской инициативой и хотите появиться в каталоге, напишите нам: администратор создаст страницу
            организации и назначит организаторов, которые смогут проводить мероприятия и принимать волонтёров.
          </p>
          <button onClick={openFeedback} className="px-8 py-4 bg-white text-primary font-bold rounded-xl hover:bg-gray-100 transition shadow-lg">
            <i className="fas fa-envelope mr-2" />Написать нам
          </button>
        </div>
      </section>
    </>
  );
}

