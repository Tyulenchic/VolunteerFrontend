import { useState, useEffect } from 'react';
import { OrganizationBadge } from '../../components/organizations/OrganizationBadge';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { publicEventsApi } from '../../api/publicEvents';
import type { EventResponseDto } from '../../types/event';
import { getCategoryLabel } from '../../types/event';
import { Spinner } from '../../components/Spinner';
import { Button } from '../../components/ui/Button';
import { Heading } from '../../components/ui/Heading';
import { Breadcrumbs } from '../../components/afisha/Breadcrumbs';
import { NotFoundState } from '../../components/afisha/NotFoundState';
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
      notify('Заявка подана. Организатор рассмотрит её и пришлёт ответ.');
      onClose();
    } catch (err) {
      notify(mapApiError(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-card border border-vol-line bg-vol-bg p-4">
          <p className="font-display text-body font-bold text-vol-head">{event.title}</p>
          <div className="mt-2 space-y-1">
            <p className="flex items-center gap-2 text-ctrl text-vol-muted">
              <i className="fas fa-map-marker-alt text-primary w-4" />
              {event.location}
            </p>
            <p className="flex items-center gap-2 text-ctrl text-vol-muted">
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
          <span className="text-ctrl text-vol-fg">
          Я подтверждаю участие и обязуюсь прийти вовремя
        </span>
        </label>
        <Button type="submit" size="lg" full loading={loading}>
          {loading ? 'Отправка…' : <><i className="fas fa-paper-plane" aria-hidden />Подать заявку</>}
        </Button>
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
    return <NotFoundState title="Мероприятие не найдено" hint="Возможно, его удалили или ссылка устарела." to="/events" action="Все мероприятия" />;
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
    Draft:     { label: 'Черновик',            cls: 'bg-vol-bg text-vol-muted' },
    Published: { label: 'Открыта регистрация', cls: 'bg-vol-green-soft text-vol-green' },
    Cancelled: { label: 'Отменено',            cls: 'bg-red-50 text-vol-warn' },
    Archived:  { label: 'В архиве',            cls: 'bg-vol-bg text-vol-muted' },
    Completed: { label: 'Завершено',           cls: 'bg-vol-accent-soft text-primary-dark' },
  };
  const badge = statusBadge[event.status] ?? { label: event.status, cls: 'bg-vol-bg text-vol-muted' };

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
        <Breadcrumbs items={[{ to: '/', label: 'Главная' }, { to: '/events', label: 'Мероприятия' }]} current={event.title} />

        <div>
          {/* Same container as the header and every other page (.wrap, 76rem). */}
          <div className="wrap py-5 sm:py-6 lg:py-8">

            {/* Mobile: title → photo → description → facts & action.
                Desktop: title across the page, then photo with the description under it, facts card on the right. */}
            <div className="grid gap-x-8 gap-y-5 lg:grid-cols-[minmax(0,1fr)_17rem] xl:grid-cols-[minmax(0,1fr)_19rem] xl:gap-x-10">

              {/* Title */}
              <header className="min-w-0 lg:col-span-2 lg:row-start-1">
                <Heading level={1} look="h1-detail" className="max-w-[48ch]">{event.title}</Heading>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-meta">
                  <span className={`rounded-full px-2.5 py-0.5 font-semibold ${badge.cls}`}>{badge.label}</span>
                  {event.category && <span className="text-vol-muted">{getCategoryLabel(event.category)}</span>}
                </div>
                <OrganizationBadge organization={event.organization} size="md" className="mt-2" />
                {!!event.tags?.length && (
                  <ul className="mt-2 flex flex-wrap gap-2" aria-label="Теги">
                    {event.tags.map(t => <li key={t} className="rounded-full bg-vol-accent-soft px-2.5 py-0.5 text-meta font-medium text-primary-dark">#{t}</li>)}
                  </ul>
                )}
              </header>

              {/* Photo: whole, proportions kept; its height cap depends on orientation and viewport height (see EventImage) */}
              <div className="min-w-0 lg:col-start-1 lg:row-start-2">
                <EventImage src={event.imageUrl} alt={event.title} variant="hero" />
              </div>

              {/* Description: right under the photo, plain text without a visible heading */}
              <section aria-labelledby="event-description" className="min-w-0 lg:col-start-1 lg:row-start-3">
                <h2 id="event-description" className="sr-only">Описание</h2>
                <div className="vol-text max-w-[68ch] space-y-3 break-words">
                  {event.description.split('\n').filter(Boolean).map((line, i) => (
                      <p key={i}>{line}</p>
                  ))}
                </div>
              </section>

              {/* Facts + action: compact, sticky only when there is room */}
              <aside aria-label="Сведения и участие" className="min-w-0 self-start lg:col-start-2 lg:row-start-2 lg:row-span-2 lg:sticky lg:top-[calc(3.75rem+1rem)]">
                <div className="space-y-4 rounded-panel border border-vol-line bg-vol-surface p-4 shadow-soft">
                  <dl className="space-y-3 text-ctrl">
                    <div className="flex gap-3">
                      <dt className="w-4 text-center text-primary pt-0.5"><i className="far fa-calendar" aria-hidden /><span className="sr-only">Дата и время</span></dt>
                      <dd className="min-w-0">
                        <p className="font-semibold text-vol-fg">{fmtDateOnly(event.startsAt)}</p>
                        <p className="text-vol-muted">{fmtTime(event.startsAt)} – {fmtTime(event.endsAt)}</p>
                      </dd>
                    </div>
                    <div className="flex gap-3">
                      <dt className="w-4 text-center text-primary pt-0.5"><i className="fas fa-map-marker-alt" aria-hidden /><span className="sr-only">Место</span></dt>
                      <dd className="min-w-0 font-semibold text-vol-fg break-words">{event.location}</dd>
                    </div>
                    {event.maxParticipants != null && (
                      <div className="flex gap-3">
                        <dt className="w-4 text-center text-primary pt-0.5"><i className="fas fa-users" aria-hidden /><span className="sr-only">Места</span></dt>
                        <dd className="flex-1 min-w-0">
                          <p className="font-semibold text-vol-fg">
                            {event.approvedCount} из {event.maxParticipants} мест занято
                            {spotsLeft !== null && spotsLeft > 0 && <span className="font-normal text-vol-muted"> · осталось {spotsLeft}</span>}
                          </p>
                          {progressPercent !== null && (
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-vol-bg" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label="Заполненность">
                              <div className={`h-full rounded-full ${progressPercent >= 100 ? 'bg-pal-red' : 'bg-primary'}`} style={{ width: `${progressPercent}%` }} />
                            </div>
                          )}
                        </dd>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <dt className="w-4 text-center text-primary pt-0.5"><i className="fas fa-hourglass-half" aria-hidden /><span className="sr-only">Приём заявок</span></dt>
                      <dd className="min-w-0">
                        <span className="text-vol-muted">Приём заявок до </span>
                        <span className={`font-semibold ${expired ? 'text-vol-warn' : 'text-vol-fg'}`}>{fmtDateTime(event.endsAt)}</span>
                      </dd>
                    </div>
                  </dl>

                  {mine ? (
                    <div className="space-y-2">
                      <p className={`flex min-h-11 w-full items-center justify-center rounded-control px-3 text-center text-ctrl font-medium ${
                        mine.status === 'Rejected' ? 'bg-red-50 text-vol-warn' : 'bg-vol-accent-soft text-primary-dark'}`}>
                        {mine.status === 'Pending' && 'Заявка на рассмотрении'}
                        {mine.status === 'Approved' && 'Вы участвуете'}
                        {mine.status === 'AttendanceConfirmed' && 'Вы участвовали'}
                        {mine.status === 'Rejected' && 'Заявка отклонена'}
                      </p>
                      {mine.adminComment && <p className="break-words text-meta text-vol-muted">Комментарий: {mine.adminComment}</p>}
                      {mine.status === 'Pending' && (
                        <Button variant="outline" size="lg" full onClick={() => setCancelOpen(true)} disabled={busy}>
                          Отозвать заявку
                        </Button>
                      )}
                      {mine.status === 'Approved' && event.status === 'Published' && (
                        <Button variant="outline" size="lg" full onClick={() => setCancelOpen(true)} disabled={busy}>
                          Отказаться от участия
                        </Button>
                      )}
                    </div>
                  ) : canApply && !isFull ? (
                    <Button size="lg" full onClick={() => setApplyOpen(true)} aria-haspopup="dialog">Подать заявку</Button>
                  ) : (
                    <p className="flex min-h-11 w-full items-center justify-center rounded-control bg-vol-bg px-3 text-center text-ctrl font-medium text-vol-muted">
                      {applyBlockReason}
                    </p>
                  )}
                </div>
              </aside>
            </div>

            <div className="mt-6 pb-2">
              <Link to="/events" className="press-flat inline-flex min-h-11 items-center gap-2 font-semibold text-vol-accent no-underline hover:text-primary-dark">
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
