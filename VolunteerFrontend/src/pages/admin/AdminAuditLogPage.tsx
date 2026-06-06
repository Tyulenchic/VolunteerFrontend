import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { Spinner } from '../../components/Spinner';
import type { AuditLogEntryDto } from '../../types/audit';

const TAKE = 20;

const ACTION_ICON: Record<string, string> = {
  BlockUser: 'fa-ban',
  UnblockUser: 'fa-check',
  ChangeUserRole: 'fa-key',
  PublishNews: 'fa-globe',
  UnpublishNews: 'fa-eye-slash',
  ArchiveNews: 'fa-archive',
  RestoreNews: 'fa-redo',
  ApproveParticipation: 'fa-check-circle',
  RejectParticipation: 'fa-times-circle',
  BulkApproveParticipations: 'fa-check-double',
  BulkRejectParticipations: 'fa-times-circle',
};

const ACTION_COLOR: Record<string, string> = {
  BlockUser: 'text-red-400',
  UnblockUser: 'text-green-400',
  ChangeUserRole: 'text-purple-400',
  PublishNews: 'text-green-400',
  UnpublishNews: 'text-yellow-400',
  ArchiveNews: 'text-gray-400',
  RestoreNews: 'text-blue-400',
  ApproveParticipation: 'text-green-400',
  RejectParticipation: 'text-red-400',
  BulkApproveParticipations: 'text-green-400',
  BulkRejectParticipations: 'text-red-400',
};

export function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntryDto[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAuditLog(skip, TAKE);
      // ✅ Исправление: защита от undefined
      setLogs(res.Items || []);
      setTotal(res.Total || 0);
    } catch (e) {
      console.error('Error loading audit log:', e);
      setLogs([]); // ✅ установить пустой массив при ошибке
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [skip]);

  useEffect(() => {
    load();
  }, [load]);

  const pages = Math.ceil(total / TAKE) || 1;
  const currentPage = Math.floor(skip / TAKE) + 1;

  return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Журнал аудита</h1>
          <p className="text-gray-500 text-sm mt-1">История действий администраторов</p>
        </div>

        {/* Loading */}
        {loading && (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
        )}

        {/* Audit Log Table */}
        {!loading && (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800/50 border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-300">Дата и время</th>
                    <th className="px-4 py-3 text-left text-gray-300">Администратор</th>
                    <th className="px-4 py-3 text-left text-gray-300">Действие</th>
                    <th className="px-4 py-3 text-left text-gray-300">Подробности</th>
                    <th className="px-4 py-3 text-left text-gray-300">IP адрес</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                  {logs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          Записей в журнале не найдено
                        </td>
                      </tr>
                  ) : (
                      logs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-800/50 transition">
                            <td className="px-4 py-3 text-gray-300 text-xs">
                              {new Date(log.createdAt).toLocaleString('ru-RU')}
                            </td>
                            <td className="px-4 py-3 text-white font-medium">{log.adminName}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <i
                                    className={`fas ${ACTION_ICON[log.actionType] || 'fa-question'} ${ACTION_COLOR[log.actionType] || 'text-gray-400'}`}
                                />
                                <span className="text-gray-300 text-xs">{log.actionType}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-gray-400 text-xs truncate max-w-xs">{log.details}</p>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{log.ipAddress || '-'}</td>
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
      </div>
  );
}