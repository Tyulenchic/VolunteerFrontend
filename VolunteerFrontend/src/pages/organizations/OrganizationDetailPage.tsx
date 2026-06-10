import { useParams, useNavigate, Link } from 'react-router-dom';
import { ORGS, CAT_BADGE, CAT_BADGE_LABEL } from './OrganizationsPage';
import type { OrgCategory } from './OrganizationsPage';

// ─── helpers ────────────────────────────────────────────────────────────────
const LEVEL_LABEL: Record<string, string> = {
    school:     'Общеобразовательная',
    college:    'Среднее проф. образование',
    university: 'Высшее образование',
};

const LEVEL_ICON: Record<string, string> = {
    school:     'fas fa-school',
    college:    'fas fa-chalkboard-teacher',
    university: 'fas fa-university',
};

const DIRECTION_ICON: Record<string, string> = {
    'Экологическое':              'fas fa-leaf',
    'Социальное':                 'fas fa-hands-helping',
    'Гражданско-патриотическое':  'fas fa-flag',
    'Патриотическое':             'fas fa-flag',
    'Культурное':                 'fas fa-theater-masks',
    'Спортивное':                 'fas fa-running',
    'Зооволонтерство':            'fas fa-paw',
    'Медицинское':                'fas fa-stethoscope',
    'Благотворительное':          'fas fa-heart',
    'Образовательное':            'fas fa-graduation-cap',
    'Духовно-нравственное':       'fas fa-dove',
    'ЗОЖ':                        'fas fa-heartbeat',
    'Спортивно-оздоровительное':  'fas fa-dumbbell',
    'Событийное':                 'fas fa-calendar-alt',
    'Благоустройство':            'fas fa-hammer',
    'Просветительское':           'fas fa-book-open',
    'Агроволонтерство':           'fas fa-seedling',
    'Инклюзивное':                'fas fa-universal-access',
    'Гуманитарное':               'fas fa-box-open',
};

function directionIcon(dir: string): string {
    for (const [key, icon] of Object.entries(DIRECTION_ICON)) {
        if (dir.toLowerCase().includes(key.toLowerCase())) return icon;
    }
    return 'fas fa-star';
}

