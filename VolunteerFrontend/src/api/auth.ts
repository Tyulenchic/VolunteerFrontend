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
    // Читаем токены ДО удаления — они нужны для запроса
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    if (refreshToken && accessToken) {
      try {
        await apiClient.post(
            "/api/auth/logout",
            { refreshToken },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
      } catch {
        // Сервер недоступен или токен уже истёк — не критично, локальная сессия уже очищена
      }
    }
  },

  forgotPassword: async (dto: ForgotPasswordDto) => {
    await apiClient.post("/api/auth/forgot-password", dto);
  },

  resetPassword: async (dto: ResetPasswordDto) => {
    await apiClient.post("/api/auth/reset-password", dto);
  },

  confirmEmail: async (token: string) => {
    // По документации: GET /api/auth/confirm-email?token=...  (только token, без userId)
    await apiClient.get("/api/auth/confirm-email", { params: { token } });
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponseDto> => {
    const { data } = await apiClient.post<AuthResponseDto>("/api/auth/refresh", { refreshToken });
    return data;
  },
};