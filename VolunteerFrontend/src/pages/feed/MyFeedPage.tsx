import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {apiClient} from "../../api/client.ts";

// ─── Types ────────────────────────────────────────────────────────────────────

type ParticipationStatus = 'Pending' | 'Approved' | 'Rejected' | 'AttendanceConfirmed';
type EventCategory =
    | 'Veterans' | 'Medical' | 'Donation' | 'Animals' | 'HealthyLife' | 'Culture'
    | 'Education' | 'Media' | 'Social' | 'Events' | 'Patriotic' | 'Urban' | 'Ecological';

interface UserProfile {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    bio?: string | null;
    role: string;
    isActive: boolean;
    avatarUrl?: string | null;
    createdAt: string;
}

interface ParticipationRecord {
    id: string;
    eventId: string;
    eventTitle: string;
    userId: string;
    userFullName?: string | null;
    status: ParticipationStatus;
    adminComment?: string | null;
    createdAt: string;
    updatedAt?: string | null;
}

interface EventRecord {
    id: string;
    title: string;
    description: string;
    location: string;
    startsAt: string;
    endsAt: string;
    maxParticipants?: number | null;
    imageUrl?: string | null;
    category: EventCategory;
    approvedCount: number;
    status: string;
    createdByUserId: string;
    createdAt: string;
}

interface FeedStats {
    totalApplied: number;
    approved: number;
    attended: number;
    pending: number;
    rejected: number;
}

// Зеркало UserFeedDto с бэкенда (GET /api/feed)
interface FeedData {
    profile: UserProfile;
    activities: ParticipationRecord[];
    upcomingEvents: EventRecord[]; // уже отфильтрованы сервером — без тех, на которые подана заявка
    stats: FeedStats;              // статистика вычислена на сервере
}

// ─── API ─────────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

function authHeaders(token: string): HeadersInit {
    return { Authorization: `Bearer ${token}`, Accept: 'application/json' };
}

/**
 * GET /api/feed?take=12
 * Один запрос — бэкенд параллельно собирает профиль, историю участий
 * и ближайшие мероприятия (уже без тех, на которые подана заявка).
 */
async function fetchFeed(take = 12): Promise<FeedData> {
    const { data } = await apiClient.get<FeedData>(`/api/feed`, {
        params: { take },
    });

    return data;
}

/**
 * POST /api/feed/apply/{eventId}
 * Запись на мероприятие прямо из ленты — без перехода на страницу события.
 */
