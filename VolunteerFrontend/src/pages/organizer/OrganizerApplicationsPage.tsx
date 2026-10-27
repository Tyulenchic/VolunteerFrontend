import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { organizerApi } from '../../api/organizer';
import { Modal } from '../../components/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Pagination } from '../../components/ui/Pagination';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState, ErrorState } from '../../components/ui/PageStates';
import { Segmented } from '../../components/ui/Segmented';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { useLatestRequest } from '../../hooks/useListHelpers';
import { adminErrorMessage } from '../../utils/adminErrors';
import {
  APPLICATION_STATUS_LABEL, MAX_VOLUNTEER_ORGANIZATIONS,
  type ApplicationStatus, type OrganizationApplication, type OrganizerSummary,
} from '../../types/organization';

const TAKE = 20;
const TONE: Record<ApplicationStatus, 'pending' | 'success' | 'cancelled' | 'neutral'> = {
  Pending: 'pending', Approved: 'success', Rejected: 'cancelled', Withdrawn: 'neutral',
};
const fmt = (iso: string) => new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

/** Заявки волонтёров на вступление в организации, где пользователь — организатор. Принятие делает волонтёра членом организации. */
export function OrganizerApplicationsPage() {
  const { notify } = useNotification();
  const begin = useLatestRequest();
  const [status, setStatus] = useState<ApplicationStatus>('Pending');
  const [orgId, setOrgId] = useState('');
  const [orgs, setOrgs] = useState<OrganizerSummary['organizations']>([]);
  const [skip, setSkip] = useState(0);
  const [items, setItems] = useState<OrganizationApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deciding, setDeciding] = useState<{ app: OrganizationApplication; approve: boolean } | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { organizerApi.summary().then(s => setOrgs(s.organizations)).catch(() => undefined); }, []);

  const load = useCallback(async () => {
    const isCurrent = begin();
    setLoading(true); setError(null);
    try {
      const page = await organizerApi.applications({ status, organizationId: orgId || undefined, skip, take: TAKE });
      if (!isCurrent()) return;
      setItems(page.items); setTotal(page.totalCount);
    } catch (err) {
      if (isCurrent()) setError(adminErrorMessage(err, 'Не удалось загрузить заявки.'));
    } finally { if (isCurrent()) setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, orgId, skip]);

  useEffect(() => { void load(); }, [load]);

  const decide = async () => {
    if (!deciding) return;
    setBusy(true);
    try {
      if (deciding.approve) await organizerApi.approveApplication(deciding.app.id, note);
      else await organizerApi.rejectApplication(deciding.app.id, note);
      notify(deciding.approve ? `${deciding.app.applicantName} теперь волонтёр организации` : 'Заявка отклонена');
      setDeciding(null); setNote('');
      await load();
    } catch (err) {
      notify(adminErrorMessage(err, 'Не удалось выполнить действие.'), 'error');
      // 409 «уже в двух организациях» — заявку можно только отклонить; обновим список на случай, если её уже рассмотрели
      void load();
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Заявки в организацию"
        description={`Принятый волонтёр становится членом организации, она появляется в его профиле. Волонтёр может состоять не более чем в ${MAX_VOLUNTEER_ORGANIZATIONS} организациях.`} />

      <div className="flex flex-wrap items-center gap-3">
        <Segmented<ApplicationStatus> label="Статус заявки" value={status} onChange={v => { setStatus(v); setSkip(0); }}
          options={(['Pending', 'Approved', 'Rejected', 'Withdrawn'] as ApplicationStatus[]).map(v => ({ value: v, label: APPLICATION_STATUS_LABEL[v] }))} />
        {orgs.length > 1 && (
          <select value={orgId} onChange={e => { setOrgId(e.target.value); setSkip(0); }} aria-label="Организация" className="px-3 py-2 text-sm">
            <option value="">Все организации</option>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}
      </div>

      {error ? <ErrorState message={error} onRetry={load} />
        : loading ? <ListSkeleton />
        : items.length === 0 ? <EmptyState icon="fa-user-plus" title={status === 'Pending' ? 'Новых заявок нет' : 'Здесь пока пусто'} hint={status === 'Pending' ? 'Когда волонтёр подаст заявку со страницы организации, она появится здесь, а в колокольчике — уведомление.' : undefined} />
        : (
          <Card>
            <ul className="divide-y divide-line">
              {items.map(a => (
                <li key={a.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
                  <Avatar name={a.applicantName} src={a.applicantAvatarThumbnailUrl} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/users/${a.userId}`} className="font-semibold text-ink-900 hover:underline no-underline">{a.applicantName}</Link>
                      <StatusBadge tone={TONE[a.status]}>{APPLICATION_STATUS_LABEL[a.status]}</StatusBadge>
                    </div>
                    <p className="meta mt-0.5">
                      {a.organizationName}{a.applicantCity ? ` · ${a.applicantCity}` : ''} · {fmt(a.createdAt)}
                    </p>
                    {a.message && <p className="mt-2 text-[14px] text-ink-700 whitespace-pre-line border-l-2 border-line-strong pl-3">{a.message}</p>}
                    {a.decisionNote && <p className="mt-2 text-[13px] text-ink-400">Комментарий: {a.decisionNote}</p>}
                  </div>
                  {a.status === 'Pending' && (
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="success" onClick={() => { setDeciding({ app: a, approve: true }); setNote(''); }}><i className="fas fa-check" aria-hidden /> Принять</Button>
                      <Button size="sm" variant="danger" onClick={() => { setDeciding({ app: a, approve: false }); setNote(''); }}><i className="fas fa-xmark" aria-hidden /> Отклонить</Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}

      {total > TAKE && <Pagination skip={skip} take={TAKE} total={total} onChange={setSkip} />}

      {deciding && (
        <Modal isOpen onClose={() => setDeciding(null)} title={deciding.approve ? 'Принять волонтёра' : 'Отклонить заявку'} maxWidth="max-w-md">
          <div className="space-y-4">
            <p className="text-[14px] text-ink-500">
              {deciding.approve
                ? <>«{deciding.app.applicantName}» станет волонтёром организации «{deciding.app.organizationName}» — она автоматически появится в его профиле, ему уйдёт письмо.</>
                : <>Заявитель получит письмо с отказом. Позже он сможет подать заявку снова.</>}
            </p>
            <label className="block">
              <span className="block text-[13px] font-medium text-ink-700 mb-1.5">Комментарий для заявителя (необязательно)</span>
              <textarea value={note} onChange={e => setNote(e.target.value)} maxLength={500} rows={3} className="w-full px-3 py-2 text-sm bg-surface-2 border border-line-strong rounded-lg" />
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeciding(null)} disabled={busy}>Отмена</Button>
              <Button variant={deciding.approve ? 'success' : 'danger'} onClick={decide} loading={busy}>{deciding.approve ? 'Принять' : 'Отклонить'}</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
