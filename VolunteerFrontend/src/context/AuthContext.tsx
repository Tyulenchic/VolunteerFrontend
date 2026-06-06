import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { usersApi } from "../api/users";
import { authApi } from "../api/auth";
import type { UserResponseDto } from "../types/user";
import type { LoginDto, RegisterDto } from "../types/auth";

interface AuthCtx {
  user: UserResponseDto | null;
  loading: boolean;
  isAdmin: boolean;
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshUser = useCallback(async () => {
    try { setUser(await usersApi.getMe()); } catch { setUser(null); }
  }, []);
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) { refreshUser().finally(() => setLoading(false)); }
    else setLoading(false);
  }, [refreshUser]);
  const login = async (dto: LoginDto) => { await authApi.login(dto); await refreshUser(); };
  const register = async (dto: RegisterDto) => { await authApi.register(dto); await refreshUser(); };
  const logout = async () => { await authApi.logout(); setUser(null); };
  return (
    <Ctx.Provider value={{ user, loading, isAdmin: user?.role === "Admin", login, register, logout, refreshUser }}>
      {children}
    </Ctx.Provider>
  );
}
export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}
