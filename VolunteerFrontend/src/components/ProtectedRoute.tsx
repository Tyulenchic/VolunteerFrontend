import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { loginState, safeRedirect } from '../utils/redirect';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './Spinner';

/** Сессия есть, но сервер временно недоступен (сеть/5xx/429): не выбрасываем пользователя на логин. */
function SessionUnavailable() {
  const { retrySession } = useAuth();
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-20 text-center">
      <p className="text-gray-700">Не удалось проверить сессию: сервер временно недоступен.</p>
      <button onClick={() => { void retrySession(); }} className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition">
        Повторить
      </button>
    </div>
  );
}

/** Гостя отправляют на вход, запомнив страницу, на которую он шёл: после входа он вернётся на неё. */
function useToLogin() {
  const { pathname, search } = useLocation();
  return <Navigate to="/login" replace state={loginState(pathname + search)} />;
}

export function ProtectedRoute() {
  const { user, loading, unavailable } = useAuth();
  const toLogin = useToLogin();
  if (loading) return <div className="flex justify-center p-20"><Spinner /></div>;
  if (unavailable) return <SessionUnavailable />;
  return user ? <Outlet /> : toLogin;
}
export function AdminRoute() {
  const { user, loading, isAdmin, unavailable } = useAuth();
  const toLogin = useToLogin();
  if (loading) return <div className="flex justify-center p-20"><Spinner /></div>;
  if (unavailable) return <SessionUnavailable />;
  if (!user) return toLogin;
  return isAdmin ? <Outlet /> : <Navigate to="/profile" replace />;
}
/** Кабинет организатора: организаторам и администраторам (администратор видит все организации). */
export function OrganizerRoute() {
  const { user, loading, isAdmin, isOrganizer, unavailable } = useAuth();
  const toLogin = useToLogin();
  if (loading) return <div className="flex justify-center p-20"><Spinner /></div>;
  if (unavailable) return <SessionUnavailable />;
  if (!user) return toLogin;
  return isAdmin || isOrganizer ? <Outlet /> : <Navigate to="/profile" replace />;
}
export function GuestRoute() {
  const { user, loading } = useAuth();
  const { state } = useLocation();
  if (loading) return <div className="flex justify-center p-20"><Spinner /></div>;
  return user ? <Navigate to={safeRedirect((state as { from?: unknown } | null)?.from) ?? '/profile'} replace /> : <Outlet />;
}
