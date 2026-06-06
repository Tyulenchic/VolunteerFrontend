import { apiClient } from "./client";
import type { LoginDto, RegisterDto, AuthResponseDto, ForgotPasswordDto, ResetPasswordDto } from "../types/auth";

export const authApi = {
  login: async (dto: LoginDto): Promise<void> => {
    const { data } = await apiClient.post<AuthResponseDto>("/api/auth/login", dto);
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
  },
  register: async (dto: RegisterDto): Promise<void> => {
    const { data } = await apiClient.post<AuthResponseDto>("/api/auth/register", dto);
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
  },
  logout: async (): Promise<void> => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    try { await apiClient.post("/api/auth/logout"); } catch { /* игнорируем */ }
  },
  forgotPassword: async (dto: ForgotPasswordDto) => { await apiClient.post("/api/auth/forgot-password", dto); },
  resetPassword: async (dto: ResetPasswordDto) => { await apiClient.post("/api/auth/reset-password", dto); },
  confirmEmail: async (userId: string, token: string) => {
    await apiClient.get("/api/auth/confirm-email", { params: { userId, token } });
  },
  refreshToken: async (refreshToken: string): Promise<AuthResponseDto> => {
    const { data } = await apiClient.post<AuthResponseDto>("/api/auth/refresh", { refreshToken });
    return data;
  },
};
