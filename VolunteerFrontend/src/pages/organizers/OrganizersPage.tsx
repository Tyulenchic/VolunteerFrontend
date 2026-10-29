import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicUsersApi } from '../../api/publicUsers';
import type { PublicUserDto } from '../../types/user';
import { Spinner } from '../../components/Spinner';
import { Avatar } from '../../components/ui/Avatar';
import { AnimatedBackdrop } from '../../components/ui/AnimatedBackdrop';
import { useFeedback } from '../../context/FeedbackContext';

export function OrganizersPage() {
  const [organizers, setOrganizers] = useState<PublicUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchRaw, setSearchRaw] = useState('');
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const { openFeedback } = useFeedback();

  useEffect(() => {
    publicUsersApi.getOrganizers(0, 50)
      // Сервер не отдаёт тех, кто скрыл ФИО или фото; страховка на случай старой версии API — без имени карточку не рисуем.
      .then(res => setOrganizers(res.items.filter(u => u.firstName || u.lastName)))
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
      <section className="relative overflow-hidden py-16 sm:py-20">
        <AnimatedBackdrop variant="organizers" />
        <div className="wrap relative z-10 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-6">
            <i className="fas fa-star" />Команда организаторов
          </div>
          <h1 className="vol-h1 mb-6">
            Люди, которые <span className="text-primary">создают</span> добрые дела
          </h1>
          <p className="vol-lead mx-auto">
            Наши организаторы координируют волонтёрские проекты и помогают каждому найти своё место в движении.
          </p>
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
      <section className="py-12 sm:py-16">
        <div className="wrap">
          {loading ? (
            <div className="flex justify-center py-20"><Spinner /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <i className="fas fa-search text-4xl mb-3 block opacity-40" />
              Организаторы не найдены
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-6">
              {filtered.map(o => {
                const name = [o.firstName, o.lastName].filter(Boolean).join(' ') || 'Пользователь'; // роль уже в бейдже ниже
                return (
                  <Link key={o.id} to={`/users/${o.id}`} className="no-underline">
                    <article className="bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:border-primary/30 transition-all duration-300 overflow-hidden group cursor-pointer h-full flex flex-col">
                      <div className="h-2 bg-gradient-to-r from-primary to-blue-500" />
                      <div className="p-6 flex-grow flex flex-col">
                        <div className="flex items-start gap-4 mb-4">
                          <Avatar name={name} thumb={o.avatarThumbnailUrl} src={o.avatarUrl} crop={o.avatarCrop} size="lg" square className="shadow-sm" />
                          <div className="min-w-0 flex-grow">
                            <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-primary transition">{name}</h3>
                            <span className="inline-flex items-center gap-1 text-[0.8125rem] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1">
                              <i className="fas fa-star text-[10px]" />Организатор
                            </span>
                          </div>
                        </div>
                        {o.bio && (
                          <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">{o.bio}</p>
                        )}
                        <div className="flex flex-col gap-2 pt-4 border-t border-gray-100 text-[0.8125rem] text-gray-600 mt-auto">
                          {o.city && (
                            <span className="flex items-center gap-1">
                              <i className="fas fa-map-marker-alt text-primary" aria-hidden />{o.city}
                            </span>
                          )}
                          {o.organizations && o.organizations.length > 0 && (
                            <span className="flex items-start gap-1">
                              <i className="fas fa-building-columns text-primary mt-0.5" aria-hidden />
                              <span className="min-w-0 break-words">{o.organizations.map(org => org.name).join(', ')}</span>
                            </span>
                          )}
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
      <section className="py-12">
        <div className="wrap text-center max-w-xl">
          <h2 className="vol-compact mb-3">Хотите стать организатором?</h2>
          <p className="text-gray-600 mb-6">Если вы хотите возглавить направление или организовать своё мероприятие — свяжитесь с нами!</p>
          <button type="button" onClick={openFeedback}
            className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition shadow-lg">
            <i className="fas fa-envelope mr-2" aria-hidden />Написать нам
          </button>
        </div>
      </section>
    </>
  );
}
