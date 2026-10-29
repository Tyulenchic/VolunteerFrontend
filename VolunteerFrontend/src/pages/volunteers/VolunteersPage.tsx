import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicUsersApi } from '../../api/publicUsers';
import type { PublicUserDto } from '../../types/user';
import { Spinner } from '../../components/Spinner';
import { Avatar } from '../../components/ui/Avatar';
import { AnimatedBackdrop } from '../../components/ui/AnimatedBackdrop';


export function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<PublicUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchRaw, setSearchRaw] = useState('');
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    publicUsersApi.getVolunteers(0, 50)
      // Сервер не отдаёт тех, кто скрыл ФИО или фото; страховка на случай старой версии API — без имени карточку не рисуем.
      .then(res => setVolunteers(res.items.filter(u => u.firstName || u.lastName)))
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
      <section className="relative overflow-hidden py-16 sm:py-20">
        <AnimatedBackdrop variant="volunteers" />
        <div className="wrap relative z-10 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-6">
            <i className="fas fa-heart" />Наши волонтёры
          </div>
          <h1 className="vol-h1 mb-6">
            Люди с <span className="text-primary">добрым</span> сердцем
          </h1>
          <p className="vol-lead mx-auto">
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
      <div className="sticky top-[3.75rem] z-20 vol-bar border-b border-vol-line py-4">
        <div className="wrap">
          <div className="relative max-w-md mx-auto">
            <input
              value={searchRaw}
              onChange={e => onSearch(e.target.value)}
              placeholder="Поиск по имени..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
            <i className="fas fa-search absolute left-3.5 top-3 text-gray-400" />
          </div>
        </div>
      </div>

      {/* GRID */}
      {/* GRID */}
      <section className="py-12 sm:py-16">
        <div className="wrap">
          {loading ? (
              <div className="flex justify-center py-20"><Spinner /></div>
          ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <i className="fas fa-search text-4xl mb-3 block opacity-40" />
                Волонтёры не найдены
              </div>
          ) : (
              /* Телефон — две карточки в ряд (фото, имя, город), шире — по месту. В подвале карточки только настоящие данные:
                 город и число мероприятий, если волонтёр их открыл. */
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] sm:gap-5">
                {filtered.map(v => {
                  const name = [v.firstName, v.lastName].filter(Boolean).join(' ') || 'Волонтёр';
                  const events = v.events?.length;
                  return (
                      <Link
                          key={v.id}
                          to={`/users/${v.id}`}
                          state={{ from: { path: '/volunteers', label: 'Волонтёры' } }}
                          className="press group block h-full rounded-panel no-underline"
                      >
                        <article className="flex h-full flex-col overflow-hidden rounded-panel border border-vol-line bg-vol-surface text-center shadow-soft transition-shadow duration-300 group-hover:border-primary/30 group-hover:shadow-raise">
                          <div className="flex-grow px-3 pb-4 pt-5 sm:px-5 sm:pb-5 sm:pt-8">
                            <Avatar name={name} thumb={v.avatarThumbnailUrl} src={v.avatarUrl} crop={v.avatarCrop} size="lg"
                              className="mx-auto mb-3 shadow-md ring-4 ring-primary/10 transition group-hover:ring-primary/30 sm:mb-4" />
                            <h3 className="line-clamp-2 text-body-sm font-bold text-vol-head transition group-hover:text-vol-accent sm:text-body">{name}</h3>
                            {v.bio && (
                                <p className="mt-2 line-clamp-2 text-meta leading-snug text-vol-muted max-sm:hidden sm:mt-3">{v.bio}</p>
                            )}
                          </div>
                          {(v.city || events) && (
                            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 border-t border-vol-line bg-vol-bg px-3 py-2.5 text-meta text-vol-muted sm:px-5">
                              {v.city && <span className="inline-flex min-w-0 items-center gap-1"><i className="fas fa-map-marker-alt text-[10px] text-primary" aria-hidden /><span className="truncate">{v.city}</span></span>}
                              {!!events && <span className="inline-flex items-center gap-1"><i className="fas fa-calendar-check text-[10px] text-primary" aria-hidden /><span className="sr-only">Мероприятий: </span>{events}</span>}
                            </div>
                          )}
                        </article>
                      </Link>
                  );
                })}
              </div>
          )}
        </div>
      </section>

      {/* JOIN CTA */}
      <section className="py-12">
        <div className="wrap text-center max-w-xl">
          <h2 className="vol-compact mb-3">Присоединяйтесь к нам!</h2>
          <p className="text-gray-600 mb-6">Станьте частью самого большого волонтёрского движения Приднестровья.</p>
          <a href="/register" className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition shadow-lg no-underline">
            <i className="fas fa-user-plus mr-2" />Зарегистрироваться
          </a>
        </div>
      </section>
    </>
  );
}
