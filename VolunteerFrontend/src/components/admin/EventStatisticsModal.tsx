import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import type { AdminEventStatisticsDto } from '../../types/admin';
import { adminErrorMessage } from '../../utils/adminErrors';
import { Modal } from '../Modal';
import { Occupancy, capacityFromFreeSlots } from '../ui/Occupancy';
import { ErrorState } from '../ui/PageStates';
import { ListSkeleton } from '../ui/Skeleton';

/** Статистика мероприятия: заявки по статусам и заполненность. Место занимают одобренные и подтвердившие присутствие. */
export function EventStatisticsModal({ eventId, title, onClose }: { eventId: string; title: string; onClose: () => void }) {
  const [stats, setStats] = useState<AdminEventStatisticsDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    adminApi.getEventStatistics(eventId)
      .then(s => { if (alive) { setStats(s); setError(null); } })
      .catch(err => { if (alive) setError(adminErrorMessage(err, 'Не удалось загрузить статистику.')); });
    return () => { alive = false; };
  }, [eventId, attempt]);

  const occupied = stats ? stats.approvedParticipants + stats.attendanceConfirmed : 0;
  const pending = stats ? stats.totalApplications - stats.approvedParticipants - stats.rejectedParticipants - stats.attendanceConfirmed : 0;

  return (
    <Modal isOpen onClose={onClose} title={`Статистика: ${title}`}>
      {error ? <ErrorState message={error} onRetry={() => setAttempt(a => a + 1)} />
        : !stats ? <ListSkeleton />
        : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <Tile label="Всего заявок" value={stats.totalApplications} />
              <Tile label="Ожидают решения" value={Math.max(0, pending)} />
              <Tile label="Одобрено" value={stats.approvedParticipants} />
              <Tile label="Отклонено" value={stats.rejectedParticipants} />
              <Tile label="Присутствовали" value={stats.attendanceConfirmed} />
              <Tile label="Свободных мест" value={stats.freeSlots < 0 ? 'без лимита' : stats.freeSlots} />
            </div>
            <div>
              <p className="meta mb-1.5">Заполненность{stats.freeSlots >= 0 ? `: ${Math.round(stats.fillPercentage)}%` : ''}</p>
              <Occupancy approved={occupied} max={capacityFromFreeSlots(occupied, stats.freeSlots)} />
            </div>
          </div>
        )}
    </Modal>
  );
}

function Tile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="p-3 bg-surface-3 rounded-lg">
      <p className="text-ink-500 text-xs">{label}</p>
      <p className="text-ink-900 text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}
