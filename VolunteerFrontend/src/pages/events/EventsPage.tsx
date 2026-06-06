import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { publicEventsApi } from '../../api/publicEvents';
import type { EventResponseDto, EventCategory } from '../../types/event';
import { Modal } from '../../components/Modal';
import { Spinner } from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { eventsApi } from '../../api/events';
import { STATIC_EVENTS } from '../../data/mockEvents';
import PhoneMeropriyatiyaImage from '../../assets/PhoneMeropriyatiya.png';
import { IMAGE_POSITIONS } from '../../constants/imagePositions';

const CAT_OPTIONS: Array<{ key: EventCategory | 'all'; label: string; icon: string }> = [
  { key: 'all', label: 'Все', icon: 'fa-th' },
  { key: 'Ecological', label: 'Экология', icon: 'fa-leaf' },
  { key: 'Social', label: 'Соц. помощь', icon: 'fa-hands-helping' },
  { key: 'Donation', label: 'Донорство', icon: 'fa-heartbeat' },
  { key: 'Education', label: 'Обучение', icon: 'fa-graduation-cap' },
  { key: 'HealthyLife', label: 'Спорт', icon: 'fa-running' },
  { key: 'Animals', label: 'Животные', icon: 'fa-paw' },
  { key: 'Veterans', label: 'Ветераны', icon: 'fa-medal' },
];

const fmtDate = (s: string) => {
  const d = new Date(s);
  return {
    day: d.getDate().toString().padStart(2, '0'),
    month: d.toLocaleDateString('ru-RU', { month: 'short' }).toUpperCase(),
    full: d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
  };
};

