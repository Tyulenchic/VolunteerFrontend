import type {
    VideoLinkListResponseDto,
    VideoLinkResponseDto,
    CreateVideoLinkDto,
    UpdateVideoLinkDto,
    ReorderVideoLinkDto,
} from '../types/VideoLink';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7001';

function authHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
    }
    if (res.status === 204) return undefined as unknown as T;
    return res.json() as Promise<T>;
}

// ── Public ────────────────────────────────────────────────────────────────────

export async function getVideoLinks(skip = 0, take = 20): Promise<VideoLinkListResponseDto> {
    const res = await fetch(
        `${API_BASE}/api/video-links?skip=${skip}&take=${take}`,
        { headers: { Accept: 'application/json' } },
    );
    return handleResponse<VideoLinkListResponseDto>(res);
}

export async function getVideoLinkById(id: string): Promise<VideoLinkResponseDto> {
    const res = await fetch(`${API_BASE}/api/video-links/${id}`, {
        headers: { Accept: 'application/json' },
    });
    return handleResponse<VideoLinkResponseDto>(res);
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function createVideoLink(dto: CreateVideoLinkDto): Promise<VideoLinkResponseDto> {
    const res = await fetch(`${API_BASE}/api/video-links`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(dto),
    });
    return handleResponse<VideoLinkResponseDto>(res);
}

export async function updateVideoLink(id: string, dto: UpdateVideoLinkDto): Promise<VideoLinkResponseDto> {
    const res = await fetch(`${API_BASE}/api/video-links/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(dto),
    });
    return handleResponse<VideoLinkResponseDto>(res);
}

export async function reorderVideoLink(id: string, dto: ReorderVideoLinkDto): Promise<void> {
    const res = await fetch(`${API_BASE}/api/video-links/${id}/sort-order`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(dto),
    });
    return handleResponse<void>(res);
}

export async function deleteVideoLink(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/video-links/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    return handleResponse<void>(res);
}

export const videoLinksApi = {
    getAll: getVideoLinks,
    getById: getVideoLinkById,
    create: createVideoLink,
    update: updateVideoLink,
    reorder: reorderVideoLink,
    delete: deleteVideoLink,
};