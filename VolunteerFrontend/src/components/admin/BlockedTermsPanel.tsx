import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { blockedTermsApi, BLOCKED_TERM_MAX, type BlockedTerm, type TermMatchMode } from '../../api/moderation';
import { useNotification } from '../../context/NotificationContext';
import { adminErrorMessage } from '../../utils/adminErrors';
import { TERM_MODES } from '../../utils/moderationLabels';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useConfirm } from '../ui/ConfirmDialog';
import { EmptyState, ErrorState } from '../ui/PageStates';
import { ListSkeleton } from '../ui/Skeleton';
import { StatusBadge } from '../ui/StatusBadge';

/** Словарь запрещённых выражений: проверяются имя, «О себе» и другие тексты, которые пишут пользователи. */
export function BlockedTermsPanel() {
  const { notify } = useNotification();
  const confirm = useConfirm();
  const [items, setItems] = useState<BlockedTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [term, setTerm] = useState('');
  const [mode, setMode] = useState<TermMatchMode>('WholeWord');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setItems(await blockedTermsApi.list()); }
    catch (err) { setError(adminErrorMessage(err, 'Не удалось загрузить список.')); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!term.trim()) return;
    setAdding(true);
    try {
      const created = await blockedTermsApi.add(term.trim(), mode);
      setItems(prev => [...prev, created]);
      setTerm('');
      notify('Выражение добавлено');
    } catch (err) { notify(adminErrorMessage(err, 'Не удалось добавить выражение.'), 'error'); }
    finally { setAdding(false); }
  };

  const remove = async (t: BlockedTerm) => {
    if (!(await confirm({ title: 'Удалить выражение?', message: `«${t.term}» перестанет блокироваться в текстах пользователей.`, confirmLabel: 'Удалить' }))) return;
    setRemoving(t.id);
    try {
      await blockedTermsApi.remove(t.id);
      setItems(prev => prev.filter(x => x.id !== t.id));
      notify('Выражение удалено');
    } catch (err) { notify(adminErrorMessage(err, 'Не удалось удалить выражение.'), 'error'); }
    finally { setRemoving(null); }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <form onSubmit={add} className="flex flex-col md:flex-row md:items-end gap-3">
          <label className="flex-1 text-sm text-ink-700">
            Выражение
            <input value={term} onChange={e => setTerm(e.target.value.slice(0, BLOCKED_TERM_MAX))} maxLength={BLOCKED_TERM_MAX}
              className="mt-1.5 w-full rounded-control border border-line-strong bg-surface-3 px-3 py-2 text-ink-900" />
          </label>
          <label className="text-sm text-ink-700">
            Как искать
            <select value={mode} onChange={e => setMode(e.target.value as TermMatchMode)}
              className="mt-1.5 w-full rounded-control border border-line-strong bg-surface-3 px-3 py-2 text-ink-900">
              {(Object.keys(TERM_MODES) as TermMatchMode[]).map(m => <option key={m} value={m}>{TERM_MODES[m].label}</option>)}
            </select>
          </label>
          <Button type="submit" loading={adding} disabled={!term.trim()}><i className="fas fa-plus" aria-hidden /> Добавить</Button>
        </form>
        <p className="meta mt-2">{TERM_MODES[mode].hint} Регистр, похожие латинские буквы и повторы символов не обходят проверку.</p>
      </Card>

      {error ? <ErrorState message={error} onRetry={load} />
        : loading ? <ListSkeleton />
        : items.length === 0 ? <EmptyState icon="fa-spell-check" title="Список пуст" hint="Добавьте выражения, которые нельзя использовать в профилях." />
        : (
          <Card>
            <ul className="divide-y divide-line">
              {items.map(t => (
                <li key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="flex-1 min-w-0 font-mono text-sm text-ink-900 break-all">{t.term}</span>
                  <StatusBadge tone={t.mode === 'Substring' ? 'pending' : 'neutral'}>{TERM_MODES[t.mode].label}</StatusBadge>
                  <button type="button" className="icon-btn" aria-label={`Удалить «${t.term}»`} disabled={removing === t.id} onClick={() => remove(t)}>
                    <i className="fas fa-trash" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}
    </div>
  );
}
