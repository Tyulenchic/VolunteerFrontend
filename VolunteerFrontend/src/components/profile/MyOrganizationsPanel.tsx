import { useCallback, useEffect, useState } from 'react';
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

  if (failed) return <p className="text-gray-600">Не удалось загрузить организации. <button className="text-primary underline" onClick={() => void load()}>Повторить</button></p>;
  if (!memberships) return <div className="flex justify-center py-8"><Spinner /></div>;

  const volunteerCount = memberships.filter(m => m.role === 'Volunteer').length;
  const history = applications.filter(a => a.status !== 'Pending');
  const pending = applications.filter(a => a.status === 'Pending');

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Мои организации</h2>
        {user?.role === 'Volunteer' && (
          <p className="text-sm text-gray-500 mb-4">Вы состоите в {volunteerCount} из {MAX_VOLUNTEER_ORGANIZATIONS} возможных организаций. Организация добавляется автоматически, когда организатор принимает вашу заявку.</p>
        )}
        {memberships.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-2xl">
            <i className="fas fa-building-columns text-3xl text-gray-300 mb-3" aria-hidden />
            <p className="text-gray-600 mb-4">Вы пока не состоите ни в одной организации.</p>
            <Link to="/organizations" className="inline-block px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition no-underline">Найти организацию</Link>
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-4">
            {memberships.map(m => (
              <li key={m.organization.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-2xl">
                <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                  {m.organization.logoThumbnailUrl
                    ? <CroppedImage src={m.organization.logoThumbnailUrl} crop={m.organization.logoCrop} aspect={1} className="w-full !rounded-none" />
                    : <i className="fas fa-hands-helping text-teal-500" aria-hidden />}
                </div>
                <div className="min-w-0 flex-1">
                  <Link to={`/organizations/${m.organization.id}`} className="font-semibold text-gray-900 hover:text-primary no-underline block truncate">{m.organization.name}</Link>
                  <p className="text-xs text-gray-500">{m.role === 'Organizer' ? 'Организатор' : 'Волонтёр'} · с {new Date(m.joinedAt).toLocaleDateString('ru-RU')}</p>
                </div>
                {m.role === 'Volunteer' && (
                  <button onClick={() => leave(m)} disabled={busy === m.organization.id} className="text-sm text-red-600 hover:underline disabled:opacity-50">Выйти</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {pending.length > 0 && (
        <section>
          <h3 className="font-bold text-gray-900 mb-3">Заявки на рассмотрении</h3>
          <ul className="space-y-2">
            {pending.map(a => (
              <li key={a.id} className="flex items-center gap-3 p-3 border border-amber-200 bg-amber-50 rounded-xl">
                <Link to={`/organizations/${a.organizationId}`} className="flex-1 font-medium text-gray-900 hover:text-primary no-underline truncate">{a.organizationName}</Link>
                <span className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleDateString('ru-RU')}</span>
                <button onClick={() => withdraw(a)} disabled={busy === a.id} className="text-sm text-gray-600 hover:underline disabled:opacity-50">Отозвать</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {history.length > 0 && (
        <section>
          <h3 className="font-bold text-gray-900 mb-3">История заявок</h3>
          <ul className="space-y-2">
            {history.map(a => (
              <li key={a.id} className="p-3 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <Link to={`/organizations/${a.organizationId}`} className="flex-1 font-medium text-gray-900 hover:text-primary no-underline truncate">{a.organizationName}</Link>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${BADGE[a.status]}`}>{APPLICATION_STATUS_LABEL[a.status]}</span>
                </div>
                {a.decisionNote && <p className="text-sm text-gray-600 mt-1">Комментарий организатора: {a.decisionNote}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
