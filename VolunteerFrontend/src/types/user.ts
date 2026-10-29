import type { Membership, OrganizationSummary } from './organization';

// Matches UserResponseDto exactly from backend
export type ProfileField =
  | 'FullName' | 'BirthYear' | 'City' | 'BookNumber' | 'About' | 'SocialLinks' | 'Photo' | 'Events' | 'Organizations';

export type UserRole = 'Volunteer' | 'Organizer' | 'Admin';

export interface UserResponseDto {
  id: string;
  email: string;
  emailConfirmed: boolean;   // backend field: EmailConfirmed (not isEmailConfirmed)
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  role: UserRole;
  isActive: boolean;         // backend field: IsActive (not isBlocked!)
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
  middleName: string | null;
  birthYear: number | null;
  city: string | null;
  bookNumber: string | null;
  socialLinks: string[];
  publicFields: ProfileField[];   // какие поля видны всем посетителям
  isProfileClosed?: boolean;      // профиль закрыт (админ/организатор)
  phoneNumber: string | null;     // виден только организаторам и администраторам
  avatarThumbnailUrl?: string | null;
  avatarStatus?: 'Pending' | 'Approved' | null;
  avatarCrop?: import('./organization').ImageCropDto | null;
  /** Адрес собственного аватара (отдаётся владельцу и с токеном, даже пока аватар на проверке). */
  avatarPreviewUrl?: string | null;   // аватар виден другим только после проверки
  /** Организации пользователя: заполняются автоматически, когда организатор принимает заявку на вступление. */
  organizations?: Membership[] | null;
}

// Public view: fields are null / empty unless the volunteer opened them.
export interface PublicUserDto {
  id: string;
  role: UserRole;
  createdAt: string;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  birthYear: number | null;
  city: string | null;
  bookNumber: string | null;
  bio: string | null;
  socialLinks: string[];
  avatarUrl: string | null;
  avatarThumbnailUrl?: string | null;  // квадратная миниатюра по кадру; null, если фото скрыто или не одобрено
  avatarCrop?: import('./organization').ImageCropDto | null;
  events: ProfileEventDto[] | null;   // null, если волонтёр не открыл мероприятия
  phoneNumber: string | null;         // только для организаторов и администраторов
  organizations?: OrganizationSummary[] | null;   // null, если волонтёр не открыл организации
  isClosed?: boolean;                 // профиль закрыт владельцем (админ/организатор): видны только имя и фото
}

export interface ProfileEventDto {
  eventId: string;
  title: string;
  startsAt: string;
}

export interface UserListResponseDto {
  items: PublicUserDto[];
  totalCount: number;
  skip: number;
  take: number;
}

// PUT /api/users/me replaces the whole profile: omitted / empty fields are cleared.
export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  bio?: string;
  birthYear?: number;
  city?: string;
  bookNumber?: string;
  phoneNumber?: string;
  socialLinks?: string[];
  publicFields?: ProfileField[];
  isProfileClosed?: boolean;          // учитывается только для администраторов и организаторов
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}
