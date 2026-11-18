export interface LoginDto { email: string; password: string; }
export interface RegisterDto { email: string; password: string; firstName?: string; lastName?: string; consentGiven: boolean; }
export interface AuthResponseDto { accessToken: string; refreshToken: string; }
export interface ForgotPasswordDto { email: string; }
export interface ResetPasswordDto { token: string; newPassword: string; }
export interface ConfirmEmailDto { token: string; }
export interface ResendConfirmationDto { email: string; }

/** Сеанс входа в аккаунт на одном устройстве. current — сеанс, из которого сделан запрос. */
export interface SessionDto {
  id: string;
  current: boolean;
  userAgent: string | null;
  ipAddress: string | null;
  startedAt: string;
  lastActiveAt: string;
  expiresAt: string;
}
