import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Modal } from '../../components/Modal';
import type { OrganizationSummary } from '../../types/organization';
import { videoLinksApi } from '../../api/VideoLink.ts';
import { adminErrorMessage } from '../../utils/adminErrors';
import { PhotoField, stagePhoto, type PhotoSelection } from '../../components/PhotoField';
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
    onSubmit: (f: FormState, cover: PhotoSelection | null) => void;
    /** Обложка, уже сохранённая на сервере (при редактировании). */
    existingCoverUrl?: string | null;
    existingCoverCrop?: VideoLinkResponseDto['coverCrop'];
}

function VideoModal({ mode, initial, saving, error, onClose, onSubmit, existingCoverUrl, existingCoverCrop }: ModalProps) {
    const [form, setForm] = useState<FormState>(initial);
    const [cover, setCover] = useState<PhotoSelection | null>(null);
    const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm(p => ({ ...p, [k]: e.target.value }));

    useEffect(() => { setForm(initial); setCover(null); }, [initial]);

    const previewThumb = isYoutube(form.url)
        ? (() => {
            const m = form.url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
            return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
        })()
        : null;

    return (
        <Modal isOpen onClose={() => { if (!saving) onClose(); }} title={mode === 'create' ? 'Добавить видео' : 'Редактировать видео'} maxWidth="max-w-lg">
                {/* Body */}
                <div className="space-y-4">
                    {error && (
                        <div className="px-4 py-3 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* URL + preview */}
                    <div>
                        <label className="block text-xs font-semibold text-ink-500 uppercase tracking-widest mb-1.5">
                            Ссылка на видео *
                        </label>
                        <input
                            type="url"
                            value={form.url}
                            onChange={set('url')}
                            placeholder="https://youtube.com/watch?v=..."
                            className="w-full bg-surface-2 border border-line rounded-xl px-4 py-2.5 text-ink-900 text-sm placeholder:text-ink-300 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300 transition"
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
                            <p className="mt-1.5 text-xs text-ink-400">
                                Превью доступно только для YouTube-ссылок
                            </p>
                        )}
                    </div>

                    {/* Cover: для видео, которые нельзя показать на сайте (VK, TikTok, Reels…) */}
                    <PhotoField
                        purpose="video"
                        label="Обложка видео"
                        selection={cover}
                        onChange={setCover}
                        existingUrl={existingCoverUrl}
                        existingCrop={existingCoverCrop ?? null}
                        disabled={saving}
                        hint="Нужна для ссылок VK, TikTok, Reels и других, у которых нет автоматического превью. У YouTube можно не загружать."
                    />

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-semibold text-ink-500 uppercase tracking-widest mb-1.5">
                            Название *
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={set('title')}
                            maxLength={200}
                            placeholder="Название видео"
                            className="w-full bg-surface-2 border border-line rounded-xl px-4 py-2.5 text-ink-900 text-sm placeholder:text-ink-300 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300 transition"
                        />
                        <span className="text-[11px] text-ink-300 mt-1 block text-right">
                            {form.title.length}/200
                        </span>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold text-ink-500 uppercase tracking-widest mb-1.5">
                            Описание
                        </label>
                        <textarea
                            value={form.description}
                            onChange={set('description')}
                            maxLength={1000}
                            rows={3}
                            placeholder="Краткое описание видео..."
                            className="w-full bg-surface-2 border border-line rounded-xl px-4 py-2.5 text-ink-900 text-sm placeholder:text-ink-300 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300 transition resize-none"
                        />
                        <span className="text-[11px] text-ink-300 mt-1 block text-right">
                            {form.description.length}/1000
                        </span>
                    </div>

                    {/* Sort order */}
                    <div>
                        <label className="block text-xs font-semibold text-ink-500 uppercase tracking-widest mb-1.5">
                            Порядок отображения
                        </label>
                        <input
                            type="number"
                            min={0}
                            value={form.sortOrder}
                            onChange={set('sortOrder')}
                            className="w-28 bg-surface-2 border border-line rounded-xl px-4 py-2.5 text-ink-900 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300 transition"
                        />
                        <p className="text-[11px] text-ink-400 mt-1">
                            Меньше — выше в списке
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-line">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2 text-sm text-ink-500 hover:text-ink-900 hover:bg-surface-2 rounded-xl transition disabled:opacity-40"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={() => onSubmit(form, cover)}
                        disabled={saving || !form.title.trim() || !form.url.trim()}
                        className="btn btn-primary"
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
        </Modal>
    );
}

