import { useEffect, useState } from 'react';
import { organizerApi } from '../../api/organizer';
import { EmptyState } from '../../components/ui/PageStates';
import { ListSkeleton } from '../../components/ui/Skeleton';
import type { OrganizationSummary } from '../../types/organization';
import { AdminVideoLinksPage } from '../admin/AdminVideoLinksPage';

/**
 * Видео организации в кабинете организатора. Та же страница, что и у администратора, но ограниченная его
 * организациями: ссылка на любое видео (YouTube, VK, Telegram, файл…), своя обложка, порядок показа.
 */
export function OrganizerVideosPage() {
  const [orgs, setOrgs] = useState<OrganizationSummary[] | null>(null);

  useEffect(() => {
    organizerApi.summary().then(s => setOrgs(s.organizations)).catch(() => setOrgs([]));
  }, []);

  if (orgs === null) return <ListSkeleton />;
  if (orgs.length === 0) {
    return <EmptyState icon="fa-film" title="Нет организации для видео"
      hint="Видео публикуют организаторы организаций. Попросите администратора назначить вас в организацию." />;
  }
  return <AdminVideoLinksPage organizations={orgs} />;
}
