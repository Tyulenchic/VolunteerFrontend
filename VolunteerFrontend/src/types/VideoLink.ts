export interface VideoLinkResponseDto {
    id: string;
    title: string;
    description?: string | null;
    url: string;
    thumbnailUrl?: string | null;
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
    title: string;
    description?: string | null;
    url: string;
    sortOrder?: number;
}

export interface UpdateVideoLinkDto {
    title: string;
    description?: string | null;
    url: string;
    sortOrder: number;
}

export interface ReorderVideoLinkDto {
    sortOrder: number;
}