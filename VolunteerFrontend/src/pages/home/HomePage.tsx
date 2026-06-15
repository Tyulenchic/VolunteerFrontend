import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useApiError } from '../../hooks/useApiError';
import { Modal } from '../../components/Modal';
import { Spinner } from '../../components/Spinner';
import { newsApi, type NewsResponseDto } from '../../api/news';
import { publicEventsApi } from '../../api/publicEvents';
import type { EventResponseDto } from '../../types/event';
import VolonterHomeImage from '../../assets/VolonterHome.png';

// ─── Video carousel data ────────────────────────────────────────────────────
const REPORT_VIDEOS = [
    { id: 'v1', title: 'Весенняя акция «Чистый Тирасполь» 2026', description: 'Более 300 волонтёров вышли на уборку города. Итоги акции.', thumbnail: 'https://images.unsplash.com/photo-1621451537084-482c78eab36d?w=640&h=360&fit=crop', duration: '4:32', date: 'Апрель 2026', src: null },
    { id: 'v2', title: 'Отчёт о деятельности за 2025 год', description: '20+ мероприятий, 15+ волонтёров, 5+ населённых пунктов.', thumbnail: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=640&h=360&fit=crop', duration: '7:15', date: 'Январь 2026', src: null },
    { id: 'v3', title: 'Донорская акция «Подари жизнь»', description: 'Как прошла самая большая донорская акция в истории движения.', thumbnail: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=640&h=360&fit=crop', duration: '5:48', date: 'Март 2026', src: null },
    { id: 'v4', title: 'Помощь ветеранам: день добрых дел', description: 'Волонтёры посетили ветеранов в 12 городах одновременно.', thumbnail: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=640&h=360&fit=crop', duration: '3:20', date: 'Февраль 2026', src: null },
    { id: 'v5', title: 'Зооволонтёры: год помощи приютам', description: 'Итоги года работы нашего зооволонтёрского направления.', thumbnail: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=640&h=360&fit=crop', duration: '6:02', date: 'Декабрь 2025', src: null },
];

// ─── Event category color map ───────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
    'Экологическое': 'bg-green-500',
    'Социальное': 'bg-orange-500',
    'Культура': 'bg-purple-500',
    'ЗОЖ': 'bg-sky-500',
    'Образование': 'bg-indigo-500',
    'Ветераны': 'bg-red-500',
    'Мед': 'bg-teal-500',
    'Донорство': 'bg-red-600',
    'Животные': 'bg-yellow-500',
    'Медиаволонтёрство': 'bg-cyan-500',
    'Событийное': 'bg-pink-500',
    'Патриотическое': 'bg-blue-700',
    'Урбанистика': 'bg-gray-500',
};

const getCategoryColor = (cat?: string): string =>
    cat ? (CATEGORY_COLORS[cat] ?? 'bg-blue-600') : 'bg-blue-600';

// ─── VideoCarousel ───────────────────────────────────────────────────────────
function VideoCarousel() {
    const [current, setCurrent] = useState(0);
    const [playing, setPlaying] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const total = REPORT_VIDEOS.length;
    const prev = () => setCurrent(p => (p - 1 + total) % total);
    const next = () => setCurrent(p => (p + 1) % total);
    const handlePlay = (id: string) => { if (playing === id) { setPlaying(null); return; } setPlaying(id); };

    return (
        <div className="w-full flex flex-col items-center">
            <div className="relative rounded-2xl overflow-hidden shadow-xl mb-8 bg-gray-900 aspect-video max-h-[480px] w-full max-w-4xl">
                {playing === REPORT_VIDEOS[current].id && REPORT_VIDEOS[current].src ? (
                    <video ref={videoRef} src={REPORT_VIDEOS[current].src!} className="w-full h-full object-cover" controls autoPlay onEnded={() => setPlaying(null)} />
                ) : (
                    <>
                        <img src={REPORT_VIDEOS[current].thumbnail} alt={REPORT_VIDEOS[current].title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                        <button onClick={() => handlePlay(REPORT_VIDEOS[current].id)} className="absolute inset-0 flex items-center justify-center group" aria-label="Воспроизвести">
                            <div className="w-18 h-18 w-[72px] h-[72px] bg-white rounded-full flex items-center justify-center shadow-2xl transition-all group-hover:scale-110">
                                <i className="fas fa-play text-blue-600 text-2xl ml-1" />
                            </div>
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                            <div className="flex items-center gap-3 mb-2">
                 <span className="px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center gap-1.5">
                   <i className="fas fa-video text-[10px]" />{REPORT_VIDEOS[current].duration}
                 </span>
                                <span className="text-white/70 text-sm">{REPORT_VIDEOS[current].date}</span>
                            </div>
                            <h3 className="text-white font-bold text-xl sm:text-2xl leading-tight mb-1">{REPORT_VIDEOS[current].title}</h3>
                            <p className="text-white/70 text-sm hidden sm:block">{REPORT_VIDEOS[current].description}</p>
                        </div>
                    </>
                )}
                <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition z-10">
                    <i className="fas fa-chevron-left text-sm" />
                </button>
                <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition z-10">
                    <i className="fas fa-chevron-right text-sm" />
                </button>
            </div>

            {/* Thumbnail strip */}
            <div className="flex justify-center gap-3 mb-6 flex-wrap max-w-4xl px-4">
                {REPORT_VIDEOS.map((v, i) => (
                    <button key={v.id} onClick={() => { setCurrent(i); setPlaying(null); }}
                            className={`relative rounded-xl overflow-hidden aspect-video transition-all duration-200 w-20 h-12 ${i === current ? 'ring-2 ring-blue-600 ring-offset-2 shadow-md scale-110' : 'opacity-50 hover:opacity-75'}`}>
                        <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0.5 right-0.5 text-[8px] bg-black/70 text-white px-0.5 py-0.5 rounded font-mono">{v.duration}</span>
                    </button>
                ))}
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2">
                {REPORT_VIDEOS.map((_, i) => (
                    <button key={i} onClick={() => { setCurrent(i); setPlaying(null); }}
                            className={`rounded-full transition-all duration-300 ${i === current ? 'w-6 h-2.5 bg-blue-600' : 'w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400'}`} />
                ))}
            </div>
        </div>
    );
}

// ─── Auth Modals ─────────────────────────────────────────────────────────────
function LoginModal({ onClose, onSwitch }: { onClose: () => void; onSwitch: () => void }) {
    const { login } = useAuth(); const { notify } = useNotification(); const navigate = useNavigate();
    const { error, capture } = useApiError();
    const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [loading, setLoading] = useState(false);
    const submit = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true);
        try { await login({ email, password: pw }); notify('Добро пожаловать! 🎉'); onClose(); navigate('/profile'); }
        catch (err) { capture(err); } finally { setLoading(false); }
    };
    return (
        <form onSubmit={submit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm">{error}</div>}
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="your@email.com" /></div>
            <div>
                <div className="flex justify-between mb-1"><label className="block text-sm font-medium text-gray-700">Пароль</label><Link to="/forgot-password" onClick={onClose} className="text-sm text-blue-600 hover:underline">Забыли пароль?</Link></div>
                <input type="password" value={pw} onChange={e => setPw(e.target.value)} required autoComplete="current-password" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <><Spinner /> Вход...</> : 'Войти'}
            </button>
            <p className="text-center text-sm text-gray-600">Нет аккаунта? <button type="button" onClick={onSwitch} className="text-blue-600 font-semibold hover:underline bg-transparent border-none cursor-pointer p-0">Зарегистрироваться</button></p>
        </form>
    );
}

function RegisterModal({ onClose, onSwitch }: { onClose: () => void; onSwitch: () => void }) {
    const { register } = useAuth(); const { notify } = useNotification(); const navigate = useNavigate();
    const { error, capture } = useApiError();
    const [form, setForm] = useState({ email: '', pw: '', confirm: '', first: '', last: '', consent: false });
    const [fe, setFe] = useState({} as Record<string, string>);
    const [loading, setLoading] = useState(false);
    const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));
    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.email) e.email = 'Обязательно';
        if (form.pw.length < 8) e.pw = 'Минимум 8 символов';
        if (form.pw !== form.confirm) e.confirm = 'Пароли не совпадают';
        if (!form.consent) e.consent = 'Необходимо согласие';
        setFe(e); return Object.keys(e).length === 0;
    };
    const submit = async (e: React.FormEvent) => {
        e.preventDefault(); if (!validate()) return; setLoading(true);
        try { await register({ email: form.email, password: form.pw, firstName: form.first || undefined, lastName: form.last || undefined, consentGiven: form.consent }); notify('Регистрация успешна! 🎉'); onClose(); navigate('/profile'); }
        catch (err) { capture(err); } finally { setLoading(false); }
    };
    const inp = (err?: string) => `w-full px-4 py-2.5 border ${err ? 'border-red-400' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition`;
    return (
        <form onSubmit={submit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm">{error}</div>}
            <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Имя</label><input value={form.first} onChange={e => set('first', e.target.value)} className={inp()} placeholder="Иван" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label><input value={form.last} onChange={e => set('last', e.target.value)} className={inp()} placeholder="Иванов" /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} required className={inp(fe.email)} placeholder="your@email.com" />{fe.email && <p className="text-red-500 text-xs mt-1">{fe.email}</p>}</div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Пароль * <span className="text-gray-400 font-normal">(мин. 8)</span></label><input type="password" value={form.pw} onChange={e => set('pw', e.target.value)} required className={inp(fe.pw)} placeholder="••••••••" />{fe.pw && <p className="text-red-500 text-xs mt-1">{fe.pw}</p>}</div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Повтор пароля *</label><input type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)} required className={inp(fe.confirm)} placeholder="••••••••" />{fe.confirm && <p className="text-red-500 text-xs mt-1">{fe.confirm}</p>}</div>
            <div>
                <label className="flex items-start gap-2 cursor-pointer"><input type="checkbox" checked={form.consent} onChange={e => set('consent', e.target.checked)} className="w-4 h-4 mt-0.5 accent-blue-600" /><span className="text-sm text-gray-600">Согласен(а) с <Link to="/privacy" onClick={onClose} className="text-blue-600 hover:underline">политикой конфиденциальности</Link></span></label>
                {fe.consent && <p className="text-red-500 text-xs mt-1">{fe.consent}</p>}
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <><Spinner /> Регистрация...</> : 'Создать аккаунт'}
            </button>
            <p className="text-center text-sm text-gray-600">Уже есть аккаунт? <button type="button" onClick={onSwitch} className="text-blue-600 font-semibold hover:underline bg-transparent border-none cursor-pointer p-0">Войти</button></p>
        </form>
    );
}

