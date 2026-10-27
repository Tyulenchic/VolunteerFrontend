import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicEventsApi } from '../../api/publicEvents';
import { eventsApi } from '../../api/events';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import type { EventResponseDto, ParticipationResponseDto } from '../../types/event';
import { loginState } from '../../utils/redirect';
import { mapApiError } from '../../utils/apiError';
import { CAT, CATEGORIES, MONTH_SHORT, WD_ABBR, WEEKDAYS, dayKey, parseDay, plural, seatsLeft } from '../../utils/afisha';
import { MiniCalendar } from '../../components/afisha/MiniCalendar';
import { Ticket } from '../../components/afisha/Ticket';
import { CancelParticipationDialog } from '../../components/CancelParticipationDialog';
import { VolIcon, type IconName } from '../../components/afisha/VolIcon';

/** Illustration for the empty state: thin blue line on a pale fill, same style as the page backdrop. */
function PeopleArt() {
  const LINE = '#7ea2e8';
  const FILL = '#dce8ff';
  return (
    <svg viewBox="0 0 120 76" fill="none" stroke={LINE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-auto w-full">
      <circle cx="60" cy="22" r="11" fill={FILL} />
      <path d="M38 64c0-12 10-21 22-21s22 9 22 21z" fill={FILL} />
      <circle cx="26" cy="31" r="8" fill={FILL} />
      <path d="M10 64c0-9 7-16 16-16 3 0 5 .6 7 1.8" />
      <circle cx="94" cy="31" r="8" fill={FILL} />
      <path d="M110 64c0-9-7-16-16-16-3 0-5 .6-7 1.8" />
      <path d="M4 68h112" strokeOpacity="0.5" />
    </svg>
  );
}

export function EventsPage() {
  const { user } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [mine, setMine] = useState<Map<string, ParticipationResponseDto>>(new Map());
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [cancelTarget, setCancelTarget] = useState<{ ev: EventResponseDto; participation: ParticipationResponseDto } | null>(null);

  const [cat, setCat] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [freeOnly, setFreeOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await publicEventsApi.getActual(0, 100);
      setEvents([...res.items].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()));
    } catch (e) {
      console.error('Error loading events:', e);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  // The user's own applications (for the "Заявка подана" state). Guests have none.
  useEffect(() => {
    if (!user) { setMine(new Map()); return; }
    let alive = true;
    eventsApi.getMyParticipations()
      .then(list => {
        if (!alive) return;
        const m = new Map<string, ParticipationResponseDto>();
        // newest application per event
        // Отозванная заявка — это «заявки нет»: кнопка снова предлагает подать её.
        [...list].filter(p => p.status !== 'Withdrawn').sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).forEach(p => m.set(p.eventId, p));
        setMine(m);
      })
      .catch(() => { /* without it the buttons simply show "Подать заявку" */ });
    return () => { alive = false; };
  }, [user]);

  const setBusyFor = (id: string, on: boolean) =>
    setBusy(s => { const n = new Set(s); if (on) n.add(id); else n.delete(id); return n; });

  const toggleApplication = async (ev: EventResponseDto) => {
    if (!user) { notify('Сначала войдите в систему', 'error'); navigate('/login', { state: loginState('/events') }); return; }
    const existing = mine.get(ev.id);
    // Заявка на рассмотрении или принятая: сначала диалог с необязательной причиной.
    if (existing && (existing.status === 'Approved' || existing.status === 'Pending')) { setCancelTarget({ ev, participation: existing }); return; }
    setBusyFor(ev.id, true);
    try {
      if (existing && existing.status === 'Pending') {
        await eventsApi.withdraw(existing.id);
        setMine(m => { const n = new Map(m); n.delete(ev.id); return n; });
        notify('Заявка отозвана', 'info');
      } else if (!existing) {
        const created = await eventsApi.apply(ev.id);
        setMine(m => new Map(m).set(ev.id, created));
        notify('Заявка подана');
      }
    } catch (err) {
      notify(mapApiError(err), 'error');
    } finally {
      setBusyFor(ev.id, false);
    }
  };

  const confirmCancel = async (reason: string) => {
    if (!cancelTarget) return;
    const { ev, participation } = cancelTarget;
    setBusyFor(ev.id, true);
    try {
      await eventsApi.cancelParticipation(participation.id, reason);
      setMine(m => { const n = new Map(m); n.delete(ev.id); return n; });
      if (participation.status === 'Approved') setEvents(list => list.map(e => (e.id === ev.id ? { ...e, approvedCount: Math.max(0, e.approvedCount - 1) } : e)));
      notify('Вы отказались от участия. Организатор получит уведомление.', 'info');
      setCancelTarget(null);
    } catch (err) {
      notify(mapApiError(err), 'error');
    } finally {
      setBusyFor(ev.id, false);
    }
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    events.forEach(e => { if (e.category) c[e.category] = (c[e.category] || 0) + 1; });
    return c;
  }, [events]);
  const cats = CATEGORIES.filter(c => counts[c.id]); // a category without events is not shown
  const eventDays = useMemo(() => new Set(events.map(e => dayKey(e.startsAt))), [events]);

  const list = useMemo(() => {
    // «#добро» находит тег «добро», как и поиск на сервере.
    const q = query.trim().replace(/^#/, '').toLowerCase();
    return events.filter(e =>
      (cat === 'all' || e.category === cat) &&
      (!freeOnly || seatsLeft(e) !== 0) &&
      (!q || (e.title + ' ' + e.location + ' ' + (e.category ? CAT[e.category].label : '') + ' ' + (e.tags ?? []).join(' ')).toLowerCase().includes(q)));
  }, [events, cat, query, freeOnly]);

  const groups = useMemo(() => {
    const m = new Map<string, EventResponseDto[]>();
    list.forEach(e => { const k = dayKey(e.startsAt); if (!m.has(k)) m.set(k, []); m.get(k)!.push(e); });
    return Array.from(m.entries());
  }, [list]);

  const reset = () => { setCat('all'); setQuery(''); setFreeOnly(false); };
  const filtered = cat !== 'all' || query.trim() !== '' || freeOnly;

  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (scrollTimer.current) clearTimeout(scrollTimer.current); }, []);
  const pickDay = (key: string) => {
    const visible = groups.some(([k]) => k === key);
    if (!visible) reset();
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    // when filters were reset the day section only exists after the next render
    scrollTimer.current = setTimeout(() => {
      document.getElementById('day-' + key)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, visible ? 0 : 80);
  };

  const rect = (id: string, label: string, icon: IconName, count: number) => {
    const on = cat === id;
    return (
      <button key={id} type="button" onClick={() => setCat(id)} aria-pressed={on}
        className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border-[1.5px] px-3.5 text-[13.5px] font-medium ${on ? 'border-vol-accent bg-vol-accent text-vol-accent-fg' : 'border-vol-rule bg-vol-surface text-vol-fg hover:border-vol-accent hover:text-vol-accent'}`}>
        <VolIcon n={icon} size={15} />{label}<span className="text-[12px] tabular-nums opacity-70">{count}</span>
      </button>
    );
  };

  return (
    <>
      <section className="relative">
        <div className="relative z-10 mx-auto grid max-w-[76rem] items-end gap-8 px-4 pb-12 pt-14 sm:px-6 md:grid-cols-[1.25fr_1fr] md:gap-16 md:pb-16 md:pt-20">
          <div className="min-w-0">
            <h1 className="font-display text-[clamp(1.85rem,4.4vw,3rem)] font-extrabold leading-[1.1] tracking-tight" style={{ textWrap: 'balance' }}>
              Волонтёрские <span className="text-vol-accent">мероприятия</span>
            </h1>
          </div>
          <div className="min-w-0">
            <p className="text-[14.5px] leading-relaxed text-vol-muted">Находите события, регистрируйтесь и участвуйте в жизни Приднестровья.</p>
            <form className="mt-6 flex items-center gap-2 border-b-2 border-vol-fg pb-2" onSubmit={ev => ev.preventDefault()} role="search">
              <label htmlFor="event-search" className="sr-only">Поиск мероприятий</label>
              <span className="text-vol-fg"><VolIcon n="search" size={18} /></span>
              <input id="event-search" type="search" value={query} onChange={ev => setQuery(ev.target.value)}
                placeholder="Название, место, категория"
                className="h-9 min-w-0 flex-1 bg-transparent text-[15px] text-vol-fg outline-none placeholder:text-vol-faint" />
              <button type="submit" className="h-9 shrink-0 rounded-lg bg-vol-accent px-5 text-[13.5px] font-semibold text-vol-accent-fg hover:opacity-90">Найти</button>
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[76rem] px-4 sm:px-6" aria-label="Категории">
        <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto border-y border-vol-line px-4 py-6 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="group">
          {rect('all', 'Все', 'grid', events.length)}
          {cats.map(c => rect(c.id, c.label, c.icon, counts[c.id]))}
        </div>
      </section>

      <section className="mx-auto max-w-[76rem] px-4 pb-24 pt-12 sm:px-6">
        <div className="grid gap-14 lg:grid-cols-[1fr_16rem]">
          <div className="min-w-0">
            <div className="mb-9 flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
              <div className="flex items-center gap-3">
                <h2 className="text-[14px] font-semibold tabular-nums" aria-live="polite">{list.length} {plural(list.length, ['мероприятие', 'мероприятия', 'мероприятий'])}</h2>
                {filtered && <button type="button" onClick={reset} className="text-[13px] font-medium text-vol-accent hover:underline">Сбросить фильтры</button>}
              </div>
              <button type="button" role="switch" aria-checked={freeOnly} onClick={() => setFreeOnly(v => !v)}
                className="inline-flex items-center gap-2.5 text-[13px] font-medium text-vol-muted hover:text-vol-fg">
                <span className={`relative h-5 w-9 rounded-full ${freeOnly ? 'bg-vol-accent' : 'bg-vol-rule'}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${freeOnly ? 'left-[1.1rem]' : 'left-0.5'}`} />
                </span>
                Только со свободными местами
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col gap-6" role="status" aria-label="Загрузка мероприятий">
                {[0, 1, 2].map(i => <div key={i} className="h-44 animate-pulse rounded-2xl border border-vol-line bg-vol-surface" />)}
              </div>
            ) : failed ? (
              <div className="rounded-2xl border-[1.5px] border-dashed border-vol-rule px-6 py-14 text-center" role="alert">
                <p className="font-display text-[15px] font-bold">Не удалось загрузить мероприятия</p>
                <p className="mt-1.5 text-[13px] text-vol-muted">Проверьте соединение и попробуйте ещё раз.</p>
                <button type="button" onClick={load} className="mt-4 h-9 rounded-lg bg-vol-accent px-5 text-[13.5px] font-semibold text-vol-accent-fg hover:opacity-90">Повторить</button>
              </div>
            ) : groups.length ? (
              <div className="flex flex-col gap-14">
                {groups.map(([key, items]) => {
                  const d = parseDay(key);
                  return (
                    <section key={key} id={'day-' + key} aria-label={`${d.d} ${MONTH_SHORT[d.m - 1]}`}
                      className="relative grid scroll-mt-24 gap-4 md:grid-cols-[6.25rem_1fr] md:gap-x-8 md:before:absolute md:before:-bottom-14 md:before:left-[calc(6.25rem+1rem-0.5px)] md:before:top-3 md:before:w-px md:before:bg-vol-rule md:last:before:bottom-0">
                      <div className="flex items-baseline gap-2.5 md:flex-col md:items-end md:gap-0 md:text-right xl:-ml-24 xl:w-[calc(100%+6rem)]">
                        <p className="font-display text-[1.7rem] font-extrabold leading-none tabular-nums md:text-[2.5rem]">{d.d}</p>
                        <p className="vol-label whitespace-nowrap text-vol-muted md:mt-2.5">{MONTH_SHORT[d.m - 1]} · <span className="md:hidden xl:inline">{WEEKDAYS[d.date.getDay()]}</span><span className="hidden md:inline xl:hidden">{WD_ABBR[d.date.getDay()]}</span></p>
                      </div>
                      <span className="absolute left-[calc(6.25rem+1rem-4px)] top-[1.05rem] hidden h-2 w-2 rounded-full bg-vol-green ring-[1.5px] ring-vol-fg md:block" aria-hidden="true" />
                      <div className="flex min-w-0 flex-col gap-6">
                        {items.map(e => <Ticket key={e.id} e={e} mine={mine.get(e.id)} busy={busy.has(e.id)} onToggle={toggleApplication} onTag={t => setQuery('#' + t)} />)}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border-[1.5px] border-dashed border-vol-rule px-6 py-14 text-center">
                <div className="mx-auto mb-4 w-28"><PeopleArt /></div>
                <p className="font-display text-[15px] font-bold">{events.length === 0 ? 'Пока нет предстоящих мероприятий' : 'Ничего не найдено'}</p>
                <p className="mt-1.5 text-[13px] text-vol-muted">{events.length === 0 ? 'Загляните позже: новые события появятся здесь.' : 'Измените запрос или выберите другую категорию.'}</p>
                {events.length > 0 && <button type="button" onClick={reset} className="mt-4 h-9 rounded-lg bg-vol-accent px-5 text-[13.5px] font-semibold text-vol-accent-fg hover:opacity-90">Сбросить фильтры</button>}
              </div>
            )}
          </div>

          {events.length > 0 && (
            <aside className="hidden lg:block" aria-label="Календарь">
              <div className="sticky top-24">
                <MiniCalendar days={eventDays} onPick={pickDay} next={events[0]} />
              </div>
            </aside>
          )}
        </div>
      </section>

      <CancelParticipationDialog isOpen={cancelTarget !== null} eventTitle={cancelTarget?.ev.title ?? ''} approved={cancelTarget?.participation.status === 'Approved'}
        busy={cancelTarget ? busy.has(cancelTarget.ev.id) : false} onConfirm={confirmCancel} onClose={() => setCancelTarget(null)} />
    </>
  );
}