// ── Delete confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({
    video,
    saving,
    error,
    onClose,
    onConfirm,
}: {
    video: VideoLinkResponseDto;
    saving: boolean;
    error: string | null;
    onClose: () => void;
    onConfirm: () => void;
}) {
    return (
        <Modal isOpen onClose={() => { if (!saving) onClose(); }} title="Удалить видео?" maxWidth="max-w-sm">
            <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-danger-50 flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-trash-alt text-danger-700 text-lg" />
                </div>
                <p className="text-ink-500 text-sm mb-6 leading-relaxed">
                    «{video.title}» будет удалено без возможности восстановления.
                </p>
                {error && <p role="alert" className="text-danger-700 text-sm mb-4">{error}</p>}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 py-2.5 text-sm text-ink-500 hover:text-ink-900 border border-line hover:border-line rounded-xl transition"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={saving}
                        className="flex-1 py-2.5 text-sm text-white font-semibold bg-danger-600 hover:bg-danger-700 rounded-xl transition disabled:opacity-40 flex items-center justify-center gap-2"
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
        </Modal>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type ModalMode = 'none' | 'create' | 'edit' | 'delete';

/**
 * Видеоотчёты. Администратор управляет всеми видео. В кабинете организатора страница получает `organizations`:
 * видна и меняется только своя организация, а новое видео публикуется от её имени.
 */
export function AdminVideoLinksPage({ organizations }: { organizations?: OrganizationSummary[] } = {}) {
    const scoped = organizations !== undefined;
    const [orgId, setOrgId] = useState(organizations?.[0]?.id ?? '');
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

    const loadSeq = useRef(0);
    const load = useCallback(async (s = 0) => {
        const seq = ++loadSeq.current;
        setLoading(true);
        setPageError(null);
        try {
            const res = await videoLinksApi.getAll(s, TAKE, scoped ? orgId : undefined);
            if (seq !== loadSeq.current) return;
            setItems(res.items);
            setTotal(res.totalCount);
        } catch (e) {
            if (seq === loadSeq.current) setPageError((e as Error).message);
        } finally {
            if (seq === loadSeq.current) setLoading(false);
        }
    }, [scoped, orgId]);

    useEffect(() => { if (!scoped || orgId) load(skip); }, [load, skip, scoped, orgId]);

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
        setSaveError(null);
        setModalMode('delete');
    }

    function closeModal() {
        setModalMode('none');
        setSelected(null);
        setSaveError(null);
    }

    // ── Actions ────────────────────────────────────────────────────────────

    async function handleSubmit(form: FormState, cover: PhotoSelection | null) {
        setSaving(true);
        setSaveError(null);
        try {
            if (modalMode === 'create') {
                const dto: CreateVideoLinkDto = {
                    title: form.title.trim(),
                    description: form.description.trim() || null,
                    url: form.url.trim(),
                    sortOrder: Number(form.sortOrder) || 0,
                    ...(scoped && { organizationId: orgId }),
                };
                // Обложка загружается заранее и привязывается при создании.
                const staged = await stagePhoto(cover);
                await videoLinksApi.create({ ...dto, ...(staged && { coverImageId: staged.imageId, coverCrop: staged.crop }) });
            } else if (modalMode === 'edit' && selected) {
                const dto: UpdateVideoLinkDto = {
                    title: form.title.trim(),
                    description: form.description.trim() || null,
                    url: form.url.trim(),
                    sortOrder: Number(form.sortOrder) || 0,
                };
                const staged = await stagePhoto(cover);
                await videoLinksApi.update(selected.id, {
                    ...dto,
                    ...(staged && { coverImageId: staged.imageId, coverCrop: staged.crop }),
                    ...(!staged && cover?.removed && { removeCover: true }),
                    // только область показа у уже загруженной обложки
                    ...(!staged && !cover?.removed && cover?.crop && selected.hasCustomCover && { coverCrop: cover.crop }),
                });
            }
            closeModal();
            await load(skip);
        } catch (e) {
            setSaveError(adminErrorMessage(e, 'Не удалось сохранить изменения. Попробуйте ещё раз.'));
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
            // If last item on page, go back (the skip effect reloads); otherwise reload in place
            if (items.length === 1 && skip > 0) setSkip(skip - TAKE);
            else await load(skip);
        } catch (e) {
            setSaveError(adminErrorMessage(e, 'Не удалось сохранить изменения. Попробуйте ещё раз.'));
        } finally {
            setSaving(false);
        }
    }

    const totalPages = Math.ceil(total / TAKE);
    const currentPage = Math.floor(skip / TAKE) + 1;

    // ── Render ─────────────────────────────────────────────────────────────

    return (
        <div className="text-ink-900">
            <div>

                {/* Page header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center">
                                <i className="fas fa-film text-brand-700 text-sm" />
                            </div>
                            <h1 className="page-title">Видеоотчёты</h1>
                        </div>
                        <p className="text-ink-400 text-sm ml-12">
                            {scoped ? 'Видео вашей организации: они появятся на странице «Видео» и на главной' : 'Управление видеоматериалами на главной странице и на странице «Видео»'}
                        </p>
                    </div>
                    <button
                        onClick={openCreate}
                        disabled={scoped && !orgId}
                        className="btn btn-primary"
                    >
                        <i className="fas fa-plus text-xs" />
                        Добавить видео
                    </button>
                </div>

                {scoped && organizations.length > 1 && (
                    <select value={orgId} onChange={e => { setSkip(0); setOrgId(e.target.value); }} aria-label="Организация" className="mb-5 px-3 py-2 text-sm">
                        {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                )}

                {/* Error banner */}
                {pageError && (
                    <div className="mb-6 px-4 py-3 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-sm flex items-center gap-3">
                        <i className="fas fa-exclamation-circle flex-shrink-0" />
                        {pageError}
                        <button
                            onClick={() => load(skip)}
                            className="ml-auto text-danger-600/70 hover:text-danger-700 transition text-xs underline"
                        >
                            Повторить
                        </button>
                    </div>
                )}

                {/* Stats bar */}
                <div className="flex items-center gap-4 mb-5 text-sm text-ink-400">
                    <span>
                        Всего:{' '}
                        <span className="text-ink-700 font-semibold">{total}</span>
                    </span>
                    {total > 0 && (
                        <span>
                            Страница{' '}
                            <span className="text-ink-700">{currentPage}</span>
                            {' '}из{' '}
                            <span className="text-ink-700">{totalPages}</span>
                        </span>
                    )}
                </div>

                {/* Table */}
                <div className="rounded-2xl border border-line overflow-hidden bg-surface">
                    {loading ? (
                        <div className="flex items-center justify-center py-20 gap-3 text-ink-400">
                            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                            <span className="text-sm">Загрузка...</span>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center">
                                <i className="fas fa-film text-ink-300 text-2xl" />
                            </div>
                            <div>
                                <p className="text-ink-500 font-medium mb-1">Нет видеоматериалов</p>
                                <p className="text-ink-300 text-sm">Добавьте первое видео</p>
                            </div>
                            <button
                                onClick={openCreate}
                                className="mt-2 px-5 py-2 bg-brand-100 hover:bg-brand-200 text-brand-700 text-sm font-semibold rounded-xl transition"
                            >
                                <i className="fas fa-plus mr-2 text-xs" />Добавить видео
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Table header */}
                            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-line bg-surface-2">
                                <span className="text-[11px] font-bold uppercase tracking-widest text-ink-400 w-14">Превью</span>
                                <span className="text-[11px] font-bold uppercase tracking-widest text-ink-400">Видео</span>
                                <span className="text-[11px] font-bold uppercase tracking-widest text-ink-400 text-center w-16">Порядок</span>
                                <span className="text-[11px] font-bold uppercase tracking-widest text-ink-400 w-24">Добавлено</span>
                                <span className="text-[11px] font-bold uppercase tracking-widest text-ink-400 w-20 text-right">Действия</span>
                            </div>

                            {/* Rows */}
                            {items.map(v => (
                                <div
                                    key={v.id}
                                    className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-4 border-b border-line last:border-b-0 hover:bg-surface-2 transition items-center group"
                                >
                                    {/* Thumbnail */}
                                    <div className="w-14 h-10 rounded-lg overflow-hidden bg-surface-2 flex-shrink-0">
                                        {v.thumbnailUrl ? (
                                            <img
                                                src={v.thumbnailUrl}
                                                alt={v.title}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <i className="fas fa-play text-ink-300 text-xs" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Title + meta */}
                                    <div className="min-w-0">
                                        <p className="text-ink-700 text-sm font-semibold truncate leading-snug">
                                            {v.title}
                                        </p>
                                        {v.organizationName && (
                                            <p className="text-ink-400 text-[11px] truncate mt-0.5"><i className="fas fa-building-columns mr-1" aria-hidden />{v.organizationName}</p>
                                        )}
                                        {v.description && (
                                            <p className="text-ink-400 text-xs truncate mt-0.5 leading-snug">
                                                {v.description}
                                            </p>
                                        )}
                                        <a
                                            href={v.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-brand-500 hover:text-brand-700 text-[11px] truncate block mt-0.5 transition leading-snug max-w-xs"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            {v.url.replace(/^https?:\/\//, '')}
                                        </a>
                                    </div>

                                    {/* Sort order */}
                                    <div className="w-16 text-center">
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-surface-2 text-ink-500 text-sm font-mono font-bold">
                                            {v.sortOrder}
                                        </span>
                                    </div>

                                    {/* Date + author */}
                                    <div className="w-24 text-right">
                                        <p className="text-ink-500 text-xs">{fmtDate(v.createdAt)}</p>
                                        {v.createdByUserFullName && (
                                            <p className="text-ink-300 text-[11px] truncate mt-0.5">
                                                {v.createdByUserFullName}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="w-20 flex items-center justify-end gap-1.5">
                                        <button
                                            onClick={() => openEdit(v)}
                                            title="Редактировать"
                                            className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-400 hover:text-ink-900 hover:bg-surface-3 transition"
                                        >
                                            <i className="fas fa-pen text-xs" />
                                        </button>
                                        <button
                                            onClick={() => openDelete(v)}
                                            title="Удалить"
                                            className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-400 hover:text-danger-700 hover:bg-danger-50 transition"
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
                            className="px-4 py-2 text-sm text-ink-500 hover:text-ink-900 border border-line hover:border-line rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
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
                                                    ? 'bg-brand-600 text-white'
                                                    : 'text-ink-500 hover:text-ink-900 hover:bg-surface-2'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                }
                                if (Math.abs(page - currentPage) === 2 && totalPages > 7) {
                                    return (
                                        <span key={i} className="text-ink-300 px-1">…</span>
                                    );
                                }
                                return null;
                            })}
                        </div>

                        <button
                            disabled={skip + TAKE >= total}
                            onClick={() => setSkip(s => s + TAKE)}
                            className="px-4 py-2 text-sm text-ink-500 hover:text-ink-900 border border-line hover:border-line rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
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
                    existingCoverUrl={modalMode === 'edit' && selected?.hasCustomCover ? selected.thumbnailUrl : null}
                    existingCoverCrop={modalMode === 'edit' ? selected?.coverCrop : null}
                />
            )}

            {modalMode === 'delete' && selected && (
                <DeleteConfirm
                    video={selected}
                    saving={saving}
                    error={saveError}
                    onClose={closeModal}
                    onConfirm={handleDelete}
                />
            )}
        </div>
    );
}