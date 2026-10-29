import axios from 'axios';
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { useNotification } from '../../context/NotificationContext';
import { adminErrorMessage } from '../../utils/adminErrors';
import { Modal } from '../../components/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState, ErrorState } from '../../components/ui/PageStates';
import { useDebounced, useLatestRequest, usePaging } from '../../hooks/useListHelpers';
import { Pagination } from '../../components/ui/Pagination';
import { Segmented } from '../../components/ui/Segmented';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { STATUS_TONE, StatusBadge } from '../../components/ui/StatusBadge';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/Input';
import type { AdminParticipationDto } from '../../types/admin';

const TAKE = 20;

const STATUS_LABEL: Record<string, string> = {
  Pending: 'Ожидает',
  Approved: 'Одобрена',
  Rejected: 'Отклонена',
  AttendanceConfirmed: 'Присутствовал',
  Withdrawn: 'Отозвана',
};


type ParticipationAction =
    | 'approve'
    | 'reject'
    | 'confirm-attendance'
    | 'reject-approved'
    | 'return-to-pending'
    | 'revoke-attendance';

// ==================== Иконки действий ====================

function CheckIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
  );
}

function XIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
  );
}

function UserCheckIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="m16 11 2 2 4-4" />
      </svg>
  );
}

function UndoIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 14 4 9 9 4" />
        <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
      </svg>
  );
}

function CommentIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
  );
}

// ==================== Конфигурация действий по статусам ====================
interface ActionConfig {
  label: string;
  Icon: (props: { className?: string }) => ReactElement;
  iconColorClass: string;
  modalTitle: string;
  confirmLabel: string;
  confirmColorClass: string;
  successMessage: string;
  call: (participationId: string, comment?: string) => Promise<any>;
}

const ACTION_CONFIG: Record<ParticipationAction, ActionConfig> = {
  approve: {
    label: 'Одобрить',
    Icon: CheckIcon,
    iconColorClass: 'text-success-700 hover:text-success-700 hover:bg-success-100',
    modalTitle: 'Одобрить заявку',
    confirmLabel: 'Одобрить',
    confirmColorClass: 'bg-success-600 hover:bg-success-700',
    successMessage: 'Заявка одобрена',
    call: (id, comment) => adminApi.approveParticipation(id, comment),
  },
  reject: {
    label: 'Отклонить',
    Icon: XIcon,
    iconColorClass: 'text-danger-700 hover:text-danger-700 hover:bg-danger-100',
    modalTitle: 'Отклонить заявку',
    confirmLabel: 'Отклонить',
    confirmColorClass: 'bg-danger-600 hover:bg-danger-700',
    successMessage: 'Заявка отклонена',
    call: (id, comment) => adminApi.rejectParticipation(id, comment),
  },
  'confirm-attendance': {
    label: 'Подтвердить присутствие',
    Icon: UserCheckIcon,
    iconColorClass: 'text-info-700 hover:text-info-700 hover:bg-info-100',
    modalTitle: 'Подтвердить присутствие',
    confirmLabel: 'Подтвердить',
    confirmColorClass: 'bg-info-600 hover:bg-info-700',
    successMessage: 'Присутствие подтверждено',
    call: (id, comment) => adminApi.confirmAttendance(id, comment),
  },
  'reject-approved': {
    label: 'Отклонить',
    Icon: XIcon,
    iconColorClass: 'text-danger-700 hover:text-danger-700 hover:bg-danger-100',
    modalTitle: 'Отклонить заявку',
    confirmLabel: 'Отклонить',
    confirmColorClass: 'bg-danger-600 hover:bg-danger-700',
    successMessage: 'Заявка отклонена',
    call: (id, comment) => adminApi.rejectApproved(id, comment),
  },
  'return-to-pending': {
    label: 'Вернуть на рассмотрение',
    Icon: UndoIcon,
    iconColorClass: 'text-warning-700 hover:text-warning-700 hover:bg-warning-100',
    modalTitle: 'Вернуть заявку на рассмотрение',
    confirmLabel: 'Вернуть',
    confirmColorClass: 'bg-warning-600 hover:bg-warning-700',
    successMessage: 'Заявка возвращена на рассмотрение',
    call: (id, comment) => adminApi.returnToPending(id, comment),
  },
  'revoke-attendance': {
    label: 'Отменить подтверждение присутствия',
    Icon: UndoIcon,
    iconColorClass: 'text-warning-700 hover:text-warning-700 hover:bg-warning-100',
    modalTitle: 'Отменить подтверждение присутствия',
    confirmLabel: 'Отменить',
    confirmColorClass: 'bg-warning-600 hover:bg-warning-700',
    successMessage: 'Подтверждение присутствия отменено',
    call: (id, comment) => adminApi.revokeAttendance(id, comment),
  },
};

