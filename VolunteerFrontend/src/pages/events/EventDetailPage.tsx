import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { publicEventsApi } from '../../api/publicEvents';
import type { EventResponseDto } from '../../types/event';
import { Spinner } from '../../components/Spinner';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { eventsApi } from '../../api/events';
import { STATIC_EVENTS } from '../../data/mockEvents';

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });



const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  Draft:     { label: 'Черновик',  cls: 'bg-gray-100 text-gray-600' },
  Published: { label: 'Открыта регистрация', cls: 'bg-green-100 text-green-700' },
  Cancelled: { label: 'Отменено',  cls: 'bg-red-100 text-red-700' },
  Completed: { label: 'Завершено', cls: 'bg-blue-100 text-blue-700' },
};

function ApplyModal({ event, onClose }: { event: EventResponseDto; onClose: () => void }) {
  const { user } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

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
        <h4 className="font-bold text-gray-900">{event.title}</h4>
        <p className="text-sm text-gray-600 mt-1">
          <i className="fas fa-map-marker-alt mr-1 text-primary" />{event.location}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          <i className="far fa-clock mr-1 text-primary" />{fmtDate(event.startsAt)}
        </p>
      </div>
      <label className="flex items-start gap-2 cursor-pointer">
        <input type="checkbox" checked={confirm} onChange={e => setConfirm(e.target.checked)} required className="w-4 h-4 mt-0.5 accent-primary" />
        <span className="text-sm text-gray-600">Я подтверждаю участие и обязуюсь прийти вовремя</span>
      </label>
      <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-60 flex items-center justify-center gap-2">
        {loading ? <><Spinner /> Отправка...</> : <><i className="fas fa-paper-plane mr-2" />Подать заявку</>}
      </button>
    </form>
  );
}

// Stub from mock for fallback
function mockEventToDto(id: string): EventResponseDto | null {
  const numId = parseInt(id, 10);
  const m = STATIC_EVENTS.find(e => e.id === numId);
  if (!m) return null;
  return {
    id: String(m.id),
    title: m.title,
    description: m.description,
    location: m.place,
    startsAt: m.datetime,
    endsAt: m.datetime,
    maxParticipants: m.need,
    approvedCount: 0,
    status: 'Published',
    createdByUserId: '0',
    createdAt: m.datetime,
    updatedAt: null,
  };
}

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    publicEventsApi.getById(id)
      .then(setEvent)
      .catch(() => {
        const fallback = mockEventToDto(id);
        setEvent(fallback);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>;
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-8xl font-bold text-primary/20 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Мероприятие не найдено</h1>
        <Link to="/events" className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition no-underline">
          ← Все мероприятия
        </Link>
      </div>
    );
  }

  const status = STATUS_LABELS[event.status] ?? { label: event.status, cls: 'bg-gray-100 text-gray-600' };
  const startsDate = new Date(event.startsAt);
  
  const day = startsDate.getDate().toString().padStart(2, '0');
  const month = startsDate.toLocaleDateString('ru-RU', { month: 'short' }).toUpperCase();
  const canApply = event.status === 'Published';
  const spotsLeft = event.maxParticipants != null ? event.maxParticipants - event.approvedCount : null;

  return (
    <>
      {/* BREADCRUMB */}
      <div className="bg-gray-50 border-b border-gray-200 py-3">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-primary transition no-underline text-gray-500">Главная</Link>
            <i className="fas fa-chevron-right text-xs" />
            <Link to="/events" className="hover:text-primary transition no-underline text-gray-500">Мероприятия</Link>
            <i className="fas fa-chevron-right text-xs" />
            <span className="text-gray-900 font-medium line-clamp-1 max-w-xs">{event.title}</span>
          </nav>
        </div>
      </div>

      {/* HERO */}
      <section className="bg-gradient-to-br from-teal-50 to-blue-50 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            {/* Date badge + info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${status.cls}`}>
                  {status.label}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-gray-900 leading-tight mb-6">
                {event.title}
              </h1>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-calendar-alt text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Начало</p>
                    <p className="font-semibold">{fmtDate(event.startsAt)}</p>
                  </div>
                </li>
                {event.startsAt !== event.endsAt && (
                  <li className="flex items-center gap-3 text-gray-700">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-flag-checkered text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Окончание</p>
                      <p className="font-semibold">{fmtDate(event.endsAt)}</p>
                    </div>
                  </li>
                )}
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-map-marker-alt text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Место</p>
                    <p className="font-semibold">{event.location}</p>
                  </div>
                </li>
                {event.maxParticipants != null && (
                  <li className="flex items-center gap-3 text-gray-700">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-users text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Участники</p>
                      <p className="font-semibold">
                        {event.approvedCount} / {event.maxParticipants}
                        {spotsLeft !== null && spotsLeft > 0 && (
                          <span className="text-green-600 text-sm ml-2">(осталось {spotsLeft} мест)</span>
                        )}
                        {spotsLeft !== null && spotsLeft <= 0 && (
                          <span className="text-red-600 text-sm ml-2">(мест нет)</span>
                        )}
                      </p>
                    </div>
                  </li>
                )}
              </ul>
              {canApply && (
                <button onClick={() => setApplyOpen(true)} className="inline-flex items-center px-8 py-4 bg-primary text-white font-bold text-lg rounded-xl hover:bg-primary-dark transition shadow-lg hover:-translate-y-0.5">
                  <i className="fas fa-paper-plane mr-2" />Подать заявку
                </button>
              )}
              {!canApply && (
                <div className={`inline-flex items-center px-6 py-3 rounded-xl font-semibold ${status.cls}`}>
                  <i className="fas fa-info-circle mr-2" />{status.label}
                </div>
              )}
            </div>

            {/* Date card */}
            <div className="flex-shrink-0">
              <div className="w-36 h-36 bg-white rounded-3xl shadow-xl flex flex-col items-center justify-center border-2 border-primary/20">
                <span className="text-5xl font-extrabold text-primary leading-none">{day}</span>
                <span className="text-lg font-bold text-gray-500 uppercase tracking-widest">{month}</span>
                <span className="text-xs text-gray-400 mt-1">
                  {startsDate.toLocaleDateString('ru-RU', { weekday: 'long' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DESCRIPTION */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-5">О мероприятии</h2>
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
            {event.description.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BOTTOM */}
      {canApply && (
        <section className="py-10 bg-gradient-to-br from-teal-50 to-blue-50 border-t border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Хотите принять участие?</h3>
              <p className="text-gray-600 text-sm">Зарегистрируйтесь, чтобы присоединиться к команде.</p>
            </div>
            <button onClick={() => setApplyOpen(true)} className="inline-flex items-center px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition shadow-lg whitespace-nowrap">
              <i className="fas fa-paper-plane mr-2" />Подать заявку
            </button>
          </div>
        </section>
      )}

      <div className="py-6 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <Link to="/events" className="inline-flex items-center gap-2 text-primary font-semibold hover:text-primary-dark transition no-underline">
            <i className="fas fa-arrow-left" />Все мероприятия
          </Link>
        </div>
      </div>

      <Modal isOpen={applyOpen} onClose={() => setApplyOpen(false)} title="Регистрация на мероприятие">
        <ApplyModal event={event} onClose={() => setApplyOpen(false)} />
      </Modal>
    </>
  );
}
