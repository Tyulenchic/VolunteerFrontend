import type { UserNotification } from '../../api/notifications';
import { notificationIcon, timeAgo } from '../../utils/notifications';

/** Одна строка списка уведомлений: значок по типу, заголовок, текст, время, точка «не прочитано». */
export function NotificationRow({ n, onOpen, compact = false }: { n: UserNotification; onOpen: (n: UserNotification) => void; compact?: boolean }) {
  const { icon, color } = notificationIcon(n.type);
  return (
    <button type="button" onClick={() => onOpen(n)}
      className={`flex w-full items-start gap-3 text-left transition hover:bg-gray-50 ${compact ? 'px-4 py-3' : 'px-5 py-4'} ${n.isRead ? '' : 'bg-blue-50/40'}`}>
      <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${color}`} aria-hidden>
        <i className={`fas ${icon} text-sm`} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[13.5px] leading-snug text-gray-900 ${n.isRead ? 'font-medium' : 'font-semibold'}`}>{n.title}</span>
        {n.message && <span className={`mt-0.5 block text-[13px] leading-snug text-gray-600 ${compact ? 'line-clamp-2' : ''}`}>{n.message}</span>}
        <span className="mt-1 block text-[12px] text-gray-400">{timeAgo(n.createdAt)}</span>
      </span>
      {!n.isRead && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" aria-label="Не прочитано" />}
    </button>
  );
}
