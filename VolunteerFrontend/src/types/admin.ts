// Admin Panel DTO types

// ==================== DASHBOARD & STATISTICS ====================

export interface AdminDashboardDto {
  statistics: AdminStatsDto;
  recentNews: RecentNewsDto[];
  upcomingEvents: UpcomingEventDto[];
  recentParticipations: RecentParticipationDto[];
  unreadNotificationsCount: number;
}

export interface AdminStatsDto {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  totalOrganizers: number;
  totalVolunteers: number;
  totalEvents: number;
  draftEvents: number;
  publishedEvents: number;
  cancelledEvents: number;
  completedEvents: number;
  totalParticipations: number;
  pendingParticipations: number;
  approvedParticipations: number;
  rejectedParticipations: number;
  totalNews: number;
  draftNews: number;
  publishedNews: number;
  archivedNews: number;
  totalFeedbacks: number;
  unreadFeedbacks: number;
}

export interface RecentNewsDto {
  id: string;
  title: string;
  status: 'Draft' | 'Published' | 'Archived';
  publishedAt?: string;
  coverImageUrl?: string;
}

export interface UpcomingEventDto {
  id: string;
  title: string;
  startsAt: string;
  location: string;
  approvedParticipantsCount: number;
  maxParticipants?: number;
  status: 'Draft' | 'Published' | 'Cancelled' | 'Completed' | 'Archived';
}

export interface RecentParticipationDto {
  id: string;
  userName: string;
  eventTitle: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  userAvatarThumbnailUrl?: string | null;
}

// ==================== USER MANAGEMENT ====================

export interface AdminUserListItemDto {
  id: string;
  avatarUrl?: string;
  fullName: string;
  email: string;
  role: 'Volunteer' | 'Organizer' | 'Admin';
  isActive: boolean;
  createdAt: string;
  participationsCount: number;
  attendedEventsCount: number;
  /** Подтверждена ли почта (в списке и в карточке). */
  emailConfirmed?: boolean;
  /** Последний вход; null — ни разу не входил. */
  lastLoginAt?: string | null;
}

export interface AdminUserDetailDto extends AdminUserListItemDto {
  firstName: string;
  lastName: string;
  emailConfirmed: boolean;
  isDeleted: boolean;
  updatedAt?: string;
  bio?: string;
  organizedEventsCount: number;
}

// ==================== EVENT MANAGEMENT ====================

export interface AdminEventListDto {
  id: string;
  title: string;
  startsAt: string;
  location: string;
  totalParticipations: number;
  approvedParticipations: number;
  freeSlots?: number;
  createdAt: string;
  createdBy: string;
  status: 'Draft' | 'Published' | 'Cancelled' | 'Completed' | 'Archived';
}

export interface AdminEventStatisticsDto {
  eventId: string;
  totalApplications: number;
  approvedParticipants: number;
  rejectedParticipants: number;
  attendanceConfirmed: number;
  fillPercentage: number;
  freeSlots: number;
}

// DTO для создания события
export interface CreateEventDto {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  location: string;
  maxParticipants?: number;
  categoryId?: string;
  tags?: string[];
}

// DTO для редактирования события
export interface UpdateEventDto {
  title?: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  location?: string;
  maxParticipants?: number;
  categoryId?: string;
  tags?: string[];
}

// ==================== PARTICIPATION MANAGEMENT ====================

export interface AdminParticipationDto {
  id: string;
  userName: string;
  userEmail: string;
  eventTitle: string;
  createdAt: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'AttendanceConfirmed' | 'Withdrawn';
  adminComment?: string;
  withdrawalReason?: string | null;
  /** Миниатюра одобренного аватара участника (админке видна независимо от публичных настроек). */
  userAvatarThumbnailUrl?: string | null;
}

// ==================== NEWS MANAGEMENT ====================

export interface AdminNewsListDto {
  id: string;
  coverImageUrl?: string;
  title: string;
  createdBy: string;
  createdAt: string;
  publishedAt?: string;
  status: 'Draft' | 'Published' | 'Archived';
}

