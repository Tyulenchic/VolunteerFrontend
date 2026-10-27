// Соответствует DTO бэкенда (ClassLibrary_BusinessLogic/DTOs/Organizations). Перечисления приходят строками.
import type { EventResponseDto } from './event';

export type OrganizationLevel = 'School' | 'College' | 'University' | 'Other';
export type OrganizationCategory = 'Eco' | 'Social' | 'Patriotic' | 'Cultural' | 'Sport' | 'Zoo' | 'Youth' | 'Health';
export type MemberRole = 'Organizer' | 'Volunteer';
export type ApplicationStatus = 'Pending' | 'Approved' | 'Rejected' | 'Withdrawn';

export type MovementDirection =
  | 'Ecological' | 'Social' | 'CivicPatriotic' | 'Patriotic' | 'Cultural' | 'Sport' | 'Zoo' | 'Medical'
  | 'Charity' | 'Educational' | 'Spiritual' | 'HealthyLife' | 'SportHealth' | 'Events' | 'Improvement'
  | 'Enlightenment' | 'Agro' | 'Inclusive' | 'Humanitarian';

/** Кадрирование в долях 0…1 от сохранённого изображения. */
export interface ImageCropDto { x: number; y: number; width: number; height: number; }

export interface OrganizationSummary {
  id: string;
  name: string;
  logoUrl: string | null;
  logoThumbnailUrl: string | null;
  logoCrop: ImageCropDto | null;
}

export interface Movement {
  id: string;
  name: string;
  directions: MovementDirection[];
  leaderName: string;
  phone: string | null;
  email: string | null;
}

export interface MovementInput {
  name: string;
  directions: MovementDirection[];
  leaderName: string;
  phone?: string | null;
  email?: string | null;
}

export interface OrganizationListItem {
  id: string;
  name: string;
  shortName: string | null;
  level: OrganizationLevel;
  categories: OrganizationCategory[];
  movementsCount: number;
  shortDescription: string;
  city: string | null;
  logoUrl: string | null;
  logoThumbnailUrl: string | null;
  logoCrop: ImageCropDto | null;
  coverThumbnailUrl: string | null;
  coverCrop: ImageCropDto | null;
  volunteerCount: number;
  publishedEventsCount: number;
  isActive: boolean;
}

export interface OrganizationDetails {
  id: string;
  name: string;
  shortName: string | null;
  level: OrganizationLevel;
  categories: OrganizationCategory[];
  contactPhone: string | null;
  movements: Movement[];
  description: string;
  city: string | null;
  contactEmail: string | null;
  website: string | null;
  logoUrl: string | null;
  logoThumbnailUrl: string | null;
  logoCrop: ImageCropDto | null;
  coverUrl: string | null;
  coverCrop: ImageCropDto | null;
  volunteerCount: number;
  organizerCount: number;
  publishedEventsCount: number;
  isActive: boolean;
  createdAt: string;
  /** Роль текущего пользователя в организации (null — не состоит). */
  myRole: MemberRole | null;
  hasPendingApplication: boolean;
  canManage: boolean;
  canApply: boolean;
  cannotApplyReason: string | null;
}

export interface OrganizationInput {
  name: string;
  description: string;
  city?: string | null;
  contactEmail?: string | null;
  website?: string | null;
  shortName?: string | null;
  level: OrganizationLevel;
  categories: OrganizationCategory[];
  contactPhone?: string | null;
  movements: MovementInput[];
}

export interface CreateOrganizationInput extends OrganizationInput {
  logoImageId?: string | null;
  logoCrop?: ImageCropDto | null;
  coverImageId?: string | null;
  coverCrop?: ImageCropDto | null;
}

export interface OrganizationMember {
  userId: string;
  fullName: string;
  city: string | null;
  phoneNumber: string | null;
  email: string | null;
  role: MemberRole;
  joinedAt: string;
  avatarThumbnailUrl: string | null;
}

/** Организатор без организации: ждёт распределения администратором. */
export interface UnassignedOrganizer {
  userId: string;
  fullName: string;
  email: string;
  avatarThumbnailUrl: string | null;
  createdAt: string;
}

export interface Membership {
  organization: OrganizationSummary;
  role: MemberRole;
  joinedAt: string;
}

export interface OrganizationApplication {
  id: string;
  organizationId: string;
  organizationName: string;
  userId: string;
  applicantName: string;
  applicantCity: string | null;
  applicantAvatarThumbnailUrl: string | null;
  message: string | null;
  status: ApplicationStatus;
  createdAt: string;
  decidedAt: string | null;
  decisionNote: string | null;
}

export interface PostImage { url: string; thumbnailUrl: string; crop: ImageCropDto | null; }

/** Публикация в общей ленте вместе с организацией-автором. */
export interface OrganizationFeedItem {
  post: OrganizationPost;
  organization: OrganizationSummary;
}

/** Вложение публикации (.pdf, .txt, .docx, .mp4); url — относительный адрес API. */
export interface PostFile {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  url: string;
}

