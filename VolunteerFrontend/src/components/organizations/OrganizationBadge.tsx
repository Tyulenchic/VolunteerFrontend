import { Link } from 'react-router-dom';
import { CroppedImage } from '../ImageCropper';
import type { OrganizationSummary } from '../../types/organization';

/**
 * Организация-организатор в карточке мероприятия: логотип и название со ссылкой на страницу организации.
 * Мероприятие «от платформы» (organization = null) ничего не показывает.
 */
export function OrganizationBadge({ organization, className = '', size = 'sm' }: {
  organization: OrganizationSummary | null | undefined;
  className?: string;
  size?: 'sm' | 'md';
}) {
  if (!organization) return null;
  const box = size === 'md' ? 'w-8 h-8' : 'w-6 h-6';
  return (
    <Link
      to={`/organizations/${organization.id}`}
      onClick={(e) => e.stopPropagation()} // карточка мероприятия сама может быть ссылкой
      className={`inline-flex items-center gap-2 min-w-0 text-gray-600 hover:text-primary transition no-underline ${className}`}
      title={`Организатор: ${organization.name}`}
    >
      <span className={`${box} shrink-0 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center`}>
        {organization.logoThumbnailUrl
          ? <CroppedImage src={organization.logoThumbnailUrl} crop={organization.logoCrop} aspect={1} round className={`${box} !rounded-none`} />
          : <i className="fas fa-hands-helping text-[11px] text-teal-500" aria-hidden />}
      </span>
      <span className={`truncate ${size === 'md' ? 'text-sm font-medium' : 'text-xs'}`}>{organization.name}</span>
    </Link>
  );
}
