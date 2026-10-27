import { emptyItem, type FieldSchema } from '../../content/registry';
import { Button } from '../ui/Button';
import { ProfilePicker } from './ProfilePicker';

/** Универсальный редактор значения по схеме: строка, абзац, список строк или список объектов (вложенность любая). */
export function ContentEditor({ schema, value, onChange, depth = 0 }: {
  schema: FieldSchema; value: unknown; onChange: (v: unknown) => void; depth?: number;
}) {
  if (schema.type === 'text') {
    return <input type="text" value={String(value ?? '')} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 text-sm" aria-label={schema.label} />;
  }
  if (schema.type === 'profile') {
    // Полноценно работает внутри элемента списка (см. ниже): там у поля есть доступ к соседним полям карточки.
    return <input type="text" value={String(value ?? '')} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 text-sm" aria-label={schema.label} />;
  }
  if (schema.type === 'textarea') {
    const text = String(value ?? '');
    return <textarea value={text} onChange={e => onChange(e.target.value)} rows={Math.min(14, Math.max(3, text.split('\n').length + 1))}
      className="w-full px-3 py-2 text-sm leading-relaxed" aria-label={schema.label} />;
  }
  if (schema.type === 'lines') {
    const lines = Array.isArray(value) ? (value as string[]) : [];
    return <textarea value={lines.join('\n')} onChange={e => onChange(e.target.value.split('\n'))} rows={Math.min(14, Math.max(3, lines.length + 1))}
      className="w-full px-3 py-2 text-sm leading-relaxed" aria-label={schema.label} />;
  }

  // list: массив объектов
  const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
  const fields = schema.fields ?? [];
  const set = (next: Record<string, unknown>[]) => onChange(next);
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[i], next[j]] = [next[j], next[i]];
    set(next);
  };

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className={`rounded-xl border border-line p-4 space-y-3 ${depth % 2 === 0 ? 'bg-surface-2' : 'bg-surface-3'}`}>
          <div className="flex items-center gap-2">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-400 flex-1">{schema.itemLabel ?? 'Элемент'} {i + 1}</p>
            <button type="button" className="icon-btn" aria-label="Выше" disabled={i === 0} onClick={() => move(i, -1)}><i className="fas fa-arrow-up" /></button>
            <button type="button" className="icon-btn" aria-label="Ниже" disabled={i === items.length - 1} onClick={() => move(i, 1)}><i className="fas fa-arrow-down" /></button>
            <button type="button" className="icon-btn is-danger" aria-label="Удалить" onClick={() => set(items.filter((_, k) => k !== i))}><i className="fas fa-trash" /></button>
          </div>
          {fields.map(f => (
            <div key={f.key}>
              <span className="block text-[13px] font-medium text-ink-700 mb-1.5">{f.label}</span>
              {f.type === 'profile'
                ? <ProfilePicker value={String(item[f.key] ?? '')}
                    onChange={v => set(items.map((it, k) => (k === i ? { ...it, [f.key]: v } : it)))}
                    onFill={patch => set(items.map((it, k) => (k === i ? { ...it, ...patch } : it)))} />
                : <ContentEditor schema={f} depth={depth + 1} value={item[f.key]}
                    onChange={v => set(items.map((it, k) => (k === i ? { ...it, [f.key]: v } : it)))} />}
              {f.hint && <span className="block meta mt-1">{f.hint}</span>}
            </div>
          ))}
        </div>
      ))}
      <Button type="button" size="sm" variant="secondary" onClick={() => set([...items, emptyItem(fields)])}>
        <i className="fas fa-plus" aria-hidden /> Добавить {schema.itemLabel ?? 'элемент'}
      </Button>
    </div>
  );
}