export interface OrganizationPost {
  id: string;
  organizationId: string;
  text: string | null;
  eventId: string | null;
  eventTitle: string | null;
  images: PostImage[];
  files: PostFile[];
  isHidden: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface PostImageInput { imageId: string; crop?: ImageCropDto | null; }

export interface Paged<T> { items: T[]; totalCount: number; skip: number; take: number; }

export type OrganizerParticipationStatus = 'Pending' | 'Approved' | 'Rejected' | 'AttendanceConfirmed' | 'Withdrawn';

export interface OrganizerParticipation {
  id: string;
  eventId: string;
  eventTitle: string;
  eventStartsAt: string;
  organizationId: string | null;
  organizationName: string | null;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  status: OrganizerParticipationStatus;
  adminComment: string | null;
  createdAt: string;
  withdrawalReason?: string | null;
}

export interface OrganizerSummary {
  organizations: OrganizationSummary[];
  pendingMembershipApplications: number;
  pendingParticipations: number;
  unreadNotifications: number;
}

export interface OrganizerNotification {
  id: string;
  /** NewOrganizationApplication | NewParticipationApplication | … */
  type: string;
  title: string;
  message?: string | null;
  isRead: boolean;
  createdAt: string;
}

/** Результат «черновой» загрузки: фото загружено до создания мероприятия/новости/публикации. */
export interface StagedImage {
  id: string;
  width: number;
  height: number;
  url: string;
  thumbnailUrl: string;
  previewUrl: string;
}

export type OrganizationEventList = Paged<EventResponseDto>;

export const LEVEL_LABEL: Record<OrganizationLevel, string> = {
  School: 'Общеобразовательная',
  College: 'Среднее профессиональное',
  University: 'Высшее образование',
  Other: 'Другая организация',
};

export const LEVEL_ICON: Record<OrganizationLevel, string> = {
  School: 'fas fa-school',
  College: 'fas fa-chalkboard-teacher',
  University: 'fas fa-university',
  Other: 'fas fa-hands-helping',
};

export const CATEGORY_LABEL: Record<OrganizationCategory, string> = {
  Eco: 'Экология', Social: 'Соц. помощь', Patriotic: 'Патриотическое', Cultural: 'Культурное',
  Sport: 'Спорт', Zoo: 'Зооволонтёрство', Youth: 'Молодёжь', Health: 'Здоровье',
};

export const CATEGORY_BADGE: Record<OrganizationCategory, string> = {
  Eco: 'bg-green-100 text-green-700', Social: 'bg-red-100 text-red-700', Patriotic: 'bg-blue-100 text-blue-800',
  Cultural: 'bg-purple-100 text-purple-700', Sport: 'bg-orange-100 text-orange-700', Zoo: 'bg-amber-100 text-amber-700',
  Youth: 'bg-indigo-100 text-indigo-700', Health: 'bg-pink-100 text-pink-700',
};

export const CATEGORY_ICON: Record<OrganizationCategory, string> = {
  Eco: 'fa-leaf', Social: 'fa-hands-helping', Patriotic: 'fa-flag', Cultural: 'fa-theater-masks',
  Sport: 'fa-running', Zoo: 'fa-paw', Youth: 'fa-graduation-cap', Health: 'fa-heartbeat',
};

export const DIRECTION_LABEL: Record<MovementDirection, string> = {
  Ecological: 'Экологическое', Social: 'Социальное', CivicPatriotic: 'Гражданско-патриотическое', Patriotic: 'Патриотическое',
  Cultural: 'Культурное', Sport: 'Спортивное', Zoo: 'Зооволонтёрство', Medical: 'Медицинское', Charity: 'Благотворительное',
  Educational: 'Образовательное', Spiritual: 'Духовно-нравственное', HealthyLife: 'ЗОЖ', SportHealth: 'Спортивно-оздоровительное',
  Events: 'Событийное', Improvement: 'Благоустройство', Enlightenment: 'Просветительское', Agro: 'Агроволонтёрство',
  Inclusive: 'Инклюзивное', Humanitarian: 'Гуманитарное',
};

export const DIRECTION_ICON: Record<MovementDirection, string> = {
  Ecological: 'fa-leaf', Social: 'fa-hands-helping', CivicPatriotic: 'fa-flag', Patriotic: 'fa-flag', Cultural: 'fa-theater-masks',
  Sport: 'fa-running', Zoo: 'fa-paw', Medical: 'fa-stethoscope', Charity: 'fa-heart', Educational: 'fa-graduation-cap',
  Spiritual: 'fa-dove', HealthyLife: 'fa-heartbeat', SportHealth: 'fa-dumbbell', Events: 'fa-calendar-alt',
  Improvement: 'fa-hammer', Enlightenment: 'fa-book-open', Agro: 'fa-seedling', Inclusive: 'fa-universal-access', Humanitarian: 'fa-box-open',
};

export const ALL_LEVELS: OrganizationLevel[] = ['School', 'College', 'University', 'Other'];
export const ALL_CATEGORIES = Object.keys(CATEGORY_LABEL) as OrganizationCategory[];
export const ALL_DIRECTIONS = Object.keys(DIRECTION_LABEL) as MovementDirection[];

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  Pending: 'На рассмотрении', Approved: 'Принята', Rejected: 'Отклонена', Withdrawn: 'Отозвана',
};

/** Максимум организаций у волонтёра — то же число, что на сервере (OrganizationMember.MaxVolunteerOrganizations). */
export const MAX_VOLUNTEER_ORGANIZATIONS = 2;
