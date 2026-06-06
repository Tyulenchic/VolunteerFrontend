// Matches backend enums and DTOs exactly
export type EventStatus = 'Draft' | 'Published' | 'Cancelled' | 'Completed';

// Full category list from EventCategory enum
export type EventCategory =
  | 'Veterans' | 'Medical' | 'Donation' | 'Animals'
  | 'HealthyLife' | 'Culture' | 'Education' | 'Media'
  | 'Social' | 'Events' | 'Patriotic' | 'Urban' | 'Ecological';

// Matches ParticipationStatus enum (AttendanceConfirmed = 3)
export type ParticipationStatus = 'Pending' | 'Approved' | 'Rejected' | 'AttendanceConfirmed';

export interface EventResponseDto {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  maxParticipants: number | null;
  approvedCount: number;
  status: EventStatus;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface EventListResponseDto {
  items: EventResponseDto[];
  totalCount: number;
  skip: number;
  take: number;
}

export interface CreateEventDto {
  title: string;
  description: string;
  location: string;
  startsAt: string;  // ISO datetime
  endsAt: string;
  maxParticipants?: number | null;
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
