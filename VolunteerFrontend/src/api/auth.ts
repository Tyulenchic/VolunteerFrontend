import { apiClient } from "./client";
import { clearSession, getRefreshToken, setTokens } from "../auth/session";
import type { LoginDto, RegisterDto, AuthResponseDto, ForgotPasswordDto, ResetPasswordDto, ConfirmEmailDto, ResendConfirmationDto } from "../types/auth";

export const authApi = {
  login: async (dto: LoginDto): Promise<void> => {
    const { data } = await apiClient.post<AuthResponseDto>("/api/auth/login", dto);
    setTokens(data.accessToken, data.refreshToken);
  },

  // Сервер отвечает 202 Accepted без токенов (одинаково для нового и существующего email).
  // Пользователь входит только после подтверждения email, поэтому здесь ничего не сохраняем.
  register: async (dto: RegisterDto): Promise<void> => {
    await apiClient.post("/api/auth/register", dto);
  },

  // Logout не требует валидного access-токена (бэкенд: AllowAnonymous, учётные данные — сам refresh-токен,
  // идемпотентно, всегда 204). Локальная сессия очищается всегда, независимо от ответа сервера; при сбое сети
  // refresh-токен на сервере доживёт до своего срока — это принятое ограничение best-effort отзыва.
  logout: async (): Promise<void> => {
    const refreshToken = getRefreshToken();
    clearSession(); // токены удалены → запрос ниже уходит без Authorization, истёкший access не мешает
    if (!refreshToken) return;
    try {
      await apiClient.post("/api/auth/logout", { refreshToken });
    } catch {
      // сервер недоступен / 429 — локальный выход уже выполнен
    }
  },

  forgotPassword: async (dto: ForgotPasswordDto) => {
    await apiClient.post("/api/auth/forgot-password", dto);
  },

  // Успешный сброс отзывает на сервере ВСЕ refresh-токены пользователя: локальная сессия больше недействительна.
  // Очищаем её централизованно (AuthContext получит уведомление); старый refresh-токен не отправляется.
  resetPassword: async (dto: ResetPasswordDto) => {
    await apiClient.post("/api/auth/reset-password", dto);
    clearSession();
  },

  // POST (а не GET): подтверждение меняет состояние и вызывается только действием пользователя на странице.
  confirmEmail: async (token: string) => {
    const dto: ConfirmEmailDto = { token };
    await apiClient.post("/api/auth/confirm-email", dto);
  },

  // Всегда 204 — сервер не раскрывает, существует ли аккаунт.
  resendConfirmation: async (email: string) => {
    const dto: ResendConfirmationDto = { email };
    await apiClient.post("/api/auth/resend-confirmation", dto);
  },
};