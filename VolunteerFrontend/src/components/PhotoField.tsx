import { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal';
import { useAdminScope } from './ui/AdminScope';
import { Button } from './ui/Button';
import { useSecureSrc } from './SecureImage';
import {
  CroppedImage, ImageCropper, PURPOSES, defaultRect, fromApiCrop, readAndCheck, toApiCrop,
  type CropRect, type ImagePurpose,
} from './ImageCropper';
import { imagesApi } from '../api/images';
import type { ImageCropDto } from '../types/organization';

/**
 * Выбор фото с кадрированием для всех форм (мероприятие, новость, организация, публикация, аватар).
 * Файл НЕ отправляется при выборе: форма хранит выбор (PhotoSelection) и отправляет фото вместе с сохранением
 * сущности — для новой сущности через «черновую» загрузку (imagesApi.stage → imageId), для существующей — её методом.
 * Поэтому загрузить фото можно до того, как у мероприятия появился идентификатор.
 */
export interface PhotoSelection {
  /** Новый файл; null — файл прежний, меняется только кадр. */
  file: File | null;
  /** Выбранный кадр (доли 0…1); null — без кадрирования. */
  crop: ImageCropDto | null;
  /** Локальный адрес нового файла для показа (data URL). */
  previewSrc: string | null;
  /** Пользователь убрал существующее фото. */
  removed?: boolean;
}

/** Отправляет выбранный файл «черновой» загрузкой и возвращает imageId + кадр для создания сущности. */
export async function stagePhoto(selection: PhotoSelection | null): Promise<{ imageId: string; crop: ImageCropDto | null } | null> {
  if (!selection?.file || selection.removed) return null;
  const staged = await imagesApi.stage(selection.file);
  return { imageId: staged.id, crop: selection.crop };
}

interface FieldProps {
  purpose: ImagePurpose;
  label?: string;
  selection: PhotoSelection | null;
  onChange: (value: PhotoSelection | null) => void;
  /** Фото, которое уже сохранено на сервере (при редактировании). */
  existingUrl?: string | null;
  existingCrop?: ImageCropDto | null;
  disabled?: boolean;
  hint?: string;
}

export function PhotoField({ purpose, label, selection, onChange, existingUrl, existingCrop, disabled, hint }: FieldProps) {
  const admin = useAdminScope();
  const cfg = PURPOSES[purpose];
  const [editing, setEditing] = useState<'pick' | 'crop' | null>(null);

  const showExisting = !selection?.removed && !selection?.previewSrc && !!existingUrl;
  const src = selection?.previewSrc ?? (selection?.removed ? null : existingUrl) ?? null;
  const crop = selection ? selection.crop : (existingCrop ?? null);
  const has = !!src;

  const t = admin
    ? { label: 'text-ink-400', muted: 'text-ink-400', box: 'border-line bg-surface-3' }
    : { label: 'text-gray-700', muted: 'text-gray-500', box: 'border-gray-200 bg-gray-50' };

  return (
    <div>
      {label && <p className={`text-sm mb-2 ${t.label}`}>{label}</p>}
      <div className="flex items-start gap-4">
        <div className={`shrink-0 border ${t.box} ${cfg.round ? 'rounded-full' : 'rounded-xl'} overflow-hidden`}
          style={{ width: cfg.aspect >= 2 ? 192 : cfg.round ? 96 : 144 }}>
          <CroppedImage src={src} crop={crop} aspect={cfg.aspect} round={cfg.round} alt="" />
        </div>
        <div className="flex flex-col gap-2 min-w-0">
          <Button type="button" variant="secondary" size="sm" disabled={disabled} onClick={() => setEditing('pick')}>
            <i className="fas fa-image" aria-hidden /> {has ? 'Заменить фото' : 'Выбрать фото'}
          </Button>
          {has && (
            <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => setEditing('crop')}>
              <i className="fas fa-crop-simple" aria-hidden /> Изменить кадр
            </Button>
          )}
          {has && (
            <Button type="button" variant="ghost" size="sm" disabled={disabled}
              onClick={() => onChange(showExisting || selection?.previewSrc ? { file: null, crop: null, previewSrc: null, removed: !!existingUrl } : null)}>
              <i className="fas fa-trash" aria-hidden /> Убрать
            </Button>
          )}
          <p className={`text-xs ${t.muted}`}>{hint ?? cfg.note}. JPEG, PNG или WebP до 15 МБ — сервер сам сожмёт фото.</p>
        </div>
      </div>

      {editing && (
        <PhotoEditorModal
          purpose={purpose}
          mode={editing}
          currentSrc={src}
          currentCrop={crop}
          onClose={() => setEditing(null)}
          onApply={(result) => {
            setEditing(null);
            if (result.file) onChange({ file: result.file, crop: result.crop, previewSrc: result.previewSrc });
            else onChange({ file: selection?.file ?? null, crop: result.crop, previewSrc: selection?.previewSrc ?? null, removed: false });
          }}
        />
      )}
    </div>
  );
}

interface EditorProps {
  purpose: ImagePurpose;
  /** pick — выбрать файл и кадр; crop — только поменять кадр у уже выбранного/сохранённого фото. */
  mode: 'pick' | 'crop';
  currentSrc: string | null;
  currentCrop: ImageCropDto | null;
  onClose: () => void;
  onApply: (result: { file: File | null; crop: ImageCropDto; previewSrc: string | null }) => void;
}

