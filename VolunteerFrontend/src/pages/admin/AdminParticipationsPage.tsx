import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { adminApi } from '../../api/admin';
import { useNotification } from '../../context/NotificationContext';
import { Modal } from '../../components/Modal';
import { Spinner } from '../../components/Spinner';
import type { AdminParticipationDto } from '../../types/admin';

const TAKE = 20;

const STATUS_LABEL: Record<string, string> = {
  Pending: 'Ожидает',
  Approved: 'Одобрена',
  Rejected: 'Отклонена',
  AttendanceConfirmed: 'Подтверждено',
};

const STATUS_COLOR: Record<string, string> = {
  Pending: 'bg-yellow-900/60 text-yellow-400',
  Approved: 'bg-green-900/60 text-green-400',
  Rejected: 'bg-red-900/60 text-red-400',
  AttendanceConfirmed: 'bg-blue-900/60 text-blue-400',
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
    iconColorClass: 'text-green-400 hover:text-green-300 hover:bg-green-900/40',
    modalTitle: 'Одобрить заявку',
    confirmLabel: 'Одобрить',
    confirmColorClass: 'bg-green-600 hover:bg-green-700',
    successMessage: 'Заявка одобрена',
    call: (id, comment) => adminApi.approveParticipation(id, comment),
  },
  reject: {
    label: 'Отклонить',
    Icon: XIcon,
    iconColorClass: 'text-red-400 hover:text-red-300 hover:bg-red-900/40',
    modalTitle: 'Отклонить заявку',
    confirmLabel: 'Отклонить',
    confirmColorClass: 'bg-red-600 hover:bg-red-700',
    successMessage: 'Заявка отклонена',
    call: (id, comment) => adminApi.rejectParticipation(id, comment),
  },
  'confirm-attendance': {
    label: 'Подтвердить присутствие',
    Icon: UserCheckIcon,
    iconColorClass: 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/40',
    modalTitle: 'Подтвердить присутствие',
    confirmLabel: 'Подтвердить',
    confirmColorClass: 'bg-blue-600 hover:bg-blue-700',
    successMessage: 'Присутствие подтверждено',
    call: (id, comment) => adminApi.confirmAttendance(id, comment),
  },
  'reject-approved': {
    label: 'Отклонить',
    Icon: XIcon,
    iconColorClass: 'text-red-400 hover:text-red-300 hover:bg-red-900/40',
    modalTitle: 'Отклонить заявку',
    confirmLabel: 'Отклонить',
    confirmColorClass: 'bg-red-600 hover:bg-red-700',
    successMessage: 'Заявка отклонена',
    call: (id, comment) => adminApi.rejectApproved(id, comment),
  },
  'return-to-pending': {
    label: 'Вернуть на рассмотрение',
    Icon: UndoIcon,
    iconColorClass: 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/40',
    modalTitle: 'Вернуть заявку на рассмотрение',
    confirmLabel: 'Вернуть',
    confirmColorClass: 'bg-yellow-600 hover:bg-yellow-700',
    successMessage: 'Заявка возвращена на рассмотрение',
    call: (id, comment) => adminApi.returnToPending(id, comment),
  },
  'revoke-attendance': {
    label: 'Отменить подтверждение присутствия',
    Icon: UndoIcon,
    iconColorClass: 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/40',
    modalTitle: 'Отменить подтверждение присутствия',
    confirmLabel: 'Отменить',
    confirmColorClass: 'bg-yellow-600 hover:bg-yellow-700',
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
      notify('Ошибка при выполнении действия', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="space-y-4">
        <div>
          <p className="text-gray-400 text-sm mb-2">Пользователь</p>
          <p className="text-white font-medium">{participation.userName}</p>
          <p className="text-gray-500 text-xs">{participation.userEmail}</p>
        </div>

        <div>
          <p className="text-gray-400 text-sm mb-2">Мероприятие</p>
          <p className="text-white font-medium">{participation.eventTitle}</p>
        </div>

        <div>
          <label className="text-gray-400 text-sm mb-2 block">Комментарий (опционально)</label>
          <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Добавьте комментарий..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary resize-none"
              rows={4}
          />
        </div>

        <div className="flex gap-2">
          <button
              onClick={handleAction}
              disabled={loading}
              className={`flex-1 px-4 py-2 ${config.confirmColorClass} disabled:bg-gray-700 text-white font-medium rounded-lg transition`}
          >
            {loading ? 'Загрузка...' : config.confirmLabel}
          </button>
          <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition"
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
      notify('Ошибка при сохранении комментария', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="space-y-4">
        <div>
          <p className="text-gray-400 text-sm mb-2">Пользователь</p>
          <p className="text-white font-medium">{participation.userName}</p>
          <p className="text-gray-500 text-xs">{participation.userEmail}</p>
        </div>

        <div>
          <p className="text-gray-400 text-sm mb-2">Мероприятие</p>
          <p className="text-white font-medium">{participation.eventTitle}</p>
        </div>

        <div>
          <label className="text-gray-400 text-sm mb-2 block">Комментарий администратора</label>
          <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Комментарий..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary resize-none"
              rows={4}
          />
        </div>

        <div className="flex gap-2">
          <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-gray-700 text-white font-medium rounded-lg transition"
          >
            {loading ? 'Загрузка...' : 'Сохранить'}
          </button>
          <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition"
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
  const [skip, setSkip] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionModal, setActionModal] = useState<{ participation: AdminParticipationDto; action: ParticipationAction } | null>(null);
  const [commentModal, setCommentModal] = useState<AdminParticipationDto | null>(null);
  const { notify } = useNotification();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getParticipations(skip, TAKE, search || undefined, status || undefined);
      // ✅ Исправление: защита от undefined
      setParticipations(res.Items || []);
      setTotal(res.Total || 0);
    } catch (e) {
      console.error('Error loading participations:', e);
      setParticipations([]); // ✅ установить пустой массив при ошибке
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [skip, search, status]);

  useEffect(() => {
    setSkip(0);
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
      notify('Ошибка при одобрении заявок', 'error');
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
      notify('Ошибка при отклонении заявок', 'error');
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

  const pages = Math.ceil(total / TAKE) || 1;
  const currentPage = Math.floor(skip / TAKE) + 1;

  return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Заявки</h1>
          <p className="text-gray-500 text-sm mt-1">Управление заявками на участие</p>
        </div>

        {/* Filters */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Поиск</label>
            <input
                type="text"
                placeholder="Пользователь или мероприятие..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Статус</label>
            <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
            >
              <option value="">Все статусы</option>
              <option value="Pending">Ожидают</option>
              <option value="Approved">Одобрены</option>
              <option value="Rejected">Отклонены</option>
              <option value="AttendanceConfirmed">Подтверждено</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
              <div className="flex gap-2 pt-2 border-t border-gray-700">
                <button
                    onClick={handleBulkApprove}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition"
                >
                  Одобрить ({selectedIds.size})
                </button>
                <button
                    onClick={handleBulkReject}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition"
                >
                  Отклонить ({selectedIds.size})
                </button>
              </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
        )}

        {/* Participations Table */}
        {!loading && (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800/50 border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left w-10">
                      {pendingParticipations.length > 0 && (
                          <input
                              type="checkbox"
                              checked={allPendingSelected}
                              onChange={toggleSelectAll}
                              title="Выбрать все заявки в ожидании"
                              className="w-4 h-4 rounded border-gray-600 cursor-pointer"
                          />
                      )}
                    </th>
                    <th className="px-4 py-3 text-left text-gray-300">Пользователь</th>
                    <th className="px-4 py-3 text-left text-gray-300">Мероприятие</th>
                    <th className="px-4 py-3 text-center text-gray-300">Статус</th>
                    <th className="px-4 py-3 text-center text-gray-300">Дата</th>
                    <th className="px-4 py-3 text-center text-gray-300">Действия</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                  {participations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          Заявки не найдены
                        </td>
                      </tr>
                  ) : (
                      participations.map((p) => {
                        const actions = STATUS_ACTIONS[p.status] || [];
                        return (
                            <tr key={p.id} className="hover:bg-gray-800/50 transition">
                              <td className="px-4 py-3">
                                {p.status === 'Pending' && (
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(p.id)}
                                        onChange={() => toggleSelect(p.id)}
                                        className="w-4 h-4 rounded border-gray-600 cursor-pointer"
                                    />
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-white font-medium">{p.userName}</div>
                                <div className="text-gray-500 text-xs">{p.userEmail}</div>
                              </td>
                              <td className="px-4 py-3 text-gray-300">{p.eventTitle}</td>
                              <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[p.status]}`}>
                            {STATUS_LABEL[p.status]}
                          </span>
                              </td>
                              <td className="px-4 py-3 text-center text-gray-400">
                                {new Date(p.createdAt).toLocaleDateString('ru-RU')}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-1.5">
                                  {actions.map((action) => {
                                    const config = ACTION_CONFIG[action];
                                    const Icon = config.Icon;
                                    return (
                                        <button
                                            key={action}
                                            onClick={() => setActionModal({ participation: p, action })}
                                            title={config.label}
                                            aria-label={config.label}
                                            className={`p-1.5 rounded-lg transition ${config.iconColorClass}`}
                                        >
                                          <Icon className="w-4 h-4" />
                                        </button>
                                    );
                                  })}
                                  <button
                                      onClick={() => setCommentModal(p)}
                                      title="Комментарий"
                                      aria-label="Комментарий"
                                      className="p-1.5 rounded-lg transition text-gray-400 hover:text-gray-200 hover:bg-gray-700/60"
                                  >
                                    <CommentIcon className="w-4 h-4" />
                                  </button>
                                </div>
                                {p.adminComment && (
                                    <div className="text-gray-500 text-xs mt-1 text-center">
                                      Комментарий: {p.adminComment}
                                    </div>
                                )}
                              </td>
                            </tr>
                        );
                      })
                  )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-4 border-t border-gray-800 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Страница {currentPage} из {pages || 1} • Всего: {total}
                </div>
                <div className="flex items-center gap-2">
                  <button
                      onClick={() => setSkip(Math.max(0, skip - TAKE))}
                      disabled={skip === 0}
                      className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 text-white rounded text-sm transition"
                  >
                    ← Назад
                  </button>
                  <button
                      onClick={() => setSkip(skip + TAKE)}
                      disabled={currentPage >= pages}
                      className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 text-white rounded text-sm transition"
                  >
                    Далее →
                  </button>
                </div>
              </div>
            </div>
        )}

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