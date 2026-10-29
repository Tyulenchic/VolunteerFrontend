import { useCallback, useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { organizationsApi } from '../../api/organizations';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { CroppedImage } from '../ImageCropper';
import { Spinner } from '../Spinner';
import {
  APPLICATION_STATUS_LABEL, MAX_VOLUNTEER_ORGANIZATIONS,
  type Membership, type OrganizationApplication,
} from '../../types/organization';

const BADGE: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700', Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700', Withdrawn: 'bg-gray-100 text-gray-600',
};
const errorText = (err: unknown, fallback: string) =>
  axios.isAxiosError(err) && typeof err.response?.data?.error === 'string' ? err.response.data.error : fallback;

/**
 * «Мои организации» в профиле: организации, где пользователь состоит (появляются сами, когда организатор принимает заявку),
 * и его заявки. Волонтёр может состоять не более чем в двух организациях.
 */
export function MyOrganizationsPanel() {
  const { user } = useAuth();
  const { notify } = useNotification();
  const [memberships, setMemberships] = useState<Membership[] | null>(null);
  const [applications, setApplications] = useState<OrganizationApplication[]>([]);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const [m, a] = await Promise.all([organizationsApi.myMemberships(), organizationsApi.myApplications()]);
      setMemberships(m); setApplications(a);
    } catch { setFailed(true); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const leave = async (m: Membership) => {
    if (!window.confirm(`Выйти из «${m.organization.name}»? Организация пропадёт из вашего профиля.`)) return;
    setBusy(m.organization.id);
    try { await organizationsApi.leave(m.organization.id); notify('Вы вышли из организации', 'info'); await load(); }
    catch (err) { notify(errorText(err, 'Не удалось выйти из организации.'), 'error'); }
    finally { setBusy(null); }
  };
  const withdraw = async (a: OrganizationApplication) => {
    setBusy(a.id);
    try { await organizationsApi.withdraw(a.id); notify('Заявка отозвана', 'info'); await load(); }
    catch (err) { notify(errorText(err, 'Не удалось отозвать заявку.'), 'error'); }
    finally { setBusy(null); }
  };

  if (failed) return <p className="vol-text-sm">Не удалось загрузить организации. <button className="press-flat font-semibold text-primary underline" onClick={() => void load()}>Повторить</button></p>;
  if (!memberships) return <div className="flex justify-center py-8"><Spinner /></div>;

  const volunteerCount = memberships.filter(m => m.role === 'Volunteer').length;
  const history = applications.filter(a => a.status !== 'Pending');
  const pending = applications.filter(a => a.status === 'Pending');

  return (
    <div className="space-y-8">
      <section>
        <h2 className="vol-h3 mb-1">Мои организации</h2>
        {user?.role === 'Volunteer' && (
          <p className="vol-text-sm mb-4">Вы состоите в {volunteerCount} из {MAX_VOLUNTEER_ORGANIZATIONS} возможных организаций. Организация добавляется автоматически, когда организатор принимает вашу заявку.</p>
        )}
        {memberships.length === 0 ? (
          <div className="rounded-panel bg-vol-bg py-10 text-center">
            <i className="fas fa-building-columns mb-3 text-3xl text-vol-rule" aria-hidden />
            <p className="vol-text-sm mb-5">Вы пока не состоите ни в одной организации.</p>
            <Button to="/organizations" size="lg">Найти организацию</Button>
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-4">
            {memberships.map(m => (
              <li key={m.organization.id} className="flex items-center gap-3 rounded-card border border-vol-line bg-vol-surface p-3 sm:gap-4 sm:p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-card border border-vol-line bg-vol-bg sm:h-14 sm:w-14">
                  {m.organization.logoThumbnailUrl
                    ? <CroppedImage src={m.organization.logoThumbnailUrl} crop={m.organization.logoCrop} aspect={1} className="w-full !rounded-none" />
                    : <i className="fas fa-hands-helping text-primary" aria-hidden />}
                </div>
                <div className="min-w-0 flex-1">
                  <Link to={`/organizations/${m.organization.id}`} className="block truncate font-semibold text-vol-fg no-underline hover:text-vol-accent">{m.organization.name}</Link>
                  <p className="vol-meta">{m.role === 'Organizer' ? 'Организатор' : 'Волонтёр'} · с {new Date(m.joinedAt).toLocaleDateString('ru-RU')}</p>
                </div>
                {m.role === 'Volunteer' && (
                  <button onClick={() => leave(m)} disabled={busy === m.organization.id} className="press-flat h-9 shrink-0 rounded-control px-3 text-ctrl font-medium text-vol-warn hover:bg-red-50 disabled:opacity-50">Выйти</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {pending.length > 0 && (
        <section>
          <h3 className="vol-h3 mb-3">Заявки на рассмотрении</h3>
          <ul className="space-y-2">
            {pending.map(a => (
              <li key={a.id} className="flex items-center gap-3 rounded-card border border-amber-200 bg-amber-50 p-3">
                <Link to={`/organizations/${a.organizationId}`} className="min-w-0 flex-1 truncate font-medium text-vol-fg no-underline hover:text-vol-accent">{a.organizationName}</Link>
                <span className="vol-meta">{new Date(a.createdAt).toLocaleDateString('ru-RU')}</span>
                <button onClick={() => withdraw(a)} disabled={busy === a.id} className="press-flat h-9 shrink-0 rounded-control px-3 text-ctrl font-medium text-vol-muted hover:bg-white disabled:opacity-50">Отозвать</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {history.length > 0 && (
        <section>
          <h3 className="vol-h3 mb-3">История заявок</h3>
          <ul className="space-y-2">
            {history.map(a => (
              <li key={a.id} className="rounded-card border border-vol-line p-3">
                <div className="flex items-center gap-3">
                  <Link to={`/organizations/${a.organizationId}`} className="min-w-0 flex-1 truncate font-medium text-vol-fg no-underline hover:text-vol-accent">{a.organizationName}</Link>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-meta font-semibold ${BADGE[a.status]}`}>{APPLICATION_STATUS_LABEL[a.status]}</span>
                </div>
                {a.decisionNote && <p className="vol-text-sm mt-1">Комментарий организатора: {a.decisionNote}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
