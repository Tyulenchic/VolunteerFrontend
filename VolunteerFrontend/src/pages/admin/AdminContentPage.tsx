import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { siteContentApi } from '../../api/siteContent';
import { ContentEditor } from '../../components/admin/ContentEditor';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { PageHeader } from '../../components/ui/PageHeader';
import { Segmented } from '../../components/ui/Segmented';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { useSiteContent } from '../../context/SiteContentContext';
import { CONTENT_GROUPS, parseStored, serialize, type ContentEntry } from '../../content/registry';
import { adminErrorMessage } from '../../utils/adminErrors';

/**
 * «Тексты сайта»: администратор правит содержимое статических страниц (FAQ, «О нас», правила, политика) без обращения к коду.
 * Сохранённое тут показывается на сайте вместо исходного текста; «Вернуть исходный» удаляет изменение.
 */
export function AdminContentPage() {
  const { notify } = useNotification();
  const confirm = useConfirm();
  const { overrides, reload } = useSiteContent();
  const [groupId, setGroupId] = useState(CONTENT_GROUPS[0].id);
  const group = CONTENT_GROUPS.find(g => g.id === groupId) ?? CONTENT_GROUPS[0];

  return (
    <div className="space-y-5">
      <PageHeader title="Тексты сайта"
        description="Правьте тексты страниц «О нас», FAQ, правил и политики конфиденциальности. Изменения сразу видны посетителям; исходный текст всегда можно вернуть." />

      <Segmented label="Страница" value={groupId} onChange={setGroupId}
        options={CONTENT_GROUPS.map(g => ({ value: g.id, label: g.title, icon: g.icon }))} />

      <div className="flex items-center justify-between gap-3">
        <h2 className="section-title">{group.title}</h2>
        <Link to={group.path} target="_blank" className="text-sm text-brand-700 hover:underline no-underline">
          Открыть страницу <i className="fas fa-arrow-up-right-from-square text-[11px]" aria-hidden />
        </Link>
      </div>

      <div className="space-y-4">
        {group.entries.map(entry => (
          <EntryCard key={`${group.id}:${entry.key}:${overrides.get(entry.key) ?? ''}`} entry={entry}
            stored={overrides.get(entry.key)} notify={notify} confirm={confirm} reload={reload} />
        ))}
      </div>
    </div>
  );
}

function EntryCard({ entry, stored, notify, confirm, reload }: {
  entry: ContentEntry; stored: string | undefined;
  notify: (m: string, t?: 'success' | 'error' | 'info') => void;
  confirm: ReturnType<typeof useConfirm>; reload: () => Promise<void>;
}) {
  const initial = useMemo(() => parseStored(entry, stored), [entry, stored]);
  const [value, setValue] = useState<unknown>(initial);
  const [busy, setBusy] = useState<'save' | 'reset' | null>(null);

  const baseline = stored ?? serialize(entry, entry.default);
  const dirty = serialize(entry, value) !== baseline;
  const changed = stored !== undefined;

  const save = async () => {
    setBusy('save');
    try { await siteContentApi.save(entry.key, serialize(entry, value)); await reload(); notify('Текст сохранён и уже виден на сайте'); }
    catch (err) { notify(adminErrorMessage(err, 'Не удалось сохранить текст.'), 'error'); }
    finally { setBusy(null); }
  };

  const reset = async () => {
    if (!(await confirm({ title: 'Вернуть исходный текст?', message: 'Ваши изменения этого блока будут потеряны, на сайте снова появится исходный текст.', confirmLabel: 'Вернуть исходный' }))) return;
    setBusy('reset');
    try { await siteContentApi.reset(entry.key); await reload(); notify('Исходный текст возвращён', 'info'); }
    catch (err) { notify(adminErrorMessage(err, 'Не удалось вернуть исходный текст.'), 'error'); }
    finally { setBusy(null); }
  };

  return (
    <Card className="p-5 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold text-ink-900">{entry.label}</h3>
        {changed ? <StatusBadge tone="brand">Изменён</StatusBadge> : <StatusBadge tone="neutral">Исходный</StatusBadge>}
        {dirty && <StatusBadge tone="pending">Не сохранено</StatusBadge>}
      </div>
      {entry.hint && <p className="meta">{entry.hint}</p>}
      <ContentEditor schema={entry} value={value} onChange={setValue} />
      <div className="flex flex-wrap gap-2 pt-1">
        <Button onClick={save} loading={busy === 'save'} disabled={!dirty || busy !== null}>Сохранить</Button>
        {dirty && <Button variant="ghost" onClick={() => setValue(initial)} disabled={busy !== null}>Отменить правки</Button>}
        {changed && <Button variant="secondary" onClick={reset} loading={busy === 'reset'} disabled={busy !== null}><i className="fas fa-rotate-left" aria-hidden /> Вернуть исходный</Button>}
      </div>
    </Card>
  );
}
