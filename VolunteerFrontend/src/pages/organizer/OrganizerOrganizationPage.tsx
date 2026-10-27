import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { organizationsApi } from '../../api/organizations';
import { organizerApi } from '../../api/organizer';
import { OrganizationForm } from '../../components/organizations/OrganizationForm';
import { CroppedImage } from '../../components/ImageCropper';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/PageStates';
import { Segmented } from '../../components/ui/Segmented';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { adminErrorMessage } from '../../utils/adminErrors';
import type { MemberRole, OrganizationDetails, OrganizationMember, OrganizationSummary } from '../../types/organization';

/** «Моя организация»: список организаций организатора. Если она одна — сразу её настройки. */
export function OrganizerOrganizationsPage() {
  const [orgs, setOrgs] = useState<OrganizationSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    organizerApi.summary().then(s => setOrgs(s.organizations)).catch(() => setError('Не удалось загрузить организации.'));
  };
  useEffect(load, []);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!orgs) return <LoadingState />;
  if (orgs.length === 0) return <EmptyState icon="fa-building-columns" title="Вы не организатор ни одной организации" hint="Администратор назначает организаторов на странице «Организации»." />;
  if (orgs.length === 1) return <OrganizerOrganizationPage organizationId={orgs[0].id} />;

  return (
    <div className="space-y-5">
      <PageHeader title="Мои организации" />
      <Card>
        <ul className="divide-y divide-line">
          {orgs.map(o => (
            <li key={o.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden border border-line bg-surface-3 flex items-center justify-center">
                {o.logoThumbnailUrl ? <CroppedImage src={o.logoThumbnailUrl} crop={o.logoCrop} aspect={1} className="w-full !rounded-none" /> : <i className="fas fa-hands-helping text-ink-400" aria-hidden />}
              </div>
              <p className="font-semibold text-ink-900 flex-1 truncate">{o.name}</p>
              <Link to={`/organizer/organizations/${o.id}`} className="btn btn-primary btn-sm no-underline">Управлять</Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/** Управление организацией: карточка (описание, контакты, движения, логотип, обложка) и участники. */
export function OrganizerOrganizationPage({ organizationId }: { organizationId?: string }) {
  const params = useParams<{ id: string }>();
  const id = organizationId ?? params.id ?? '';
  const { isAdmin } = useAuth();
  const { notify } = useNotification();
  const confirm = useConfirm();

  const [org, setOrg] = useState<OrganizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<MemberRole | ''>('');
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [membersTotal, setMembersTotal] = useState(0);
  const [membersLoading, setMembersLoading] = useState(false);

  const load = useCallback(() => {
    setError(null);
    organizationsApi.get(id).then(setOrg).catch(err => setError(adminErrorMessage(err, 'Не удалось загрузить организацию.')));
  }, [id]);
  useEffect(load, [load]);

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const page = await organizationsApi.members(id, role || undefined, 0, 100);
      setMembers(page.items); setMembersTotal(page.totalCount);
    } catch (err) { notify(adminErrorMessage(err, 'Не удалось загрузить участников.'), 'error'); }
    finally { setMembersLoading(false); }
  }, [id, role, notify]);
  useEffect(() => { void loadMembers(); }, [loadMembers]);

  const remove = async (m: OrganizationMember) => {
    const ok = await confirm({ message: `Исключить «${m.fullName}» из организации? Она пропадёт из его профиля.`, confirmLabel: 'Исключить', danger: true });
    if (!ok) return;
    try { await organizationsApi.removeMember(id, m.userId); notify('Участник исключён'); await loadMembers(); load(); }
    catch (err) { notify(adminErrorMessage(err, 'Не удалось исключить участника.'), 'error'); }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!org) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader title={org.shortName || org.name} description="Страница организации, которую видят посетители сайта."
        actions={<Link to={`/organizations/${org.id}`} className="btn btn-secondary btn-sm no-underline"><i className="fas fa-arrow-up-right-from-square" aria-hidden /> Открыть страницу</Link>} />

      <Card>
        <CardHeader title="Карточка организации" />
        <div className="p-5">
          <OrganizationForm key={org.id + (org.logoUrl ?? '') + (org.coverUrl ?? '')} initial={org}
            onSaved={saved => { setOrg(saved); notify('Организация сохранена'); }} />
        </div>
      </Card>

      <Card>
        <CardHeader title={`Участники${membersTotal ? ` (${membersTotal})` : ''}`}
          action={<Segmented<MemberRole | ''> label="Роль участника" value={role} onChange={setRole}
            options={[{ value: '', label: 'Все' }, { value: 'Organizer', label: 'Организаторы' }, { value: 'Volunteer', label: 'Волонтёры' }]} />} />
        {membersLoading ? <div className="p-5"><LoadingState /></div>
          : members.length === 0 ? <EmptyState icon="fa-users" title="Пока никого" hint="Волонтёры появятся здесь после того, как вы примете их заявки." />
          : (
            <ul className="divide-y divide-line">
              {members.map(m => (
                <li key={m.userId} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                  <Avatar name={m.fullName} src={m.avatarThumbnailUrl} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/users/${m.userId}`} className="font-semibold text-ink-900 hover:underline no-underline">{m.fullName}</Link>
                      <StatusBadge tone={m.role === 'Organizer' ? 'brand' : 'neutral'}>{m.role === 'Organizer' ? 'Организатор' : 'Волонтёр'}</StatusBadge>
                    </div>
                    <p className="meta">
                      {m.email && <a href={`mailto:${m.email}`} className="hover:underline">{m.email}</a>}
                      {m.phoneNumber && <> · {m.phoneNumber}</>}{m.city && <> · {m.city}</>} · с {new Date(m.joinedAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  {(m.role === 'Volunteer' || isAdmin) && <Button size="sm" variant="ghost" onClick={() => remove(m)} aria-label={`Исключить ${m.fullName}`}><i className="fas fa-user-minus" aria-hidden /> Исключить</Button>}
                </li>
              ))}
            </ul>
          )}
      </Card>
    </div>
  );
}