async function applyToEvent(token: string, eventId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/feed/apply/${eventId}`, {
        method: 'POST',
        headers: authHeaders(token),
    });

    if (res.status === 409) throw new Error('Вы уже подали заявку на это мероприятие');
    if (res.status === 400) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? 'Заявка не принята');
    }
    if (!res.ok) throw new Error('Не удалось подать заявку');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_META: Record<ParticipationStatus, { label: string; cls: string; icon: string }> = {
    Pending:             { label: 'На рассмотрении', cls: 'bg-yellow-100 text-yellow-800', icon: 'fas fa-clock' },
    Approved:            { label: 'Одобрено',         cls: 'bg-green-100 text-green-700',  icon: 'fas fa-check-circle' },
    Rejected:            { label: 'Отклонено',         cls: 'bg-red-100 text-red-700',     icon: 'fas fa-times-circle' },
    AttendanceConfirmed: { label: 'Присутствие',       cls: 'bg-blue-100 text-blue-700',   icon: 'fas fa-star' },
};

const CAT_LABELS: Record<EventCategory, string> = {
    Veterans:   'Ветераны',    Medical:    'Медицина',
    Donation:   'Донорство',   Animals:    'Животные',
    HealthyLife:'ЗОЖ',        Culture:    'Культура',
    Education:  'Образование', Media:      'Медиа',
    Social:     'Социальное',  Events:     'События',
    Patriotic:  'Патриотика',  Urban:      'Городское',
    Ecological: 'Экология',
};

const CAT_COLORS: Record<EventCategory, string> = {
    Veterans:   'bg-red-100 text-red-700',
    Medical:    'bg-pink-100 text-pink-700',
    Donation:   'bg-rose-100 text-rose-700',
    Animals:    'bg-amber-100 text-amber-700',
    HealthyLife:'bg-lime-100 text-lime-700',
    Culture:    'bg-purple-100 text-purple-700',
    Education:  'bg-indigo-100 text-indigo-700',
    Media:      'bg-sky-100 text-sky-700',
    Social:     'bg-orange-100 text-orange-700',
    Events:     'bg-violet-100 text-violet-700',
    Patriotic:  'bg-blue-100 text-blue-700',
    Urban:      'bg-cyan-100 text-cyan-700',
    Ecological: 'bg-green-100 text-green-700',
};

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateShort(iso: string): string {
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function daysUntil(iso: string): number {
    const diff = new Date(iso).getTime() - Date.now();
    return Math.ceil(diff / 86400000);
}

function fullName(u: UserProfile): string {
    const n = [u.firstName, u.lastName].filter(Boolean).join(' ');
    return n || u.email.split('@')[0];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({ icon, value, label }: { icon: string; value: number; label: string }) {
    return (
        <div className="flex flex-col items-center gap-1 bg-white/60 rounded-2xl px-5 py-4 min-w-[80px]">
            <i className={`${icon} text-primary text-lg`} />
            <span className="text-2xl font-extrabold text-gray-900 leading-none">{value}</span>
            <span className="text-xs text-gray-500 font-medium text-center leading-tight">{label}</span>
        </div>
    );
}

function ActivityCard({ rec, onRevoke }: {
    rec: ParticipationRecord;
    onRevoke: (id: string) => void;
}) {
    const m = STATUS_META[rec.status];
    const [confirming, setConfirming] = useState(false);

    return (
        <article className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i className="fas fa-calendar-check text-primary text-sm" />
            </div>
            <div className="flex-1 min-w-0">
                <Link
                    to={`/events/${rec.eventId}`}
                    className="font-semibold text-gray-900 hover:text-primary transition text-sm leading-snug line-clamp-2"
                >
                    {rec.eventTitle}
                </Link>
                <p className="text-xs text-gray-400 mt-1">Заявка от {formatDate(rec.createdAt)}</p>
                {rec.adminComment && (
                    <p className="text-xs text-gray-500 mt-1 italic">«{rec.adminComment}»</p>
                )}
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${m.cls}`}>
          <i className={`${m.icon} text-xs`} />
            {m.label}
        </span>
                {rec.status === 'Pending' && !confirming && (
                    <button
                        onClick={() => setConfirming(true)}
                        className="text-xs text-gray-400 hover:text-red-500 transition"
                    >
                        Отозвать
                    </button>
                )}
                {confirming && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => { onRevoke(rec.id); setConfirming(false); }}
                            className="text-xs text-red-600 font-semibold hover:underline"
                        >
                            Да, отозвать
                        </button>
                        <button
                            onClick={() => setConfirming(false)}
                            className="text-xs text-gray-400 hover:underline"
                        >
                            Нет
                        </button>
                    </div>
                )}
            </div>
        </article>
    );
}