function EventModal({ title, onClose }: { title: string; onClose: () => void }) {
    const { user } = useAuth(); const { notify } = useNotification(); const navigate = useNavigate();
    const [loading, setLoading] = useState(false); const [confirm, setConfirm] = useState(false);
    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) { notify('Сначала войдите в систему', 'error'); onClose(); navigate('/login'); return; }
        setLoading(true); await new Promise(r => setTimeout(r, 800));
        notify('Заявка подана! Ожидайте подтверждения 🎫'); setLoading(false); onClose();
    };
    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h4 className="font-bold text-gray-900">{title}</h4>
                <p className="text-sm text-gray-500 mt-1">Подтвердите регистрацию на мероприятие</p>
            </div>
            <label className="flex items-start gap-2 cursor-pointer"><input type="checkbox" checked={confirm} onChange={e => setConfirm(e.target.checked)} required className="w-4 h-4 mt-0.5 accent-blue-600" /><span className="text-sm text-gray-600">Я подтверждаю участие и обязуюсь прийти вовремя</span></label>
            <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <><Spinner /> Регистрация...</> : 'Подтвердить регистрацию'}
            </button>
        </form>
    );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
type ModalT = 'login' | 'register' | 'event' | null;

const fmtDate = (s: string) => new Date(s).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtEventDate = (s: string) => {
    const d = new Date(s);
    return {
        day: d.getDate().toString().padStart(2, '0'),
        month: d.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '').toUpperCase(),
        time: d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        full: d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) + ', ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };
};