function ApplyModal({ event, onClose }: { event: EventResponseDto; onClose: () => void }) {
  const { user } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const dt = fmtDate(event.startsAt);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { notify('Сначала войдите в систему', 'error'); onClose(); navigate('/login'); return; }
    setLoading(true);
    try {
      await eventsApi.apply(event.id);
      notify('Заявка подана! Ожидайте подтверждения 🎫');
      onClose();
    } catch {
      notify('Не удалось подать заявку. Возможно, вы уже зарегистрированы.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
        <div className="flex gap-4 items-start">
          <div className="flex-shrink-0 w-14 h-14 bg-primary/10 rounded-xl flex flex-col items-center justify-center text-primary">
            <span className="text-xl font-bold leading-none">{dt.day}</span>
            <span className="text-xs font-medium uppercase">{dt.month}</span>
          </div>
          <div>
            <h4 className="font-bold text-gray-900">{event.title}</h4>
            <p className="text-sm text-gray-600 mt-1"><i className="fas fa-map-marker-alt mr-1 text-primary" />{event.location}</p>
            <p className="text-sm text-gray-600 mt-0.5"><i className="far fa-clock mr-1 text-primary" />{dt.full}</p>
          </div>
        </div>
      </div>
      <label className="flex items-start gap-2 cursor-pointer">
        <input type="checkbox" checked={confirm} onChange={e => setConfirm(e.target.checked)} required className="w-4 h-4 mt-0.5 accent-primary" />
        <span className="text-sm text-gray-600">Я подтверждаю участие и обязуюсь прийти вовремя</span>
      </label>
      <button type="submit" disabled={loading}
        className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-60 flex items-center justify-center gap-2">
        {loading ? <><Spinner /> Отправка...</> : <><i className="fas fa-paper-plane mr-2" />Подать заявку</>}
      </button>
    </form>
  );
}

export function EventsPage() {
  const [items, setItems] = useState<EventResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<EventCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [searchRaw, setSearchRaw] = useState('');
  const [selected, setSelected] = useState<EventResponseDto | null>(null);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLoading(true);
    publicEventsApi.getActual(0, 100)
      .then(res => setItems(res.items.length ? res.items : buildMock()))
      .catch(() => setItems(buildMock()))
      .finally(() => setLoading(false));
  }, []);

  function buildMock(): EventResponseDto[] {
    return STATIC_EVENTS.map(e => ({
      id: String(e.id), title: e.title, description: e.description,
      location: e.place, startsAt: e.datetime, endsAt: e.datetime,
      maxParticipants: e.need, approvedCount: 0, status: 'Published' as const,
      createdByUserId: '0', createdAt: e.datetime, updatedAt: null,
    }));
  }

  const onSearch = (v: string) => {
    setSearchRaw(v);
    if (timer) clearTimeout(timer);
    setTimer(setTimeout(() => setSearch(v), 300));
  };

  const filtered = items.filter(ev => {
    if (cat !== 'all') return false; // category filter via API category field when available
    if (!search) return true;
    const q = search.toLowerCase();
    return ev.title.toLowerCase().includes(q) || ev.location.toLowerCase().includes(q);
  });

  return (
    <>
      {/* HERO */}
      <section className="py-16 sm:py-24 relative overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={PhoneMeropriyatiyaImage}
            alt="Background"
            className="w-full h-full object-cover"
            style={{ objectPosition: IMAGE_POSITIONS.events }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50/30 to-blue-50/30"></div>
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-3xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-gray-900 mb-6 leading-tight">
            Волонтёрские <span className="text-primary">мероприятия</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Находите события, регистрируйтесь и участвуйте в жизни Приднестровья
          </p>
        </div>
      </section>

      {/* FILTERS */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-200 shadow-sm py-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <input
                value={searchRaw}
                onChange={e => onSearch(e.target.value)}
                placeholder="Поиск мероприятий..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none transition"
              />
              <i className="fas fa-search absolute left-3.5 top-3 text-gray-400" />
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 w-full md:w-auto">
              {CAT_OPTIONS.map(c => (
                <button
                  key={c.key}
                  onClick={() => setCat(c.key as EventCategory | 'all')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                    cat === c.key ? 'bg-primary text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <i className={`fas ${c.icon} text-xs`} />{c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* LIST */}
      <section className="py-12 sm:py-16 bg-gray-50 min-h-[60vh]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-24"><Spinner /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <i className="fas fa-calendar-times text-5xl text-gray-300 mb-4 block" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">Мероприятий не найдено</h3>
              <p className="text-gray-500">Попробуйте изменить фильтры или поисковый запрос</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map(ev => {
                const dt = fmtDate(ev.startsAt);
                const spotsLeft = ev.maxParticipants != null ? ev.maxParticipants - ev.approvedCount : null;
                return (
                  <article key={ev.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:border-primary/30 transition-all duration-300 group flex flex-col">
                    {/* Date + title */}
                    <div className="p-5 flex gap-4 items-start flex-1">
                      <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-primary/10 to-blue-100 rounded-xl flex flex-col items-center justify-center text-primary shadow-sm">
                        <span className="text-xl font-bold leading-none">{dt.day}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wide">{dt.month}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-base leading-tight mb-2 group-hover:text-primary transition line-clamp-2">
                          {ev.title}
                        </h3>
                        <p className="text-gray-500 text-sm line-clamp-2 mb-3">{ev.description}</p>
                        <div className="space-y-1 text-xs text-gray-500">
                          <p className="flex items-center gap-1.5"><i className="far fa-clock text-primary" />{dt.full}</p>
                          <p className="flex items-center gap-1.5"><i className="fas fa-map-marker-alt text-primary" />{ev.location}</p>
                          {spotsLeft !== null && (
                            <p className={`flex items-center gap-1.5 font-medium ${spotsLeft <= 5 ? 'text-orange-500' : 'text-gray-500'}`}>
                              <i className="fas fa-users text-primary" />
                              {spotsLeft > 0 ? `Осталось ${spotsLeft} мест` : 'Мест нет'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="px-5 pb-5 flex gap-2 border-t border-gray-50 pt-3">
                      <button
                        onClick={() => setSelected(ev)}
                        className="flex-1 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition flex items-center justify-center gap-1.5"
                      >
                        <i className="fas fa-paper-plane text-xs" />Подать заявку
                      </button>
                      <Link
                        to={`/events/${ev.id}`}
                        className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition no-underline flex items-center gap-1"
                      >
                        <i className="fas fa-info-circle text-xs" />Подробнее
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Modal isOpen={selected !== null} onClose={() => setSelected(null)} title="Регистрация на мероприятие">
        {selected && <ApplyModal event={selected} onClose={() => setSelected(null)} />}
      </Modal>
    </>
  );
}