// ─── Page ────────────────────────────────────────────────────────────────────
export function OrganizationDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const org = ORGS.find(o => o.id === id);

    if (!org) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-4">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-search text-4xl text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Организация не найдена</h2>
                <p className="text-gray-500 max-w-sm">
                    Возможно, она была удалена или ссылка устарела.
                </p>
                <Link
                    to="/organizations"
                    className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition"
                >
                    <i className="fas fa-arrow-left mr-2" />
                    Вернуться к списку
                </Link>
            </div>
        );
    }

    // collect all unique directions across movements
    const allDirections = Array.from(
        new Set(org.movements.flatMap(m => m.directions))
    );

    return (
        <>
            {/* ── BREADCRUMB ── */}
            <div className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <nav className="flex items-center gap-2 text-sm text-gray-500">
                        <Link to="/" className="hover:text-primary transition">Главная</Link>
                        <i className="fas fa-chevron-right text-xs text-gray-300" />
                        <Link to="/organizations" className="hover:text-primary transition">Организации</Link>
                        <i className="fas fa-chevron-right text-xs text-gray-300" />
                        <span className="text-gray-700 font-medium truncate max-w-[200px]">{org.shortName}</span>
                    </nav>
                </div>
            </div>

            {/* ── HERO ── */}
            <section className="relative bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50 overflow-hidden">
                {org.bgImg && (
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-5"
                        style={{ backgroundImage: `url('${org.bgImg}')` }}
                    />
                )}
                {/* decorative blobs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full -mr-48 -mt-48 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-300/20 rounded-full -ml-32 -mb-32 blur-2xl pointer-events-none" />

                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 relative z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition mb-8 group"
                    >
            <span className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:shadow-md transition">
              <i className="fas fa-arrow-left text-xs" />
            </span>
                        Назад к списку
                    </button>

                    <div className="flex flex-col lg:flex-row gap-10 items-start">
                        {/* logo box */}
                        <div className="flex-shrink-0">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-gray-100">
                                <i className={`${org.icon} text-5xl sm:text-6xl ${org.iconColor}`} />
                            </div>
                        </div>

                        {/* title block */}
                        <div className="flex-1 min-w-0">
                            {/* level badge */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-xs font-semibold text-gray-600 shadow-sm">
                  <i className={`${LEVEL_ICON[org.level]} text-primary`} />
                    {LEVEL_LABEL[org.level]}
                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-xs font-semibold text-gray-600 shadow-sm">
                  <i className="fas fa-map-marker-alt text-primary" />
                                    {org.city}
                </span>
                            </div>

                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-gray-900 leading-tight mb-3">
                                {org.name}
                            </h1>

                            <p className="text-base sm:text-lg text-gray-600 mb-5 max-w-2xl leading-relaxed">
                                {org.description}
                            </p>

                            {/* category badges */}
                            <div className="flex flex-wrap gap-2">
                                {org.categories.map(c => (
                                    <span
                                        key={c}
                                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${CAT_BADGE[c as OrgCategory]}`}
                                    >
                    {CAT_BADGE_LABEL[c as OrgCategory]}
                  </span>
                                ))}
                            </div>
                        </div>

                        {/* stats panel */}
                        <div className="flex-shrink-0 w-full lg:w-auto">
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex gap-8 lg:flex-col lg:gap-4 lg:min-w-[160px]">
                                {org.stats.map(s => (
                                    <div key={s.label} className="text-center">
                                        <div className="text-3xl font-extrabold text-primary leading-none">{s.value}</div>
                                        <div className="text-xs text-gray-500 mt-1 font-medium">{s.label}</div>
                                    </div>
                                ))}
                                <div className="text-center">
                                    <div className="text-3xl font-extrabold text-primary leading-none">{allDirections.length}</div>
                                    <div className="text-xs text-gray-500 mt-1 font-medium">Направлений</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── MAIN CONTENT ── */}
            <section className="py-14 sm:py-20 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-3 gap-10">

                        {/* LEFT: movements ─────────────────────────── */}
                        <div className="lg:col-span-2 space-y-6">
                            <h2 className="text-2xl font-heading font-bold text-gray-900 flex items-center gap-3">
                <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-users text-primary text-sm" />
                </span>
                                Волонтёрские движения
                            </h2>

                            {org.movements.map((mv, i) => (
                                <article
                                    key={i}
                                    className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden hover:border-primary/30 hover:shadow-md transition-all duration-200"
                                >
                                    {/* movement header */}
                                    <div className="bg-gradient-to-r from-primary/5 to-teal-50 px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Движение</p>
                                            <h3 className="text-lg font-bold text-gray-900">{mv.name}</h3>
                                        </div>
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
                                            <i className="fas fa-hands-helping text-primary" />
                                        </div>
                                    </div>

                                    <div className="px-6 py-5 space-y-5">
                                        {/* directions */}
                                        <div>
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Направления</p>
                                            <div className="flex flex-wrap gap-2">
                                                {mv.directions.map(d => (
                                                    <span
                                                        key={d}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-medium shadow-sm"
                                                    >
                            <i className={`${directionIcon(d)} text-primary text-xs`} />
                                                        {d}
                          </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* leader + contacts */}
                                        <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                                            {/* leader */}
                                            <div className="flex items-start gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <i className="fas fa-user-tie text-indigo-500 text-sm" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Руководитель</p>
                                                    <p className="text-sm text-gray-800 font-medium mt-0.5 leading-snug">{mv.leader}</p>
                                                </div>
                                            </div>

                                            {/* phone + email */}
                                            <div className="space-y-2">
                                                {mv.phone && (
                                                    <a
                                                        href={`tel:${mv.phone.replace(/\s/g, '')}`}
                                                        className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-primary transition group"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition">
                                                            <i className="fas fa-phone text-green-600 text-xs" />
                                                        </div>
                                                        <span className="font-medium">{mv.phone}</span>
                                                    </a>
                                                )}
                                                {mv.email && (
                                                    <a
                                                        href={`mailto:${mv.email}`}
                                                        className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-primary transition group"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition">
                                                            <i className="fas fa-envelope text-blue-600 text-xs" />
                                                        </div>
                                                        <span className="font-medium truncate">{mv.email}</span>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {/* RIGHT: sidebar ──────────────────────────── */}
                        <div className="space-y-6">

                            {/* location card */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                                    <i className="fas fa-map-marker-alt text-primary" />
                                    <h3 className="font-bold text-gray-800">Местонахождение</h3>
                                </div>
                                <div className="p-5 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                                            <i className="fas fa-city text-teal-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-medium">Город / район</p>
                                            <p className="text-sm font-semibold text-gray-800">{org.city}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                            <i className={`${LEVEL_ICON[org.level]} text-indigo-600`} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-medium">Тип учреждения</p>
                                            <p className="text-sm font-semibold text-gray-800">{LEVEL_LABEL[org.level]}</p>
                                        </div>
                                    </div>
                                    {/* mini map placeholder */}
                                    <div className="mt-2 rounded-xl overflow-hidden bg-gradient-to-br from-teal-100 to-blue-100 h-32 flex items-center justify-center border border-gray-100">
                                        <div className="text-center">
                                            <i className="fas fa-map-marked-alt text-3xl text-teal-400 mb-1" />
                                            <p className="text-xs text-teal-600 font-medium">{org.city}, ПМР</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* all directions card */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                                    <i className="fas fa-compass text-primary" />
                                    <h3 className="font-bold text-gray-800">Направления деятельности</h3>
                                </div>
                                <ul className="divide-y divide-gray-50">
                                    {allDirections.map(d => (
                                        <li key={d} className="px-5 py-3 flex items-center gap-3">
                                            <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
                                                <i className={`${directionIcon(d)} text-primary text-xs`} />
                                            </div>
                                            <span className="text-sm text-gray-700">{d}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* join CTA */}
                            <div className="bg-gradient-to-br from-primary to-teal-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                                <div className="relative z-10">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                                        <i className="fas fa-user-plus text-white text-xl" />
                                    </div>
                                    <h3 className="text-lg font-bold mb-2">Вступить в команду</h3>
                                    <p className="text-sm text-blue-100 mb-4 leading-relaxed">
                                        Станьте частью волонтёрского движения и помогайте другим вместе с нами.
                                    </p>
                                    <button className="w-full px-4 py-3 bg-white text-primary font-bold rounded-xl hover:bg-blue-50 transition shadow text-sm">
                                        <i className="fas fa-paper-plane mr-2" />
                                        Отправить заявку
                                    </button>
                                </div>
                            </div>

                            {/* back link */}
                            <Link
                                to="/organizations"
                                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition text-sm"
                            >
                                <i className="fas fa-th-large" />
                                Все организации
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}