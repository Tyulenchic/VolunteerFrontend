import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { OrganizationBadge } from '../organizations/OrganizationBadge';
import { Avatar } from '../ui/Avatar';
import { Heading } from '../ui/Heading';
import { VolIcon, type IconName } from '../afisha/VolIcon';
import type { PublicUserDto } from '../../types/user';

const ROLE_LABEL: Record<string, string> = { Volunteer: 'Волонтёр', Organizer: 'Организатор', Admin: 'Администратор' };
const ROLE_ICON: Record<string, IconName> = { Volunteer: 'handheart', Organizer: 'flag', Admin: 'award' };

export const publicName = (u: PublicUserDto) =>
  [u.lastName, u.firstName, u.middleName].filter(Boolean).join(' ') || 'Пользователь'; // роль показывается отдельным бейджем, в имени её не дублируем

const fmtDate = (s: string) => new Date(s).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtMonth = (s: string) => new Date(s).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

/** Блок профиля: белая карточка с заголовком H3 и иконкой. */
function Panel({ icon, title, children, className = '' }: { icon: IconName; title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-vol-line bg-vol-surface p-5 sm:p-6 ${className}`}>
      <h2 className="vol-h3 mb-4 flex items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-vol-accent-soft text-vol-accent" aria-hidden><VolIcon n={icon} size={16} /></span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Спокойное пустое состояние внутри блока: объясняет, почему пусто, а не оставляет дыру. */
function Empty({ children }: { children: ReactNode }) {
  return <p className="vol-text-sm rounded-xl bg-vol-bg px-4 py-3">{children}</p>;
}

/**
 * Публичная страница человека: шапка с фоном, фото и именем, рядом сведения, организации и участие в мероприятиях.
 * Показывает только то, что сервер отдал для зрителя: скрытые владельцем поля приходят пустыми (null) и нигде не
 * появляются — ни в заголовке, ни в подписи фото, ни в alt. Пустые блоки не рисуются «дырой»: либо поясняющее
 * сообщение, либо блок не показывается вовсе.
 */
export function PublicProfileView({ user, isOwner = false }: { user: PublicUserDto; isOwner?: boolean }) {
  const name = publicName(user);
  const nameHidden = !user.firstName && !user.lastName && !user.middleName;
  const orgs = user.organizations ?? null;
  const events = user.events ?? null;

  const facts: Array<{ icon: IconName; label: string; value: string }> = [
    user.city && { icon: 'pin' as IconName, label: 'Город', value: user.city },
    user.birthYear && { icon: 'cal' as IconName, label: 'Год рождения', value: String(user.birthYear) },
    user.phoneNumber && { icon: 'phone' as IconName, label: 'Телефон', value: user.phoneNumber },
    user.bookNumber && { icon: 'idcard' as IconName, label: 'Книжка добровольца', value: `№ ${user.bookNumber}` },
    { icon: 'calcheck' as IconName, label: 'На сайте с', value: fmtDate(user.createdAt) },
  ].filter(Boolean) as Array<{ icon: IconName; label: string; value: string }>;

  const stats = [
    events && { n: events.length, label: 'мероприятий с подтверждённым участием' },
    orgs && { n: orgs.length, label: orgs.length === 1 ? 'организация' : 'организаций' },
  ].filter(Boolean) as Array<{ n: number; label: string }>;

  return (
    <div className="space-y-5">
      {/* ── Шапка ── */}
      <section className="vol-profile-hero relative overflow-hidden rounded-3xl border border-vol-line bg-vol-surface">
        <div className="vol-profile-cover h-28 sm:h-36" aria-hidden />
        <div className="relative px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:gap-6">
            <Avatar name={nameHidden ? '?' : name} thumb={user.avatarThumbnailUrl} src={user.avatarUrl} crop={user.avatarCrop}
              size="xl" square className="border-4 border-white bg-white shadow-[0_10px_28px_rgba(11,32,56,.14)]" />
            <div className="min-w-0 flex-1 sm:pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-vol-accent-soft px-3 py-1 text-meta font-semibold text-primary-dark">
                  <VolIcon n={ROLE_ICON[user.role] ?? 'user'} size={13} />{ROLE_LABEL[user.role]}
                </span>
                {isOwner && <span className="rounded-full bg-vol-bg px-3 py-1 text-meta font-semibold text-vol-muted">Так видят вас другие</span>}
              </div>
              <Heading level={isOwner ? 2 : 1} look="h1-detail" className="mt-2">{name}</Heading>
              <p className="vol-meta mt-1.5">
                На сайте с {fmtMonth(user.createdAt)}{user.city && <> · {user.city}</>}
              </p>
            </div>
          </div>
          {user.bio && <p className="vol-text mt-5 max-w-[68ch] whitespace-pre-line">{user.bio}</p>}
          {stats.length > 0 && !user.isClosed && (
            <dl className="mt-6 flex flex-wrap gap-3">
              {stats.map(s => (
                <div key={s.label} className="flex min-w-[9rem] items-baseline gap-2 rounded-xl bg-vol-bg px-4 py-2.5">
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="font-display text-compact font-bold leading-none text-vol-head tabular-nums">{s.n}</dd>
                  <span className="vol-meta" aria-hidden>{s.label}</span>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      {user.isClosed ? (
        <section className="rounded-2xl border border-vol-line bg-vol-surface px-6 py-10 text-center">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-vol-accent-soft text-vol-accent" aria-hidden>
            <i className="fas fa-lock text-xl" />
          </span>
          <p className="vol-h3">Профиль закрыт</p>
          <p className="vol-text-sm mx-auto mt-1 max-w-[40ch]">Пользователь ограничил доступ к своей странице.</p>
        </section>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <aside className="space-y-5 lg:col-span-1">
            <Panel icon="info" title="Сведения">
              <dl className="space-y-3.5">
                {facts.map(f => (
                  <div key={f.label} className="flex items-start gap-3">
                    <VolIcon n={f.icon} size={16} className="mt-0.5 shrink-0 text-vol-accent" />
                    <div className="min-w-0">
                      <dt className="vol-meta">{f.label}</dt>
                      <dd className="text-body-sm text-vol-fg break-words">{f.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </Panel>
            {user.socialLinks.length > 0 && (
              <Panel icon="chat" title="Ссылки">
                <ul className="space-y-2">
                  {user.socialLinks.map(link => (
                    <li key={link}>
                      <a href={link} target="_blank" rel="noopener noreferrer nofollow" className="text-body-sm text-vol-accent hover:underline break-all">
                        <i className="fas fa-link mr-1.5" aria-hidden />{link.replace(/^https:\/\//, '')}
                      </a>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </aside>

          <div className="space-y-5 lg:col-span-2">
            {orgs && (
              <Panel icon="users" title="Организации">
                {orgs.length === 0
                  ? <Empty>Пока не состоит ни в одной организации.</Empty>
                  : (
                    <ul className="flex flex-wrap gap-2" aria-label="Организации">
                      {orgs.map(o => (
                        <li key={o.id}><OrganizationBadge organization={o} size="md" className="rounded-full border border-vol-line bg-vol-bg px-3 py-1.5" /></li>
                      ))}
                    </ul>
                  )}
              </Panel>
            )}
            {events && (
              <Panel icon="calcheck" title="Участие в мероприятиях">
                {events.length === 0
                  ? <Empty>Подтверждённых участий пока нет — они появятся после первых мероприятий.</Empty>
                  : (
                    <ul className="divide-y divide-vol-line">
                      {events.map(ev => (
                        <li key={ev.eventId} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5">
                          <Link to={`/events/${ev.eventId}`} className="min-w-0 text-body-sm font-medium text-vol-fg hover:text-vol-accent break-words">{ev.title}</Link>
                          <time className="vol-meta whitespace-nowrap" dateTime={ev.startsAt}>{fmtDate(ev.startsAt)}</time>
                        </li>
                      ))}
                    </ul>
                  )}
              </Panel>
            )}
            {!orgs && !events && (
              <section className="vol-media-empty relative overflow-hidden rounded-2xl border border-vol-line px-6 py-10 text-center">
                <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white/80 text-vol-accent" aria-hidden>
                  <VolIcon n="handheart" size={26} />
                </span>
                <p className="vol-h3">Активность скрыта</p>
                <p className="vol-text-sm mx-auto mt-1 max-w-[44ch]">
                  {isOwner
                    ? 'Вы не показываете посетителям мероприятия и организации. Это можно изменить во вкладке «Настройки» → «Видимость в публичном профиле».'
                    : 'Пользователь решил не показывать мероприятия и организации.'}
                </p>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