// ==================== ANALYTICS ====================

export interface RegistrationAnalyticsDto {
  month: string;
  totalRegistrations: number;
  volunteerRegistrations: number;
  organizerRegistrations: number;
}

export interface ParticipationAnalyticsDto {
  month: string;
  totalApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
}

export interface EventAnalyticsDto {
  month: string;
  totalEvents: number;
  publishedEvents: number;
  completedEvents: number;
  cancelledEvents: number;
}

export interface PopularEventDto {
  id: string;
  title: string;
  participantsCount: number;
}

export interface ActiveVolunteerDto {
  id: string;
  name: string;
  eventsAttended: number;
  hoursVolunteered: number;
}

export interface ActiveOrganizerDto {
  id: string;
  name: string;
  eventsCreated: number;
  totalParticipants: number;
}

export interface AdminAnalyticsDto {
  registrationTrends: RegistrationAnalyticsDto[];
  participationTrends: ParticipationAnalyticsDto[];
  eventTrends: EventAnalyticsDto[];
  topEvents: PopularEventDto[];
  topVolunteers: ActiveVolunteerDto[];
  topOrganizers: ActiveOrganizerDto[];
  userGrowthPercentage: number;
  averageEventParticipants: number;
  /** Кто реально пользуется сайтом и кто застрял на подтверждении почты. */
  audience?: { signedInLast30Days: number; unconfirmedEmails: number; neverSignedIn: number };
  /** Путь заявки: подано → одобрено → пришёл. */
  participationFunnel?: {
    applications: number; pending: number; approved: number; attended: number; rejected: number; withdrawn: number;
    approvalRatePercent: number; attendanceRatePercent: number;
  };
  usersByCity?: { city: string; users: number }[];
  eventsByCategory?: Record<string, number>;
  topOrganizations?: { id: string; name: string; events: number; participants: number; members: number }[];
}
// ==================== NOTIFICATIONS ====================

export interface AdminNotificationDto {
  id: string;
  type: string;
  title: string;
  message?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface UnreadNotificationsResponseDto {
  unreadCount: number;
  notifications: AdminNotificationDto[];
}

// ==================== USER DOSSIER ====================

/** GET /api/admin/users/{id}/dossier. Мероприятия описаны один раз в `events`, заявки ссылаются на них по `eventId`. */
export interface UserDossierDto {
  account: {
    id: string; email: string; emailConfirmed: boolean; role: string; isActive: boolean; isDeleted: boolean;
    deletionReason: string | null; deletedAt: string | null; consentGiven: boolean;
    createdAt: string; updatedAt: string | null; lastLoginAt: string | null;
  };
  profile: {
    firstName: string | null; lastName: string | null; middleName: string | null; bio: string | null;
    birthYear: number | null; city: string | null; bookNumber: string | null; phoneNumber: string | null;
    socialLinks: string[]; publicFields: string[];
  };
  avatar: { status: string; uploadedAt: string; approvedAt: string | null; previewUrl: string } | null;
  sessions: { createdAt: string; expiresAt: string; revokedAt: string | null; ip: string | null; userAgent: string | null }[];
  participations: { id: string; eventId: string; status: string; adminComment: string | null; createdAt: string; updatedAt: string | null }[];
  events: { id: string; title: string; startsAt: string; endsAt: string; location: string; status: string }[];
  organizedEventIds: string[];
  moderation: { openReports: number; reports: { id: string; reason: string; status: string; resolution: string | null; createdAt: string }[] } | null;
  summary: { totalParticipations: number; pending: number; approved: number; rejected: number; attendanceConfirmed: number; organizedEvents: number };
  /** Данные учётной записи WordPress — только у импортированных пользователей (поле есть в PHP-версии API). */
  wordPress?: { id: number; userLogin: string | null; displayName: string | null; roles: string | null; locale: string | null } | null;
}
