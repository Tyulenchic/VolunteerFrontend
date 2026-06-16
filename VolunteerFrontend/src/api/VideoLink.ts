import { apiClient } from './client';
import type {
    VideoLinkListResponseDto,
    VideoLinkResponseDto,
    CreateVideoLinkDto,
    UpdateVideoLinkDto,
    ReorderVideoLinkDto,
} from '../types/VideoLink';

// ── Public ────────────────────────────────────────────────────────────────────

export async function getVideoLinks(skip = 0, take = 20): Promise<VideoLinkListResponseDto> {
    const { data } = await apiClient.get<VideoLinkListResponseDto>(
        `/api/video-links?skip=${skip}&take=${take}`,
    );
    return data;
}

export async function getVideoLinkById(id: string): Promise<VideoLinkResponseDto> {
    const { data } = await apiClient.get<VideoLinkResponseDto>(`/api/video-links/${id}`);
    return data;
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function createVideoLink(dto: CreateVideoLinkDto): Promise<VideoLinkResponseDto> {
    const { data } = await apiClient.post<VideoLinkResponseDto>('/api/video-links', dto);
    return data;
}

export async function updateVideoLink(
    id: string,
    dto: UpdateVideoLinkDto,
): Promise<VideoLinkResponseDto> {
    const { data } = await apiClient.put<VideoLinkResponseDto>(`/api/video-links/${id}`, dto);
    return data;
}

export async function reorderVideoLink(id: string, dto: ReorderVideoLinkDto): Promise<void> {
    await apiClient.patch(`/api/video-links/${id}/sort-order`, dto);
}

export async function deleteVideoLink(id: string): Promise<void> {
    await apiClient.delete(`/api/video-links/${id}`);
}

export const videoLinksApi = {
    getAll: getVideoLinks,
    getById: getVideoLinkById,
    create: createVideoLink,
    update: updateVideoLink,
    reorder: reorderVideoLink,
    delete: deleteVideoLink,
};