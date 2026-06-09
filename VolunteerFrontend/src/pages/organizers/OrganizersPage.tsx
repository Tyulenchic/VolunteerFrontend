import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicUsersApi } from '../../api/publicUsers';
import type { UserResponseDto } from '../../types/user';
import { Spinner } from '../../components/Spinner';

const LOCATIONS = ['Тирасполь', 'Бендеры', 'Рыбница', 'Дубоссары', 'Слободзея'];
const CATEGORIES = ['Экология', 'Социальная помощь', 'Спорт', 'Обучение', 'Медицина', 'Животные'];

function getMeta(id: string) {
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    location: LOCATIONS[hash % LOCATIONS.length],
    category: CATEGORIES[hash % CATEGORIES.length],
  };
}

export function OrganizersPage() {
  const [organizers, setOrganizers] = useState<UserResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchRaw, setSearchRaw] = useState('');
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    publicUsersApi.getOrganizers(0, 50)
      .then(res => setOrganizers(res.items.length ? res.items : [])) // API may return empty array with 200 status, treat as no organizers
      .finally(() => setLoading(false));
  }, []);

  const onSearch = (v: string) => {
    setSearchRaw(v);
    if (timer) clearTimeout(timer);
    setTimer(setTimeout(() => setSearch(v), 300));
  };

  const filtered = organizers.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = `${o.firstName ?? ''} ${o.lastName ?? ''}`.toLowerCase();
    return name.includes(q) || (o.bio ?? '').toLowerCase().includes(q);
  });

  return (
    <>
      {/* HERO */}
      <section className="bg-gradient-to-br from-teal-50 to-blue-50 py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-6">
            <i className="fas fa-star" />Команда организаторов
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-gray-900 leading-tight mb-5">
            Люди, которые <span className="text-primary">создают</span> добрые дела
          </h1>
          <p className="text-lg text-gray-600">
            Наши организаторы координируют волонтёрские проекты и помогают каждому найти своё место в движении.
          </p>
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
              Организаторы не найдены
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(o => {
                const name = [o.firstName, o.lastName].filter(Boolean).join(' ') || o.email.split('@')[0];
                const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                const meta = getMeta(o.id);
                return (
                  <Link key={o.id} to={`/users/${o.id}`} className="no-underline">
                    <article className="bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:border-primary/30 transition-all duration-300 overflow-hidden group cursor-pointer h-full flex flex-col">
                      <div className="h-2 bg-gradient-to-r from-primary to-blue-500" />
                      <div className="p-6 flex-grow flex flex-col">
                        <div className="flex items-start gap-4 mb-4">
                          {o.avatarUrl ? (
                            <img src={o.avatarUrl} alt={name} className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 shadow-sm" />
                          ) : (
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-blue-400/30 flex items-center justify-center flex-shrink-0">
                              <span className="text-xl font-bold text-primary">{initials}</span>
                            </div>
                          )}
                          <div className="min-w-0 flex-grow">
                            <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-primary transition">{name}</h3>
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1">
                              <i className="fas fa-star text-[10px]" />Организатор
                            </span>
                          </div>
                        </div>
                        {o.bio && (
                          <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">{o.bio}</p>
                        )}
                        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100 text-xs text-gray-500 mt-auto">
                          <span className="flex items-center gap-1">
                            <i className="fas fa-map-marker-alt text-primary" />{meta.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <i className="fas fa-tag text-primary" />{meta.category}
                          </span>
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

      {/* CTA */}
      <section className="py-12 bg-gradient-to-br from-teal-50 to-blue-50 border-t border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-xl">
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-3">Хотите стать организатором?</h2>
          <p className="text-gray-600 mb-6">Если вы хотите возглавить направление или организовать своё мероприятие — свяжитесь с нами!</p>
          <a href="mailto:info@volunteerspmr.org" className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition shadow-lg no-underline">
            <i className="fas fa-envelope mr-2" />Написать нам
          </a>
        </div>
      </section>
    </>
  );
}
