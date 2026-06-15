import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { publicEventsApi } from '../../api/publicEvents';
import type { EventResponseDto } from '../../types/event';
import { getCategoryColor, getCategoryLabel } from '../../types/event';
import { Spinner } from '../../components/Spinner';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { eventsApi } from '../../api/events';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtDateTime = (s: string) =>
    new Date(s).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

const fmtDateOnly = (s: string) =>
    new Date(s).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

const fmtTime = (s: string) =>
    new Date(s).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

/** Мероприятие считается завершённым по времени если дата окончания уже прошла */
const isExpired = (endsAt: string) => new Date() > new Date(endsAt);

// ─── Apply Modal ──────────────────────────────────────────────────────────────

function ApplyModal({ event, onClose }: { event: EventResponseDto; onClose: () => void }) {
  const { user } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      notify('Сначала войдите в систему', 'error');
      onClose();
      navigate('/login');
      return;
    }
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
          <h4 className="font-bold text-gray-900 text-base">{event.title}</h4>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <i className="fas fa-map-marker-alt text-primary w-4" />
              {event.location}
            </p>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <i className="far fa-calendar text-primary w-4" />
              {fmtDateTime(event.startsAt)}
            </p>
          </div>
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
              type="checkbox"
              checked={confirm}
              onChange={e => setConfirm(e.target.checked)}
              required
              className="w-4 h-4 mt-0.5 accent-primary flex-shrink-0"
          />
          <span className="text-sm text-gray-600">
          Я подтверждаю участие и обязуюсь прийти вовремя
        </span>
        </label>
        <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <><Spinner /> Отправка...</> : <><i className="fas fa-paper-plane" />Подать заявку</>}
        </button>
      </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

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
        .catch(() => setEvent(null))
        .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner />
        </div>
    );
  }

  if (!event) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="text-8xl font-bold text-primary/20 mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Мероприятие не найдено</h1>
          <Link
              to="/events"
              className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition no-underline"
          >
            ← Все мероприятия
          </Link>
        </div>
    );
  }

  // ── Derived state ───────────────────────────────────────────────────────────
  const expired = isExpired(event.endsAt);
  // Подача заявки возможна только если статус Published И дата окончания ещё не прошла
  const canApply = event.status === 'Published' && !expired;

  const spotsLeft =
      event.maxParticipants != null
          ? event.maxParticipants - event.approvedCount
          : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;

  const progressPercent =
      event.maxParticipants != null && event.maxParticipants > 0
          ? Math.min(100, Math.round((event.approvedCount / event.maxParticipants) * 100))
          : null;

  const startsDate = new Date(event.startsAt);
  const day = startsDate.getDate().toString().padStart(2, '0');
  const monthShort = startsDate
      .toLocaleDateString('ru-RU', { month: 'short' })
      .replace('.', '')
      .toUpperCase();

  // Статус-бейдж
  const statusBadge: Record<string, { label: string; cls: string }> = {
    Draft:     { label: 'Черновик',            cls: 'bg-gray-100 text-gray-600' },
    Published: { label: 'Открыта регистрация', cls: 'bg-green-100 text-green-700' },
    Cancelled: { label: 'Отменено',             cls: 'bg-red-100 text-red-700' },
    Completed: { label: 'Завершено',            cls: 'bg-blue-100 text-blue-700' },
  };
  const badge = statusBadge[event.status] ?? { label: event.status, cls: 'bg-gray-100 text-gray-600' };

  // Причина, почему нельзя подать заявку (для информационного блока)
  const applyBlockReason = expired
      ? 'Срок подачи заявок истёк'
      : event.status === 'Cancelled'
          ? 'Мероприятие отменено'
          : event.status === 'Completed'
              ? 'Мероприятие завершено'
              : isFull
                  ? 'Все места заняты'
                  : null;

  return (
      <>
        {/* ── BREADCRUMB ─────────────────────────────────────────────────────── */}
        <div className="bg-gray-50 border-b border-gray-200 py-3">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-sm text-gray-500">
              <Link to="/" className="hover:text-primary transition no-underline text-gray-500">
                Главная
              </Link>
              <i className="fas fa-chevron-right text-xs" />
              <Link to="/events" className="hover:text-primary transition no-underline text-gray-500">
                Мероприятия
              </Link>
              <i className="fas fa-chevron-right text-xs" />
              <span className="text-gray-900 font-medium line-clamp-1 max-w-xs">{event.title}</span>
            </nav>
          </div>
        </div>

        <div className="bg-white min-h-screen">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl">

            {/* ── HERO BLOCK ───────────────────────────────────────────────────── */}
            <div className="grid lg:grid-cols-[1fr_340px] gap-6 mb-8">

              {/* Left: image + title */}
              <div>
                {/* Image */}
                <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-gray-100 mb-6">
                  {event.imageUrl ? (
                      <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="w-full h-full object-cover"
                      />
                  ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                        <i className="fas fa-image text-gray-300 text-5xl" />
                      </div>
                  )}
                  {/* Category badge over image */}
                  {event.category && (
                      <span className={`absolute top-4 left-4 px-3 py-1.5 ${getCategoryColor(event.category)} text-white text-xs font-bold rounded-full flex items-center gap-1.5`}>
                    <i className="fas fa-tag text-[10px]" />
                        {getCategoryLabel(event.category)}
                  </span>
                  )}
                </div>

                {/* Status + title */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${badge.cls}`}>
                  {badge.label}
                </span>
                  {expired && event.status === 'Published' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-orange-100 text-orange-700">
                    Истёк срок подачи
                  </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
                  {event.title}
                </h1>

                {/* Key info pills */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl text-sm text-gray-700 border border-gray-100">
                    <i className="far fa-calendar text-primary" />
                    <span>{fmtDateOnly(event.startsAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl text-sm text-gray-700 border border-gray-100">
                    <i className="far fa-clock text-primary" />
                    <span>{fmtTime(event.startsAt)} – {fmtTime(event.endsAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl text-sm text-gray-700 border border-gray-100">
                    <i className="fas fa-map-marker-alt text-primary" />
                    <span>{event.location}</span>
                  </div>
                </div>
              </div>

              {/* Right: action card */}
              <div className="lg:sticky lg:top-6 self-start">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

                  {/* Date accent */}
                  <div className="bg-gradient-to-br from-primary/5 to-blue-50 px-6 py-5 border-b border-gray-100 flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow flex flex-col items-center justify-center border border-gray-100 flex-shrink-0">
                      <span className="text-2xl font-extrabold text-primary leading-none">{day}</span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{monthShort}</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Дата и время</p>
                      <p className="font-bold text-gray-900 text-sm">
                        {fmtDateOnly(event.startsAt)}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {fmtTime(event.startsAt)} – {fmtTime(event.endsAt)}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 py-5 space-y-4">

                    {/* Location */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <i className="fas fa-map-marker-alt text-primary text-sm" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Место проведения</p>
                        <p className="text-sm font-semibold text-gray-800">{event.location}</p>
                      </div>
                    </div>

                    {/* Registration deadline */}
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${expired ? 'bg-red-50' : 'bg-orange-50'}`}>
                        <i className={`fas fa-hourglass-half text-sm ${expired ? 'text-red-500' : 'text-orange-500'}`} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">
                          Регистрация открыта до
                        </p>
                        <p className={`text-sm font-semibold ${expired ? 'text-red-600' : 'text-gray-800'}`}>
                          {fmtDateTime(event.endsAt)}
                        </p>
                        {expired && (
                            <p className="text-xs text-red-500 mt-0.5">Срок подачи заявок истёк</p>
                        )}
                      </div>
                    </div>

                    {/* Participants */}
                    {event.maxParticipants != null && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fas fa-users text-primary text-sm" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
                              Количество мест
                            </p>
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="text-sm font-semibold text-gray-800">
                                {event.approvedCount} / {event.maxParticipants} волонтёров
                              </p>
                              {spotsLeft !== null && spotsLeft > 0 && (
                                  <span className="text-xs text-green-600 font-medium">
                              осталось {spotsLeft}
                            </span>
                              )}
                              {isFull && (
                                  <span className="text-xs text-red-600 font-medium">мест нет</span>
                              )}
                            </div>
                            {progressPercent !== null && (
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                      className={`h-full rounded-full transition-all ${
                                          progressPercent >= 100 ? 'bg-red-400' :
                                              progressPercent >= 75  ? 'bg-orange-400' :
                                                  'bg-primary'
                                      }`}
                                      style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                            )}
                          </div>
                        </div>
                    )}

                    {/* Divider */}
                    <div className="border-t border-gray-100" />

                    {/* CTA */}
                    {canApply && !isFull ? (
                        <button
                            onClick={() => setApplyOpen(true)}
                            className="w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition shadow-md shadow-primary/20 flex items-center justify-center gap-2 text-base"
                        >
                          <i className="fas fa-paper-plane" />
                          Подать заявку
                        </button>
                    ) : (
                        <div className={`w-full py-3.5 rounded-xl font-semibold text-center text-sm flex items-center justify-center gap-2 ${
                            isFull
                                ? 'bg-gray-100 text-gray-500'
                                : expired
                                    ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                    : 'bg-gray-100 text-gray-500'
                        }`}>
                          <i className={`fas ${
                              isFull ? 'fa-user-times' :
                                  expired ? 'fa-hourglass-end' :
                                      'fa-info-circle'
                          }`} />
                          {isFull
                              ? 'Все места заняты'
                              : applyBlockReason ?? badge.label}
                        </div>
                    )}

                    {/* Already applied hint */}
                    {canApply && (
                        <p className="text-xs text-gray-400 text-center">
                          Уже подали заявку: {event.approvedCount} чел.
                        </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── DESCRIPTION BLOCK ────────────────────────────────────────────── */}
            <div className="grid lg:grid-cols-[1fr_340px] gap-6">
              <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                    <i className="fas fa-align-left text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Описание</h2>
                </div>
                <div className="text-gray-700 leading-relaxed space-y-3 text-[15px]">
                  {event.description.split('\n').filter(Boolean).map((line, i) => (
                      <p key={i}>{line}</p>
                  ))}
                </div>
              </div>

              {/* Right column: summary card (repeated for sticky scroll companion) */}
              <div className="hidden lg:block">
                {/* Intentionally empty — sticky card above already covers this column */}
              </div>
            </div>

            {/* ── BOTTOM CTA ───────────────────────────────────────────────────── */}
            {canApply && !isFull && (
                <div className="mt-6 bg-gradient-to-br from-primary/5 to-blue-50 border border-primary/10 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">Станьте частью добрых дел!</h3>
                    <p className="text-gray-600 text-sm">
                      Ваша помощь действительно важна. Вместе мы сделаем наш город лучше.
                    </p>
                    {spotsLeft !== null && (
                        <p className="text-primary font-semibold text-sm mt-1">
                          Осталось {spotsLeft} {spotsLeft === 1 ? 'место' : spotsLeft < 5 ? 'места' : 'мест'}
                        </p>
                    )}
                  </div>
                  <button
                      onClick={() => setApplyOpen(true)}
                      className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition shadow-lg whitespace-nowrap text-base"
                  >
                    <i className="fas fa-paper-plane" />
                    Подать заявку
                  </button>
                </div>
            )}

            {/* ── BACK LINK ────────────────────────────────────────────────────── */}
            <div className="mt-8 pb-4">
              <Link
                  to="/events"
                  className="inline-flex items-center gap-2 text-primary font-semibold hover:text-primary-dark transition no-underline"
              >
                <i className="fas fa-arrow-left" />
                Все мероприятия
              </Link>
            </div>
          </div>
        </div>

        {/* ── MODAL ────────────────────────────────────────────────────────────── */}
        <Modal isOpen={applyOpen} onClose={() => setApplyOpen(false)} title="Регистрация на мероприятие">
          <ApplyModal event={event} onClose={() => setApplyOpen(false)} />
        </Modal>
      </>
  );
}