function EventCard({ event, participatedIds, pendingSet, onApply }: {
    event: EventRecord;
    participatedIds: Set<string>;
    pendingSet: Set<string>;
    onApply: (eventId: string) => void;
}) {
    const alreadyIn  = participatedIds.has(event.id);
    const isApplying = pendingSet.has(event.id);
    const days       = daysUntil(event.startsAt);
    const isFull     = event.maxParticipants != null && event.approvedCount >= event.maxParticipants;

    let urgencyBadge: { text: string; cls: string } | null = null;
    if (days <= 0)       urgencyBadge = { text: 'Сегодня!', cls: 'bg-red-500 text-white' };
    else if (days === 1) urgencyBadge = { text: 'Завтра',   cls: 'bg-orange-500 text-white' };
    else if (days <= 7)  urgencyBadge = { text: `${days} дн.`, cls: 'bg-yellow-400 text-yellow-900' };

    return (
        <article className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all duration-200 flex flex-col">
            {/* image or placeholder */}
            <div className="relative h-36 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex-shrink-0">
                {event.imageUrl ? (
                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <i className="fas fa-hands-helping text-4xl text-gray-300" />
                    </div>
                )}
                {/* category */}
                <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold ${CAT_COLORS[event.category as EventCategory] ?? 'bg-gray-100 text-gray-600'}`}>
          {CAT_LABELS[event.category as EventCategory] ?? event.category}
        </span>
                {/* urgency */}
                {urgencyBadge && (
                    <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold ${urgencyBadge.cls}`}>
            {urgencyBadge.text}
          </span>
                )}
            </div>

            <div className="p-4 flex flex-col flex-grow gap-3">
                <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-primary transition">
                    {event.title}
                </h3>

                {/* meta */}
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <i className="fas fa-calendar w-3.5 text-center text-primary/70" />
                        <span>{formatDateShort(event.startsAt)} · {formatTime(event.startsAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <i className="fas fa-map-marker-alt w-3.5 text-center text-primary/70" />
                        <span className="truncate">{event.location}</span>
                    </div>
                    {event.maxParticipants != null && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <i className="fas fa-users w-3.5 text-center text-primary/70" />
                            <span>{event.approvedCount} / {event.maxParticipants} мест</span>
                            {/* seats bar */}
                            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${isFull ? 'bg-red-400' : 'bg-primary'}`}
                                    style={{ width: `${Math.min(100, (event.approvedCount / event.maxParticipants!) * 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-1">
                    {alreadyIn ? (
                        <div className="w-full text-center py-2.5 bg-green-50 text-green-700 rounded-xl text-xs font-semibold">
                            <i className="fas fa-check mr-1.5" />
                            Заявка подана
                        </div>
                    ) : isFull ? (
                        <div className="w-full text-center py-2.5 bg-gray-100 text-gray-400 rounded-xl text-xs font-semibold cursor-not-allowed">
                            <i className="fas fa-ban mr-1.5" />
                            Мест нет
                        </div>
                    ) : (
                        <button
                            onClick={() => onApply(event.id)}
                            disabled={isApplying}
                            className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isApplying ? (
                                <><i className="fas fa-spinner fa-spin" /> Отправляю…</>
                            ) : (
                                <><i className="fas fa-paper-plane" /> Записаться</>
                            )}
                        </button>
                    )}
                </div>

                <Link
                    to={`/events/${event.id}`}
                    className="text-center text-xs text-gray-400 hover:text-primary transition"
                >
                    Подробнее →
                </Link>
            </div>
        </article>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function MyFeedPage() {
    const { user } = useAuth();
    const { notify } = useNotification();

    const [data, setData]       = useState<FeedData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);

    // IDs of events user applied to (local optimistic state)
    const [appliedIds, setAppliedIds]   = useState<Set<string>>(new Set());
    // IDs currently in flight (POST in progress)
    const [applyingIds, setApplyingIds] = useState<Set<string>>(new Set());

    // tab: 'feed' | 'history'
    const [tab, setTab] = useState<'feed' | 'history'>('feed');

    // Токен хранится в localStorage (см. AuthContext → authApi.login)
    const getToken = useCallback(() => localStorage.getItem('accessToken') ?? '', []);

    const load = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const d = await fetchFeed();
            setData(d);
            const ids = new Set(d.activities.map(a => a.eventId));
            setAppliedIds(ids);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Ошибка загрузки');
        } finally {
            setLoading(false);
        }
    }, [user, getToken]);

    useEffect(() => { load(); }, [load]);

    const handleApply = async (eventId: string) => {
        const token = getToken();
        if (!token) return;
        setApplyingIds(prev => new Set(prev).add(eventId));
        try {
            await applyToEvent(token, eventId);
            setAppliedIds(prev => new Set(prev).add(eventId));
            notify('Заявка успешно отправлена! 🎉');
            const fresh = await fetchFeed();
            setData(fresh);
        } catch (e: unknown) {
            notify(e instanceof Error ? e.message : 'Ошибка при подаче заявки', 'error');
        } finally {
            setApplyingIds(prev => { const s = new Set(prev); s.delete(eventId); return s; });
        }
    };

    const handleRevoke = async (participationId: string) => {
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/api/participations/${participationId}`, {
                method: 'DELETE',
                headers: authHeaders(token),
            });
            if (!res.ok) throw new Error('Не удалось отозвать заявку');
            notify('Заявка отозвана');
            const fresh = await fetchFeed();
            setData(fresh);
            setAppliedIds(new Set(fresh.activities.map(a => a.eventId)));
        } catch (e: unknown) {
            notify(e instanceof Error ? e.message : 'Ошибка', 'error');
        }
    };

    // ── Loading state
    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
                        <i className="fas fa-leaf text-primary text-2xl" />
                    </div>
                    <p className="text-gray-500 text-sm">Загружаем вашу ленту…</p>
                </div>
            </div>
        );
    }

    // ── Error state
    if (error || !data) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <div className="text-center space-y-4 max-w-sm">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <i className="fas fa-exclamation-triangle text-red-500 text-2xl" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Что-то пошло не так</h2>
                    <p className="text-gray-500 text-sm">{error}</p>
                    <button
                        onClick={load}
                        className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition text-sm"
                    >
                        <i className="fas fa-redo mr-2" />
                        Попробовать снова
                    </button>
                </div>
            </div>
        );
    }

    const { profile, activities, upcomingEvents, stats } = data;

    // Статистика и сортировка — с сервера, клиент ничего не считает
    const { totalApplied, approved, attended, pending } = stats;

    // upcomingEvents уже отфильтрованы сервером (без заявок пользователя),
    // но учитываем оптимистичные локальные записи сделанные в этой сессии
    const newEvents = upcomingEvents.filter(e => !appliedIds.has(e.id));

    // Активности — порядок с сервера (новые первыми), просто переименовываем
    const sortedActivities = activities;

    const memberSince = new Date(profile.createdAt).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

    return (
        <>
            {/* ── PROFILE HERO ─────────────────────────────────────────────── */}
            <section className="bg-gradient-to-br from-[#0f1117] via-[#1a2410] to-[#0f1117] text-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        {/* avatar */}
                        <div className="relative flex-shrink-0">
                            {profile.avatarUrl ? (
                                <img
                                    src={profile.avatarUrl}
                                    alt={fullName(profile)}
                                    className="w-20 h-20 rounded-2xl object-cover ring-4 ring-primary/30"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-2xl bg-primary/20 ring-4 ring-primary/30 flex items-center justify-center">
                                    <i className="fas fa-user text-primary text-3xl" />
                                </div>
                            )}
                            <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center ring-2 ring-[#0f1117]">
                                <i className="fas fa-leaf text-white text-xs" />
                            </div>
                        </div>

                        {/* name + meta */}
                        <div className="flex-1 min-w-0">
                            <p className="text-primary/80 text-xs font-semibold uppercase tracking-widest mb-1">
                                Личный кабинет волонтёра
                            </p>
                            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-1">
                                {fullName(profile)}
                            </h1>
                            <p className="text-gray-400 text-sm">
                                {profile.email} · С нами с {memberSince}
                            </p>
                            {profile.bio && (
                                <p className="text-gray-300 text-sm mt-2 max-w-lg leading-relaxed">{profile.bio}</p>
                            )}
                        </div>

                        {/* edit profile link */}
                        <Link
                            to="/profile"
                            className="flex-shrink-0 px-4 py-2 border border-white/20 text-white text-sm font-medium rounded-xl hover:bg-white/10 transition"
                        >
                            <i className="fas fa-pen mr-2 text-xs" />
                            Редактировать
                        </Link>
                    </div>

                    {/* stats pills */}
                    <div className="flex flex-wrap gap-3 mt-8">
                        <StatPill icon="fas fa-paper-plane" value={totalApplied} label="Заявок всего" />
                        <StatPill icon="fas fa-check-circle" value={approved}   label="Одобрено" />
                        <StatPill icon="fas fa-star"          value={attended}   label="Посещено" />
                        <StatPill icon="fas fa-clock"         value={pending}    label="На рассмотрении" />
                    </div>
                </div>
            </section>

            {/* ── TABS ─────────────────────────────────────────────────────── */}
            <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-0">
                        {(['feed', 'history'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                                    tab === t
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {t === 'feed' ? (
                                    <><i className="fas fa-stream mr-2" />Лента мероприятий</>
                                ) : (
                                    <><i className="fas fa-history mr-2" />Моя история
                                        {pending > 0 && (
                                            <span className="ml-2 w-5 h-5 rounded-full bg-yellow-400 text-yellow-900 text-xs font-bold inline-flex items-center justify-center">
                        {pending}
                      </span>
                                        )}
                                    </>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── CONTENT ──────────────────────────────────────────────────── */}
            <section className="py-10 bg-gray-50 min-h-[50vh]">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">

                    {/* ── TAB: FEED ── */}
                    {tab === 'feed' && (
                        <>
                            {/* section header */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Ближайшие мероприятия</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        {newEvents.length > 0
                                            ? `${newEvents.length} событий ждут вашего участия`
                                            : 'Вы уже подали заявки на все доступные мероприятия 🎉'}
                                    </p>
                                </div>
                                <Link
                                    to="/events"
                                    className="text-sm text-primary font-semibold hover:underline"
                                >
                                    Все мероприятия →
                                </Link>
                            </div>

                            {newEvents.length === 0 && upcomingEvents.length > 0 && (
                                <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-2xl text-sm text-green-700 flex items-center gap-3">
                                    <i className="fas fa-check-circle text-green-500 text-lg" />
                                    <span>Вы подали заявки на все актуальные мероприятия. Ждём новых!</span>
                                </div>
                            )}

                            {upcomingEvents.length === 0 ? (
                                <div className="text-center py-20 text-gray-400">
                                    <i className="fas fa-calendar-times text-5xl mb-4 block" />
                                    <p className="text-lg font-semibold text-gray-600">Нет актуальных мероприятий</p>
                                    <p className="text-sm mt-1">Загляните позже — новые события появятся скоро.</p>
                                </div>
                            ) : (
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                    {upcomingEvents.map(ev => (
                                        <EventCard
                                            key={ev.id}
                                            event={ev}
                                            participatedIds={appliedIds}
                                            pendingSet={applyingIds}
                                            onApply={handleApply}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* ── TAB: HISTORY ── */}
                    {tab === 'history' && (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">История участий</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">{activities.length} заявок за всё время</p>
                                </div>
                            </div>

                            {sortedActivities.length === 0 ? (
                                <div className="text-center py-20 text-gray-400">
                                    <i className="fas fa-inbox text-5xl mb-4 block" />
                                    <p className="text-lg font-semibold text-gray-600">Вы ещё не участвовали в мероприятиях</p>
                                    <button
                                        onClick={() => setTab('feed')}
                                        className="mt-4 px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition text-sm"
                                    >
                                        Найти мероприятие
                                    </button>
                                </div>
                            ) : (
                                <div className="grid lg:grid-cols-2 gap-3 max-w-4xl">
                                    {sortedActivities.map(rec => (
                                        <ActivityCard key={rec.id} rec={rec} onRevoke={handleRevoke} />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>
        </>
    );
}