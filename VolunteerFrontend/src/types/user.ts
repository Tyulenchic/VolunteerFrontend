// Matches UserResponseDto exactly from backend
export type UserRole = 'Volunteer' | 'Organizer' | 'Admin';

export interface UserResponseDto {
  id: string;
  email: string;
  emailConfirmed: boolean;   // backend field: EmailConfirmed (not isEmailConfirmed)
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  role: UserRole;
  isActive: boolean;         // backend field: IsActive (not isBlocked!)
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface UserListResponseDto {
  items: UserResponseDto[];
  totalCount: number;
  skip: number;
  take: number;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  bio?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}
