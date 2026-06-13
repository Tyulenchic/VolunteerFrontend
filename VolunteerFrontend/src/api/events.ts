import { apiClient } from './client';
import type {
  EventListResponseDto, EventResponseDto,
  CreateEventDto, UpdateEventDto, UpdateMaxParticipantsDto,
  ParticipationResponseDto, ReviewParticipationDto, ConfirmAttendanceDto,
  EventStatus, ParticipationStatus,
} from '../types/event';

export const eventsApi = {
  // ── Any authenticated user ────────────────────────────────────────────────
  getAll: async (skip = 0, take = 20, status?: EventStatus): Promise<EventListResponseDto> => {
    const { data } = await apiClient.get<EventListResponseDto>('/api/events', {
      params: { skip, take, ...(status ? { status } : {}) },
    });
    return data;
  },
  getById: async (id: string): Promise<EventResponseDto> => {
    const { data } = await apiClient.get<EventResponseDto>(`/api/events/${id}`);
    return data;
  },

  // ── Volunteer actions ─────────────────────────────────────────────────────
  apply: async (eventId: string): Promise<ParticipationResponseDto> => {
    const { data } = await apiClient.post<ParticipationResponseDto>(`/api/events/${eventId}/apply`);
    return data;
  },
  withdraw: async (participationId: string): Promise<void> => {
    await apiClient.delete(`/api/participations/${participationId}`);
  },
  getMyParticipations: async (): Promise<ParticipationResponseDto[]> => {
    const { data } = await apiClient.get<ParticipationResponseDto[]>('/api/users/me/participations');
    return data;
  },

  // ── Admin/Organizer CRUD ──────────────────────────────────────────────────
  create: async (dto: CreateEventDto): Promise<EventResponseDto> => {
    const { data } = await apiClient.post<EventResponseDto>('/api/events', dto);
    return data;
  },
  update: async (id: string, dto: UpdateEventDto): Promise<EventResponseDto> => {
    const { data } = await apiClient.put<EventResponseDto>(`/api/events/${id}`, dto);
    return data;
  },
  updateMaxParticipants: async (id: string, dto: UpdateMaxParticipantsDto): Promise<EventResponseDto> => {
    const { data } = await apiClient.patch<EventResponseDto>(`/api/events/${id}/max-participants`, dto);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/events/${id}`);
  },

  // ── Image management (Admin/Organizer) ────────────────────────────────────
  uploadImage: async (id: string, file: File): Promise<EventResponseDto> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post<EventResponseDto>(`/api/events/${id}/image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  deleteImage: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/events/${id}/image`);
  },

  // ── Status transitions ────────────────────────────────────────────────────
  publish: async (id: string): Promise<void> => {
    await apiClient.post(`/api/events/${id}/publish`);
  },
  cancel: async (id: string): Promise<void> => {
    await apiClient.post(`/api/events/${id}/cancel`);
  },
  complete: async (id: string): Promise<void> => {
    await apiClient.post(`/api/events/${id}/complete`);
  },

  // ── Participations (Admin/Organizer) ──────────────────────────────────────
  getParticipations: async (eventId: string, status?: ParticipationStatus): Promise<ParticipationResponseDto[]> => {
    const { data } = await apiClient.get<ParticipationResponseDto[]>(
        `/api/events/${eventId}/participations`,
        { params: status ? { status } : {} }
    );
    return data;
  },
  review: async (participationId: string, dto: ReviewParticipationDto): Promise<ParticipationResponseDto> => {
    const { data } = await apiClient.post<ParticipationResponseDto>(
        `/api/participations/${participationId}/review`, dto
    );
    return data;
  },
  confirmAttendance: async (participationId: string, dto?: ConfirmAttendanceDto): Promise<ParticipationResponseDto> => {
    const { data } = await apiClient.post<ParticipationResponseDto>(
        `/api/participations/${participationId}/confirm-attendance`, dto ?? {}
    );
    return data;
  },
};