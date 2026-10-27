import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { organizationsApi } from '../../api/organizations';
import { CroppedImage } from '../../components/ImageCropper';
import { Modal } from '../../components/Modal';
import { OrganizationForm } from '../../components/organizations/OrganizationForm';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { SearchInput } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState, ErrorState } from '../../components/ui/PageStates';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { useDebounced, useLatestRequest, usePaging } from '../../hooks/useListHelpers';
import { adminErrorMessage } from '../../utils/adminErrors';
import { LEVEL_LABEL, type OrganizationDetails, type OrganizationListItem, type OrganizationMember, type UnassignedOrganizer } from '../../types/organization';
import type { AdminUserListItemDto } from '../../types/admin';

const TAKE = 20;

/** Организации: создание, изменение, архив и назначение организаторов (их в организации может быть несколько). */
export function AdminOrganizationsPage() {
  const { notify } = useNotification();
  const confirm = useConfirm();
  const begin = useLatestRequest();

  const [searchInput, setSearchInput] = useState('');
  const search = useDebounced(searchInput);
  const [skip, setSkip] = usePaging(search);
  const [items, setItems] = useState<OrganizationListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<{ open: boolean; org: OrganizationDetails | null }>({ open: false, org: null });
  const [organizersOf, setOrganizersOf] = useState<OrganizationListItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const isCurrent = begin();
    setLoading(true); setError(null);
    try {
      const page = await organizationsApi.list({ skip, take: TAKE, search: search || undefined });
      if (!isCurrent()) return;
      setItems(page.items); setTotal(page.totalCount);
    } catch (err) {
      if (isCurrent()) setError(adminErrorMessage(err, 'Не удалось загрузить организации.'));
    } finally { if (isCurrent()) setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, search]);
  useEffect(() => { void load(); }, [load]);

  const edit = async (o: OrganizationListItem) => {
    try { setForm({ open: true, org: await organizationsApi.get(o.id) }); }
    catch (err) { notify(adminErrorMessage(err, 'Не удалось открыть организацию.'), 'error'); }
  };

  const toggleArchive = async (o: OrganizationListItem) => {
    const archive = o.isActive;
    if (archive && !(await confirm({ message: `Архивировать «${o.name}»? Страница исчезнет для посетителей, новые заявки и мероприятия станут недоступны.`, confirmLabel: 'Архивировать', danger: true }))) return;
    setBusyId(o.id);
    try { await (archive ? organizationsApi.archive(o.id) : organizationsApi.activate(o.id)); notify(archive ? 'Организация в архиве' : 'Организация восстановлена'); await load(); }
    catch (err) { notify(adminErrorMessage(err, 'Не удалось изменить статус.'), 'error'); }
    finally { setBusyId(null); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Организации" description="Создавайте организации и назначайте организаторов — они будут вести мероприятия, публикации и принимать волонтёров."
        actions={<Button onClick={() => setForm({ open: true, org: null })}><i className="fas fa-plus" aria-hidden /> Создать организацию</Button>} />

      <UnassignedOrganizers onAssigned={() => void load()} />

      <SearchInput value={searchInput} onChange={setSearchInput} label="Поиск организации" placeholder="Название или описание" />

      {error ? <ErrorState message={error} onRetry={load} />
        : loading ? <ListSkeleton />
        : items.length === 0 ? <EmptyState icon="fa-building-columns" title="Организаций нет" hint="Создайте организацию или импортируйте справочник: scripts/import-organizations.mjs." />
        : (
          <Card>
            <ul className="divide-y divide-line">
              {items.map(o => (
                <li key={o.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden border border-line bg-surface-3 flex items-center justify-center">
                    {o.logoThumbnailUrl ? <CroppedImage src={o.logoThumbnailUrl} crop={o.logoCrop} aspect={1} className="w-full !rounded-none" /> : <i className="fas fa-hands-helping text-ink-400" aria-hidden />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/organizations/${o.id}`} className="font-semibold text-ink-900 hover:underline no-underline">{o.shortName || o.name}</Link>
                      {!o.isActive && <StatusBadge tone="neutral">В архиве</StatusBadge>}
                    </div>
                    <p className="meta">{LEVEL_LABEL[o.level]}{o.city ? ` · ${o.city}` : ''} · волонтёров {o.volunteerCount} · мероприятий {o.publishedEventsCount}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Button size="sm" variant="secondary" onClick={() => setOrganizersOf(o)}><i className="fas fa-user-shield" aria-hidden /> Организаторы</Button>
                    <Button size="sm" variant="secondary" onClick={() => edit(o)}><i className="fas fa-pen" aria-hidden /> Изменить</Button>
                    <Button size="sm" variant={o.isActive ? 'ghost' : 'success'} loading={busyId === o.id} onClick={() => toggleArchive(o)}>{o.isActive ? 'В архив' : 'Восстановить'}</Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

      {total > TAKE && <Pagination skip={skip} take={TAKE} total={total} onChange={setSkip} />}

      {form.open && (
        <Modal isOpen onClose={() => setForm({ open: false, org: null })} title={form.org ? 'Изменить организацию' : 'Новая организация'} maxWidth="max-w-3xl">
          <OrganizationForm key={form.org?.id ?? 'new'} initial={form.org}
            onSaved={() => { notify(form.org ? 'Организация сохранена' : 'Организация создана'); setForm({ open: false, org: null }); void load(); }}
            onCancel={() => setForm({ open: false, org: null })} />
        </Modal>
      )}

      {organizersOf && <OrganizersModal org={organizersOf} onClose={() => { setOrganizersOf(null); void load(); }} />}
    </div>
  );
}

/**
 * Организаторы без организации (роль выдана раньше или организацию у них забрали): ждут распределения.
 * Роль «Организатор» теперь выдаётся вместе с организацией, поэтому новые сюда не попадают.
 */
function UnassignedOrganizers({ onAssigned }: { onAssigned: () => void }) {
  const { notify } = useNotification();
  const [list, setList] = useState<UnassignedOrganizer[]>([]);
  const [orgs, setOrgs] = useState<OrganizationListItem[]>([]);
  const [pick, setPick] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [u, o] = await Promise.all([organizationsApi.unassignedOrganizers(0, 50), organizationsApi.list({ skip: 0, take: 100 })]);
      setList(u.items); setOrgs(o.items.filter(x => x.isActive));
    } catch { setList([]); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  if (list.length === 0) return null;

  const assign = async (u: UnassignedOrganizer) => {
    const orgId = pick[u.userId];
    if (!orgId) { notify('Выберите организацию', 'error'); return; }
    setBusy(u.userId);
    try { await organizationsApi.addOrganizer(orgId, u.userId); notify(`${u.fullName} назначен организатором`); await load(); onAssigned(); }
    catch (err) { notify(adminErrorMessage(err, 'Не удалось назначить организатора.'), 'error'); }
    finally { setBusy(null); }
  };

  return (
    <Card>
      <div className="px-5 pt-4">
        <h3 className="section-title">Организаторы без организации ({list.length})</h3>
        <p className="meta mt-1">Они пока ничем не управляют. Назначьте организацию — или они снова станут волонтёрами, когда их снимут с последней.</p>
      </div>
      <ul className="divide-y divide-line mt-3">
        {list.map(u => (
          <li key={u.userId} className="flex flex-wrap items-center gap-3 px-5 py-3">
            <Avatar name={u.fullName} src={u.avatarThumbnailUrl} size="sm" />
            <div className="min-w-0 flex-1"><p className="text-[13px] font-medium truncate">{u.fullName}</p><p className="meta truncate">{u.email}</p></div>
            <select aria-label={`Организация для ${u.fullName}`} value={pick[u.userId] ?? ''} onChange={e => setPick(p => ({ ...p, [u.userId]: e.target.value }))}
              className="px-3 py-2 text-[13px] rounded-lg max-w-[16rem]">
              <option value="">Выберите организацию…</option>
              {orgs.map(o => <option key={o.id} value={o.id}>{o.shortName || o.name}</option>)}
            </select>
            <Button size="sm" loading={busy === u.userId} onClick={() => assign(u)}>Назначить</Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Организаторы организации: список, исключение и назначение любого активного пользователя (роль выдаётся вместе с организацией). */
function OrganizersModal({ org, onClose }: { org: OrganizationListItem; onClose: () => void }) {
  const { notify } = useNotification();
  const confirm = useConfirm();
  const [organizers, setOrganizers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const search = useDebounced(query, 350);
  const [found, setFound] = useState<AdminUserListItemDto[]>([]);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setOrganizers((await organizationsApi.members(org.id, 'Organizer', 0, 100)).items); }
    catch (err) { notify(adminErrorMessage(err, 'Не удалось загрузить организаторов.'), 'error'); }
    finally { setLoading(false); }
  }, [org.id, notify]);
  useEffect(() => { void load(); }, [load]);

  // Подбор активных пользователей: волонтёр при назначении сам становится организатором.
  useEffect(() => {
    if (search.trim().length < 2) { setFound([]); return; }
    let alive = true;
    setSearching(true);
    adminApi.getUsers(0, 8, search.trim(), undefined, true)
      .then(r => { if (alive) setFound(r.Items.filter(u => u.role !== 'Admin' && !organizers.some(o => o.userId === u.id))); })
      .catch(() => { if (alive) setFound([]); })
      .finally(() => { if (alive) setSearching(false); });
    return () => { alive = false; };
  }, [search, organizers]);

  const add = async (u: AdminUserListItemDto) => {
    try { await organizationsApi.addOrganizer(org.id, u.id); notify(`${u.fullName || u.email} назначен организатором`); setQuery(''); setFound([]); await load(); }
    catch (err) { notify(adminErrorMessage(err, 'Не удалось назначить организатора.'), 'error'); }
  };
  const remove = async (m: OrganizationMember) => {
    if (!(await confirm({ message: `Снять «${m.fullName}» с роли организатора этой организации?`, confirmLabel: 'Снять', danger: true }))) return;
    try { await organizationsApi.removeMember(org.id, m.userId); notify('Организатор снят'); await load(); }
    catch (err) { notify(adminErrorMessage(err, 'Не удалось снять организатора.'), 'error'); }
  };

  return (
    <Modal isOpen onClose={onClose} title={`Организаторы: ${org.shortName || org.name}`} maxWidth="max-w-xl">
      <div className="space-y-5">
        <div>
          <label className="block text-[13px] font-medium text-ink-700 mb-1.5" htmlFor="org-find">Назначить организатора</label>
          <input id="org-find" value={query} onChange={e => setQuery(e.target.value)} placeholder="Имя или email пользователя" className="w-full px-3 py-2 text-sm" />
          <p className="text-xs text-ink-400 mt-1">Роль «Организатор» выдаётся вместе с организацией. Организаторов в организации может быть несколько, а одного человека можно назначить в несколько организаций.</p>
          {searching && <p className="meta mt-2">Поиск…</p>}
          {found.length > 0 && (
            <ul className="mt-2 border border-line rounded-lg divide-y divide-line">
              {found.map(u => (
                <li key={u.id} className="flex items-center gap-3 px-3 py-2">
                  <Avatar name={u.fullName || u.email} src={u.avatarUrl} size="sm" />
                  <div className="min-w-0 flex-1"><p className="text-[13px] font-medium truncate">{u.fullName || u.email}</p><p className="meta truncate">{u.email}{u.role === 'Volunteer' ? ' · станет организатором' : ''}</p></div>
                  <Button size="sm" onClick={() => add(u)}>Назначить</Button>
                </li>
              ))}
            </ul>
          )}
          {!searching && search.trim().length >= 2 && found.length === 0 && <p className="meta mt-2">Пользователи не найдены.</p>}
        </div>

        <div>
          <h4 className="text-[13px] font-medium text-ink-700 mb-2">Сейчас организаторы</h4>
          {loading ? <p className="meta">Загрузка…</p> : organizers.length === 0 ? <p className="meta">Пока никого — назначьте первого.</p> : (
            <ul className="border border-line rounded-lg divide-y divide-line">
              {organizers.map(m => (
                <li key={m.userId} className="flex items-center gap-3 px-3 py-2">
                  <Avatar name={m.fullName} src={m.avatarThumbnailUrl} size="sm" />
                  <div className="min-w-0 flex-1"><p className="text-[13px] font-medium truncate">{m.fullName}</p><p className="meta truncate">{m.email}</p></div>
                  <Button size="sm" variant="ghost" onClick={() => remove(m)} aria-label={`Снять ${m.fullName}`}><i className="fas fa-user-minus" aria-hidden /></Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
