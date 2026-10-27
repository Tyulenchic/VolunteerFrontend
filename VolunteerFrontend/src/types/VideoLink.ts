export interface VideoLinkResponseDto {
    id: string;
    title: string;
    description?: string | null;
    url: string;
    thumbnailUrl?: string | null;
    /** true — обложка загружена администратором (а не взята у YouTube). */
    hasCustomCover?: boolean;
    coverCrop?: { x: number; y: number; width: number; height: number } | null;
    /** Организация, загрузившая видео; null — видео администратора. */
    organizationId?: string | null;
    organizationName?: string | null;
    sortOrder: number;
    createdByUserId: string;
    createdByUserFullName?: string | null;
    createdAt: string;
    updatedAt?: string | null;
}

export interface VideoLinkListResponseDto {
    items: VideoLinkResponseDto[];
    totalCount: number;
    skip: number;
    take: number;
}

export interface CreateVideoLinkDto {
    /** Организатор обязан указать свою организацию; администратор может не указывать (общее видео). */
    organizationId?: string | null;
    title: string;
    description?: string | null;
    url: string;
    sortOrder?: number;
    /** Идентификатор заранее загруженной обложки (POST /api/images). */
    coverImageId?: string | null;
    coverCrop?: { x: number; y: number; width: number; height: number } | null;
}

export interface UpdateVideoLinkDto {
    title: string;
    description?: string | null;
    url: string;
    sortOrder: number;
    coverImageId?: string | null;
    coverCrop?: { x: number; y: number; width: number; height: number } | null;
    removeCover?: boolean;
}

export interface ReorderVideoLinkDto {
    sortOrder: number;
}