import { useId, useRef, useState } from 'react';
import { checkPostFile, fileIcon, formatSize, MAX_POST_FILES, POST_FILE_ACCEPT } from '../../utils/postFiles';

/**
 * Выбор вложений публикации (.pdf, .txt, .docx, .mp4). Файлы только накапливаются в списке: на сервер они уходят
 * после создания публикации. Неподходящие файлы отклоняются сразу с понятной причиной.
 */
export function PostFilePicker({ value, onChange, disabled, max = MAX_POST_FILES }: {
  value: File[]; onChange: (files: File[]) => void; disabled?: boolean; max?: number;
}) {
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [problems, setProblems] = useState<string[]>([]);

  const add = (list: FileList | null) => {
    if (!list) return;
    const next = [...value];
    const bad: string[] = [];
    for (const f of Array.from(list)) {
      const err = checkPostFile(f);
      if (err) bad.push(err);
      else if (next.some(x => x.name === f.name && x.size === f.size)) bad.push(`«${f.name}»: уже добавлен.`);
      else if (next.length >= max) bad.push(`«${f.name}»: в публикации не больше ${max} файлов.`);
      else next.push(f);
    }
    setProblems(bad);
    onChange(next);
    if (input.current) input.current.value = '';   // тот же файл можно выбрать повторно после удаления
  };

  return (
    <div>
      <span className="block text-[13px] font-medium text-ink-700 mb-1.5">Файлы (.pdf, .docx, .txt, .mp4)</span>
      {value.length > 0 && (
        <ul className="mb-2 divide-y divide-line border border-line rounded-lg">
          {value.map((f, i) => (
            <li key={f.name + f.size} className="flex items-center gap-3 px-3 py-2">
              <i className={`fas ${fileIcon(f.name)} text-ink-400`} aria-hidden />
              <span className="min-w-0 flex-1 truncate text-[13px] text-ink-900">{f.name}</span>
              <span className="text-xs text-ink-400 shrink-0">{formatSize(f.size)}</span>
              <button type="button" className="icon-btn is-danger" disabled={disabled} aria-label={`Убрать файл ${f.name}`}
                onClick={() => onChange(value.filter((_, k) => k !== i))}><i className="fas fa-xmark" aria-hidden /></button>
            </li>
          ))}
        </ul>
      )}
      <input ref={input} id={inputId} type="file" multiple accept={POST_FILE_ACCEPT} className="sr-only" disabled={disabled || value.length >= max}
        onChange={e => add(e.target.files)} />
      <label htmlFor={inputId}
        className={`btn btn-secondary btn-sm ${disabled || value.length >= max ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}>
        <i className="fas fa-paperclip" aria-hidden /> Прикрепить файл
      </label>
      <p className="text-xs text-ink-400 mt-1">До {max} файлов: документы до 10 МБ, видео .mp4 до 50 МБ. К файлам нужна подпись (текст).</p>
      {problems.length > 0 && (
        <ul role="alert" className="mt-1 space-y-0.5 text-xs text-danger-700">{problems.map(p => <li key={p}>{p}</li>)}</ul>
      )}
    </div>
  );
}
