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
  status: 'Draft' | 'Published' | 'Cancelled' | 'Completed';
}

export interface RecentParticipationDto {
  id: string;
  userName: string;
  eventTitle: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
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
  views: number;
  status: 'Draft' | 'Published' | 'Cancelled' | 'Completed';
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
  status: 'Pending' | 'Approved' | 'Rejected' | 'AttendanceConfirmed';
  adminComment?: string;
}

// ==================== NEWS MANAGEMENT ====================

export interface AdminNewsListDto {
  id: string;
  coverImageUrl?: string;
  title: string;
  createdBy: string;
  createdAt: string;
  publishedAt?: string;
  views: number;
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
  views: number;
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
