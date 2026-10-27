import { useState, useEffect } from 'react';
import { OrganizationBadge } from '../../components/organizations/OrganizationBadge';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { publicEventsApi } from '../../api/publicEvents';
import type { EventResponseDto } from '../../types/event';
import { getCategoryLabel } from '../../types/event';
import { Spinner } from '../../components/Spinner';
import { EventImage } from '../../components/EventImage';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { eventsApi } from '../../api/events';
import type { ParticipationResponseDto } from '../../types/event';
import { CancelParticipationDialog } from '../../components/CancelParticipationDialog';
import { mapApiError } from '../../utils/apiError';
import { loginState } from '../../utils/redirect';

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

function ApplyModal({ event, onClose, onApplied }: { event: EventResponseDto; onClose: () => void; onApplied: (p: ParticipationResponseDto) => void }) {
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
      navigate('/login', { state: loginState(`/events/${event.id}`) });
      return;
    }
    setLoading(true);
    try {
      const created = await eventsApi.apply(event.id);
      onApplied(created);
      notify('Заявка подана! Ожидайте подтверждения 🎫');
      onClose();
    } catch (err) {
      notify(mapApiError(err), 'error');
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
          <span className="text-sm text-gray-700">
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
  const { user } = useAuth();
  const { notify } = useNotification();
  const [mine, setMine] = useState<ParticipationResponseDto | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // The user's own application for this event decides what the action block shows.
  useEffect(() => {
    if (!id || !user) { setMine(null); return; }
    let alive = true;
    eventsApi.getMyParticipations()
      .then(list => { if (alive) setMine(list.find(p => p.eventId === id && p.status !== 'Withdrawn') ?? null); })
      .catch(() => { /* without it the block simply offers "Подать заявку" */ });
    return () => { alive = false; };
  }, [id, user]);

  const cancelApproved = async (reason: string) => {
    if (!mine) return;
    setBusy(true);
    try {
      await eventsApi.cancelParticipation(mine.id, reason);
      setMine(null);
      if (mine.status === 'Approved') setEvent(ev => (ev ? { ...ev, approvedCount: Math.max(0, ev.approvedCount - 1) } : ev));
      setCancelOpen(false);
      notify(mine.status === 'Approved' ? 'Вы отказались от участия. Организатор получит уведомление.' : 'Заявка отозвана', 'info');
    } catch (err) {
      notify(mapApiError(err), 'error');
    } finally {
      setBusy(false);
    }
  };

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
          <div className="text-6xl sm:text-8xl font-bold text-primary/20 mb-4">404</div>
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

  // Статус: текст + цвет (смысл всегда передаётся словами, цвет — вторичен)
  const statusBadge: Record<string, { label: string; cls: string }> = {
    Draft:     { label: 'Черновик',            cls: 'bg-gray-100 text-gray-700' },
    Published: { label: 'Открыта регистрация', cls: 'bg-green-100 text-green-800' },
    Cancelled: { label: 'Отменено',            cls: 'bg-red-100 text-red-800' },
    Archived:  { label: 'В архиве',            cls: 'bg-gray-100 text-gray-700' },
    Completed: { label: 'Завершено',           cls: 'bg-blue-100 text-blue-800' },
  };
  const badge = statusBadge[event.status] ?? { label: event.status, cls: 'bg-gray-100 text-gray-700' };

  // Почему нельзя подать заявку (показываем вместо кнопки)
  const applyBlockReason = expired
      ? 'Срок подачи заявок истёк'
      : event.status === 'Cancelled'
          ? 'Мероприятие отменено'
          : event.status === 'Completed'
              ? 'Мероприятие завершено'
              : isFull
                  ? 'Все места заняты'
                  : badge.label;

  return (
      <>
        {/* ── BREADCRUMB ─────────────────────────────────────────────────────── */}
        <div className="bg-gray-50 border-b border-gray-200 py-2.5">
          <div className="max-w-[72rem] 2xl:max-w-[80rem] mx-auto px-4 sm:px-6 lg:px-8">
            <nav aria-label="Навигация" className="flex items-center gap-2 text-sm text-gray-500 min-w-0">
              <Link to="/" className="hover:text-primary transition no-underline text-gray-500 shrink-0">Главная</Link>
              <i className="fas fa-chevron-right text-xs shrink-0" aria-hidden />
              <Link to="/events" className="hover:text-primary transition no-underline text-gray-500 shrink-0">Мероприятия</Link>
              <i className="fas fa-chevron-right text-xs shrink-0" aria-hidden />
              <span className="text-gray-900 font-medium truncate" aria-current="page">{event.title}</span>
            </nav>
          </div>
        </div>

        <div className="bg-white">
          {/* Content width is capped: on large monitors the free space grows, the elements do not. */}
          <div className="max-w-[72rem] 2xl:max-w-[80rem] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">

            {/* Mobile: photo → title → facts & action → description.
                Desktop: photo + facts card on one row, then title, then description. */}
            <div className="grid gap-x-8 gap-y-5 lg:grid-cols-[minmax(0,1fr)_17rem] xl:grid-cols-[minmax(0,1fr)_19rem] xl:gap-x-10">

              {/* Photo: whole, proportions kept; its height cap depends on orientation and viewport height (see EventImage) */}
              <div className="min-w-0 lg:col-start-1 lg:row-start-1">
                <EventImage src={event.imageUrl} alt={event.title} variant="hero" />
              </div>

              {/* Title */}
              <header className="min-w-0 lg:col-span-2 lg:row-start-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className={`px-2.5 py-0.5 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
                  {event.category && <span className="text-gray-600">{getCategoryLabel(event.category)}</span>}
                </div>
                <OrganizationBadge organization={event.organization} size="md" className="mt-2" />
                {!!event.tags?.length && (
                  <ul className="mt-2 flex flex-wrap gap-2" aria-label="Теги">
                    {event.tags.map(t => <li key={t} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-sm font-medium text-blue-700">#{t}</li>)}
                  </ul>
                )}
                <h1 className="mt-2 text-[clamp(1.375rem,1.1rem+1vw,1.875rem)] font-heading font-bold text-gray-900 leading-tight break-words max-w-[40ch] sm:max-w-[48ch] xl:max-w-[56ch]">
                  {event.title}
                </h1>
              </header>

              {/* Facts + action: compact, sticky only when there is room */}
              <aside aria-label="Сведения и участие" className="min-w-0 self-start lg:col-start-2 lg:row-start-1 lg:sticky lg:top-4">
                <div className="border border-gray-200 rounded-2xl p-4 space-y-4">
                  <dl className="space-y-3 text-sm">
                    <div className="flex gap-3">
                      <dt className="w-4 text-center text-primary pt-0.5"><i className="far fa-calendar" aria-hidden /><span className="sr-only">Дата и время</span></dt>
                      <dd className="min-w-0">
                        <p className="font-semibold text-gray-900">{fmtDateOnly(event.startsAt)}</p>
                        <p className="text-gray-600">{fmtTime(event.startsAt)} – {fmtTime(event.endsAt)}</p>
                      </dd>
                    </div>
                    <div className="flex gap-3">
                      <dt className="w-4 text-center text-primary pt-0.5"><i className="fas fa-map-marker-alt" aria-hidden /><span className="sr-only">Место</span></dt>
                      <dd className="min-w-0 font-semibold text-gray-900 break-words">{event.location}</dd>
                    </div>
                    {event.maxParticipants != null && (
                      <div className="flex gap-3">
                        <dt className="w-4 text-center text-primary pt-0.5"><i className="fas fa-users" aria-hidden /><span className="sr-only">Места</span></dt>
                        <dd className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">
                            {event.approvedCount} из {event.maxParticipants} мест занято
                            {spotsLeft !== null && spotsLeft > 0 && <span className="font-normal text-gray-600"> · осталось {spotsLeft}</span>}
                          </p>
                          {progressPercent !== null && (
                            <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label="Заполненность">
                              <div className={`h-full rounded-full ${progressPercent >= 100 ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${progressPercent}%` }} />
                            </div>
                          )}
                        </dd>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <dt className="w-4 text-center text-primary pt-0.5"><i className="fas fa-hourglass-half" aria-hidden /><span className="sr-only">Приём заявок</span></dt>
                      <dd className="min-w-0">
                        <span className="text-gray-600">Приём заявок до </span>
                        <span className={`font-semibold ${expired ? 'text-red-700' : 'text-gray-900'}`}>{fmtDateTime(event.endsAt)}</span>
                      </dd>
                    </div>
                  </dl>

                  {mine ? (
                    <div className="space-y-2">
                      <p className={`w-full min-h-[44px] flex items-center justify-center rounded-xl text-sm font-medium text-center px-3 ${
                        mine.status === 'Rejected' ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'}`}>
                        {mine.status === 'Pending' && 'Заявка на рассмотрении'}
                        {mine.status === 'Approved' && 'Вы участвуете'}
                        {mine.status === 'AttendanceConfirmed' && 'Вы участвовали'}
                        {mine.status === 'Rejected' && 'Заявка отклонена'}
                      </p>
                      {mine.adminComment && <p className="text-sm text-gray-600 break-words">Комментарий: {mine.adminComment}</p>}
                      {mine.status === 'Pending' && (
                        <button type="button" onClick={() => setCancelOpen(true)} disabled={busy}
                          className="w-full min-h-[44px] rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-800 hover:border-primary hover:text-primary disabled:opacity-60">
                          Отозвать заявку
                        </button>
                      )}
                      {mine.status === 'Approved' && event.status === 'Published' && (
                        <button type="button" onClick={() => setCancelOpen(true)} disabled={busy}
                          className="w-full min-h-[44px] rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-800 hover:border-primary hover:text-primary disabled:opacity-60">
                          Отказаться от участия
                        </button>
                      )}
                    </div>
                  ) : canApply && !isFull ? (
                    <button
                        type="button"
                        onClick={() => setApplyOpen(true)}
                        className="w-full min-h-[44px] bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition"
                    >
                      Подать заявку
                    </button>
                  ) : (
                    <p className="w-full min-h-[44px] flex items-center justify-center rounded-xl bg-gray-100 text-gray-700 font-medium text-sm text-center px-3">
                      {applyBlockReason}
                    </p>
                  )}
                </div>
              </aside>

              {/* Description */}
              <section aria-labelledby="event-description" className="min-w-0 lg:col-span-2 lg:row-start-3">
                <h2 id="event-description" className="text-base font-heading font-bold text-gray-900 mb-2">Описание</h2>
                <div className="text-gray-700 text-base leading-relaxed space-y-3 max-w-[68ch] break-words">
                  {event.description.split('\n').filter(Boolean).map((line, i) => (
                      <p key={i}>{line}</p>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-6 pb-2">
              <Link to="/events" className="inline-flex items-center gap-2 min-h-[44px] text-primary font-semibold hover:text-primary-dark transition no-underline">
                <i className="fas fa-arrow-left" aria-hidden />
                Все мероприятия
              </Link>
            </div>
          </div>
        </div>

        {/* ── MODAL ────────────────────────────────────────────────────────────── */}
        <Modal isOpen={applyOpen} onClose={() => setApplyOpen(false)} title="Регистрация на мероприятие">
          <ApplyModal event={event} onClose={() => setApplyOpen(false)} onApplied={setMine} />
        </Modal>
        <CancelParticipationDialog isOpen={cancelOpen} eventTitle={event.title} approved={mine?.status === 'Approved'} busy={busy} onConfirm={cancelApproved} onClose={() => setCancelOpen(false)} />
      </>
  );
}
