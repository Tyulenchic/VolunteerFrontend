export interface LoginDto { email: string; password: string; }
export interface RegisterDto { email: string; password: string; firstName?: string; lastName?: string; consentGiven: boolean; }
export interface AuthResponseDto { accessToken: string; refreshToken: string; }
export interface ForgotPasswordDto { email: string; }
export interface ResetPasswordDto { token: string; newPassword: string; }
export interface ConfirmEmailDto { userId: string; token: string; }
