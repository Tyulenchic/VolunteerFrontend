import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import { usersApi } from "../api/users";
import { authApi } from "../api/auth";
import { clearSession, getAccessToken, hasSession, isRefreshUnavailable, onSessionCleared, refreshSession } from "../auth/session";
import type { UserResponseDto } from "../types/user";
import type { LoginDto, RegisterDto } from "../types/auth";

interface AuthCtx {
  user: UserResponseDto | null;
  /** Идёт первичное восстановление сессии. */
  loading: boolean;
  /** Сессия есть, но проверить её сейчас нельзя (сеть/5xx/429). Токены сохранены, пользователь не разлогинен. */
  unavailable: boolean;
  isAdmin: boolean;
  /** Организатор (глобальная роль). Кабинет организатора доступен также администратору. */
  isOrganizer: boolean;
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  /** Повторная попытка восстановить сессию после временного сбоя. */
  retrySession: () => Promise<void>;
}
const Ctx = createContext<AuthCtx | null>(null);

/** 401, который остался после попытки refresh и НЕ связан с временной недоступностью refresh. */
const isDefinitiveUnauthorized = (err: unknown) =>
  axios.isAxiosError(err) && err.response?.status === 401 && !isRefreshUnavailable(err);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  /**
   * Восстановление сессии (при старте и по «Повторить»):
   *  - нет токенов → гость;
   *  - есть access → /api/users/me; при 401 перехватчик сам делает один refresh и повторяет запрос;
   *  - нет access, но есть refresh → сначала refresh, затем /me;
   *  - refresh недействителен → сессия очищена, гость;
   *  - временный сбой → токены остаются, unavailable=true.
   */
  const restoreSession = useCallback(async () => {
    setUnavailable(false);
    if (!hasSession()) { setUser(null); return; }
    try {
      if (!getAccessToken()) {
        const result = await refreshSession();
        if (result === "invalid") { setUser(null); return; }
        if (result === "unavailable") { setUnavailable(true); return; }
      }
      setUser(await usersApi.getMe());
    } catch (err) {
      if (isDefinitiveUnauthorized(err)) { clearSession(); setUser(null); }
      else setUnavailable(true);
    }
  }, []);

  useEffect(() => {
    void restoreSession().finally(() => setLoading(false));
  }, [restoreSession]);

  // Одна точка выхода из состояния «аутентифицирован»: refresh отклонён, logout, выход в другой вкладке.
  useEffect(() => onSessionCleared(() => { setUser(null); setUnavailable(false); }), []);

  /** Перечитать профиль (после правок). Временный сбой не разлогинивает: прежний user сохраняется. */
  const refreshUser = useCallback(async () => {
    try {
      setUser(await usersApi.getMe());
    } catch (err) {
      if (isDefinitiveUnauthorized(err)) { clearSession(); setUser(null); }
    }
  }, []);

  const login = async (dto: LoginDto) => {
    await authApi.login(dto);
    try {
      setUser(await usersApi.getMe());
    } catch (err) {
      clearSession(); // не оставляем «полусессию»: токены есть, а профиль загрузить не удалось
      throw err;
    }
  };
  // Регистрация не аутентифицирует: сервер отвечает 202 без токенов, вход — после подтверждения email.
  const register = async (dto: RegisterDto) => { await authApi.register(dto); };
  const logout = async () => { await authApi.logout(); setUser(null); setUnavailable(false); };

  return (
    <Ctx.Provider value={{ user, loading, unavailable, isAdmin: user?.role === "Admin", isOrganizer: user?.role === "Organizer", login, register, logout, refreshUser, retrySession: restoreSession }}>
      {children}
    </Ctx.Provider>
  );
}
export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}
