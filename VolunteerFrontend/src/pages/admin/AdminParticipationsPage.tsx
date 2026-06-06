import { useCallback, useEffect, useState } from 'react';
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

interface ActionModalProps {
  participation: AdminParticipationDto;
  action: 'approve' | 'reject';
  onClose: () => void;
  onSuccess: () => void;
}

function ActionModal({ participation, action, onClose, onSuccess }: ActionModalProps) {
  const { notify } = useNotification();
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    setLoading(true);
    try {
      if (action === 'approve') {
        await adminApi.approveParticipation(participation.id, comment || undefined);
        notify('Заявка одобрена');
      } else {
        await adminApi.rejectParticipation(participation.id, comment || undefined);
        notify('Заявка отклонена');
      }
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
              className={`flex-1 px-4 py-2 ${action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} disabled:bg-gray-700 text-white font-medium rounded-lg transition`}
          >
            {loading ? 'Загрузка...' : action === 'approve' ? 'Одобрить' : 'Отклонить'}
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
  const [actionModal, setActionModal] = useState<{ participation: AdminParticipationDto; action: 'approve' | 'reject' } | null>(null);
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
  }, [search, status]);

  useEffect(() => {
    load();
  }, [load]);

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
    if (selectedIds.size === participations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(participations.map((p) => p.id)));
    }
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
                    <th className="px-4 py-3 text-left">
                      <input
                          type="checkbox"
                          checked={selectedIds.size > 0 && selectedIds.size === participations.length}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-gray-600 cursor-pointer"
                      />
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
                      participations.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-800/50 transition">
                            <td className="px-4 py-3">
                              <input
                                  type="checkbox"
                                  checked={selectedIds.has(p.id)}
                                  onChange={() => toggleSelect(p.id)}
                                  className="w-4 h-4 rounded border-gray-600 cursor-pointer"
                              />
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
                            <td className="px-4 py-3 text-center space-x-2">
                              {p.status === 'Pending' && (
                                  <>
                                    <button
                                        onClick={() => setActionModal({ participation: p, action: 'approve' })}
                                        className="text-green-400 hover:text-green-300 text-xs"
                                    >
                                      Одобрить
                                    </button>
                                    <button
                                        onClick={() => setActionModal({ participation: p, action: 'reject' })}
                                        className="text-red-400 hover:text-red-300 text-xs"
                                    >
                                      Отклонить
                                    </button>
                                  </>
                              )}
                              {p.adminComment && (
                                  <div className="text-gray-500 text-xs mt-1">
                                    Комментарий: {p.adminComment}
                                  </div>
                              )}
                            </td>
                          </tr>
                      ))
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
                title={actionModal.action === 'approve' ? 'Одобрить заявку' : 'Отклонить заявку'}
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
      </div>
  );
}