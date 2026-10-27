import { apiClient } from './client';
import type { EventListResponseDto, EventResponseDto, EventCategory } from '../types/event';

export const publicEventsApi = {
  getActual: async (skip = 0, take = 20, category?: EventCategory): Promise<EventListResponseDto> => {
    const { data } = await apiClient.get<EventListResponseDto>('/api/events/actual', {
      params: { skip, take, ...(category ? { ctg: category } : {}) },
    });
    return data;
  },
  /** Недавно завершённые мероприятия («чем занимаются волонтёры»); давно прошедшие уходят в архив и здесь не видны. */
  getCompleted: async (skip = 0, take = 20, category?: EventCategory): Promise<EventListResponseDto> => {
    const { data } = await apiClient.get<EventListResponseDto>('/api/events/completed', {
      params: { skip, take, ...(category ? { ctg: category } : {}) },
    });
    return data;
  },
  getById: async (id: string): Promise<EventResponseDto> => {
    const { data } = await apiClient.get<EventResponseDto>(`/api/events/${id}`);
    return data;
  },
};
