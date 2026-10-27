// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { notificationIcon, notificationTarget, parseNotificationData, timeAgo } from './notifications';

const volunteer = { isAdmin: false, isOrganizer: false };
const organizer = { isAdmin: false, isOrganizer: true };
const admin = { isAdmin: true, isOrganizer: false };
const json = (o: object) => JSON.stringify(o);

describe('переходы по уведомлениям', () => {
  it('решение по заявке ведёт к мероприятию', () => {
    expect(notificationTarget({ type: 'ParticipationApproved', data: json({ eventId: 'e1' }) }, volunteer)).toBe('/events/e1');
    expect(notificationTarget({ type: 'ParticipationRejected', data: json({ eventId: 'e2' }) }, volunteer)).toBe('/events/e2');
  });

  it('новость, запись организации и решение о вступлении ведут к своему предмету', () => {
    expect(notificationTarget({ type: 'NewsPublished', data: json({ newsId: 'n1' }) }, volunteer)).toBe('/news/n1');
    expect(notificationTarget({ type: 'NewOrganizationPost', data: json({ organizationId: 'o1', postId: 'p1', eventId: 'e9' }) }, volunteer))
      .toBe('/organizations/o1');
    expect(notificationTarget({ type: 'MembershipApproved', data: json({ organizationId: 'o2' }) }, volunteer)).toBe('/organizations/o2');
  });

  it('новое мероприятие организации ведёт к мероприятию', () => {
    expect(notificationTarget({ type: 'NewEventInOrganization', data: json({ eventId: 'e3', organizationId: 'o3' }) }, volunteer)).toBe('/events/e3');
  });

  it('служебные уведомления ведут в раздел той роли, которая их получила', () => {
    expect(notificationTarget({ type: 'NewParticipationApplication', data: null }, organizer)).toBe('/organizer/participations');
    expect(notificationTarget({ type: 'NewParticipationApplication', data: null }, admin)).toBe('/admin/participations');
    expect(notificationTarget({ type: 'FeedbackReceived', data: null }, admin)).toBe('/admin/feedback');
    expect(notificationTarget({ type: 'AvatarPendingModeration', data: null }, admin)).toBe('/admin/moderation');
  });

  it('без данных и с повреждёнными данными перехода нет, но и ошибки нет', () => {
    expect(notificationTarget({ type: 'ParticipationApproved', data: null }, volunteer)).toBeNull();
    expect(notificationTarget({ type: 'ParticipationApproved', data: '{не json' }, volunteer)).toBeNull();
    expect(parseNotificationData('123')).toEqual({});
    expect(parseNotificationData('null')).toEqual({});
  });

  it('у каждого типа есть значок', () => {
    for (const t of ['ParticipationApproved', 'NewsPublished', 'FeedbackReceived', 'Unknown']) {
      expect(notificationIcon(t).icon).toMatch(/^fa-/);
    }
  });
});

describe('время «как в соцсетях»', () => {
  const now = new Date('2026-10-19T12:00:00Z');
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();

  it('подписывает недавнее относительно', () => {
    expect(timeAgo(ago(20_000), now)).toBe('только что');
    expect(timeAgo(ago(5 * 60_000), now)).toBe('5 мин назад');
    expect(timeAgo(ago(3 * 3_600_000), now)).toBe('3 ч назад');
    expect(timeAgo(ago(30 * 3_600_000), now)).toBe('вчера');
    expect(timeAgo(ago(4 * 86_400_000), now)).toBe('4 дн назад');
  });

  it('старое показывает датой, а время из будущего не уходит в минус', () => {
    expect(timeAgo(ago(40 * 86_400_000), now)).toMatch(/сентября|августа/);
    expect(timeAgo(new Date(now.getTime() + 60_000).toISOString(), now)).toBe('только что');
  });
});
