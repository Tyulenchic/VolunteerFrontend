import { Link } from 'react-router-dom';
import { OrganizationBadge } from '../organizations/OrganizationBadge';
import type { PublicUserDto } from '../../types/user';

const ROLE_LABEL: Record<string, string> = { Volunteer: 'Волонтёр', Organizer: 'Организатор', Admin: 'Администратор' };

export const publicName = (u: PublicUserDto) =>
  [u.lastName, u.firstName, u.middleName].filter(Boolean).join(' ') || 'Пользователь'; // роль показывается отдельным бейджем, в имени её не дублируем

/**
 * Публичная страница человека (как во ВКонтакте): шапка с фото, сведения слева, мероприятия и организации справа.
 * Показывает только то, что сервер отдал для зрителя: скрытые владельцем поля приходят пустыми и блоки не рисуются.
 */
export function PublicProfileView({ user, isOwner = false }: { user: PublicUserDto; isOwner?: boolean }) {
  const name = publicName(user);
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const facts: Array<{ icon: string; label: string; value: string }> = [
    user.city && { icon: 'fa-map-marker-alt', label: 'Город', value: user.city },
    user.birthYear && { icon: 'fa-birthday-cake', label: 'Год рождения', value: String(user.birthYear) },
    user.phoneNumber && { icon: 'fa-phone', label: 'Телефон', value: user.phoneNumber },
    user.bookNumber && { icon: 'fa-id-card', label: 'Книжка добровольца', value: `№ ${user.bookNumber}` },
    { icon: 'fa-calendar-alt', label: 'На сайте с', value: new Date(user.createdAt).toLocaleDateString('ru-RU') },
  ].filter(Boolean) as Array<{ icon: string; label: string; value: string }>;

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-24 sm:h-32 bg-gradient-to-r from-primary/30 via-blue-400/20 to-teal-300/30" aria-hidden />
        <div className="px-6 pb-6 -mt-12 flex flex-col sm:flex-row sm:items-end gap-4">
          {user.avatarUrl
            ? <img src={user.avatarUrl} alt={name} className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white shadow-md bg-white" />
            : <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white shadow-md bg-primary/10 flex items-center justify-center">
                <span className="text-3xl font-bold text-primary">{initials}</span>
              </div>}
          <div className="flex-1 min-w-0 sm:pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 break-words">{name}</h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-primary/10 text-primary">{ROLE_LABEL[user.role]}</span>
              {isOwner && <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">Так видят вас другие</span>}
            </div>
            {user.bio && <p className="text-gray-600 mt-2 whitespace-pre-line">{user.bio}</p>}
          </div>
        </div>
      </section>

      {user.isClosed && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <i className="fas fa-lock text-3xl text-gray-300 mb-3" aria-hidden />
          <p className="font-semibold text-gray-700">Профиль закрыт</p>
          <p className="text-sm text-gray-400 mt-1">Пользователь ограничил доступ к своей странице.</p>
        </section>
      )}

      {!user.isClosed && <div className="grid gap-5 lg:grid-cols-3">
        <aside className="space-y-5 lg:col-span-1">
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Сведения</h2>
            <dl className="space-y-3 text-sm">
              {facts.map(f => (
                <div key={f.label} className="flex items-start gap-3">
                  <i className={`fas ${f.icon} text-primary w-4 text-center mt-0.5`} aria-hidden />
                  <div className="min-w-0"><dt className="text-gray-400 text-xs">{f.label}</dt><dd className="text-gray-800 break-words">{f.value}</dd></div>
                </div>
              ))}
            </dl>
          </section>
          {user.socialLinks.length > 0 && (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Ссылки</h2>
              <ul className="space-y-2">
                {user.socialLinks.map(link => (
                  <li key={link}><a href={link} target="_blank" rel="noopener noreferrer nofollow" className="text-primary hover:underline text-sm break-all">
                    <i className="fas fa-link mr-1" aria-hidden />{link.replace(/^https:\/\//, '')}</a></li>
                ))}
              </ul>
            </section>
          )}
        </aside>

        <div className="space-y-5 lg:col-span-2">
          {user.organizations && user.organizations.length > 0 && (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Организации</h2>
              <ul className="flex flex-wrap gap-2" aria-label="Организации">
                {user.organizations.map(o => (
                  <li key={o.id}><OrganizationBadge organization={o} size="md" className="px-3 py-1.5 bg-teal-50 border border-teal-100 rounded-full" /></li>
                ))}
              </ul>
            </section>
          )}
          {user.events && (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Участие в мероприятиях</h2>
              {user.events.length === 0
                ? <p className="text-sm text-gray-400">Пока нет подтверждённых участий</p>
                : <ul className="divide-y divide-gray-100">
                    {user.events.map(ev => (
                      <li key={ev.eventId} className="flex justify-between gap-3 py-2 text-sm">
                        <Link to={`/events/${ev.eventId}`} className="text-primary hover:underline">{ev.title}</Link>
                        <span className="text-gray-400 whitespace-nowrap">{new Date(ev.startsAt).toLocaleDateString('ru-RU')}</span>
                      </li>
                    ))}
                  </ul>}
            </section>
          )}
          {!user.events && !(user.organizations && user.organizations.length) && (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-sm text-gray-400">
              Пользователь не показывает мероприятия и организации
            </section>
          )}
        </div>
      </div>}
    </div>
  );
}
