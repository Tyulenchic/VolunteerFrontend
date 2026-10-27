import { useCallback, useEffect, useState } from 'react';
import { moderationApi, type PendingAvatar } from '../../api/moderation';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState, ErrorState } from '../../components/ui/PageStates';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { useNotification } from '../../context/NotificationContext';
import { useAuthBlobUrl } from '../../components/SecureImage';
import { adminErrorMessage } from '../../utils/adminErrors';

const TAKE = 12;
const MAX_REASON = 500;

/** Картинка аватара на проверке: непубличная, поэтому загружается запросом с токеном. */
function PendingPhoto({ url, name }: { url: string; name: string }) {
  const src = useAuthBlobUrl(url);
  return (
    <div className="aspect-square w-full bg-surface-3 flex items-center justify-center overflow-hidden">
      {src ? <img src={src} alt={`Аватар: ${name}`} className="w-full h-full object-cover" />
        : <span className="spinner text-brand-500" aria-label="Загрузка изображения" />}
    </div>
  );
}

/** Модерация: очередь новых аватаров. До одобрения аватар виден только своему владельцу. */
export function AdminModerationPage() {
  const { notify } = useNotification();
  const [skip, setSkip] = useState(0);
  const [items, setItems] = useState<PendingAvatar[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<PendingAvatar | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const page = await moderationApi.pendingAvatars(skip, TAKE);
      // после решения последняя страница могла опустеть — возвращаемся назад
      if (page.items.length === 0 && skip > 0) { setSkip(Math.max(0, skip - TAKE)); return; }
      setItems(page.items); setTotal(page.totalCount);
    } catch (err) { setError(adminErrorMessage(err, 'Не удалось загрузить очередь аватаров.')); }
    finally { setLoading(false); }
  }, [skip]);
  useEffect(() => { void load(); }, [load]);

  const approve = async (a: PendingAvatar) => {
    setBusy(a.userId);
    try { await moderationApi.approveAvatar(a.userId); notify('Аватар одобрен'); await load(); }
    catch (err) { notify(adminErrorMessage(err, 'Не удалось одобрить аватар.'), 'error'); }
    finally { setBusy(null); }
  };

  const reject = async () => {
    if (!rejecting || !reason.trim()) return;
    setBusy(rejecting.userId);
    try {
      await moderationApi.rejectAvatar(rejecting.userId, reason.trim());
      notify('Аватар отклонён, пользователь получит письмо с причиной', 'info');
      setRejecting(null); setReason(''); await load();
    } catch (err) { notify(adminErrorMessage(err, 'Не удалось отклонить аватар.'), 'error'); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Модерация аватаров"
        description="Новые фото профиля сначала видит только их владелец. Одобрите фото, чтобы его увидели остальные, или отклоните с причиной — пользователь получит письмо." />

      {error ? <ErrorState message={error} onRetry={load} />
        : loading && items.length === 0 ? <ListSkeleton />
        : items.length === 0 ? <EmptyState icon="fa-circle-check" title="Очередь пуста" hint="Новые аватары появятся здесь и в уведомлениях." />
        : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map(a => (
              <li key={a.userId}>
                <Card className="overflow-hidden">
                  <PendingPhoto url={a.previewUrl} name={a.displayName} />
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="font-semibold text-ink-900 truncate">{a.displayName}</p>
                      <p className="meta">Загружен {new Date(a.uploadedAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="success" loading={busy === a.userId} onClick={() => approve(a)}><i className="fas fa-check" aria-hidden /> Одобрить</Button>
                      <Button size="sm" variant="danger" disabled={busy === a.userId} onClick={() => { setRejecting(a); setReason(''); }}><i className="fas fa-xmark" aria-hidden /> Отклонить</Button>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}

      {total > TAKE && <Pagination skip={skip} take={TAKE} total={total} onChange={setSkip} />}

      {rejecting && (
        <Modal isOpen onClose={() => busy ? undefined : setRejecting(null)} title={`Отклонить аватар: ${rejecting.displayName}`}>
          <div className="space-y-4">
            <label className="block text-sm text-ink-700">
              Причина (её увидит пользователь)
              <textarea value={reason} onChange={e => setReason(e.target.value.slice(0, MAX_REASON))} rows={4} autoFocus
                className="mt-1.5 w-full rounded-control border border-line-strong bg-surface-3 p-3 text-ink-900" />
            </label>
            <p className="meta text-right">{reason.length}/{MAX_REASON}</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setRejecting(null)} disabled={!!busy}>Отмена</Button>
              <Button variant="danger" loading={!!busy} disabled={!reason.trim()} onClick={reject}>Отклонить и удалить фото</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