/** Окно выбора файла и области показа. */
export function PhotoEditorModal({ purpose, mode, currentSrc, currentCrop, onClose, onApply }: EditorProps) {
  const admin = useAdminScope();
  const cfg = PURPOSES[purpose];
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [rect, setRect] = useState<CropRect | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // Режим «только кадр»: исходная картинка — текущая (возможно, непубличная, поэтому через запасной путь с токеном).
  const secure = useSecureSrc(mode === 'crop' ? currentSrc : null);
  useEffect(() => {
    if (mode !== 'crop' || !secure.src) return;
    const img = new Image();
    img.onload = () => {
      setSrc(secure.src);
      setSize({ w: img.naturalWidth, h: img.naturalHeight });
      setRect(currentCrop ? fromApiCrop(currentCrop) : defaultRect(img.naturalWidth, img.naturalHeight, cfg.aspect));
    };
    img.onerror = () => { if (secure.src === currentSrc) secure.onError(); };
    img.src = secure.src;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, secure.src]);

  const choose = async (picked: File | undefined | null) => {
    if (!picked) return;
    setError(null);
    const check = await readAndCheck(picked, purpose);
    if (!check.ok) { setError(check.error); return; }
    setFile(picked);
    setSrc(check.src);
    setSize({ w: check.width, h: check.height });
    setWarning(check.warning);
    setRect(defaultRect(check.width, check.height, cfg.aspect, purpose === 'avatar' ? 0.3 : 0.5));
  };

  const t = admin
    ? { muted: 'text-ink-400', warn: 'text-warning-700', err: 'text-danger-700', zone: 'border-line-strong hover:bg-surface-3' }
    : { muted: 'text-gray-500', warn: 'text-amber-700', err: 'text-red-600', zone: 'border-gray-300 hover:bg-gray-50' };

  const ready = !!src && !!size && !!rect;

  return (
    <Modal isOpen onClose={onClose} title={mode === 'crop' ? 'Область показа' : `Фото: ${cfg.label.toLowerCase()}`} maxWidth="max-w-3xl">
      <div className="space-y-4">
        {!ready && mode === 'pick' && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); void choose(e.dataTransfer.files?.[0]); }}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition ${t.zone} ${dragging ? 'ring-2 ring-offset-2 ring-brand-500' : ''}`}
          >
            <i className="fas fa-cloud-arrow-up text-3xl mb-3" aria-hidden />
            <p className="font-medium mb-1">Перетащите фото сюда или выберите на устройстве</p>
            <p className={`text-xs mb-4 ${t.muted}`}>JPEG, PNG или WebP, до 15 МБ. {cfg.note}.</p>
            <Button type="button" onClick={() => input.current?.click()}>Выбрать файл</Button>
            <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; void choose(f); }} />
          </div>
        )}
        {!ready && mode === 'crop' && <p className={`text-sm ${t.muted}`}>Загрузка изображения…</p>}

        {ready && src && size && rect && (
          <>
            <p className={`text-sm ${t.muted}`}>
              Передвиньте рамку и потяните за уголок — в {purpose === 'avatar' || purpose === 'orgLogo' ? 'круге' : 'рамке'} останется то, что увидят посетители.
              Клавиатура: стрелки — двигать, «+» и «−» — размер.
            </p>
            <div className="flex flex-col md:flex-row gap-5 items-start">
              <div className="min-w-0 w-full flex-1 flex justify-center">
                <ImageCropper src={src} naturalWidth={size.w} naturalHeight={size.h} aspect={cfg.aspect} rect={rect} onChange={setRect} round={cfg.round} />
              </div>
              {/* Предпросмотр тем же компонентом, что и на сайте, — совпадает с результатом после сохранения. */}
              <div className="w-full md:w-40 shrink-0" aria-label="Предпросмотр" role="group">
                <p className={`text-xs mb-2 ${t.muted}`}>Так увидят посетители</p>
                <div className="flex flex-wrap items-start gap-3 md:flex-col">
                  <figure className={cfg.previews ? 'w-[7.5rem] md:w-40' : 'w-32 md:w-40'}>
                    <CroppedImage src={src} crop={toApiCrop(rect)} aspect={cfg.aspect} round={cfg.round} />
                    {cfg.previews && <figcaption className={`mt-1 text-[11px] ${t.muted}`}>Карточка</figcaption>}
                  </figure>
                  {cfg.previews?.map(pv => (
                    <figure key={pv.label} style={{ width: pv.aspect < 1 ? '4.5rem' : '7.5rem' }}>
                      <CroppedImage src={src} crop={toApiCrop(rect)} aspect={pv.aspect} />
                      <figcaption className={`mt-1 text-[11px] ${t.muted}`}>{pv.label}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            </div>
            {warning && <p className={`text-xs ${t.warn}`}><i className="fas fa-triangle-exclamation mr-1" aria-hidden />{warning}</p>}
          </>
        )}

        {error && <p role="alert" className={`text-sm ${t.err}`}>{error}</p>}

        <div className="flex justify-between gap-2 pt-1">
          {mode === 'pick' && ready
            ? <Button type="button" variant="ghost" onClick={() => { setSrc(null); setSize(null); setRect(null); setFile(null); setWarning(null); }}>Выбрать другой файл</Button>
            : <span />}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Отмена</Button>
            <Button type="button" disabled={!ready}
              onClick={() => rect && onApply({ file, crop: toApiCrop(rect), previewSrc: file ? src : null })}>
              Применить
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
