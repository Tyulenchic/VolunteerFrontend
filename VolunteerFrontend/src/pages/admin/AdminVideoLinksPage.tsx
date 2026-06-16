import React, { useEffect, useState, useCallback } from 'react';
import { videoLinksApi } from '../../api/VideoLink.ts';
import type {
    VideoLinkResponseDto,
    CreateVideoLinkDto,
    UpdateVideoLinkDto,
} from '../../types/VideoLink';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function isYoutube(url: string) {
    return /youtube\.com|youtu\.be/.test(url);
}

// ── Form state ────────────────────────────────────────────────────────────────

interface FormState {
    title: string;
    description: string;
    url: string;
    sortOrder: string;
}

const EMPTY_FORM: FormState = { title: '', description: '', url: '', sortOrder: '0' };

function formFromDto(v: VideoLinkResponseDto): FormState {
    return {
        title: v.title,
        description: v.description ?? '',
        url: v.url,
        sortOrder: String(v.sortOrder),
    };
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface ModalProps {
    mode: 'create' | 'edit';
    initial: FormState;
    saving: boolean;
    error: string | null;
    onClose: () => void;
    onSubmit: (f: FormState) => void;
}

function VideoModal({ mode, initial, saving, error, onClose, onSubmit }: ModalProps) {
    const [form, setForm] = useState<FormState>(initial);
    const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm(p => ({ ...p, [k]: e.target.value }));

    useEffect(() => { setForm(initial); }, [initial]);

    const previewThumb = isYoutube(form.url)
        ? (() => {
            const m = form.url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
            return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
        })()
        : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative z-10 w-full max-w-lg rounded-2xl bg-[#161b27] border border-white/10 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <h2 className="text-white font-bold text-base">
                        {mode === 'create' ? 'Добавить видео' : 'Редактировать видео'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
                    >
                        <i className="fas fa-times text-sm" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {error && (
                        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* URL + preview */}
                    <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                            Ссылка на видео *
                        </label>
                        <input
                            type="url"
                            value={form.url}
                            onChange={set('url')}
                            placeholder="https://youtube.com/watch?v=..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#3BB34A]/60 focus:ring-1 focus:ring-[#3BB34A]/30 transition"
                        />
                        {previewThumb && (
                            <div className="mt-2 rounded-xl overflow-hidden aspect-video w-full max-h-40 bg-black">
                                <img
                                    src={previewThumb}
                                    alt="превью"
                                    className="w-full h-full object-cover opacity-80"
                                />
                            </div>
                        )}
                        {form.url && !previewThumb && (
                            <p className="mt-1.5 text-xs text-white/30">
                                Превью доступно только для YouTube-ссылок
                            </p>
                        )}
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                            Название *
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={set('title')}
                            maxLength={200}
                            placeholder="Название видео"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#3BB34A]/60 focus:ring-1 focus:ring-[#3BB34A]/30 transition"
                        />
                        <span className="text-[11px] text-white/20 mt-1 block text-right">
                            {form.title.length}/200
                        </span>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                            Описание
                        </label>
                        <textarea
                            value={form.description}
                            onChange={set('description')}
                            maxLength={1000}
                            rows={3}
                            placeholder="Краткое описание видео..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#3BB34A]/60 focus:ring-1 focus:ring-[#3BB34A]/30 transition resize-none"
                        />
                        <span className="text-[11px] text-white/20 mt-1 block text-right">
                            {form.description.length}/1000
                        </span>
                    </div>

                    {/* Sort order */}
                    <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                            Порядок отображения
                        </label>
                        <input
                            type="number"
                            min={0}
                            value={form.sortOrder}
                            onChange={set('sortOrder')}
                            className="w-28 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#3BB34A]/60 focus:ring-1 focus:ring-[#3BB34A]/30 transition"
                        />
                        <p className="text-[11px] text-white/25 mt-1">
                            Меньше — выше в списке
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2 text-sm text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition disabled:opacity-40"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={() => onSubmit(form)}
                        disabled={saving || !form.title.trim() || !form.url.trim()}
                        className="px-5 py-2 bg-[#3BB34A] hover:bg-[#34a343] text-white text-sm font-semibold rounded-xl transition disabled:opacity-40 flex items-center gap-2"
                    >
                        {saving && (
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                        )}
                        {mode === 'create' ? 'Добавить' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Delete confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({
    video,
    saving,
    onClose,
    onConfirm,
}: {
    video: VideoLinkResponseDto;
    saving: boolean;
    onClose: () => void;
    onConfirm: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-sm rounded-2xl bg-[#161b27] border border-white/10 shadow-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-trash-alt text-red-400 text-lg" />
                </div>
                <h3 className="text-white font-bold mb-2">Удалить видео?</h3>
                <p className="text-white/40 text-sm mb-6 leading-relaxed">
                    «{video.title}» будет удалено без возможности восстановления.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 py-2.5 text-sm text-white/50 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={saving}
                        className="flex-1 py-2.5 text-sm text-white font-semibold bg-red-500 hover:bg-red-600 rounded-xl transition disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                        {saving && (
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                        )}
                        Удалить
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type ModalMode = 'none' | 'create' | 'edit' | 'delete';

export function AdminVideoLinksPage() {
    const [items, setItems] = useState<VideoLinkResponseDto[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState<string | null>(null);

    const [skip, setSkip] = useState(0);
    const TAKE = 20;

    const [modalMode, setModalMode] = useState<ModalMode>('none');
    const [selected, setSelected] = useState<VideoLinkResponseDto | null>(null);
    const [formInitial, setFormInitial] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const load = useCallback(async (s = 0) => {
        setLoading(true);
        setPageError(null);
        try {
            const res = await videoLinksApi.getAll(s, TAKE);
            setItems(res.items);
            setTotal(res.totalCount);
        } catch (e) {
            setPageError((e as Error).message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(skip); }, [load, skip]);

    // ── Open modals ────────────────────────────────────────────────────────

    function openCreate() {
        setFormInitial(EMPTY_FORM);
        setSaveError(null);
        setModalMode('create');
    }

    function openEdit(v: VideoLinkResponseDto) {
        setSelected(v);
        setFormInitial(formFromDto(v));
        setSaveError(null);
        setModalMode('edit');
    }

    function openDelete(v: VideoLinkResponseDto) {
        setSelected(v);
        setModalMode('delete');
    }

    function closeModal() {
        setModalMode('none');
        setSelected(null);
        setSaveError(null);
    }

    // ── Actions ────────────────────────────────────────────────────────────

    async function handleSubmit(form: FormState) {
        setSaving(true);
        setSaveError(null);
        try {
            if (modalMode === 'create') {
                const dto: CreateVideoLinkDto = {
                    title: form.title.trim(),
                    description: form.description.trim() || null,
                    url: form.url.trim(),
                    sortOrder: Number(form.sortOrder) || 0,
                };
                await videoLinksApi.create(dto);
            } else if (modalMode === 'edit' && selected) {
                const dto: UpdateVideoLinkDto = {
                    title: form.title.trim(),
                    description: form.description.trim() || null,
                    url: form.url.trim(),
                    sortOrder: Number(form.sortOrder) || 0,
                };
                await videoLinksApi.update(selected.id, dto);
            }
            closeModal();
            await load(skip);
        } catch (e) {
            setSaveError((e as Error).message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!selected) return;
        setSaving(true);
        try {
            await videoLinksApi.delete(selected.id);
            closeModal();
            // If last item on page, go back
            const newSkip = items.length === 1 && skip > 0 ? skip - TAKE : skip;
            setSkip(newSkip);
            await load(newSkip);
        } catch (e) {
            setSaveError((e as Error).message);
        } finally {
            setSaving(false);
        }
    }

    const totalPages = Math.ceil(total / TAKE);
    const currentPage = Math.floor(skip / TAKE) + 1;

    // ── Render ─────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-[#0f1117] text-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Page header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-9 h-9 rounded-xl bg-[#3BB34A]/15 flex items-center justify-center">
                                <i className="fas fa-film text-[#3BB34A] text-sm" />
                            </div>
                            <h1 className="text-xl font-bold text-white">Видеоотчёты</h1>
                        </div>
                        <p className="text-white/30 text-sm ml-12">
                            Управление видеоматериалами на главной странице
                        </p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3BB34A] hover:bg-[#34a343] text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-[#3BB34A]/20"
                    >
                        <i className="fas fa-plus text-xs" />
                        Добавить видео
                    </button>
                </div>

                {/* Error banner */}
                {pageError && (
                    <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
                        <i className="fas fa-exclamation-circle flex-shrink-0" />
                        {pageError}
                        <button
                            onClick={() => load(skip)}
                            className="ml-auto text-red-400/60 hover:text-red-400 transition text-xs underline"
                        >
                            Повторить
                        </button>
                    </div>
                )}

                {/* Stats bar */}
                <div className="flex items-center gap-4 mb-5 text-sm text-white/30">
                    <span>
                        Всего:{' '}
                        <span className="text-white/70 font-semibold">{total}</span>
                    </span>
                    {total > 0 && (
                        <span>
                            Страница{' '}
                            <span className="text-white/70">{currentPage}</span>
                            {' '}из{' '}
                            <span className="text-white/70">{totalPages}</span>
                        </span>
                    )}
                </div>

                {/* Table */}
                <div className="rounded-2xl border border-white/8 overflow-hidden bg-[#13181f]">
                    {loading ? (
                        <div className="flex items-center justify-center py-20 gap-3 text-white/30">
                            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                            <span className="text-sm">Загрузка...</span>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
                                <i className="fas fa-film text-white/20 text-2xl" />
                            </div>
                            <div>
                                <p className="text-white/40 font-medium mb-1">Нет видеоматериалов</p>
                                <p className="text-white/20 text-sm">Добавьте первое видео</p>
                            </div>
                            <button
                                onClick={openCreate}
                                className="mt-2 px-5 py-2 bg-[#3BB34A]/15 hover:bg-[#3BB34A]/25 text-[#3BB34A] text-sm font-semibold rounded-xl transition"
                            >
                                <i className="fas fa-plus mr-2 text-xs" />Добавить видео
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Table header */}
                            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/8 bg-white/2">
                                <span className="text-[11px] font-bold uppercase tracking-widest text-white/25 w-14">Превью</span>
                                <span className="text-[11px] font-bold uppercase tracking-widest text-white/25">Видео</span>
                                <span className="text-[11px] font-bold uppercase tracking-widest text-white/25 text-center w-16">Порядок</span>
                                <span className="text-[11px] font-bold uppercase tracking-widest text-white/25 w-24">Добавлено</span>
                                <span className="text-[11px] font-bold uppercase tracking-widest text-white/25 w-20 text-right">Действия</span>
                            </div>

                            {/* Rows */}
                            {items.map(v => (
                                <div
                                    key={v.id}
                                    className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-4 border-b border-white/5 last:border-b-0 hover:bg-white/2 transition items-center group"
                                >
                                    {/* Thumbnail */}
                                    <div className="w-14 h-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                                        {v.thumbnailUrl ? (
                                            <img
                                                src={v.thumbnailUrl}
                                                alt={v.title}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <i className="fas fa-play text-white/20 text-xs" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Title + meta */}
                                    <div className="min-w-0">
                                        <p className="text-white/90 text-sm font-semibold truncate leading-snug">
                                            {v.title}
                                        </p>
                                        {v.description && (
                                            <p className="text-white/30 text-xs truncate mt-0.5 leading-snug">
                                                {v.description}
                                            </p>
                                        )}
                                        <a
                                            href={v.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[#3BB34A]/60 hover:text-[#3BB34A] text-[11px] truncate block mt-0.5 transition leading-snug max-w-xs"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            {v.url.replace(/^https?:\/\//, '')}
                                        </a>
                                    </div>

                                    {/* Sort order */}
                                    <div className="w-16 text-center">
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white/5 text-white/50 text-sm font-mono font-bold">
                                            {v.sortOrder}
                                        </span>
                                    </div>

                                    {/* Date + author */}
                                    <div className="w-24 text-right">
                                        <p className="text-white/40 text-xs">{fmtDate(v.createdAt)}</p>
                                        {v.createdByUserFullName && (
                                            <p className="text-white/20 text-[11px] truncate mt-0.5">
                                                {v.createdByUserFullName}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="w-20 flex items-center justify-end gap-1.5">
                                        <button
                                            onClick={() => openEdit(v)}
                                            title="Редактировать"
                                            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition"
                                        >
                                            <i className="fas fa-pen text-xs" />
                                        </button>
                                        <button
                                            onClick={() => openDelete(v)}
                                            title="Удалить"
                                            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition"
                                        >
                                            <i className="fas fa-trash-alt text-xs" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-5">
                        <button
                            disabled={skip === 0}
                            onClick={() => setSkip(s => Math.max(0, s - TAKE))}
                            className="px-4 py-2 text-sm text-white/50 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <i className="fas fa-chevron-left text-xs" />
                            Назад
                        </button>

                        <div className="flex items-center gap-1.5">
                            {Array.from({ length: totalPages }, (_, i) => i).map(i => {
                                const page = i + 1;
                                const active = page === currentPage;
                                if (
                                    totalPages <= 7 ||
                                    page === 1 ||
                                    page === totalPages ||
                                    Math.abs(page - currentPage) <= 1
                                ) {
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setSkip(i * TAKE)}
                                            className={`w-8 h-8 flex items-center justify-center rounded-xl text-sm font-semibold transition ${
                                                active
                                                    ? 'bg-[#3BB34A] text-white'
                                                    : 'text-white/40 hover:text-white hover:bg-white/5'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                }
                                if (Math.abs(page - currentPage) === 2 && totalPages > 7) {
                                    return (
                                        <span key={i} className="text-white/20 px-1">…</span>
                                    );
                                }
                                return null;
                            })}
                        </div>

                        <button
                            disabled={skip + TAKE >= total}
                            onClick={() => setSkip(s => s + TAKE)}
                            className="px-4 py-2 text-sm text-white/50 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            Вперёд
                            <i className="fas fa-chevron-right text-xs" />
                        </button>
                    </div>
                )}
            </div>

            {/* Modals */}
            {(modalMode === 'create' || modalMode === 'edit') && (
                <VideoModal
                    mode={modalMode}
                    initial={formInitial}
                    saving={saving}
                    error={saveError}
                    onClose={closeModal}
                    onSubmit={handleSubmit}
                />
            )}

            {modalMode === 'delete' && selected && (
                <DeleteConfirm
                    video={selected}
                    saving={saving}
                    onClose={closeModal}
                    onConfirm={handleDelete}
                />
            )}
        </div>
    );
}