// Какие переходы статуса доступны администратору для текущего статуса заявки
const STATUS_ACTIONS: Record<string, ParticipationAction[]> = {
  Pending: ['approve', 'reject'],
  Approved: ['confirm-attendance', 'reject-approved', 'return-to-pending'],
  Rejected: ['return-to-pending'],
  AttendanceConfirmed: ['revoke-attendance'],
};

interface ActionModalProps {
  participation: AdminParticipationDto;
  action: ParticipationAction;
  onClose: () => void;
  onSuccess: () => void;
}

function ActionModal({ participation, action, onClose, onSuccess }: ActionModalProps) {
  const { notify } = useNotification();
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const config = ACTION_CONFIG[action];

  const handleAction = async () => {
    setLoading(true);
    try {
      await config.call(participation.id, comment || undefined);
      notify(config.successMessage);
      onSuccess();
      onClose();
    } catch (e) {
      console.error('Error performing action:', e);
      notify(adminErrorMessage(e, 'Не удалось выполнить действие'), 'error');
      // The application changed meanwhile (withdrawn by the volunteer, decided by another organizer): the list on screen is stale.
      if (axios.isAxiosError(e) && [400, 404, 409].includes(e.response?.status ?? 0)) { onSuccess(); onClose(); }
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="space-y-4">
        <div>
          <p className="text-ink-500 text-sm mb-2">Пользователь</p>
          <p className="text-ink-900 font-medium">{participation.userName}</p>
          <p className="text-ink-400 text-xs">{participation.userEmail}</p>
        </div>

        <div>
          <p className="text-ink-500 text-sm mb-2">Мероприятие</p>
          <p className="text-ink-900 font-medium">{participation.eventTitle}</p>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-ink-700 mb-1.5">Комментарий (опционально)</label>
          <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Добавьте комментарий..."
              className="w-full bg-surface-2 border border-line-strong rounded-lg px-3 py-2 text-ink-900 placeholder-ink-400 focus:outline-none focus:border-brand-500 resize-none"
              rows={4}
          />
        </div>

        <div className="flex gap-2">
          <button
              onClick={handleAction}
              disabled={loading}
              className={`flex-1 px-4 py-2 ${config.confirmColorClass} disabled:bg-ink-300 text-ink-900 font-medium rounded-lg transition`}
          >
            {loading ? 'Загрузка...' : config.confirmLabel}
          </button>
          <button
              onClick={onClose}
              className="btn btn-secondary"
          >
            Отмена
          </button>
        </div>
      </div>
  );
}

// ==================== Модальное окно редактирования комментария ====================

interface CommentModalProps {
  participation: AdminParticipationDto;
  onClose: () => void;
  onSuccess: () => void;
}

function CommentModal({ participation, onClose, onSuccess }: CommentModalProps) {
  const { notify } = useNotification();
  const [comment, setComment] = useState(participation.adminComment || '');
  const [loading, setLoading] = useState(false);
  const hasComment = !!participation.adminComment;

  const handleSave = async () => {
    setLoading(true);
    try {
      const trimmed = comment.trim();
      if (trimmed) {
        if (hasComment) {
          await adminApi.updateParticipationComment(participation.id, trimmed);
        } else {
          await adminApi.addParticipationComment(participation.id, trimmed);
        }
      } else if (hasComment) {
        await adminApi.deleteParticipationComment(participation.id);
      } else {
        onClose();
        return;
      }
      notify('Комментарий сохранён');
      onSuccess();
      onClose();
    } catch (e) {
      console.error('Error saving comment:', e);
      notify(adminErrorMessage(e, 'Не удалось сохранить комментарий'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="space-y-4">
        <div>
          <p className="text-ink-500 text-sm mb-2">Пользователь</p>
          <p className="text-ink-900 font-medium">{participation.userName}</p>
          <p className="text-ink-400 text-xs">{participation.userEmail}</p>
        </div>

        <div>
          <p className="text-ink-500 text-sm mb-2">Мероприятие</p>
          <p className="text-ink-900 font-medium">{participation.eventTitle}</p>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-ink-700 mb-1.5">Комментарий администратора</label>
          <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Комментарий..."
              className="w-full bg-surface-2 border border-line-strong rounded-lg px-3 py-2 text-ink-900 placeholder-ink-400 focus:outline-none focus:border-brand-500 resize-none"
              rows={4}
          />
        </div>

        <div className="flex gap-2">
          <button
              onClick={handleSave}
              disabled={loading}
              className="btn btn-primary flex-1"
          >
            {loading ? 'Загрузка...' : 'Сохранить'}
          </button>
          <button
              onClick={onClose}
              className="btn btn-secondary"
          >
            Отмена
          </button>
        </div>
      </div>
  );
}

export function AdminParticipationsPage() {
  const [participations, setParticipations] = useState<AdminParticipationDto[]>([]);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounced(searchInput);
  const [params, setParams] = useSearchParams();
  // Same default as before (all statuses); the dashboard links here with ?status=Pending.
  const status = params.get('status') ?? '';
  const setStatus = (v: string) => setParams({ status: v }, { replace: true });
  const [skip, setSkip] = usePaging(`${search}|${status}`);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const beginRequest = useLatestRequest();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionModal, setActionModal] = useState<{ participation: AdminParticipationDto; action: ParticipationAction } | null>(null);
  const [commentModal, setCommentModal] = useState<AdminParticipationDto | null>(null);
  const { notify } = useNotification();

  const load = useCallback(async () => {
    const isCurrent = beginRequest();
    setLoading(true);
    setFailed(false);
    try {
      const res = await adminApi.getParticipations(skip, TAKE, search || undefined, status || undefined);
      if (!isCurrent()) return;
      setParticipations(res.Items || []);
      setTotal(res.Total || 0);
    } catch (e) {
      if (!isCurrent()) return;
      console.error('Error loading participations:', e);
      setParticipations([]);
      setTotal(0);
      setFailed(true);
    } finally {
      if (isCurrent()) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, search, status]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [search, status]);

  useEffect(() => {
    load();
  }, [load]);

  // Выбор (чекбоксы + "выбрать все") доступен только для заявок в статусе Pending.
  const pendingParticipations = participations.filter((p) => p.status === 'Pending');
  const allPendingSelected =
      pendingParticipations.length > 0 && pendingParticipations.every((p) => selectedIds.has(p.id));

  // Если после обновления списка часть выбранных заявок перестала быть Pending
  // (например, по ней выполнили индивидуальное действие) — убираем их из выбора.
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const pendingIds = new Set(participations.filter((p) => p.status === 'Pending').map((p) => p.id));
      let changed = false;
      const next = new Set<string>();
      prev.forEach((id) => {
        if (pendingIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [participations]);

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) {
      notify('Выберите заявки', 'error');
      return;
    }

    try {
      const res = await adminApi.bulkApproveParticipations(Array.from(selectedIds));
      notify(`${res.ApprovedCount} заявок одобрено`);
      setSelectedIds(new Set());
      load();
    } catch (e) {
      console.error('Error bulk approving:', e);
      notify(adminErrorMessage(e, 'Не удалось одобрить заявки'), 'error');
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) {
      notify('Выберите заявки', 'error');
      return;
    }

    try {
      const res = await adminApi.bulkRejectParticipations(Array.from(selectedIds));
      notify(`${res.RejectedCount} заявок отклонено`);
      setSelectedIds(new Set());
      load();
    } catch (e) {
      console.error('Error bulk rejecting:', e);
      notify(adminErrorMessage(e, 'Не удалось отклонить заявки'), 'error');
    }
  };

  const toggleSelectAll = () => {
    const newIds = new Set(selectedIds);
    if (allPendingSelected) {
      pendingParticipations.forEach((p) => newIds.delete(p.id));
    } else {
      pendingParticipations.forEach((p) => newIds.add(p.id));
    }
    setSelectedIds(newIds);
  };

  const toggleSelect = (id: string) => {
    const newIds = new Set(selectedIds);
    if (newIds.has(id)) {
      newIds.delete(id);
    } else {
      newIds.add(id);
    }
    setSelectedIds(newIds);
  };


  return (
      <div className="space-y-6">
        <PageHeader title="Заявки" description="Заявки волонтёров на участие. Ожидающие решения выделены цветом." />

        <div className="flex flex-wrap items-center gap-3">
          <Segmented label="Статус заявки" value={status} onChange={setStatus}
            options={[
              { value: '', label: 'Все' },
              { value: 'Pending', label: 'Ожидают' },
              { value: 'Approved', label: 'Одобрены' },
              { value: 'AttendanceConfirmed', label: 'Присутствовали' },
              { value: 'Rejected', label: 'Отклонены' },
              { value: 'Withdrawn', label: 'Отозваны' },
            ]} />
          <SearchInput label="Поиск по заявкам" placeholder="Волонтёр или мероприятие…" value={searchInput} onChange={setSearchInput} />
        </div>

        <Card className="overflow-hidden">
          {selectedIds.size > 0 && (
            <div className="glass sticky top-0 z-10 flex flex-wrap items-center gap-3 px-4 py-2.5 border-b border-line-strong">
              <span className="text-[13px] text-ink-900 font-medium">Выбрано: {selectedIds.size}</span>
              <div className="flex gap-2 ml-auto">
                <Button size="sm" variant="success" onClick={handleBulkApprove}><i className="fas fa-check" />Одобрить</Button>
                <Button size="sm" variant="secondary" onClick={handleBulkReject}>Отклонить</Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Снять выбор</Button>
              </div>
            </div>
          )}
          {loading && participations.length === 0 ? (
            <ListSkeleton rows={8} />
          ) : failed ? (
            <ErrorState message="Не удалось загрузить заявки" onRetry={load} />
          ) : participations.length === 0 ? (
            <EmptyState icon="fa-clipboard-check"
              title={status === 'Pending' && !searchInput ? 'Нет заявок, ожидающих решения' : 'Заявки не найдены'}
              hint={status === 'Pending' && !searchInput ? 'Когда волонтёры подадут новые заявки, они появятся здесь.' : 'Измените поиск или выберите другой статус.'}
              action={(status || searchInput) ? <Button variant="secondary" size="sm" onClick={() => { setSearchInput(''); setStatus(''); }}>Показать все заявки</Button> : undefined} />
          ) : (
            <div className={`relative overflow-x-auto scroll-soft transition-opacity ${loading ? 'opacity-60' : ''}`}>
              <table className="rtable w-full text-sm">
                <thead>
                  <tr>
                    <th className="pl-4 pr-1 w-10 text-left">
                      {pendingParticipations.length > 0 && (
                        <input type="checkbox" checked={allPendingSelected} onChange={toggleSelectAll} aria-label="Выбрать все ожидающие заявки" title="Выбрать все заявки в ожидании" className="w-4 h-4 rounded cursor-pointer" />
                      )}
                    </th>
                    <th className="px-4 text-left">Волонтёр</th>
                    <th className="px-4 text-left">Мероприятие</th>
                    <th className="px-4 text-left hidden md:table-cell">Подана</th>
                    <th className="px-4 text-left">Статус</th>
                    <th className="px-4 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {participations.map((p) => {
                    const actions = STATUS_ACTIONS[p.status] || [];
                    const isPending = p.status === 'Pending';
                    return (
                      <tr key={p.id} className={isPending ? 'bg-warning-50/40 shadow-[inset_3px_0_0_0_theme(colors.warning.600)]' : ''}>
                        <td className="pl-4 pr-1 py-3">
                          {isPending && (
                            <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} aria-label={`Выбрать заявку: ${p.userName}`} className="w-4 h-4 rounded cursor-pointer" />
                          )}
                        </td>
                        <td className="px-4 py-3 rt-grow">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar name={p.userName} thumb={p.userAvatarThumbnailUrl} />
                            <div className="min-w-0">
                              <p className="font-medium text-ink-900 truncate max-w-[14rem]">{p.userName}</p>
                              <p className="meta truncate max-w-[14rem]">{p.userEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-ink-700 rt-full">
                          <p className="line-clamp-2 max-w-[20rem]">{p.eventTitle}</p>
                          {p.adminComment && <p className="meta mt-0.5 line-clamp-1 max-w-[20rem]"><i className="far fa-comment mr-1" />{p.adminComment}</p>}
                          {p.withdrawalReason && <p className="meta mt-0.5 line-clamp-2 max-w-[20rem]" title={p.withdrawalReason}><i className="far fa-comment-dots mr-1" />Волонтёр: {p.withdrawalReason}</p>}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-ink-500 whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString('ru-RU')}</td>
                        <td className="px-4 py-3"><StatusBadge tone={STATUS_TONE[p.status] ?? 'neutral'}>{STATUS_LABEL[p.status] ?? p.status}</StatusBadge></td>
                        <td className="px-4 py-3 rt-end">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending ? (
                              <>
                                <Button size="sm" variant="success" onClick={() => setActionModal({ participation: p, action: 'approve' })}><i className="fas fa-check" />Одобрить</Button>
                                <Button size="sm" variant="secondary" onClick={() => setActionModal({ participation: p, action: 'reject' })}>Отклонить</Button>
                              </>
                            ) : actions.map((action) => {
                              const config = ACTION_CONFIG[action];
                              const Icon = config.Icon;
                              return (
                                <button key={action} onClick={() => setActionModal({ participation: p, action })} title={config.label} aria-label={config.label} className={`p-1.5 rounded-lg transition ${config.iconColorClass}`}>
                                  <Icon className="w-4 h-4" />
                                </button>
                              );
                            })}
                            <button onClick={() => setCommentModal(p)} title="Комментарий" aria-label="Комментарий" className="icon-btn"><CommentIcon className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Pagination skip={skip} take={TAKE} total={total} onChange={setSkip} />
        </Card>

        {/* Action Modal */}
        {actionModal && (
            <Modal
                title={ACTION_CONFIG[actionModal.action].modalTitle}
                isOpen={!!actionModal}
                onClose={() => setActionModal(null)}
            >
              <ActionModal
                  participation={actionModal.participation}
                  action={actionModal.action}
                  onClose={() => setActionModal(null)}
                  onSuccess={load}
              />
            </Modal>
        )}

        {/* Comment Modal */}
        {commentModal && (
            <Modal
                title="Комментарий администратора"
                isOpen={!!commentModal}
                onClose={() => setCommentModal(null)}
            >
              <CommentModal
                  participation={commentModal}
                  onClose={() => setCommentModal(null)}
                  onSuccess={load}
              />
            </Modal>
        )}
      </div>
  );
}