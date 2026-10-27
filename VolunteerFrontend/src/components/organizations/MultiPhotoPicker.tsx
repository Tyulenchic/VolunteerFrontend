import { useState } from 'react';
import { CroppedImage, PURPOSES } from '../ImageCropper';
import { PhotoEditorModal, type PhotoSelection } from '../PhotoField';
import { Button } from '../ui/Button';

/** Несколько фото для публикации (до max): каждое выбирается с кадром, отправляется вместе с публикацией. */
export function MultiPhotoPicker({ value, onChange, max = 10, disabled }: {
  value: PhotoSelection[];
  onChange: (value: PhotoSelection[]) => void;
  max?: number;
  disabled?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [recrop, setRecrop] = useState<number | null>(null);
  const aspect = PURPOSES.post.aspect;

  return (
    <div>
      <ul className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {value.map((p, i) => (
          <li key={i} className="relative group">
            <CroppedImage src={p.previewSrc} crop={p.crop} aspect={aspect} className="w-full" />
            <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition">
              <button type="button" aria-label={`Изменить кадр фото ${i + 1}`} disabled={disabled} onClick={() => setRecrop(i)}
                className="w-7 h-7 rounded-full bg-black/60 text-white text-xs hover:bg-black/80"><i className="fas fa-crop-simple" /></button>
              <button type="button" aria-label={`Убрать фото ${i + 1}`} disabled={disabled} onClick={() => onChange(value.filter((_, k) => k !== i))}
                className="w-7 h-7 rounded-full bg-black/60 text-white text-xs hover:bg-red-600"><i className="fas fa-xmark" /></button>
            </div>
          </li>
        ))}
        {value.length < max && (
          <li>
            <button type="button" disabled={disabled} onClick={() => setAdding(true)} aria-label="Добавить фото"
              className="w-full border-2 border-dashed border-line-strong rounded-xl text-ink-400 hover:bg-surface-3 hover:text-ink-700 transition flex flex-col items-center justify-center gap-1"
              style={{ aspectRatio: aspect }}>
              <i className="fas fa-plus" aria-hidden /><span className="text-[11px]">Фото</span>
            </button>
          </li>
        )}
      </ul>
      <p className="text-xs text-ink-400 mt-2">{value.length} из {max}. JPEG, PNG или WebP до 15 МБ — сервер сам сожмёт фото.</p>

      {adding && (
        <PhotoEditorModal purpose="post" mode="pick" currentSrc={null} currentCrop={null} onClose={() => setAdding(false)}
          onApply={(r) => { setAdding(false); if (r.file) onChange([...value, { file: r.file, crop: r.crop, previewSrc: r.previewSrc }]); }} />
      )}
      {recrop !== null && value[recrop] && (
        <PhotoEditorModal purpose="post" mode="crop" currentSrc={value[recrop].previewSrc} currentCrop={value[recrop].crop} onClose={() => setRecrop(null)}
          onApply={(r) => { const i = recrop; setRecrop(null); onChange(value.map((p, k) => (k === i ? { ...p, crop: r.crop } : p))); }} />
      )}
      {value.length > 0 && (
        <Button type="button" variant="ghost" size="sm" className="mt-1" disabled={disabled} onClick={() => onChange([])}>Убрать все</Button>
      )}
    </div>
  );
}
