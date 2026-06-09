import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicUsersApi } from '../../api/publicUsers';
import type { UserResponseDto } from '../../types/user';
import { Spinner } from '../../components/Spinner';

const LOCATIONS = ['Тирасполь', 'Бендеры', 'Рыбница', 'Дубоссары', 'Слободзея', 'Григориополь'];
const CATEGORIES = ['Экология', 'Социальная помощь', 'Спорт', 'Обучение', 'Медицина', 'Животные', 'Патриотика', 'Культура'];

function getMeta(id: string) {
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    location: LOCATIONS[hash % LOCATIONS.length],
    category: CATEGORIES[(hash * 7) % CATEGORIES.length],
  };
}

const EVENTS_RANGE = [3, 5, 8, 12, 15, 20, 25];

export function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<UserResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchRaw, setSearchRaw] = useState('');
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    publicUsersApi.getVolunteers(0, 50)
      .then(res => setVolunteers(res.items.length ? res.items : [])) // API may return empty array with 200 status, treat as no volunteers
      .finally(() => setLoading(false));
  }, []);

  const onSearch = (v: string) => {
    setSearchRaw(v);
    if (timer) clearTimeout(timer);
    setTimer(setTimeout(() => setSearch(v), 300));
  };

  const filtered = volunteers.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = `${v.firstName ?? ''} ${v.lastName ?? ''}`.toLowerCase();
    return name.includes(q) || (v.bio ?? '').toLowerCase().includes(q);
  });

  return (
    <>
      {/* HERO */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-6">
            <i className="fas fa-heart" />Наши волонтёры
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-gray-900 leading-tight mb-5">
            Люди с <span className="text-primary">добрым</span> сердцем
          </h1>
          <p className="text-lg text-gray-600">
            Каждый волонтёр — это история доброты. Знакомьтесь с теми, кто делает Приднестровье лучше каждый день.
          </p>
          <div className="flex justify-center gap-8 mt-8">
            {[{ v: `${volunteers.length || '50+'}`, l: 'Волонтёров' }, { v: '200+', l: 'Акций' }, { v: '5 лет', l: 'Движению' }].map(s => (
              <div key={s.l} className="text-center">
                <div className="text-3xl font-bold text-primary">{s.v}</div>
                <div className="text-sm text-gray-500">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEARCH */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-200 py-4 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative max-w-md mx-auto">
            <input
              value={searchRaw}
              onChange={e => onSearch(e.target.value)}
              placeholder="Поиск по имени..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
            <i className="fas fa-search absolute left-3.5 top-3 text-gray-400" />
          </div>
        </div>
      </div>

      {/* GRID */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20"><Spinner /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <i className="fas fa-search text-4xl mb-3 block opacity-40" />
              Волонтёры не найдены
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map(v => {
                const name = [v.firstName, v.lastName].filter(Boolean).join(' ') || v.email.split('@')[0];
                const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                const meta = getMeta(v.id);
                const hash = v.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
                const eventsCount = EVENTS_RANGE[hash % EVENTS_RANGE.length];
                return (
                  <Link key={v.id} to={`/users/${v.id}`} className="no-underline">
                    <article className="bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:border-primary/30 transition-all duration-300 overflow-hidden group text-center cursor-pointer h-full flex flex-col">
                      <div className="pt-8 pb-5 px-5 flex-grow">
                        {v.avatarUrl ? (
                          <img src={v.avatarUrl} alt={name} className="w-20 h-20 rounded-full object-cover mx-auto mb-4 shadow-md ring-4 ring-primary/10 group-hover:ring-primary/30 transition" />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-blue-400/20 flex items-center justify-center mx-auto mb-4 ring-4 ring-primary/10 group-hover:ring-primary/30 transition">
                            <span className="text-2xl font-bold text-primary">{initials}</span>
                          </div>
                        )}
                        <h3 className="font-bold text-gray-900 text-base group-hover:text-primary transition">{name}</h3>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full mt-1">
                          <i className="fas fa-heart text-[10px]" />Волонтёр
                        </span>
                        {v.bio && (
                          <p className="text-gray-500 text-xs leading-relaxed mt-3 line-clamp-2">{v.bio}</p>
                        )}
                      </div>
                      <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 flex justify-around text-center">
                        <div>
                          <div className="text-sm font-bold text-gray-900">{meta.location}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-1 justify-center">
                            <i className="fas fa-map-marker-alt text-primary text-[10px]" />Город
                          </div>
                        </div>
                        <div className="w-px bg-gray-200" />
                        <div>
                          <div className="text-sm font-bold text-gray-900">{eventsCount}</div>
                          <div className="text-xs text-gray-400">Акций</div>
                        </div>
                        <div className="w-px bg-gray-200" />
                        <div>
                          <div className="text-sm font-bold text-gray-900 truncate max-w-[70px]">{meta.category}</div>
                          <div className="text-xs text-gray-400">Категория</div>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* JOIN CTA */}
      <section className="py-12 bg-gradient-to-br from-blue-50 to-purple-50 border-t border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-xl">
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-3">Присоединяйтесь к нам!</h2>
          <p className="text-gray-600 mb-6">Станьте частью самого большого волонтёрского движения Приднестровья.</p>
          <a href="/register" className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition shadow-lg no-underline">
            <i className="fas fa-user-plus mr-2" />Зарегистрироваться
          </a>
        </div>
      </section>
    </>
  );
}