// ─── Feature pills for hero ───────────────────────────────────────────────────
const HERO_FEATURES = [
    { icon: 'fa-calendar-check', label: 'Актуальные\nмероприятия',  bg: 'bg-green-100',  iconColor: 'text-green-600'  },
    { icon: 'fa-file-alt',        label: 'Удобная подача\nзаявок',   bg: 'bg-blue-100',   iconColor: 'text-blue-600'   },
    { icon: 'fa-certificate',     label: 'Сертификаты\nи достижения',bg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
    { icon: 'fa-handshake',       label: 'Поддержка\nорганизаций',   bg: 'bg-sky-100',    iconColor: 'text-sky-600'    },
];

// ─── Mock event categories (fallback) ────────────────────────────────────────
const EVENT_IMAGES = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=280&fit=crop',
    'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=280&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=280&fit=crop',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=280&fit=crop',
];
const EVENT_CATS = ['Экология', 'Социальное', 'Экология', 'Культура'];


// ─── Main Component ───────────────────────────────────────────────────────────
export function HomePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { openFeedback } = useFeedback();
    const [modal, setModal] = useState<ModalT>(null);
    const [selEvent, setSelEvent] = useState('');
    const close = () => { setModal(null); setSelEvent(''); };
    const openEvent = (title: string) => { setSelEvent(title); setModal('event'); };
    const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const [newsItems, setNewsItems] = useState<NewsResponseDto[]>([]);
    const [events, setEvents] = useState<EventResponseDto[]>([]);
    const [newsLoading, setNewsLoading] = useState(true);
    const [eventsLoading, setEventsLoading] = useState(true);

    useEffect(() => {
        newsApi.getActual(0, 5)
            .then(res => setNewsItems(res.items))
            .finally(() => setNewsLoading(false));
    }, []);

    useEffect(() => {
        publicEventsApi.getActual(0, 4)
            .then(res => setEvents(res.items))
            .finally(() => setEventsLoading(false));
    }, []);

    return (
        <>
            {/* ── HERO ────────────────────────────────────────────────────────── */}
            <section className="bg-white pt-10 pb-0 overflow-hidden">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-8 items-center">

                        {/* Left: text */}
                        <div className="pb-12 lg:pb-20">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-sm text-gray-600 font-medium mb-7 bg-white shadow-sm">
                                <i className="fas fa-heart text-blue-600 text-xs" />
                                Вместе делаем ПМР лучше
                            </div>

                            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-3">
                                Присоединяйся к добрым делам
                            </h1>
                            <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-600 leading-tight mb-6">
                                в Приднестровье
                            </h1>

                            <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-md">
                                Находите мероприятия, становитесь волонтёром, помогайте и меняйте мир вокруг себя к лучшему вместе с нами.
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-wrap gap-3 mb-10">
                                <button
                                    onClick={() => scrollTo('events')}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-600/25 text-sm"
                                >
                                    Перейти к мероприятиям <i className="fas fa-arrow-right text-xs" />
                                </button>
                                {user
                                    ? <Link to="/profile" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:text-blue-600 transition text-sm no-underline">
                                        <i className="fas fa-user text-sm" />Личный кабинет
                                    </Link>
                                    : <button onClick={() => setModal('register')} className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:text-blue-600 transition text-sm">
                                        Стать волонтёром <i className="fas fa-user-plus text-sm" />
                                    </button>
                                }
                            </div>

                            {/* Feature pills */}
                            <div className="flex flex-wrap gap-4">
                                {HERO_FEATURES.map(f => (
                                    <div key={f.label} className="flex items-center gap-2.5">
                                        <div className={`w-9 h-9 ${f.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                            <i className={`fas ${f.icon} ${f.iconColor} text-sm`} />
                                        </div>
                                        <span className="text-xs text-gray-600 font-medium leading-tight whitespace-pre-line">{f.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: hero image with blobs */}
                        <div className="relative flex justify-end items-end h-[420px] sm:h-[500px] lg:h-[540px]">
                            {/* Photo */}
                            <img
                                src={VolonterHomeImage}
                                alt="Волонтёры"
                                className="relative z-10 w-[100%] h-[115%] object-contain"
                            />

                            {/* Dot grid decoration */}
                            <div className="absolute top-[50%] left-[5%] z-20" style={{
                                backgroundImage: 'radial-gradient(circle, #2563EB 2.5px, transparent 2.5px)',
                                backgroundSize: '20px 20px',
                                width: '100px', height: '100px', opacity: 0.8
                            }} />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── NEWS + EVENTS (vertical layout) ───────────────────────────── */}
            <section id="events" className="py-12 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-12">

                        {/* News column */}
                        <div>
                            <div className="flex flex-col items-center text-center mb-6">
                                <h2 className="text-xl font-extrabold text-gray-900">Последние новости</h2>
                            </div>

                            {newsLoading ? (
                                <div className="flex justify-center py-10">
                                    <Spinner />
                                </div>
                            ) : (() => {
                                const items = newsItems.slice(0, 10);
                                const withImage = items.filter(n => n.imageUrl);
                                const withoutImage = items.filter(n => !n.imageUrl);

                                if (withImage.length > 0) {
                                    return (
                                        <div className="grid grid-cols-5 gap-3">
                                            {withImage.map(n => (
                                                <Link
                                                    key={n.id}
                                                    to={`/news/${n.id}`}
                                                    className="flex flex-col gap-2 group no-underline"
                                                >
                                                    <div className="w-full overflow-hidden rounded-xl" style={{ aspectRatio: '16/10' }}>
                                                        <img
                                                            src={n.imageUrl}
                                                            alt={n.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                    <p className="text-[13px] font-semibold text-gray-800 group-hover:text-blue-600 transition leading-snug line-clamp-3 m-0">
                                                        {n.title}
                                                    </p>
                                                    <time className="text-[11px] text-gray-400">{fmtDate(n.createdAt)}</time>
                                                </Link>
                                            ))}

                                            {withoutImage.length > 0 && (
                                                <div className="col-span-5 grid grid-cols-2 gap-x-8 mt-2">
                                                    {withoutImage.slice(0, 8).map(n => (
                                                        <Link
                                                            key={n.id}
                                                            to={`/news/${n.id}`}
                                                            className="flex flex-col gap-1 py-3 border-b border-gray-100 last:border-b-0 group no-underline"
                                                        >
                                                            <p className="text-[13px] font-semibold text-gray-800 group-hover:text-blue-600 transition leading-snug line-clamp-2 m-0">
                                                                {n.title}
                                                            </p>
                                                            <time className="text-[11px] text-gray-400">{fmtDate(n.createdAt)}</time>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                return (
                                    <div className="grid grid-cols-2 gap-x-8">
                                        {withoutImage.slice(0, 8).map(n => (
                                            <Link
                                                key={n.id}
                                                to={`/news/${n.id}`}
                                                className="flex flex-col gap-1 py-3 border-b border-gray-100 last:border-b-0 group no-underline"
                                            >
                                                <p className="text-[13px] font-semibold text-gray-800 group-hover:text-blue-600 transition leading-snug line-clamp-2 m-0">
                                                    {n.title}
                                                </p>
                                                <time className="text-[11px] text-gray-400">{fmtDate(n.createdAt)}</time>
                                            </Link>
                                        ))}
                                    </div>
                                );
                            })()}

                            <div className="flex flex-col items-center text-center mt-6">
                                <Link
                                    to="/news"
                                    className="inline-flex items-center gap-1.5 text-blue-600 text-sm font-semibold hover:text-blue-700 no-underline mt-2"
                                >
                                    Все новости <i className="fas fa-arrow-right text-xs" />
                                </Link>
                            </div>
                        </div>

                        {/* Events column */}
                        <div>
                            <div className="flex flex-col items-center text-center mb-6">
                                <h2 className="text-xl font-extrabold text-gray-900">Популярные мероприятия</h2>
                            </div>

                            {eventsLoading
                                ? <div className="flex justify-center py-16"><Spinner /></div>
                                : (() => {
                                    const cols = 5;
                                    const remainder = events.length % cols;
                                    const hasRemainder = remainder !== 0;
                                    const mainItems = hasRemainder ? events.slice(0, events.length - remainder) : events;
                                    const lastItems = hasRemainder ? events.slice(events.length - remainder) : [];

                                    const EventCard = (ev: EventResponseDto, idx: number) => {
                                        const dt = fmtEventDate(ev.startsAt);
                                        const cat = (ev as any).category ?? EVENT_CATS[idx] ?? 'Экология';
                                        const imgUrl = (ev as any).imageUrl ?? EVENT_IMAGES[idx % EVENT_IMAGES.length];
                                        return (
                                            <article key={ev.id} className="bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all duration-300 overflow-hidden group">
                                                <div className="relative aspect-[16/10] overflow-hidden">
                                                    <img src={imgUrl} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                                    <span className={`absolute top-2 left-2 px-2.5 py-1 ${getCategoryColor(cat)} text-white text-xs font-bold rounded-full`}>
                                                      {cat}
                                                    </span>
                                                    <div className="absolute bottom-2 right-2 flex flex-col items-center bg-white rounded-xl px-2.5 py-1.5 shadow-md min-w-[44px]">
                                                        <span className="text-lg font-extrabold text-gray-900 leading-none">{dt.day}</span>
                                                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">{dt.month}</span>
                                                    </div>
                                                </div>
                                                <div className="p-4">
                                                    <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 group-hover:text-blue-600 transition line-clamp-2">{ev.title}</h3>
                                                    <div className="space-y-1 mb-3">
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                            <i className="fas fa-map-marker-alt text-gray-300 w-3 flex-shrink-0" />
                                                            <span className="truncate">{ev.location}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                            <i className="far fa-clock text-gray-300 w-3 flex-shrink-0" />
                                                            <span>{dt.full}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                            <i className="fas fa-users text-gray-400" />
                                                            <span>{ev.approvedCount ?? 0} участников</span>
                                                        </div>
                                                        <button
                                                            onClick={() => openEvent(ev.title)}
                                                            className="text-gray-400 hover:text-blue-600 transition"
                                                            aria-label="Сохранить"
                                                        >
                                                            <i className="far fa-bookmark text-base" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    };

                                    return (
                                        <>
                                            {mainItems.length > 0 && (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                                    {mainItems.map((ev, idx) => EventCard(ev, idx))}
                                                </div>
                                            )}
                                            {lastItems.length > 0 && (
                                                <div className="flex justify-center gap-4 mt-4 flex-wrap">
                                                    {lastItems.map((ev, idx) => (
                                                        <div key={ev.id} className="w-[calc(20%-0.8rem)] min-w-[160px]">
                                                            {EventCard(ev, mainItems.length + idx)}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    );
                                })()
                            }

                            <div className="flex flex-col items-center text-center mt-6">
                                <Link to="/events" className="inline-flex items-center gap-1.5 text-blue-600 text-sm font-semibold hover:text-blue-700 no-underline mt-2">
                                    Все мероприятия <i className="fas fa-arrow-right text-xs" />
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── HOW TO START ────────────────────────────────────────────────── */}
            <section className="py-16 sm:py-20 bg-gray-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Как начать путь волонтёра</h2>
                        <p className="text-gray-500">Всего четыре простых шага</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 relative">
                        {[
                            { n: 1, icon: 'fa-user-plus',      t: 'Зарегистрируйтесь',    d: 'Заполните простую форму за 5 минут', action: () => setModal('register') },
                            { n: 2, icon: 'fa-id-card',         t: 'Заполните профиль',    d: 'Расскажите о себе и своих интересах', action: () => user ? navigate('/profile') : setModal('register') },
                            { n: 3, icon: 'fa-search',           t: 'Выберите мероприятие', d: 'Просмотрите календарь событий', action: () => scrollTo('events') },
                            { n: 4, icon: 'fa-heart',            t: 'Примите участие',      d: 'Приходите и делайте мир лучше!', action: () => navigate('/events') },
                        ].map(s => (
                            <button
                                key={s.n}
                                onClick={s.action}
                                className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all z-10 text-center cursor-pointer hover:bg-blue-50/30"
                            >
                                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md shadow-blue-600/20">
                                    <i className={`fas ${s.icon} text-white text-xl`} />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2 text-sm">{s.t}</h3>
                                <p className="text-gray-400 text-xs">{s.d}</p>
                            </button>
                        ))}
                    </div>
                    <div className="text-center mt-10">
                        {user
                            ? <Link to="/profile" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-md no-underline text-sm">Перейти в профиль <i className="fas fa-arrow-right ml-2" /></Link>
                            : <button onClick={() => setModal('register')} className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-md text-sm">Начать сейчас <i className="fas fa-arrow-right ml-2" /></button>}
                    </div>
                </div>
            </section>

            {/* ── VIDEO CAROUSEL ──────────────────────────────────────────────── */}
            <section className="py-16 sm:py-20 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                        <div>
              <span className="inline-flex items-center gap-1.5 text-blue-600 text-xs font-bold uppercase tracking-widest mb-2">
                <i className="fas fa-film" />Видеоотчёт
              </span>
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Отчёт деятельности</h2>
                            <p className="text-gray-400 mt-1 text-sm">Видеоматериалы наших акций и мероприятий</p>
                        </div>
                        <span className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
              <i className="fas fa-video text-blue-600" />{REPORT_VIDEOS.length} видео
            </span>
                    </div>
                    <VideoCarousel />
                </div>
            </section>

            {/* ── WHAT YOU CAN DO ─────────────────────────────────────────────── */}
            <section className="py-16 sm:py-20 bg-gray-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Возможности портала</h2>
                        <p className="text-gray-400 text-sm">Удобная платформа для координации волонтёрской деятельности</p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {[
                            { icon: 'fa-newspaper',      iconColor: 'text-blue-600',   bg: 'bg-blue-50   group-hover:bg-blue-100',   title: 'Новости движения',    desc: 'Следите за событиями и анонсами', link: <Link to="/news" className="inline-flex items-center gap-1 text-blue-600 text-sm font-semibold hover:text-blue-700 no-underline mt-auto">Читать <i className="fas fa-arrow-right text-xs" /></Link> },
                            { icon: 'fa-calendar-check', iconColor: 'text-sky-600',    bg: 'bg-sky-50    group-hover:bg-sky-100',    title: 'Участие в акциях',    desc: 'Находите события и регистрируйтесь онлайн', link: <button onClick={() => scrollTo('events')} className="inline-flex items-center gap-1 text-blue-600 text-sm font-semibold hover:text-blue-700 bg-transparent border-none cursor-pointer p-0 mt-auto">Смотреть <i className="fas fa-arrow-right text-xs" /></button> },
                            { icon: 'fa-users',          iconColor: 'text-purple-600', bg: 'bg-purple-50 group-hover:bg-purple-100', title: 'Сообщество',          desc: 'Общайтесь с единомышленниками', link: <button onClick={() => scrollTo('community')} className="inline-flex items-center gap-1 text-blue-600 text-sm font-semibold hover:text-blue-700 bg-transparent border-none cursor-pointer p-0 mt-auto">Войти <i className="fas fa-arrow-right text-xs" /></button> },
                            { icon: 'fa-award',          iconColor: 'text-amber-600',  bg: 'bg-amber-50  group-hover:bg-amber-100',  title: 'Достижения',         desc: 'Отслеживайте вклад и получайте сертификаты', link: user ? <Link to="/profile" className="inline-flex items-center gap-1 text-blue-600 text-sm font-semibold hover:text-blue-700 no-underline mt-auto">Кабинет <i className="fas fa-arrow-right text-xs" /></Link> : <button onClick={() => setModal('register')} className="inline-flex items-center gap-1 text-blue-600 text-sm font-semibold hover:text-blue-700 bg-transparent border-none cursor-pointer p-0 mt-auto">Начать <i className="fas fa-arrow-right text-xs" /></button> },
                        ].map(f => (
                            <article key={f.title} className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all group flex flex-col">
                                <div className={`w-11 h-11 ${f.bg} rounded-xl flex items-center justify-center mb-4 transition-colors`}>
                                    <i className={`fas ${f.icon} ${f.iconColor} text-lg`} />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2 text-sm">{f.title}</h3>
                                <p className="text-gray-400 text-xs mb-4 flex-1 leading-relaxed">{f.desc}</p>
                                {f.link}
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── COMMUNITY ───────────────────────────────────────────────────── */}
            <section id="community" className="py-16 sm:py-20 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 sm:p-12 border border-blue-100">
                        <div className="grid lg:grid-cols-2 gap-10 items-center">
                            <div>
                                <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 text-blue-600 text-xs font-bold uppercase tracking-widest mb-4">
              <i className="fas fa-users" />Сообщество
            </span>
                                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Наше сообщество</h2>
                                    <p className="text-gray-600 text-base mb-6 leading-relaxed">Волонтеры Приднестровья — это большая команда неравнодушных людей, которые меняют Приднестровье к лучшему каждый день.</p>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    {['Общение с единомышленниками', 'Обмен опытом и знаниями', 'Совместные проекты и инициативы', 'Поддержка и мотивация'].map(item => (
                                        <li key={item} className="flex items-center gap-3">
                                            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <i className="fas fa-check text-blue-600 text-[10px]" />
                                            </div>
                                            <span className="text-gray-600 text-sm">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                {user
                                    ? <Link to="/profile" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-md no-underline text-sm">Мой профиль <i className="fas fa-arrow-right ml-2" /></Link>
                                    : <button onClick={() => setModal('register')} className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-md text-sm">Присоединиться <i className="fas fa-arrow-right ml-2" /></button>}
                            </div>
                            <div className="flex justify-center lg:justify-end">
                                <div className="relative w-full max-w-sm">
                                    <div className="absolute -inset-3 bg-blue-100 rounded-3xl blur-2xl opacity-50" />
                                    <img src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=500&h=400&fit=crop" alt="Волонтёры" className="relative rounded-2xl shadow-xl w-full object-cover" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FEEDBACK ────────────────────────────────────────────────────── */}
            <section id="feedback" className="py-16 sm:py-20 bg-gray-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-xl text-center">
                    <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <i className="fas fa-envelope text-blue-600 text-2xl" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Обратная связь</h2>
                    <p className="text-gray-400 mb-8 text-sm">Есть вопросы или предложения? Мы всегда рады ответить.</p>
                    <button
                        onClick={openFeedback}
                        className="inline-flex items-center px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-md text-sm"
                    >
                        <i className="fas fa-paper-plane mr-2" />Написать нам
                    </button>
                </div>
            </section>

            {/* ── MODALS ──────────────────────────────────────────────────────── */}
            <Modal isOpen={modal === 'login'}    onClose={close} title="Вход в систему">
                <LoginModal onClose={close} onSwitch={() => setModal('register')} />
            </Modal>
            <Modal isOpen={modal === 'register'} onClose={close} title="Регистрация волонтёра">
                <RegisterModal onClose={close} onSwitch={() => setModal('login')} />
            </Modal>
            <Modal isOpen={modal === 'event'}    onClose={close} title="Регистрация на мероприятие">
                <EventModal title={selEvent} onClose={close} />
            </Modal>
        </>
    );
}