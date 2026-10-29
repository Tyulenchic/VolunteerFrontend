// Matches backend enums and DTOs exactly
export type EventStatus = 'Draft' | 'Published' | 'Cancelled' | 'Completed' | 'Archived';

// Full category list from EventCategory enum
export type EventCategory =
    | 'Veterans'      // Ветераны
    | 'Medical'       // Мед
    | 'Donation'      // Донорство
    | 'Animals'       // Животные
    | 'HealthyLife'   // ЗОЖ
    | 'Culture'       // Культура и искусство
    | 'Education'     // Образование
    | 'Media'         // Медиаволонтёрство
    | 'Social'        // Социальное
    | 'Events'        // Событийное
    | 'Patriotic'     // Патриотическое
    | 'Urban'         // Урбанистика
    | 'Ecological';   // Экологическое

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  Veterans: 'Ветераны',
  Medical: 'Мед',
  Donation: 'Донорство',
  Animals: 'Животные',
  HealthyLife: 'ЗОЖ',
  Culture: 'Культура',
  Education: 'Образование',
  Media: 'Медиаволонтёрство',
  Social: 'Социальное',
  Events: 'Событийное',
  Patriotic: 'Патриотическое',
  Urban: 'Урбанистика',
  Ecological: 'Экологическое',
};

// Category color map (все 13 категорий)
export const CATEGORY_COLORS: Record<EventCategory, string> = {
  Veterans: 'bg-red-500',
  Medical: 'bg-blue-400',
  Donation: 'bg-red-600',
  Animals: 'bg-yellow-500',
  HealthyLife: 'bg-sky-500',
  Culture: 'bg-purple-500',
  Education: 'bg-indigo-500',
  Media: 'bg-cyan-500',
  Social: 'bg-orange-500',
  Events: 'bg-pink-500',
  Patriotic: 'bg-blue-700',
  Urban: 'bg-gray-500',
  Ecological: 'bg-green-500',
};

// Helper to get category color
export const getCategoryColor = (cat?: EventCategory | null): string => {
  if (!cat) return 'bg-blue-600';
  return CATEGORY_COLORS[cat] ?? 'bg-blue-600';
};

// Helper to get category label
export const getCategoryLabel = (cat?: EventCategory | null): string => {
  if (!cat) return 'Не указано';
  return CATEGORY_LABELS[cat] ?? cat;
};

// Matches ParticipationStatus enum (AttendanceConfirmed = 3, Withdrawn = 4 — волонтёр отозвал заявку)
export type ParticipationStatus = 'Pending' | 'Approved' | 'Rejected' | 'AttendanceConfirmed' | 'Withdrawn';

import type { ImageCropDto, OrganizationSummary } from './organization';

export interface EventResponseDto {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  maxParticipants: number | null;
  imageUrl: string | null;
  category: EventCategory | null;
  /** Теги мероприятия; участвуют в поиске. */
  tags?: string[];
  approvedCount: number;
  status: EventStatus;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string | null;
  imageThumbnailUrl?: string | null;
  imageCrop?: ImageCropDto | null;
  /** Организация-организатор; null — мероприятие от платформы. */
  organization?: OrganizationSummary | null;
}

export interface EventListResponseDto {
  items: EventResponseDto[];
  totalCount: number;
  skip: number;
  take: number;
  status?: EventStatus | null;
  category?: EventCategory | null;
}

export interface CreateEventDto {
  title: string;
  description: string;
  location: string;
  startsAt: string;  // ISO datetime
  endsAt: string;
  maxParticipants?: number | null;
  category?: EventCategory | null;
  tags?: string[];
  /** Организация, от имени которой проводится мероприятие (организатору обязательна, если у него их несколько). */
  organizationId?: string | null;
  /** Фото, загруженное заранее (POST /api/images) — идентификатор мероприятия для этого не нужен. */
  imageId?: string | null;
  imageCrop?: ImageCropDto | null;
}

export interface UpdateEventDto {
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  maxParticipants?: number | null;
}

export interface UpdateMaxParticipantsDto {
  maxParticipants: number | null;
}

export interface ParticipationResponseDto {
  id: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  userFullName: string | null;
  status: ParticipationStatus;
  adminComment: string | null;
  /** Комментарий волонтёра при отзыве заявки (статус Withdrawn). */
  withdrawalReason?: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface ReviewParticipationDto {
  approved: boolean;
  comment?: string;
}

export interface ConfirmAttendanceDto {
  comment?: string;
}
