import type { UserNotification } from '../api/notifications';

interface TargetIds { eventId?: string; organizationId?: string; postId?: string; newsId?: string; }

/** Идентификаторы из JSON уведомления; повреждённые или пустые данные дают пустой объект, а не ошибку. */
export function parseNotificationData(data: string | null): TargetIds {
  if (!data) return {};
  try {
    const parsed: unknown = JSON.parse(data);
    return parsed && typeof parsed === 'object' ? (parsed as TargetIds) : {};
  } catch {
    return {};
  }
}

/** Служебные уведомления ведут в рабочие разделы; остальные — к самому предмету (мероприятию, новости, организации). */
const STAFF_ROUTES: Record<string, { admin?: string; organizer?: string }> = {
  AvatarPendingModeration: { admin: '/admin/moderation' },
  FeedbackReceived: { admin: '/admin/feedback' },
  UserComplaintReceived: { admin: '/admin/moderation' },
  NewOrganizationApplication: { admin: '/admin/organizations', organizer: '/organizer/applications' },
  NewParticipationApplication: { admin: '/admin/participations', organizer: '/organizer/participations' },
};

/**
 * Куда вести по нажатию на уведомление. null — перехода нет (уведомление только читается).
 * isAdmin/isOrganizer нужны, чтобы служебные уведомления вели в раздел той роли, которая их получила.
 */
export function notificationTarget(n: Pick<UserNotification, 'type' | 'data'>, role: { isAdmin: boolean; isOrganizer: boolean }): string | null {
  const staff = STAFF_ROUTES[n.type];
  if (staff) {
    const route = role.isAdmin ? staff.admin ?? staff.organizer : role.isOrganizer ? staff.organizer ?? staff.admin : undefined;
    if (route) return route;
  }
  const ids = parseNotificationData(n.data);
  switch (n.type) {
    case 'NewsPublished':
      return ids.newsId ? `/news/${ids.newsId}` : null;
    case 'NewOrganizationPost':
    case 'MembershipApproved':
    case 'MembershipRejected':
      return ids.organizationId ? `/organizations/${ids.organizationId}` : null;
    default:
      return ids.eventId ? `/events/${ids.eventId}` : ids.organizationId ? `/organizations/${ids.organizationId}` : null;
  }
}

/** Значок (Font Awesome) и цвет по типу уведомления. */
export function notificationIcon(type: string): { icon: string; color: string } {
  switch (type) {
    case 'ParticipationApproved': return { icon: 'fa-circle-check', color: 'text-green-600 bg-green-50' };
    case 'ParticipationRejected': return { icon: 'fa-circle-xmark', color: 'text-red-600 bg-red-50' };
    case 'ParticipationCancelledByVolunteer': return { icon: 'fa-user-minus', color: 'text-amber-600 bg-amber-50' };
    case 'ParticipatedEventCancelled':
    case 'EventCancelled': return { icon: 'fa-ban', color: 'text-red-600 bg-red-50' };
    case 'ParticipatedEventRescheduled': return { icon: 'fa-clock', color: 'text-amber-600 bg-amber-50' };
    case 'NewEventInOrganization':
    case 'NewEventPublished': return { icon: 'fa-calendar-plus', color: 'text-blue-600 bg-blue-50' };
    case 'NewOrganizationPost': return { icon: 'fa-pen-to-square', color: 'text-blue-600 bg-blue-50' };
    case 'NewsPublished': return { icon: 'fa-newspaper', color: 'text-indigo-600 bg-indigo-50' };
    case 'MembershipApproved': return { icon: 'fa-people-group', color: 'text-green-600 bg-green-50' };
    case 'MembershipRejected': return { icon: 'fa-people-group', color: 'text-red-600 bg-red-50' };
    case 'FeedbackReceived': return { icon: 'fa-envelope', color: 'text-blue-600 bg-blue-50' };
    case 'SuspiciousLoginAttempt': return { icon: 'fa-shield-halved', color: 'text-red-600 bg-red-50' };
    default: return { icon: 'fa-bell', color: 'text-gray-600 bg-gray-100' };
  }
}

/** «только что», «5 мин назад», «вчера», затем дата — как в соцсетях. now передаётся для проверяемости. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const seconds = Math.max(0, Math.round((now.getTime() - then.getTime()) / 1000));
  if (seconds < 60) return 'только что';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'вчера';
  if (days < 7) return `${days} дн назад`;
  return then.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: then.getFullYear() === now.getFullYear() ? undefined : 'numeric' });
}
